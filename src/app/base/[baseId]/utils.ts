import { faker } from "@faker-js/faker";
import type { RecordRow, ColumnValue, ColumnMeta } from "./types";
import type { AccessorKeyColumnDef } from "@tanstack/react-table";

// Default column names for new tables
export const defaultColumnsKeys = [
    "Name",
    "Notes",
    "Status",
    "Priority"
];

// Generate fake record data based on column definitions
export function generateFakeRecord(columns: AccessorKeyColumnDef<RecordRow, ColumnValue>[]): Record<string, string | number | null> {
    const record: Record<string, string | number | null> = {};

    // Filter out the row number column and generate data for data columns
    const dataColumns = columns.filter(
        (col) => col.accessorKey && col.accessorKey !== "rowNumber"
    );

    dataColumns.forEach((col) => {
        if (!col.accessorKey) return;

        const key = col.accessorKey;
        const meta = col.meta as ColumnMeta | undefined;
        const columnType = meta?.type ?? "text";

        // Generate appropriate fake data based on column type and name
        if (columnType === "number") {
            record[key] = faker.number.int({ min: 1, max: 100 });
        } else {
            // Generate contextual text based on column name
            const columnName = String(key).toLowerCase();
            if (columnName.includes("name")) {
                record[key] = faker.person.fullName();
            } else if (columnName.includes("email")) {
                record[key] = faker.internet.email();
            } else if (columnName.includes("status")) {
                record[key] = faker.helpers.arrayElement(["Active", "Inactive", "Pending", "Complete"]);
            } else if (columnName.includes("priority")) {
                record[key] = faker.helpers.arrayElement(["High", "Medium", "Low"]);
            } else if (columnName.includes("notes") || columnName.includes("description")) {
                record[key] = faker.lorem.sentence();
            } else if (columnName.includes("date")) {
                record[key] = faker.date.recent().toISOString().split('T')[0]!;
            } else {
                record[key] = faker.word.words({ count: faker.number.int({ min: 1, max: 3 }) });
            }
        }
    });

    return record;
}

// Utility to highlight search matches in text
export function highlightSearchMatch(text: string, searchQuery: string): string {
    if (!searchQuery || !text) return text;

    // For now, just return the text as-is
    // Component-level highlighting will be handled in the cell renderer
    return text;
}

// Format cell value for display
export function formatCellValue(value: ColumnValue, type: "text" | "number" = "text"): string {
    if (value === null || value === undefined) return "";

    if (type === "number" && typeof value === "number") {
        return value.toLocaleString();
    }

    return String(value);
}

// Validate cell value based on type
export function validateCellValue(value: string, type: "text" | "number"): ColumnValue {
    if (type === "number") {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    return value.trim();
} 