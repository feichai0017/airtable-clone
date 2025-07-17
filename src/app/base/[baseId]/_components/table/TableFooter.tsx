import { Plus, Users, X, Loader2, Sparkles } from "lucide-react";
import type { BulkProgress } from "../../types";

interface TableFooterProps {
    createRowHandler: () => Promise<void>;
    handleAddFakeRecords: (count: number) => Promise<void>;
    isSaving: boolean;
    isAddingBulkRows: boolean;
    bulkRowProgress: BulkProgress;
    cancelBulkRowAddition: () => void;
    totalCount?: number;
}

export function TableFooter({
    createRowHandler,
    handleAddFakeRecords,
    isSaving,
    isAddingBulkRows,
    bulkRowProgress,
    cancelBulkRowAddition,
    totalCount,
}: TableFooterProps) {
    return (
        <div className="flex h-12 items-center justify-between border-t border-gray-200 bg-white px-4 shadow-sm">
            <div className="flex items-center space-x-3">
                {/* Add single record */}
                <button
                    onClick={createRowHandler}
                    disabled={isSaving}
                    className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add record</span>
                </button>

                {/* Add multiple fake records */}
                {!isAddingBulkRows && (
                    <div className="flex items-center space-x-2">
                        <div className="w-px h-6 bg-gray-300" />
                        
                        <button
                            onClick={() => handleAddFakeRecords(100)}
                            disabled={isSaving}
                            className="flex items-center space-x-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift"
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>+100</span>
                        </button>
                        
                        <button
                            onClick={() => handleAddFakeRecords(1000)}
                            disabled={isSaving}
                            className="flex items-center space-x-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white transition-all duration-200 hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift"
                        >
                            <Users className="h-4 w-4" />
                            <span>+1K</span>
                        </button>
                        
                        <button
                            onClick={() => handleAddFakeRecords(10000)}
                            disabled={isSaving}
                            className="flex items-center space-x-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-sm text-white transition-all duration-200 hover:bg-orange-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift"
                        >
                            <Users className="h-4 w-4" />
                            <span>+10K</span>
                        </button>
                    </div>
                )}

                {/* Bulk addition progress */}
                {isAddingBulkRows && (
                    <div className="flex items-center space-x-4 animate-pulse">
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <div className="absolute inset-0 rounded-full border-2 border-blue-200" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                Adding records: <span className="text-blue-600">{bulkRowProgress.current.toLocaleString()}</span> / {bulkRowProgress.total.toLocaleString()}
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* Progress bar */}
                            <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{
                                        width: `${(bulkRowProgress.current / bulkRowProgress.total) * 100}%`,
                                    }}
                                />
                            </div>
                            
                            {/* Progress percentage */}
                            <span className="text-xs text-gray-500 font-mono min-w-[3rem] text-right">
                                {Math.round((bulkRowProgress.current / bulkRowProgress.total) * 100)}%
                            </span>
                            
                            {/* Cancel button */}
                            <button
                                onClick={cancelBulkRowAddition}
                                className="flex items-center space-x-1 rounded-md border border-red-300 bg-white px-2 py-1 text-sm text-red-600 transition-all duration-200 hover:bg-red-50 hover:border-red-400 hover:shadow-sm"
                            >
                                <X className="h-3 w-3" />
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Total count display */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
                {totalCount !== undefined && (
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="font-mono">
                            {totalCount.toLocaleString()} records total
                        </span>
                    </div>
                )}
                
                {isSaving && !isAddingBulkRows && (
                    <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" />
                        <span className="text-blue-600">Saving...</span>
                    </div>
                )}
            </div>
        </div>
    );
} 