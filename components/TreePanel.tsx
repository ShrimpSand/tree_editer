'use client';

import { TreeNode as TreeNodeType } from '@/types';
import { TreeNode } from './TreeNode';

interface TreePanelProps {
  nodes: TreeNodeType[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onToggleNode: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function TreePanel({ nodes, selectedNodeId, onSelectNode, onToggleNode, onExpandAll, onCollapseAll }: TreePanelProps) {
  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
      {/* ツールバー */}
      <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onExpandAll}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200
                   dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
          title="全て展開 (Ctrl+A)"
        >
          全展開
        </button>
        <button
          onClick={onCollapseAll}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200
                   dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
          title="全て折りたたみ (Ctrl+Z)"
        >
          全折畳
        </button>
      </div>

      {/* ツリー表示エリア */}
      <div className="flex-1 overflow-y-auto">
        {nodes.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">ノードがありません</div>
        ) : (
          nodes.map((node) => (
            <TreeNode key={node.id} node={node} isSelected={selectedNodeId === node.id} onSelect={onSelectNode} onToggle={onToggleNode} />
          ))
        )}
      </div>
    </div>
  );
}
