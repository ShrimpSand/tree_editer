'use client';

import { TreeNode as TreeNodeType } from '@/types';

interface TreeNodeProps {
  node: TreeNodeType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TreeNode({
  node,
  isSelected,
  onSelect,
  onToggle,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const indentClass = `ml-${node.depth * 4}`;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''}
        `}
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: `${node.depth * 1.5 + 0.75}rem` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center
                     text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {node.isExpanded ? (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <span className="flex-1 text-sm">{node.text || '(空のノード)'}</span>
      </div>
      {hasChildren && node.isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              isSelected={isSelected}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
