import { Trash2, Plus, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface RowNumberCellProps {
  index: number;
  isSelected: boolean;
  onDeleteRow: () => void;
  onInsertRowAbove?: () => void;
  onInsertRowBelow?: () => void;
  onSelectRow?: () => void;
}

export function RowNumberCell({
  index,
  isSelected,
  onDeleteRow,
  onInsertRowAbove,
  onInsertRowBelow,
  onSelectRow
}: RowNumberCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`
        relative flex items-center justify-center w-full h-full group transition-all duration-150
        ${isSelected
          ? 'bg-blue-100 border-r-2 border-blue-400'
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
      onClick={onSelectRow}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      {/* Row number */}
      <span
        className={`
          text-xs font-mono font-medium transition-colors duration-150
          ${isSelected
            ? 'text-blue-700'
            : isHovered
              ? 'text-gray-700'
              : 'text-gray-500'
          }
        `}
      >
        {index + 1}
      </span>

      {/* Action buttons on hover */}
      {isHovered && !showMenu && (
        <div className="absolute right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(true);
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white rounded"
            title="Row options"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div className="absolute left-full top-0 z-[9999] bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px] ml-1">
          {onInsertRowAbove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInsertRowAbove();
                setShowMenu(false);
              }}
              className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            >
              <Plus className="w-3 h-3 mr-2" />
              Insert row above
            </button>
          )}
          {onInsertRowBelow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInsertRowBelow();
                setShowMenu(false);
              }}
              className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            >
              <Plus className="w-3 h-3 mr-2" />
              Insert row below
            </button>
          )}
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRow();
              setShowMenu(false);
            }}
            className="flex items-center w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Delete row
          </button>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}
    </div>
  );
} 