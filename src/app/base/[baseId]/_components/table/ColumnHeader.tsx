import { Trash2, ArrowUp, ArrowDown, MoreVertical, Type, Hash, Edit2 } from "lucide-react";
import { useState } from "react";

interface ColumnHeaderProps {
  name: string;
  type: "text" | "number";
  isSelected?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onDelete: () => void;
  onSort?: (direction: "asc" | "desc") => void;
  onRename?: (newName: string) => void;
  onTypeChange?: (newType: "text" | "number") => void;
  onInsertColumnLeft?: () => void;
  onInsertColumnRight?: () => void;
}

export function ColumnHeader({ 
  name, 
  type, 
  isSelected,
  sortDirection,
  onDelete, 
  onSort,
  onRename,
  onTypeChange,
  onInsertColumnLeft,
  onInsertColumnRight
}: ColumnHeaderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const handleRename = () => {
    if (editValue.trim() && editValue !== name && onRename) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
    setEditValue(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(name);
    }
  };

  const TypeIcon = type === "number" ? Hash : Type;

  return (
    <div 
      className={`
        relative flex items-center justify-between w-full h-full px-2 py-1 group transition-all duration-150
        ${isSelected 
          ? 'bg-blue-100 border-b-2 border-blue-400' 
          : isHovered 
            ? 'bg-gray-100' 
            : 'bg-gray-50 hover:bg-gray-100'
        }
        border-r border-gray-200 cursor-pointer
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {/* Type icon */}
        <TypeIcon className={`
          w-3 h-3 flex-shrink-0 transition-colors duration-150
          ${isSelected 
            ? 'text-blue-600' 
            : 'text-gray-400'
          }
        `} />
        
        {/* Column name */}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 px-1 py-0.5 text-sm font-medium bg-white border border-blue-300 rounded outline-none"
            autoFocus
          />
        ) : (
          <span 
            className={`
              flex-1 min-w-0 text-sm font-medium truncate transition-colors duration-150
              ${isSelected 
                ? 'text-blue-800' 
                : isHovered 
                  ? 'text-gray-800' 
                  : 'text-gray-700'
              }
            `}
            onDoubleClick={() => {
              if (onRename) {
                setIsEditing(true);
                setEditValue(name);
              }
            }}
            title={name}
          >
            {name}
          </span>
        )}

        {/* Sort indicator */}
        {sortDirection && (
          <div className="flex-shrink-0">
            {sortDirection === "asc" ? (
              <ArrowUp className="w-3 h-3 text-blue-600" />
            ) : (
              <ArrowDown className="w-3 h-3 text-blue-600" />
            )}
          </div>
        )}
      </div>

      {/* Action buttons on hover */}
      {(isHovered || showMenu) && !isEditing && (
        <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors duration-150"
            title="Column options"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div className="absolute right-0 top-full z-[9999] bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]">
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditValue(name);
                setShowMenu(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Rename column
            </button>
          )}

          {onSort && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSort("asc");
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Sort A→Z
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSort("desc");
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Sort Z→A
              </button>
            </>
          )}

          {onTypeChange && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Change type
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTypeChange("text");
                  setShowMenu(false);
                }}
                className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 ${
                  type === "text" ? "text-blue-600 bg-blue-50" : "text-gray-700"
                }`}
              >
                <Type className="w-4 h-4 mr-2" />
                Text
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTypeChange("number");
                  setShowMenu(false);
                }}
                className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 ${
                  type === "number" ? "text-blue-600 bg-blue-50" : "text-gray-700"
                }`}
              >
                <Hash className="w-4 h-4 mr-2" />
                Number
              </button>
            </>
          )}

          {(onInsertColumnLeft || onInsertColumnRight) && (
            <>
              <div className="border-t border-gray-200 my-1" />
              {onInsertColumnLeft && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsertColumnLeft();
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  ← Insert column left
                </button>
              )}
              {onInsertColumnRight && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsertColumnRight();
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Insert column right →
                </button>
              )}
            </>
          )}

          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setShowMenu(false);
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete column
          </button>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 right-0 h-1 bg-blue-500" />
      )}

      {/* Resize handle */}
      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 opacity-0 hover:opacity-100 transition-opacity duration-150" />
    </div>
  );
} 