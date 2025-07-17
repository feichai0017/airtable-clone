import { useState, useEffect, useRef, useCallback } from "react";
import type { CellContext } from "@tanstack/react-table";
import { Check, X, Edit3 } from "lucide-react";
import type {
    RecordRow,
    ColumnValue,
    FilterType,
    SortType
} from "../../types";
import { formatCellValue, validateCellValue, highlightSearchMatch } from "../../utils";

interface CellRendererProps extends CellContext<RecordRow, ColumnValue> {
    keyName: string;
    fieldType: "text" | "number";
    selectedCell: { rowIndex: number; columnId: string } | null;
    setSelectedCell: (cell: { rowIndex: number; columnId: string } | null) => void;
    setData: React.Dispatch<React.SetStateAction<RecordRow[]>>;
    tableId: string | null;
    setIsSaving: (saving: boolean) => void;
    updateCellMutation: any;
    searchQuery: string;
    editedCellsRef: React.MutableRefObject<Map<string, { value: string | number | null }>>;
    activeFilter?: FilterType;
    activeSort?: SortType;
    onNavigateCell?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export function CellRenderer({
    getValue,
    row,
    column,
    keyName,
    fieldType,
    selectedCell,
    setSelectedCell,
    setData,
    tableId,
    setIsSaving,
    updateCellMutation,
    searchQuery,
    editedCellsRef,
    onNavigateCell,
}: CellRendererProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [isHovered, setIsHovered] = useState(false);
    const [isSaving, setIsCellSaving] = useState(false);
    const [hasError, setHasError] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    const currentValue = getValue();
    const isSelected = selectedCell?.rowIndex === row.index && selectedCell?.columnId === keyName;
    const displayValue = formatCellValue(currentValue, fieldType);

    // Auto-focus when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            // Use a small delay to ensure the input is rendered
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    if (inputRef.current instanceof HTMLInputElement) {
                        inputRef.current.select();
                    } else if (inputRef.current instanceof HTMLTextAreaElement) {
                        inputRef.current.select();
                    }
                }
            }, 10);
        }
    }, [isEditing]);

    // Handle outside clicks to save/cancel
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isEditing && cellRef.current && !cellRef.current.contains(event.target as Node)) {
                handleSave();
            }
        }

        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing, editValue]);

    const handleCellClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditing) {
            // If this cell is already selected and user clicks again, start editing
            if (isSelected) {
                setIsEditing(true);
                setEditValue(displayValue);
            } else {
                // Otherwise just select the cell
                setSelectedCell({ rowIndex: row.index, columnId: keyName });
            }
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditing) {
            setSelectedCell({ rowIndex: row.index, columnId: keyName });
            setIsEditing(true);
            setEditValue(displayValue);
        }
    };

    const handleSave = useCallback(async () => {
        if (!tableId || !row.original.id) return;

        setHasError(false);
        setIsCellSaving(true);
        setIsSaving(true); // Set global saving state

        try {
            const validatedValue = validateCellValue(editValue, fieldType);
            const editKey = `${row.original.id}|${keyName}`;

            // Store in edited cells ref for immediate UI update
            editedCellsRef.current.set(editKey, { value: validatedValue });

            // Update local state immediately for instant UI feedback
            setData(prevData =>
                prevData.map(item =>
                    item.id === row.original.id
                        ? { ...item, [keyName]: validatedValue }
                        : item
                )
            );

            setIsEditing(false);

            // Ensure all values are strings for the API
            const stringValue = validatedValue === null || validatedValue === undefined
                ? ""
                : String(validatedValue);

            // Fire and forget the API call for better UX
            updateCellMutation.mutateAsync({
                id: row.original.id,
                data: { [keyName]: stringValue },
            }).then(() => {
                // Remove from edited cells ref after successful save
                editedCellsRef.current.delete(editKey);
            }).catch((error) => {
                console.error("Failed to save cell:", error);
                setHasError(true);
                // Revert local state on error
                setData(prevData =>
                    prevData.map(item =>
                        item.id === row.original.id
                            ? { ...item, [keyName]: currentValue }
                            : item
                    )
                );
                editedCellsRef.current.delete(editKey);
            });

        } catch (error) {
            console.error("Failed to validate cell:", error);
            setHasError(true);
        } finally {
            setIsCellSaving(false);
            setIsSaving(false); // Clear global saving state
        }
    }, [editValue, fieldType, tableId, row.original.id, keyName, editedCellsRef, setData, updateCellMutation, currentValue, setIsSaving]);

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(displayValue);
        setHasError(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case "Enter":
                e.preventDefault();
                if (e.shiftKey && fieldType === "text") {
                    // Multi-line text handling
                    setEditValue(prev => prev + "\n");
                } else {
                    handleSave().then(() => {
                        if (onNavigateCell) onNavigateCell('down');
                    });
                }
                break;
            case "Escape":
                e.preventDefault();
                handleCancel();
                break;
            case "Tab":
                e.preventDefault();
                handleSave().then(() => {
                    if (onNavigateCell) {
                        onNavigateCell(e.shiftKey ? 'left' : 'right');
                    }
                });
                break;
            case "F2":
                e.preventDefault();
                if (!isEditing) {
                    setIsEditing(true);
                    setEditValue(displayValue);
                }
                break;
        }
    };

    // Handle arrow key navigation when not editing
    const handleCellKeyDown = (e: React.KeyboardEvent) => {
        if (!isEditing && isSelected && onNavigateCell) {
            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    onNavigateCell('up');
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    onNavigateCell('down');
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    onNavigateCell('left');
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    onNavigateCell('right');
                    break;
                case "Enter":
                case "F2":
                case " ": // Space key
                    e.preventDefault();
                    if (!isEditing) {
                        setIsEditing(true);
                        setEditValue(displayValue);
                    }
                    break;
            }
        }
    };

    const editKey = `${row.original.id}|${keyName}`;
    const isModified = editedCellsRef.current.has(editKey);

    if (isEditing) {
        const isMultiline = fieldType === "text" && editValue.includes('\n');
        const InputComponent = isMultiline ? 'textarea' : 'input';

        return (
            <div ref={cellRef} className="relative w-full h-full flex items-center">
                <div className="absolute inset-0 bg-white border-2 border-blue-500 shadow-lg rounded-sm z-50">
                    <InputComponent
                        ref={inputRef as any}
                        type={fieldType === "number" ? "number" : "text"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`w-full h-full px-2 py-1 border-none outline-none resize-none text-sm ${hasError ? 'text-red-600' : 'text-gray-900'
                            } ${isMultiline ? 'min-h-[32px]' : ''}`}
                        style={{
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: 'inherit'
                        }}
                        rows={isMultiline ? Math.min(editValue.split('\n').length, 5) : undefined}
                    />

                    {/* Edit controls */}
                    <div className="absolute right-1 top-1 flex items-center space-x-1">
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="w-5 h-5 flex items-center justify-center text-green-600 hover:bg-green-100 rounded"
                                    title="Save (Enter)"
                                >
                                    <Check className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="w-5 h-5 flex items-center justify-center text-red-600 hover:bg-red-100 rounded"
                                    title="Cancel (Esc)"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cellRef}
            className={`
                relative w-full h-full flex items-center px-2 py-1 cursor-cell transition-all duration-150
                ${isSelected
                    ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset'
                    : isHovered
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-25'
                }
                ${isModified ? 'bg-yellow-50 border-l-2 border-yellow-400' : ''}
                ${hasError ? 'bg-red-50 border-l-2 border-red-400' : ''}
                group
            `}
            onClick={handleCellClick}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onKeyDown={handleCellKeyDown}
            tabIndex={isSelected ? 0 : -1}
        >
            <div className="flex-1 text-sm text-gray-900 truncate">
                {searchQuery ? highlightSearchMatch(displayValue, searchQuery) : displayValue}
            </div>

            {/* Edit indicator */}
            {isHovered && !isEditing && (
                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="w-3 h-3 text-gray-400" />
                </div>
            )}

            {/* Modified indicator */}
            {isModified && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full transform translate-x-1 -translate-y-1" />
            )}

            {/* Error indicator */}
            {hasError && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full transform translate-x-1 -translate-y-1" />
            )}
        </div>
    );
} 