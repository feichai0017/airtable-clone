"use client";

// React hooks for state management and UI interactions
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
// Next.js navigation hooks
import { useParams } from "next/navigation";
// TanStack Table imports for data table functionality
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type AccessorKeyColumnDef,
  type CellContext,
  type Row,
} from "@tanstack/react-table";
// TRPC API client for backend communication
import { api } from "~/trpc/react";
// TanStack virtualization for efficient rendering of large datasets
import { useVirtualizer } from "@tanstack/react-virtual";
// UI components from Lucide
import { Loader2 } from "lucide-react";
// Faker library for generating test data
import { faker } from "@faker-js/faker";

// Import types for type-safety throughout the application
import type {
  RecordRow,      // Type for a row in the table
  ColumnValue,    // Type for column values
  ColumnMeta,     // Type for column metadata
  FilterType,     // Type for filter configuration
  SortType,       // Type for sort configuration
  TableColumn,    // Type for table column definition
  BulkProgress    // Type for bulk progress tracking
} from "./types";

// Import utility functions and hooks
import { generateFakeRecord, defaultColumnsKeys } from "./utils";
import { useDelayedLoading, useOutsideClick } from "./hooks";

// Import UI components for the table and related interfaces
import { TopNavigation } from "./_components/table/TopNavigation";
import { TableHeader } from "./_components/table/TableHeader";
import { ColumnHeader as TableColumnHeader } from "./_components/table/ColumnHeader";
import { CellRenderer as TableCellRenderer } from "./_components/table/CellRenderer";
import { RowNumberCell as TableRowNumberCell } from "./_components/table/RowNumberCell";
import { TableFooter } from "./_components/table/TableFooter";

