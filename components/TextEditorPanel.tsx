'use client';

import { useState, useEffect } from 'react';
import { TreeNode } from '@/types';

interface TextEditorPanelProps {
  selectedNode: TreeNode | null;
  onUpdateText: (id: string, text: string) => void;
  onAddNode: (parentId?: string, depth?: number) => void;
  onDeleteNode: (id: string) => void;
}

export function TextEditorPanel({
  selectedNode,
  onUpdateText,
  onAddNode,
  onDeleteNode,
}: TextEditorPanelProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setText(selectedNode.text);
    } else {
      setText('');
    }
  }, [selectedNode]);

  const handleTextChange = (value: string) => {
    setText(value);
    if (selectedNode) {
      onUpdateText(selectedNode.id, value);
    }
  };

  const handleAddSibling = () => {
    if (selectedNode) {
      onAddNode(selectedNode.parent?.id, selectedNode.depth);
    } else {
      onAddNode(undefined, 0);
    }
  };

  const handleAddChild = () => {
    if (selectedNode) {
      onAddNode(selectedNode.id, selectedNode.depth + 1);
    }
  };

  const handleDelete = () => {
    if (selectedNode) {
      onDeleteNode(selectedNode.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleAddSibling}
          className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600
                   text-white rounded"
          title="新規ノード (Enter)"
        >
          ＋ノード
        </button>
        <button
          onClick={handleAddChild}
          disabled={!selectedNode}
          className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600
                   text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="子ノード追加 (Ctrl+Enter)"
        >
          ＋子
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedNode}
          className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600
                   text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="削除 (Delete)"
        >
          削除
        </button>
      </div>

      {/* テキスト編集エリア */}
      <div className="flex-1 p-4">
        {selectedNode ? (
          <div className="h-full flex flex-col gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              深度: {selectedNode.depth} | ID: {selectedNode.id}
            </div>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600
                       rounded resize-none focus:outline-none focus:ring-2
                       focus:ring-blue-500 dark:bg-gray-800"
              placeholder="ノードのテキストを入力..."
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            ノードを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
