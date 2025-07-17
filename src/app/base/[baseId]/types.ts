// Row data type - represents a single row in the table
export interface RecordRow {
  id: string;
  order?: number;
  [key: string]: string | number | null | undefined;
}

// Column value type - represents the possible values a cell can contain
export type ColumnValue = string | number | null;

// Column metadata type - stores column configuration
export interface ColumnMeta {
  type: "text" | "number";
}

// Filter configuration type
export interface FilterType {
  columnName: string;
  operator: "equals" | "notEquals" | "contains" | "notContains" | "isEmpty" | "isNotEmpty" | "greaterThan" | "lessThan";
  value?: string;
}

// Sort configuration type
export interface SortType {
  columnName: string;
  direction: "asc" | "desc";
}

// Table column definition type
export interface TableColumn {
  id: string;
  name: string;
  type: string;
  order: number;
}

// View type definition
export interface View {
  id: string;
  name: string;
  type: string;
  tableId: string;
  filter: FilterType | null;
  sort: SortType | null;
  hiddenColumns: string[];
  createdAt: string;
  updatedAt: string;
}

// Table data response type
export interface TableDataResponse {
  rows: Array<{
    id: string;
    data: Record<string, string | number | null>;
    order: number;
  }>;
  columns: TableColumn[];
  totalCount: number;
  nextCursor?: string;
}

// Bulk progress tracking type
export interface BulkProgress {
  current: number;
  total: number;
} 