// -------------------------------------------------------------------------
// BasePage Component - Main component for the Airtable clone base page
// -------------------------------------------------------------------------
export default function BasePage() {
  // Get baseId from URL parameters
  const { baseId } = useParams();

  // All state declarations
  // ---------------------
  // Core table data
  const [data, setData] = useState<RecordRow[]>([]); // Holds the table rows data
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null); // Tracks the currently selected cell for editing
  const [selectedRow, setSelectedRow] = useState<number | null>(null); // Tracks selected row
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null); // Tracks selected column
  const [tableId, setTableId] = useState<string | null>(null); // Current active table ID
  const [localTables, setLocalTables] = useState<any[] | null>(null); // Local copy of tables for optimistic updates

  // UI state flags
  const [isSaving, setIsSaving] = useState(false); // Indicates if data is being saved
  const [isAddingColumn, setIsAddingColumn] = useState(false); // Flag for column addition in progress
  const [searchQuery, setSearchQuery] = useState(""); // Current search term
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Flag for initial data loading

  // Modal visibility states
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false); // Controls field addition modal visibility

  // Bulk operations state
  const [isAddingBulkRows, setIsAddingBulkRows] = useState(false); // Flag for bulk row addition in progress
  const [bulkRowProgress, setBulkRowProgress] = useState<BulkProgress>({
    current: 0,
    total: 0,
  }); // Tracks progress of bulk row addition

  // New field attributes
  const [newFieldName, setNewFieldName] = useState(""); // Name for new field being created
  const [newFieldType, setNewFieldType] = useState<"text" | "number">("text"); // Type for new field
  const [fieldError, setFieldError] = useState<string>(""); // Error message for field validation

  // All refs
  // --------
  // DOM element refs for virtualization and UI interaction
  const parentRef = useRef<HTMLDivElement>(null); // Reference to the table container
  const initialTableCreationAttempted = useRef(false); // Tracks if initial table creation was attempted
  const editedCellsRef = useRef<Map<string, { value: string | number | null }>>(new Map()); // Stores edited cells before saving
  const shouldCancelBulkRowsRef = useRef(false); // Flag to cancel bulk row creation

  // Refs for popovers and modals
  const addFieldModalRef = useRef<HTMLDivElement>(null);

  // Add click outside handlers for the popovers
  useOutsideClick(() => setIsFieldModalOpen(false), [addFieldModalRef as React.RefObject<Element>]);

  // Data loading state refs
  const dataRef = useRef<RecordRow[]>([]); // Ref to current data for asynchronous access

  // Track deleted row IDs to filter them from UI immediately
  const deletedRowIdsRef = useRef<Set<string>>(new Set());

  // -----------------------------------------------------------------------
  // Data Fetching & Table Creation
  // -----------------------------------------------------------------------

  // Fetch base details using the baseId from URL params
  const { data: base, isLoading: isBaseLoading } = api.bases.getById.useQuery({
    id: baseId as string,
  });

  // Fetch all tables belonging to this base
  const {
    data: tables,
    isLoading: isTablesLoading,
    refetch: refetchTables,
  } = api.tables.getAll.useQuery(
    { baseId: baseId as string },
    { enabled: !!baseId } // Only run query when baseId is available
  );

  // Use local tables if available, otherwise use server data
  const effectiveTables = localTables ?? tables;

  // Query to fetch table data
  const {
    data: rowsData,
    refetch,
  } = api.rows.getPaginated.useQuery(
    {
      tableId: tableId ?? "",
      limit: 1000, // Large limit for now
      search: searchQuery,
    },
    {
      enabled: !!tableId,
    }
  );

  // State for table creation
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  // Mutation for creating a new table
  const createTableMutation = api.tables.create.useMutation({
    onSuccess: async (newTable) => {
      setTableId(newTable.id);
      setIsCreatingTable(false);
      setTableError(null);
      // Refetch both the tables list and table data
      await refetchTables();
      void refetch();
    },
    onError: (error) => {
      setTableError(error.message);
      setIsCreatingTable(false);
    },
  });

  // Mutation for renaming a table
  const renameTableMutation = api.tables.update.useMutation({
    onSuccess: async () => {
      await refetchTables();
    },
    onError: (error) => {
      console.error("Failed to rename table:", error);
    },
  });

  // Mutation for deleting a table
  const deleteTableMutation = api.tables.delete.useMutation({
    onSuccess: async () => {
      await refetchTables();
      // If we deleted the current table, switch to the first available table
      if (effectiveTables && effectiveTables.length > 1) {
        const remainingTables = effectiveTables.filter(t => t.id !== tableId);
        if (remainingTables.length > 0 && remainingTables[0]) {
          setTableId(remainingTables[0].id);
        }
      }
    },
    onError: (error) => {
      console.error("Failed to delete table:", error);
    },
  });

  // Effect to create initial table if none exists
  useEffect(() => {
    if (
      !baseId ||
      !tables ||
      isTablesLoading ||
      initialTableCreationAttempted.current
    )
      return;

    if (tables && tables.length === 0) {
      initialTableCreationAttempted.current = true;
      void createTableMutation.mutateAsync({
        baseId: baseId as string,
        name: "Table 1",
      });
    }
  }, [baseId, tables, isTablesLoading, createTableMutation]);

  // Effect to sync local tables with server data
  useEffect(() => {
    if (tables) {
      setLocalTables(tables);
    }
  }, [tables]);

  // Effect to set initial table selection when tables are loaded
  useEffect(() => {
    if (effectiveTables && effectiveTables.length > 0 && !tableId && effectiveTables[0]?.id) {
      setTableId(effectiveTables[0].id);
    }
  }, [effectiveTables, tableId]);

  // Effect to handle table switching and data refresh
  useEffect(() => {
    if (tableId) {
      // Reset all view-related states when switching tables
      setData([]);
      setIsInitialLoading(true);
      // Refetch the table data
      void refetch();
    }
  }, [tableId, refetch]);

  // Function to create a new table
  const handleCreateNewTable = async () => {
    if (!baseId || !effectiveTables) return;

    setIsCreatingTable(true);
    setTableError(null);

    const nextTableNumber = effectiveTables.length + 1;

    try {
      await createTableMutation.mutateAsync({
        baseId: baseId as string,
        name: `Table ${nextTableNumber}`,
      });
    } catch (error) {
      console.error("Failed to create table:", error);
    }
  };

  // Function to rename a table
  const handleRenameTable = async (tableIdToRename: string, newName: string) => {
    await renameTableMutation.mutateAsync({
      id: tableIdToRename,
      name: newName,
    });
  };

  // Function to delete a table
  const handleDeleteTable = async (tableIdToDelete: string) => {
    await deleteTableMutation.mutateAsync({
      id: tableIdToDelete,
    });
  };

  // Mutation for updating cell values
  const updateCellMutation = api.rows.update.useMutation({
    onSuccess: () => {
      setIsSaving(false);
    },
    onError: (error: any) => {
      console.error("Failed to update cell:", error);
      setIsSaving(false);
    },
  });

  // Effect to process rowsData and update local state
  useEffect(() => {
    if (rowsData) {
      // Process each row - filter deleted rows and format data
      const formattedData = rowsData.rows
        .filter((row: any) => !deletedRowIdsRef.current.has(row.id))
        .map((row: any) => {
          const rowData: RecordRow = {
            id: row.id,
            ...(row.data as Record<string, string | number | null>),
          };

          // Apply any pending unsaved edits to this row
          const rowId = row.id;
          if (rowId) {
            for (const [key, value] of editedCellsRef.current.entries()) {
              const [editedRowId, columnName] = key.split("|");

              if (
                editedRowId === rowId &&
                columnName &&
                typeof columnName === "string"
              ) {
                rowData[columnName] = value.value;
              }
            }
          }

          return rowData;
        });

      setData(formattedData);
      dataRef.current = formattedData;
      setIsInitialLoading(false);
    }
  }, [rowsData]);

  // Initialize dataRef when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // -----------------------------------------------------------------------
  // Row & Column Mutations
  // -----------------------------------------------------------------------

  // tRPC mutations and queries
  const createRowMutation = api.rows.create.useMutation();
  const bulkCreateRowsMutation = api.rows.bulkCreate.useMutation();

  // Mutation for creating a new column
  const createColumnMutation = api.columns.create.useMutation({
    onSuccess: (newColumn: any) => {
      if (tableId) {
        void refetch();
        setData((prevData) =>
          prevData.map((row) => ({
            ...row,
            [newColumn.name]: newColumn.type === "number" ? null : "",
          }))
        );
      }
      setIsAddingColumn(false);
    },
    onError: (error: any) => {
      console.error("Failed to add column:", error);
      setIsAddingColumn(false);
    },
  });

  // Mutation for deleting a column
  const deleteColumnMutation = api.columns.delete.useMutation({
    onSuccess: () => {
      if (tableId) {
        void refetch();
      }
    },
    onError: (err: any) => {
      console.error("Failed to delete column:", err);
    },
  });

  // Mutation for updating a column
  const updateColumnMutation = api.columns.update.useMutation({
    onSuccess: () => {
      if (tableId) {
        void refetch();
      }
    },
    onError: (err: any) => {
      console.error("Failed to update column:", err);
      // Revert on error
      void refetch();
    },
  });

  // Mutation for deleting a row
  const deleteRowMutation = api.rows.delete.useMutation({
    onSuccess: (_: any, variables: any) => {
      deletedRowIdsRef.current.add(variables.id);
      setData((prevData) =>
        prevData.filter((row) => row.id !== variables.id)
      );
    },
    onError: (error: any) => {
      console.error("Failed to delete row:", error);
    },
  });

  // -----------------------------------------------------------------------
  // All Handler Functions
  // -----------------------------------------------------------------------

  // Handler for deleting a column
  const handleDeleteColumn = useCallback(
    (name: string) => {
      if (!tableId) return;
      // Find the column ID by name from the table info
      const tableInfo = effectiveTables?.find(t => t.id === tableId);
      const column = tableInfo?.columns?.find((col: any) => col.name === name);
      if (column) {
        deleteColumnMutation.mutate({ id: column.id });
      }
    },
    [tableId, deleteColumnMutation, effectiveTables]
  );

  // Handler for renaming a column
  const handleRenameColumn = useCallback(
    (oldName: string, newName: string) => {
      if (!tableId || !newName.trim() || oldName === newName.trim()) return;
      
      const tableInfo = effectiveTables?.find(t => t.id === tableId);
      const column = tableInfo?.columns?.find((col: any) => col.name === oldName);
      if (!column) return;

      // Update local tables state immediately
      setLocalTables(prevTables => 
        prevTables?.map(table => 
          table.id === tableId 
            ? {
                ...table,
                columns: table.columns.map((col: any) => 
                  col.id === column.id 
                    ? { ...col, name: newName.trim() }
                    : col
                )
              }
            : table
        ) ?? null
      );

      // Update local data immediately for instant UI feedback
      setData(prevData => 
        prevData.map(row => {
          const newRow = { ...row };
          if (oldName in newRow) {
            newRow[newName.trim()] = newRow[oldName];
            delete newRow[oldName];
          }
          return newRow;
        })
      );

      // Update backend
      updateColumnMutation.mutate({
        id: column.id,
        name: newName.trim()
      });
    },
    [tableId, updateColumnMutation, effectiveTables]
  );

  // Handler for changing column type
  const handleChangeColumnType = useCallback(
    (columnName: string, newType: "text" | "number") => {
      if (!tableId) return;
      const tableInfo = effectiveTables?.find(t => t.id === tableId);
      const column = tableInfo?.columns?.find((col: any) => col.name === columnName);
      if (!column) return;

      // Update local tables state immediately
      setLocalTables(prevTables => 
        prevTables?.map(table => 
          table.id === tableId 
            ? {
                ...table,
                columns: table.columns.map((col: any) => 
                  col.id === column.id 
                    ? { ...col, type: newType }
                    : col
                )
              }
            : table
        ) ?? null
      );

      // Update local data immediately - convert values to match new type
      setData(prevData => 
        prevData.map(row => {
          const newRow = { ...row };
          if (columnName in newRow) {
            const currentValue = newRow[columnName];
            if (newType === "number") {
              // Convert to number
              const num = currentValue ? Number(currentValue) : null;
              newRow[columnName] = isNaN(num as number) ? null : num;
            } else {
              // Convert to text
              newRow[columnName] = currentValue === null ? "" : String(currentValue);
            }
          }
          return newRow;
        })
      );

      // Update backend
      updateColumnMutation.mutate({
        id: column.id,
        type: newType
      });
    },
    [tableId, updateColumnMutation, effectiveTables]
  );

  // Handler for deleting a row
  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (!tableId || !rowId) return;
      deleteRowMutation.mutate({ id: rowId });
    },
    [tableId, deleteRowMutation]
  );

  // Row selection handler
  const handleRowSelect = useCallback((rowIndex: number) => {
    setSelectedRow(selectedRow === rowIndex ? null : rowIndex);
    setSelectedColumn(null);
    setSelectedCell(null);
  }, [selectedRow]);

  // Column selection handler
  const handleColumnSelect = useCallback((columnId: string) => {
    setSelectedColumn(selectedColumn === columnId ? null : columnId);
    setSelectedRow(null);
    setSelectedCell(null);
  }, [selectedColumn]);

  // Keyboard navigation handler
  const handleCellNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell || !data.length || !effectiveTables || !tableId) return;

    const currentRowIndex = selectedCell.rowIndex;
    const currentColumnId = selectedCell.columnId;

    // Get columns from tables data instead of columns variable to avoid circular dependency
    const tableInfo = effectiveTables.find(t => t.id === tableId);
    const tableColumns = tableInfo?.columns ?? [];
    const dataColumns = tableColumns.filter(col => col.name !== "rowNumber");
    const currentColumnIndex = dataColumns.findIndex(col => col.name === currentColumnId);

    let newRowIndex = currentRowIndex;
    let newColumnIndex = currentColumnIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'down':
        newRowIndex = Math.min(data.length - 1, currentRowIndex + 1);
        break;
      case 'left':
        newColumnIndex = Math.max(0, currentColumnIndex - 1);
        break;
      case 'right':
        newColumnIndex = Math.min(dataColumns.length - 1, currentColumnIndex + 1);
        break;
    }

    const newColumnId = dataColumns[newColumnIndex]?.name;
    if (newColumnId) {
      setSelectedCell({
        rowIndex: newRowIndex,
        columnId: newColumnId,
      });
    }
  }, [selectedCell, data, effectiveTables, tableId]);

  // -----------------------------------------------------------------------
  // Build Columns (Prepending the row number column)
  // -----------------------------------------------------------------------

  const columns: AccessorKeyColumnDef<RecordRow, ColumnValue>[] =
    useMemo(() => {
      if (!effectiveTables || !tableId)
        return [] as AccessorKeyColumnDef<RecordRow, ColumnValue>[];

      // Row insertion handlers defined within the useMemo
      const insertRowAbove = async (rowIndex: number) => {
        if (!tableId || !effectiveTables) return;

        const defaultData: Record<string, string> = {};
        const tableInfo = effectiveTables.find(t => t.id === tableId);
        const tableColumns = tableInfo?.columns ?? [];

        tableColumns.forEach((col) => {
          const columnType = col.type;
          defaultData[col.name] = columnType === "number"
            ? String(faker.number.int({ min: 0, max: 100 }))
            : faker.word.words({ count: faker.number.int({ min: 1, max: 3 }) });
        });

        try {
          await createRowMutation.mutateAsync({
            tableId,
            data: defaultData,
          });
          void refetch();
        } catch (error) {
          console.error("Failed to insert row:", error);
        }
      };

      const insertRowBelow = async (rowIndex: number) => {
        if (!tableId || !effectiveTables) return;

        const defaultData: Record<string, string> = {};
        const tableInfo = effectiveTables.find(t => t.id === tableId);
        const tableColumns = tableInfo?.columns ?? [];

        tableColumns.forEach((col) => {
          const columnType = col.type;
          defaultData[col.name] = columnType === "number"
            ? String(faker.number.int({ min: 0, max: 100 }))
            : faker.word.words({ count: faker.number.int({ min: 1, max: 3 }) });
        });

        try {
          await createRowMutation.mutateAsync({
            tableId,
            data: defaultData,
          });
          void refetch();
        } catch (error) {
          console.error("Failed to insert row:", error);
        }
      };

      // Create the special row number/selection column that appears first
      const rowNumberColumn: AccessorKeyColumnDef<RecordRow, ColumnValue> = {
        accessorKey: "rowNumber",
        id: "rowNumber",
        header: () => (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs font-medium text-gray-500">#</span>
          </div>
        ),
        size: 80,
        enableResizing: false,
        cell: ({ row }: { row: Row<RecordRow> }) => (
          <TableRowNumberCell
            index={row.index}
            isSelected={selectedRow === row.index}
            onDeleteRow={() => handleDeleteRow(row.original.id ?? "")}
            onSelectRow={() => handleRowSelect(row.index)}
            onInsertRowAbove={() => insertRowAbove(row.index)}
            onInsertRowBelow={() => insertRowBelow(row.index)}
          />
        ),
      };

      // Get table info to access columns
      const tableInfo = effectiveTables?.find(t => t.id === tableId);
      const dataColumns = (tableInfo?.columns ?? [])
        .map((col: TableColumn) => ({
          accessorKey: col.name,
          meta: {
            type: col.type as "text" | "number"
          },
          header: () => (
            <TableColumnHeader
              name={col.name}
              onDelete={() => handleDeleteColumn(col.name)}
              type={col.type as "text" | "number"}
              isSelected={selectedColumn === col.name}
              onRename={(newName) => handleRenameColumn(col.name, newName)}
              onTypeChange={(newType) => handleChangeColumnType(col.name, newType)}
            />
          ),
          cell: (props: CellContext<RecordRow, ColumnValue>) => (
            <TableCellRenderer
              {...props}
              keyName={col.name}
              fieldType={col.type as "text" | "number"}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              setData={setData}
              tableId={tableId}
              setIsSaving={setIsSaving}
              updateCellMutation={updateCellMutation}
              searchQuery={searchQuery}
              editedCellsRef={editedCellsRef}
              onNavigateCell={handleCellNavigation}
            />
          ),
        }));

      return [rowNumberColumn, ...(dataColumns ?? [])];
    }, [
      effectiveTables,
      tableId,
      handleDeleteColumn,
      handleRenameColumn,
      handleChangeColumnType,
      handleDeleteRow,
      selectedCell,
      setSelectedCell,
      setData,
      setIsSaving,
      updateCellMutation,
      searchQuery,
      editedCellsRef,
      handleRowSelect,
      selectedRow,
      selectedColumn,
      handleCellNavigation,
      createRowMutation,
      refetch,
    ]);

  // Handler for adding a new column
  const handleAddColumn = async () => {
    setFieldError("");

    if (!newFieldName.trim()) {
      setFieldError("Field name is required");
      return;
    }

    if (!tableId) {
      setFieldError("No active table selected");
      return;
    }

    const tableInfo = effectiveTables?.find(t => t.id === tableId);
    const columnExists = tableInfo?.columns?.some(
      (col: any) => col.name.toLowerCase() === newFieldName.trim().toLowerCase()
    );

    if (columnExists) {
      setFieldError("A column with this name already exists");
      return;
    }

    setIsAddingColumn(true);
    
    // Create optimistic update for immediate UI feedback
    const tempColumnId = `temp-${Date.now()}`;
    const newColumn = {
      id: tempColumnId,
      name: newFieldName.trim(),
      type: newFieldType,
      order: (tableInfo?.columns?.length ?? 0),
      tableId: tableId
    };

    // Update local tables state immediately
    setLocalTables(prevTables => 
      prevTables?.map(table => 
        table.id === tableId 
          ? {
              ...table,
              columns: [...(table.columns || []), newColumn]
            }
          : table
      ) ?? null
    );

    // Add empty values to existing rows for the new column
    setData(prevData => 
      prevData.map(row => ({
        ...row,
        [newFieldName.trim()]: newFieldType === "number" ? null : ""
      }))
    );

    try {
      await createColumnMutation.mutateAsync({
        tableId,
        name: newFieldName.trim(),
        type: newFieldType,
      });
      
      // Refresh the data to sync with server
      await refetch();
      
      // Reset form
      setNewFieldName("");
      setNewFieldType("text");
      setIsFieldModalOpen(false);
      setFieldError("");
    } catch (error: any) {
      console.error("Failed to add column:", error);
      setFieldError(error.message || "Failed to create column");
      // Revert optimistic update on error
      void refetch();
    } finally {
      setIsAddingColumn(false);
    }
  };

  // We'll use individual row creation for bulk operations since createRows doesn't exist

  // Handler for creating a single row with fake data
  const createRowHandler = async () => {
    if (!tableId) return;
    if (isSaving) return;
    setIsSaving(true);

    const defaultData: Record<string, string | number | null> = {};

    const dataColumns = columns.filter(
      (col) => col.accessorKey && col.accessorKey !== "rowNumber"
    );

    dataColumns.forEach((col) => {
      if (!col.accessorKey) return;
      const key = col.accessorKey;
      const meta = col.meta as ColumnMeta | undefined;
      const columnType = meta?.type ?? "text";

      defaultData[key] =
        columnType === "number"
          ? faker.number.int({ min: 0, max: 100 })
          : faker.word.words({ count: faker.number.int({ min: 1, max: 3 }) });
    });

    try {
      // Convert all values to strings for the API
      const stringData: Record<string, string> = {};
      Object.entries(defaultData).forEach(([key, value]) => {
        stringData[key] = String(value || "");
      });

      await createRowMutation.mutateAsync({
        tableId,
        data: stringData,
      });
      void refetch();
    } catch (error) {
      console.error("Failed to create row:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for adding multiple fake records in bulk
  const handleAddFakeRecords = async (count: number) => {
    if (!tableId) return;
    setIsSaving(true);
    setIsAddingBulkRows(true);
    setBulkRowProgress({ current: 0, total: count });
    shouldCancelBulkRowsRef.current = false;

    try {
      const batchSize = 1000; // Smaller batch size for better performance
      const batches = Math.ceil(count / batchSize);

      let lastRefreshTime = Date.now();
      const REFRESH_INTERVAL = 2000;

      for (let i = 0; i < batches; i++) {
        if (shouldCancelBulkRowsRef.current) {
          console.log("Cancelling bulk row addition");
          break;
        }

        const batchCount = Math.min(batchSize, count - i * batchSize);

        // Generate fake records for this batch
        const fakeRecords = Array.from({ length: batchCount }, () => {
          const record = generateFakeRecord(columns);
          // Convert all values to strings for the API
          const stringData: Record<string, string> = {};
          Object.entries(record).forEach(([key, value]) => {
            stringData[key] = String(value || "");
          });
          return stringData;
        });

        try {
          // Use bulk create API instead of individual creates
          await bulkCreateRowsMutation.mutateAsync({
            tableId,
            records: fakeRecords,
          });

          const newProgress = Math.min((i + 1) * batchSize, count);
          setBulkRowProgress({
            current: newProgress,
            total: count,
          });

          const currentTime = Date.now();
          if (currentTime - lastRefreshTime >= REFRESH_INTERVAL) {
            console.log("Refreshing table data...");
            await refetch();
            lastRefreshTime = currentTime;
          }

          await new Promise(resolve => setTimeout(resolve, 100)); // Reduce delay

        } catch (err) {
          console.error("Failed to create batch:", err);
          break;
        }
      }

      if (!shouldCancelBulkRowsRef.current) {
        console.log("Final refresh of table data");
        void refetch();
      }

    } finally {
      setIsSaving(false);
      setIsAddingBulkRows(false);
      shouldCancelBulkRowsRef.current = false;
    }
  };

  // Function to cancel bulk row addition
  const cancelBulkRowAddition = () => {
    shouldCancelBulkRowsRef.current = true;
  };

  // Function to save all pending cell edits before navigating away
  const saveAllPendingChanges = async () => {
    if (editedCellsRef.current.size === 0) return true;

    setIsSaving(true);

    try {
      const savePromises = Array.from(editedCellsRef.current.entries()).map(
        async ([key, value]) => {
          const [rowId, columnName] = key.split("|");
          if (!rowId || !columnName || !tableId) return;

          return updateCellMutation.mutateAsync({
            id: rowId,
            data: { [columnName]: String(value.value || "") },
          });
        }
      );

      await Promise.all(savePromises);
      return true;
    } catch (error) {
      console.error("Failed to save pending changes:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Table Initialization & Virtualization
  // -----------------------------------------------------------------------

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id ?? faker.string.uuid(),
    columnResizeMode: "onChange",
  });

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 25,

    // Removed infinite scroll for now since we're using regular query
  });

  const showLoading = useDelayedLoading(false); // Removed for now

  return (
    <div className="flex h-screen flex-col">
      {/* Top Navigation */}
      <TopNavigation
        baseName={base?.name ?? ""}
        isLoading={isBaseLoading}
        onSaveAllPendingChanges={saveAllPendingChanges}
      />

      {/* Table Header */}
      <TableHeader
        tables={effectiveTables}
        tableId={tableId}
        setTableId={setTableId}
        handleCreateNewTable={handleCreateNewTable}
        isCreatingTable={isCreatingTable}
        tableError={tableError}
        onDeleteTable={handleDeleteTable}
        onRenameTable={handleRenameTable}
      />

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Table Body */}
        <div
          className="h-full"
          onClick={() => {
            setSelectedCell(null);
            setSelectedRow(null);
            setSelectedColumn(null);
          }}
        >
          {isInitialLoading || isBaseLoading || isTablesLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-gray-400" />
              <span className="text-gray-600">Loading table data...</span>
            </div>
          ) : (
            <div
              ref={parentRef}
              className="h-full overflow-auto"
              onClick={() => {
                setSelectedCell(null);
                setSelectedRow(null);
                setSelectedColumn(null);
              }}
            >
              <div className="inline-block min-w-[800px]">
                {/* Table Header */}
                <div className="sticky top-0 z-10 flex w-max bg-[#f4f4f4] text-sm text-gray-800">
                  <div className="flex">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <div key={headerGroup.id} className="flex">
                        {headerGroup.headers.map((header) => (
                          <div
                            key={header.id}
                            style={{
                              width: `${header.getSize()}px`,
                              minWidth: `${header.getSize()}px`,
                              height: "30px",
                            }}
                            className="border-r border-b border-gray-200 px-3 py-1 text-left"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>
                        ))}
                      </div>
                    ))}
                    {/* Add Field Button Column */}
                    <div
                      className="border-b border-r border-gray-200 px-3 py-1 text-left"
                      style={{
                        width: "90px",
                        minWidth: "90px",
                        height: "30px",
                      }}
                    >
                      <button
                        onClick={() => {
                          if (!isAddingColumn) {
                            setIsFieldModalOpen(!isFieldModalOpen);
                          }
                        }}
                        className="flex h-full w-full items-center justify-center text-lg font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                        disabled={isAddingColumn}
                        style={{ caretColor: 'transparent' }}
                      >
                        {isAddingColumn ? "..." : "+"}
                      </button>
                      {isFieldModalOpen && (
                        <div ref={addFieldModalRef} className="absolute z-10 mt-2 w-64 rounded border bg-white p-4 shadow-md">
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            handleAddColumn();
                          }}>
                            <div className="flex justify-between mb-2">
                              <h3 className="text-sm font-medium">Add new field</h3>
                              <button
                                onClick={() => setIsFieldModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                                type="button"
                              >
                                &times;
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Field name"
                              value={newFieldName}
                              onChange={(e) => {
                                setNewFieldName(e.target.value);
                                setFieldError("");
                              }}
                              className="mb-2 w-full rounded border px-2 py-1 text-sm"
                              autoFocus
                              required
                            />
                            <select
                              value={newFieldType}
                              onChange={(e) =>
                                setNewFieldType(
                                  e.target.value as "text" | "number"
                                )
                              }
                              className="mb-2 w-full rounded border px-2 py-1 text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                            </select>
                            {fieldError && (
                              <p className="mb-2 text-xs text-red-600">
                                {fieldError}
                              </p>
                            )}
                            <button
                              type="submit"
                              className="w-full rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                              disabled={isAddingColumn}
                            >
                              {isAddingColumn ? "Adding..." : "Add Field"}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Virtualized Table Body */}
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = table.getRowModel().rows[virtualRow.index];
                    if (!row) return null;

                    return (
                      <div
                        key={row.id ?? virtualRow.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          transform: `translateY(${virtualRow.start}px)`,
                          height: "35px",
                        }}
                        className="flex border-b border-gray-200"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <div
                            key={cell.id}
                            style={{
                              width: `${cell.column.getSize()}px`,
                              minWidth: `${cell.column.getSize()}px`,
                              height: "100%",
                            }}
                            className="border-r border-gray-200"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {showLoading && (
                <div className="sticky bottom-0 flex w-full items-center justify-center bg-white/80 py-2 shadow-md">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Loading more rows...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <TableFooter
        createRowHandler={createRowHandler}
        handleAddFakeRecords={handleAddFakeRecords}
        isSaving={isSaving}
        isAddingBulkRows={isAddingBulkRows}
        bulkRowProgress={bulkRowProgress}
        cancelBulkRowAddition={cancelBulkRowAddition}
        totalCount={rowsData?.total}
      />
    </div>
  );
} 