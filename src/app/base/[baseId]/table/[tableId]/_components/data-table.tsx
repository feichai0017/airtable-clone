"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Filter, Plus, ChevronDown } from "lucide-react";
import { api } from "~/trpc/react";

interface DataTableProps {
    tableId: string;
}

interface TableRow {
    id: string;
    order: number;
    data: Record<string, string>;
}

export function DataTable({ tableId }: DataTableProps) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<any[]>([]);
    const [sorting, setSorting] = useState<any[]>([]);


    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [tableHeight, setTableHeight] = useState(600);


    const { data: columns = [] } = api.columns.getByTableId.useQuery({ tableId });


    const {
        data: rowsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = api.rows.getPaginated.useInfiniteQuery(
        {
            tableId,
            limit: 50,
            search: globalFilter,
            filters: columnFilters,
            sorts: sorting,
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                const allRows = allPages.flatMap((page) => page.rows);
                return lastPage.hasMore ? allRows.length : undefined;
            },
        }
    );


    const allRows = useMemo(() => {
        return rowsData?.pages.flatMap((page) => page.rows) ?? [];
    }, [rowsData]);

    const totalRows = rowsData?.pages[0]?.total ?? 0;


    const tableColumns = useMemo<ColumnDef<TableRow>[]>(() => {
        return columns.map((column) => ({
            id: column.name,
            header: column.name,
            accessorFn: (row) => row.data[column.name] || "",
            cell: ({ getValue, row, column }) => {
                return (
                    <EditableCell
                        value={getValue() as string}
                        rowId={row.original.id}
                        columnName={column.id!}
                        columnType={columns.find(col => col.name === column.id)?.type || "text"}
                    />
                );
            },
            size: 150,
            minSize: 100,
            maxSize: 500,
        }));
    }, [columns]);


    const table = useReactTable({
        data: allRows,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });


    const rowVirtualizer = useVirtualizer({
        count: totalRows,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 35, // Height of each row
        overscan: 5,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();


    useEffect(() => {
        const [lastItem] = [...virtualItems].reverse();

        if (!lastItem) return;

        if (
            lastItem.index >= allRows.length - 10 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage();
        }
    }, [virtualItems, allRows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);


    useEffect(() => {
        const updateHeight = () => {
            if (tableContainerRef.current) {
                const rect = tableContainerRef.current.getBoundingClientRect();
                setTableHeight(window.innerHeight - rect.top - 20);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">

            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-4">

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search all cells..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>


                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                        <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                        {totalRows.toLocaleString()} rows total
                    </span>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Column
                    </button>
                </div>
            </div>


            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto"
                style={{ height: tableHeight }}
            >
                <div style={{ height: rowVirtualizer.getTotalSize() }}>
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <div key={headerGroup.id} className="flex">
                                {headerGroup.headers.map((header) => (
                                    <div
                                        key={header.id}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50"
                                        style={{ width: header.getSize() }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>


                    <div className="relative">
                        {virtualItems.map((virtualRow) => {
                            const row = allRows[virtualRow.index];
                            if (!row) return null;

                            const tableRow = table.getRowModel().rows.find(r => r.original.id === row.id);
                            if (!tableRow) return null;

                            return (
                                <div
                                    key={row.id}
                                    className="absolute flex w-full hover:bg-gray-50"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {tableRow.getVisibleCells().map((cell) => (
                                        <div
                                            key={cell.id}
                                            className="px-4 py-2 border-r border-gray-200 flex items-center"
                                            style={{ width: cell.column.getSize() }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>


                {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading more rows...</span>
                    </div>
                )}
            </div>
        </div>
    );
}


function EditableCell({
    value,
    rowId,
    columnName,
    columnType
}: {
    value: string;
    rowId: string;
    columnName: string;
    columnType: string;
}) {
    const [editing, setEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const utils = api.useUtils();
    const updateRow = api.rows.update.useMutation({
        onSuccess: async () => {
            await utils.rows.invalidate();
        },
    });

    const handleSave = useCallback(async () => {
        if (currentValue !== value) {
            try {
                await updateRow.mutateAsync({
                    id: rowId,
                    data: { [columnName]: currentValue },
                });
            } catch (error) {
                console.error("Failed to update cell:", error);
                setCurrentValue(value);
            }
        }
        setEditing(false);
    }, [currentValue, value, rowId, columnName, updateRow]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setCurrentValue(value);
            setEditing(false);
        } else if (e.key === "Tab") {
            handleSave();
        }
    }, [handleSave, value]);

    if (editing) {
        return (
            <input
                type={columnType === "number" ? "number" : "text"}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full border-none outline-none bg-blue-50 px-1 py-0.5 rounded"
                autoFocus
            />
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className="w-full cursor-text hover:bg-gray-100 px-1 py-0.5 rounded"
        >
            {value || <span className="text-gray-400">Empty</span>}
        </div>
    );
} 