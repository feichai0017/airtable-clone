import { Plus, Loader2, X, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";

interface Table {
    id: string;
    name: string;
}

interface TableHeaderProps {
    tables: Table[] | undefined;
    tableId: string | null;
    setTableId: (id: string) => void;
    handleCreateNewTable: () => Promise<void>;
    isCreatingTable: boolean;
    tableError: string | null;
    onDeleteTable?: (tableId: string) => Promise<void>;
    onRenameTable?: (tableId: string, newName: string) => Promise<void>;
}

export function TableHeader({
    tables,
    tableId,
    setTableId,
    handleCreateNewTable,
    isCreatingTable,
    tableError,
    onDeleteTable,
    onRenameTable
}: TableHeaderProps) {
    const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleStartEdit = (table: Table) => {
        setEditingTabId(table.id);
        setEditValue(table.name);
    };

    const handleSaveEdit = async () => {
        if (editingTabId && editValue.trim() && onRenameTable) {
            try {
                await onRenameTable(editingTabId, editValue.trim());
                setEditingTabId(null);
                setEditValue("");
            } catch (error) {
                console.error("Failed to rename table:", error);
            }
        } else {
            setEditingTabId(null);
            setEditValue("");
        }
    };

    const handleCancelEdit = () => {
        setEditingTabId(null);
        setEditValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handleDeleteTable = async (tableIdToDelete: string) => {
        if (!onDeleteTable || !tables || tables.length <= 1) return;

        setIsDeleting(true);
        try {
            await onDeleteTable(tableIdToDelete);
            setDeleteModalOpen(null);
        } catch (error) {
            console.error("Failed to delete table:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="flex h-10 items-end border-b border-gray-200 bg-gray-50 px-2">
                <div className="flex items-end space-x-0.5 overflow-x-auto scrollbar-hide">
                    {/* Table tabs - Excel style */}
                    {tables?.map((table) => (
                        <div
                            key={table.id}
                            className="relative"
                            onMouseEnter={() => setHoveredTabId(table.id)}
                            onMouseLeave={() => setHoveredTabId(null)}
                        >
                            <div
                                onClick={() => {
                                    if (editingTabId !== table.id) {
                                        setTableId(table.id);
                                    }
                                }}
                                className={`
                                    group relative flex items-center space-x-1 rounded-t-md border-l border-r border-t px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer
                                    ${tableId === table.id
                                        ? "border-gray-300 bg-white text-gray-900 shadow-sm"
                                        : "border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                                    }
                                `}
                                style={{
                                    marginBottom: tableId === table.id ? "-1px" : "0px",
                                    zIndex: tableId === table.id ? 10 : 1
                                }}
                            >
                                {editingTabId === table.id ? (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={handleSaveEdit}
                                        onKeyDown={handleKeyDown}
                                        className="max-w-[120px] px-1 py-0.5 text-sm font-medium bg-white border border-blue-300 rounded outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <>
                                        <span
                                            className="max-w-[120px] truncate"
                                            onDoubleClick={() => onRenameTable && handleStartEdit(table)}
                                            title={table.name}
                                        >
                                            {table.name}
                                        </span>

                                        {/* Action buttons on hover */}
                                        {hoveredTabId === table.id && (
                                            <div className="flex items-center space-x-1 ml-1">
                                                {onRenameTable && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEdit(table);
                                                        }}
                                                        className="w-3 h-3 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded"
                                                        title="Rename table"
                                                    >
                                                        <Edit2 className="w-2.5 h-2.5" />
                                                    </button>
                                                )}

                                                {onDeleteTable && tables.length > 1 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteModalOpen(table.id);
                                                        }}
                                                        className="w-3 h-3 flex items-center justify-center text-gray-400 hover:text-red-600 rounded"
                                                        title="Delete table"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Active tab indicator */}
                            {tableId === table.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                            )}
                        </div>
                    ))}

                    {/* Add new table button - simplified */}
                    <div className="relative">
                        <button
                            onClick={handleCreateNewTable}
                            disabled={isCreatingTable}
                            className="flex items-center space-x-1 rounded-t-md border border-transparent bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 transition-colors"
                            title="Create new table"
                        >
                            {isCreatingTable ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3 w-3" />
                                    <span>Add</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error display */}
                {tableError && (
                    <div className="ml-4 text-sm text-red-600">
                        {tableError}
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        {/* Background overlay */}
                        <div
                            className="fixed inset-0 bg-black/30 transition-opacity"
                            onClick={() => setDeleteModalOpen(null)}
                        />

                        {/* Modal */}
                        <div className="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Delete Table
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                This action cannot be undone
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeleteModalOpen(null)}
                                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="mb-6">
                                    <p className="text-gray-700">
                                        Are you sure you want to delete{" "}
                                        <span className="font-semibold">
                                            "{tables?.find(t => t.id === deleteModalOpen)?.name}"
                                        </span>
                                        ? All data in this table will be permanently lost.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteModalOpen(null)}
                                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTable(deleteModalOpen)}
                                        disabled={isDeleting}
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {isDeleting ? "Deleting..." : "Delete Table"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 