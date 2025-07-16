"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Table, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Calendar, 
  Database,
  Zap 
} from "lucide-react";
import { api } from "~/trpc/react";

interface TablesGridProps {
  baseId: string;
}

export function TablesGrid({ baseId }: TablesGridProps) {
  const [tables] = api.tables.getAll.useSuspenseQuery({ baseId });

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <Table className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tables</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first table.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tables.map((table) => (
        <TableCard key={table.id} table={table} baseId={baseId} />
      ))}
    </div>
  );
}

function TableCard({ table, baseId }: { table: any; baseId: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const utils = api.useUtils();
  const deleteTable = api.tables.delete.useMutation({
    onSuccess: async () => {
      await utils.tables.invalidate();
    },
  });

  const generateFakeData = api.tables.generateFakeData.useMutation({
    onSuccess: async () => {
      await utils.tables.invalidate();
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this table? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteTable.mutateAsync({ id: table.id });
      } catch (error) {
        console.error("Failed to delete table:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleGenerateFakeData = async () => {
    if (confirm("This will add 100,000 rows of fake data to your table. Continue?")) {
      setIsGenerating(true);
      setIsMenuOpen(false);
      try {
        await generateFakeData.mutateAsync({ tableId: table.id, count: 100000 });
      } catch (error) {
        console.error("Failed to generate fake data:", error);
      }
    }
  };

  const rowCount = table._count?.rows || 0;
  const columnCount = table._count?.columns || 0;

  return (
    <div className="relative group">
      <Link
        href={`/base/${baseId}/table/${table.id}`}
        className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Table className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 truncate">
              {table.name}
            </h3>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Database className="h-4 w-4 mr-2" />
                <span>
                  {columnCount} {columnCount === 1 ? "column" : "columns"}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{rowCount.toLocaleString()} rows</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Updated {new Date(table.updatedAt).toLocaleDateString()}
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
                handleGenerateFakeData();
              }}
              disabled={isGenerating}
              className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Add 100k Rows"}
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

      {/* Loading overlay for data generation */}
      {isGenerating && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Generating 100k rows...</p>
          </div>
        </div>
      )}
    </div>
  );
} 