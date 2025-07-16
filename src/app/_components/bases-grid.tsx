"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, Table, MoreVertical, Trash2, Edit, Calendar } from "lucide-react";
import { api } from "~/trpc/react";

export function BasesGrid() {
    const [bases] = api.bases.getAll.useSuspenseQuery();

    if (bases.length === 0) {
        return (
            <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new workspace.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bases.map((base) => (
                <BaseCard key={base.id} base={base} />
            ))}
        </div>
    );
}

function BaseCard({ base }: { base: any }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const utils = api.useUtils();
    const deleteBase = api.bases.delete.useMutation({
        onSuccess: async () => {
            await utils.bases.invalidate();
        },
    });

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
            setIsDeleting(true);
            try {
                await deleteBase.mutateAsync({ id: base.id });
            } catch (error) {
                console.error("Failed to delete base:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const tableCount = base.tables?.length || 0;
    const totalRows = base.tables?.reduce((sum: number, table: any) => sum + (table._count?.rows || 0), 0) || 0;

    return (
        <div className="relative group">
            <Link
                href={`/base/${base.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Folder className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 truncate">
                            {base.name}
                        </h3>

                        {/* Stats */}
                        <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-500">
                                <Table className="h-4 w-4 mr-2" />
                                <span>
                                    {tableCount} {tableCount === 1 ? "table" : "tables"}
                                </span>
                            </div>

                            {totalRows > 0 && (
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>{totalRows.toLocaleString()} rows</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Updated {new Date(base.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </Link>

            {/* Menu Button */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-1 rounded-md hover:bg-gray-100"
                >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsMenuOpen(false);
                                // TODO: Implement edit functionality
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsMenuOpen(false);
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 