'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TreeNode, FileData } from '@/types';
import { useFontSize } from '@/contexts/FontSizeContext';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon, MinusIcon, ArrowUturnDownIcon } from '@heroicons/react/16/solid';
import { FileSelector } from './FileSelector';

interface BrowserViewProps {
  files: FileData[];
  currentFileId: string;
  nodes: TreeNode[];
  onToggleNode: (id: string) => void;
  onUpdateNodes: (nodes: TreeNode[]) => void;
  onSwitchToEditor: () => void;
  onFileSelect: (fileId: string) => void;
  onNewFile: () => void;
  onDeleteFile: (fileId: string) => void;
}

// フラット化されたノードの型（表示用）
interface FlatNode {
  id: string;
  text: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  index: number;
}

// ドロップ位置の種類
type DropPosition = 'before' | 'after' | 'child';

// ドロップターゲットの情報
interface DropTarget {
  nodeId: string;
  position: DropPosition;
}

export function BrowserView({
  files,
  currentFileId,
  nodes,
  onToggleNode,
  onUpdateNodes,
  onSwitchToEditor,
  onFileSelect,
  onNewFile,
  onDeleteFile,
}: BrowserViewProps) {
  const { fontSize, setFontSize, indentWidth } = useFontSize();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const collect = (nodeList: TreeNode[]) => {
      nodeList.forEach((node) => {
        if (node.isExpanded) ids.add(node.id);
        if (node.children) collect(node.children);
      });
    };
    collect(nodes);
    return ids;
  });

  // アンドゥ・リドゥ用の履歴
  const [history, setHistory] = useState<TreeNode[][]>([nodes]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // ドラッグアンドドロップ用の状態
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // ノードをフラット化（展開状態に応じて）
  const flatNodes = useMemo<FlatNode[]>(() => {
    const result: FlatNode[] = [];
    let index = 0;

    const traverse = (node: TreeNode) => {
      const isExpanded = expandedIds.has(node.id);
      result.push({
        id: node.id,
        text: node.text,
        depth: node.depth,
        hasChildren: node.children && node.children.length > 0,
        isExpanded,
        index: index++,
      });

      if (isExpanded && node.children) {
        node.children.forEach(traverse);
      }
    };

    nodes.forEach(traverse);
    return result;
  }, [nodes, expandedIds]);

  // ノードマップ（高速検索用）
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const build = (nodeList: TreeNode[]) => {
      nodeList.forEach((node) => {
        map.set(node.id, node);
        if (node.children) build(node.children);
      });
    };
    build(nodes);
    return map;
  }, [nodes]);

  // 深さごとのノード数を計算
  const depthCounts = useMemo(() => {
    const counts = new Map<number, number>();
    flatNodes.forEach((node) => {
      counts.set(node.depth, (counts.get(node.depth) || 0) + 1);
    });
    return counts;
  }, [flatNodes]);

  // 最大深度を取得
  const maxDepth = useMemo(() => {
    return Math.max(0, ...Array.from(depthCounts.keys()));
  }, [depthCounts]);

  // スクロール処理
  const scrollToIndex = useCallback((index: number) => {
    const row = rowRefs.current.get(index);
    if (row) {
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, []);

  // トグル処理
  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 階層全体を開閉
  const handleToggleDepth = useCallback(
    (depth: number) => {
      const nodesAtDepth = flatNodes.filter((n) => n.depth === depth && n.hasChildren);
      if (nodesAtDepth.length === 0) return;

      const allExpanded = nodesAtDepth.every((n) => expandedIds.has(n.id));

      setExpandedIds((prev) => {
        const newSet = new Set(prev);
        nodesAtDepth.forEach((node) => {
          if (allExpanded) {
            newSet.delete(node.id);
          } else {
            newSet.add(node.id);
          }
        });
        return newSet;
      });
    },
    [flatNodes, expandedIds]
  );

  // 全て展開
  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collect = (nodeList: TreeNode[]) => {
      nodeList.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collect(node.children);
        }
      });
    };
    collect(nodes);
    setExpandedIds(allIds);
  }, [nodes]);

  // 全て折りたたみ
  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // 履歴に追加
  const addToHistory = useCallback((newNodes: TreeNode[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newNodes);
      // 履歴は最大50件まで保持
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistoryIndex((idx) => idx);
        return newHistory;
      }
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  // アンドゥ
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onUpdateNodes(history[newIndex]);
    }
  }, [historyIndex, history, onUpdateNodes]);

  // リドゥ
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onUpdateNodes(history[newIndex]);
    }
  }, [historyIndex, history, onUpdateNodes]);

  // 削除処理
  const handleDelete = useCallback(
    (id: string) => {
      const removeNode = (nodeList: TreeNode[]): TreeNode[] => {
        return nodeList
          .filter((node) => node.id !== id)
          .map((node) => ({
            ...node,
            children: removeNode(node.children || []),
          }));
      };

      const updatedNodes = removeNode(nodes);
      addToHistory(updatedNodes);
      onUpdateNodes(updatedNodes);

      const newIndex = Math.min(focusedIndex, flatNodes.length - 2);
      setFocusedIndex(Math.max(0, newIndex));
    },
    [nodes, onUpdateNodes, focusedIndex, flatNodes.length, addToHistory]
  );

  // 兄弟ノード追加
  const handleAddSibling = useCallback(
    (id: string) => {
      const targetNode = nodeMap.get(id);
      if (!targetNode) return;

      const newNode: TreeNode = {
        id: `node-${Date.now()}`,
        text: '',
        depth: targetNode.depth,
        children: [],
        isExpanded: true,
        parent: targetNode.parent,
      };

      if (targetNode.parent) {
        const updateNode = (node: TreeNode): TreeNode => {
          if (node.id === targetNode.parent!.id) {
            const targetIndex = node.children.findIndex((n) => n.id === id);
            const newChildren = [...node.children];
            newChildren.splice(targetIndex + 1, 0, newNode);
            return { ...node, children: newChildren };
          }
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateNode),
            };
          }
          return node;
        };

        const updatedNodes = nodes.map(updateNode);
        addToHistory(updatedNodes);
        onUpdateNodes(updatedNodes);
      } else {
        const targetIndex = nodes.findIndex((n) => n.id === id);
        const newNodes = [...nodes];
        newNodes.splice(targetIndex + 1, 0, newNode);
        addToHistory(newNodes);
        onUpdateNodes(newNodes);
      }

      setEditingId(newNode.id);
    },
    [nodes, onUpdateNodes, nodeMap, addToHistory]
  );

  // 親ノードに兄弟を追加
  const handleAddParentSibling = useCallback(
    (id: string) => {
      const targetNode = nodeMap.get(id);
      if (!targetNode) return;

      // 親ノードがない場合（ルートレベル）は何もしない
      if (!targetNode.parent) return;

      const parentNode = targetNode.parent;
      const newNode: TreeNode = {
        id: `node-${Date.now()}`,
        text: '',
        depth: parentNode.depth,
        children: [],
        isExpanded: true,
        parent: parentNode.parent,
      };

      // 親の親が存在する場合
      if (parentNode.parent) {
        const updateNode = (node: TreeNode): TreeNode => {
          if (node.id === parentNode.parent!.id) {
            const parentIndex = node.children.findIndex((n) => n.id === parentNode.id);
            const newChildren = [...node.children];
            newChildren.splice(parentIndex + 1, 0, newNode);
            return { ...node, children: newChildren };
          }
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateNode),
            };
          }
          return node;
        };

        const updatedNodes = nodes.map(updateNode);
        addToHistory(updatedNodes);
        onUpdateNodes(updatedNodes);
      } else {
        // 親がルートレベルの場合
        const parentIndex = nodes.findIndex((n) => n.id === parentNode.id);
        const newNodes = [...nodes];
        newNodes.splice(parentIndex + 1, 0, newNode);
        addToHistory(newNodes);
        onUpdateNodes(newNodes);
      }

      setEditingId(newNode.id);
    },
    [nodes, onUpdateNodes, nodeMap, addToHistory]
  );

  // テキスト更新
  const handleUpdateText = useCallback(
    (id: string, newText: string) => {
      // 空文字の場合はノード作成をキャンセル（削除）
      if (newText.trim() === '') {
        const removeNode = (nodeList: TreeNode[]): TreeNode[] => {
          return nodeList
            .filter((node) => node.id !== id)
            .map((node) => ({
              ...node,
              children: removeNode(node.children || []),
            }));
        };

        const updatedNodes = removeNode(nodes);
        addToHistory(updatedNodes);
        onUpdateNodes(updatedNodes);
        setEditingId(null);
        return;
      }

      // 通常の更新処理
      const updateNode = (node: TreeNode): TreeNode => {
        if (node.id === id) {
          return { ...node, text: newText };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        }
        return node;
      };

      const updatedNodes = nodes.map(updateNode);
      addToHistory(updatedNodes);
      onUpdateNodes(updatedNodes);
      setEditingId(null);

      // テキストが保存された場合、そのノードにフォーカスを移動
      setTimeout(() => {
        // 更新後のflatNodesを再計算する必要があるため、少し待つ
        const newFlatNodes: FlatNode[] = [];
        let index = 0;

        const traverse = (node: TreeNode) => {
          const isExpanded = expandedIds.has(node.id);
          newFlatNodes.push({
            id: node.id,
            text: node.text,
            depth: node.depth,
            hasChildren: node.children && node.children.length > 0,
            isExpanded,
            index: index++,
          });

          if (isExpanded && node.children) {
            node.children.forEach(traverse);
          }
        };

        updatedNodes.forEach(traverse);

        const newIndex = newFlatNodes.findIndex((n) => n.id === id);
        if (newIndex !== -1) {
          setFocusedIndex(newIndex);
          scrollToIndex(newIndex);
        }
      }, 50);
    },
    [nodes, onUpdateNodes, addToHistory, expandedIds, scrollToIndex]
  );

  // 子ノード追加
  const handleAddChild = useCallback(
    (id: string) => {
      const updateNode = (node: TreeNode): TreeNode => {
        if (node.id === id) {
          const newNode: TreeNode = {
            id: `node-${Date.now()}`,
            text: '',
            depth: node.depth + 1,
            children: [],
            isExpanded: true,
            parent: node,
          };

          return {
            ...node,
            children: [...(node.children || []), newNode],
            isExpanded: true,
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        }
        return node;
      };

      const updatedNodes = nodes.map(updateNode);
      addToHistory(updatedNodes);
      onUpdateNodes(updatedNodes);
      setExpandedIds((prev) => new Set(prev).add(id));

      setTimeout(() => {
        const newMap = new Map<string, TreeNode>();
        const build = (nodeList: TreeNode[]) => {
          nodeList.forEach((node) => {
            newMap.set(node.id, node);
            if (node.children) build(node.children);
          });
        };
        build(updatedNodes);

        const updatedParent = newMap.get(id);
        if (updatedParent?.children && updatedParent.children.length > 0) {
          const newChildId = updatedParent.children[updatedParent.children.length - 1].id;
          setEditingId(newChildId);
        }
      }, 50);
    },
    [nodes, onUpdateNodes, addToHistory]
  );

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    setDraggingId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId);
  }, []);

  // ドラッグオーバー（ドロップ位置の判定）
  const handleDragOver = useCallback((e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingId || draggingId === targetNodeId) {
      setDropTarget(null);
      return;
    }

    // ドラッグ中のノードの子孫にはドロップできない
    const dragNode = nodeMap.get(draggingId);
    const targetNode = nodeMap.get(targetNodeId);
    if (!dragNode || !targetNode) return;

    // 子孫チェック
    const isDescendant = (parent: TreeNode, childId: string): boolean => {
      if (parent.id === childId) return true;
      if (!parent.children) return false;
      return parent.children.some(child => isDescendant(child, childId));
    };

    if (isDescendant(dragNode, targetNodeId)) {
      setDropTarget(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // 上下30%の範囲で before/after、中央40%で child
    let position: DropPosition;
    if (y < height * 0.3) {
      position = 'before';
    } else if (y > height * 0.7) {
      position = 'after';
    } else {
      position = 'child';
    }

    setDropTarget({ nodeId: targetNodeId, position });
  }, [draggingId, nodeMap]);

  // ドラッグリーブ
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // 子要素に移動した場合はクリアしない
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setDropTarget(null);
  }, []);

  // ドロップ処理
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingId || !dropTarget) {
      setDraggingId(null);
      setDropTarget(null);
      return;
    }

    const sourceNode = nodeMap.get(draggingId);
    const targetNode = nodeMap.get(dropTarget.nodeId);

    if (!sourceNode || !targetNode) {
      setDraggingId(null);
      setDropTarget(null);
      return;
    }

    // ノードを削除する関数
    const removeNode = (nodeList: TreeNode[], nodeId: string): TreeNode[] => {
      return nodeList
        .filter(node => node.id !== nodeId)
        .map(node => ({
          ...node,
          children: removeNode(node.children || [], nodeId),
        }));
    };

    // ノードの深さを更新する関数（子孫全てを再帰的に更新）
    const updateNodeDepth = (node: TreeNode, newDepth: number, newParent?: TreeNode): TreeNode => {
      const updated: TreeNode = {
        ...node,
        depth: newDepth,
        parent: newParent,
      };

      if (node.children && node.children.length > 0) {
        updated.children = node.children.map(child => updateNodeDepth(child, newDepth + 1, updated));
      }

      return updated;
    };

    // ノードを挿入する関数
    const insertNode = (nodeList: TreeNode[], targetId: string, newNode: TreeNode, position: DropPosition): TreeNode[] => {
      return nodeList.map(node => {
        if (node.id === targetId) {
          if (position === 'child') {
            // 子として追加（子ノード全てを引き連れる）
            const nodeWithUpdatedDepth = updateNodeDepth(newNode, node.depth + 1, node);
            return {
              ...node,
              children: [...(node.children || []), nodeWithUpdatedDepth],
              isExpanded: true,
            };
          }
        }

        // 子ノードを処理
        if (node.children && node.children.length > 0) {
          const childIndex = node.children.findIndex(child => child.id === targetId);

          if (childIndex !== -1 && (position === 'before' || position === 'after')) {
            // 同階層に挿入（子ノード全てを引き連れる）
            const newChildren = [...node.children];
            const insertIndex = position === 'before' ? childIndex : childIndex + 1;
            const nodeWithUpdatedDepth = updateNodeDepth(newNode, node.children[childIndex].depth, node);
            newChildren.splice(insertIndex, 0, nodeWithUpdatedDepth);
            return { ...node, children: newChildren };
          }

          return {
            ...node,
            children: insertNode(node.children, targetId, newNode, position),
          };
        }

        return node;
      });
    };

    // ルートレベルの処理
    const rootIndex = nodes.findIndex(node => node.id === dropTarget.nodeId);
    if (rootIndex !== -1 && (dropTarget.position === 'before' || dropTarget.position === 'after')) {
      // ルートレベルでの before/after（子ノード全てを引き連れる）
      const nodesWithoutSource = removeNode(nodes, draggingId);
      const newNodes = [...nodesWithoutSource];
      const targetIndex = newNodes.findIndex(node => node.id === dropTarget.nodeId);

      if (targetIndex !== -1) {
        const insertIndex = dropTarget.position === 'before' ? targetIndex : targetIndex + 1;
        // ルートレベルなので depth を 0 に、親も undefined に更新
        const nodeWithUpdatedDepth = updateNodeDepth(sourceNode, 0, undefined);
        newNodes.splice(insertIndex, 0, nodeWithUpdatedDepth);
        addToHistory(newNodes);
        onUpdateNodes(newNodes);
      }
    } else {
      // 階層内での移動（子ノード全てを引き連れる）
      const nodesWithoutSource = removeNode(nodes, draggingId);
      const newNodes = insertNode(nodesWithoutSource, dropTarget.nodeId, sourceNode, dropTarget.position);
      addToHistory(newNodes);
      onUpdateNodes(newNodes);
    }

    // ドロップ先が child の場合は展開
    if (dropTarget.position === 'child') {
      setExpandedIds(prev => new Set(prev).add(dropTarget.nodeId));
    }

    setDraggingId(null);
    setDropTarget(null);
  }, [draggingId, dropTarget, nodeMap, nodes, addToHistory, onUpdateNodes]);

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // アンドゥ・リドゥ（編集中でも動作）
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (editingId) return;

      const currentNode = flatNodes[focusedIndex];
      if (!currentNode) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            for (let i = focusedIndex - 1; i >= 0; i--) {
              if (flatNodes[i].depth === currentNode.depth) {
                setFocusedIndex(i);
                scrollToIndex(i);
                break;
              }
            }
          } else {
            const newIndex = Math.max(0, focusedIndex - 1);
            setFocusedIndex(newIndex);
            scrollToIndex(newIndex);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            for (let i = focusedIndex + 1; i < flatNodes.length; i++) {
              if (flatNodes[i].depth === currentNode.depth) {
                setFocusedIndex(i);
                scrollToIndex(i);
                break;
              }
            }
          } else {
            const newIndex = Math.min(flatNodes.length - 1, focusedIndex + 1);
            setFocusedIndex(newIndex);
            scrollToIndex(newIndex);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (currentNode.isExpanded && currentNode.hasChildren) {
            handleToggle(currentNode.id);
          } else {
            const node = nodeMap.get(currentNode.id);
            if (node?.parent) {
              const parentIndex = flatNodes.findIndex((n) => n.id === node.parent!.id);
              if (parentIndex !== -1) {
                setFocusedIndex(parentIndex);
                scrollToIndex(parentIndex);
              }
            }
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (currentNode.hasChildren) {
            if (!currentNode.isExpanded) {
              handleToggle(currentNode.id);
            } else {
              const nextIndex = focusedIndex + 1;
              if (nextIndex < flatNodes.length) {
                setFocusedIndex(nextIndex);
                scrollToIndex(nextIndex);
              }
            }
          }
          break;

        case ' ':
          e.preventDefault();
          if (currentNode.hasChildren) {
            handleToggle(currentNode.id);
          }
          break;

        case 'Enter':
          e.preventDefault();
          handleAddSibling(currentNode.id);
          break;

        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            handleAddParentSibling(currentNode.id);
          } else {
            handleAddChild(currentNode.id);
          }
          break;

        case 'F2':
          e.preventDefault();
          setEditingId(currentNode.id);
          break;

        case 'Delete':
          e.preventDefault();
          handleDelete(currentNode.id);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, flatNodes, editingId, nodeMap, handleToggle, scrollToIndex, handleAddSibling, handleAddChild, handleDelete, handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen w-full">
      {/* ツールバー */}
      <div className="relative h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="absolute inset-0 flex items-center justify-between">
          {/* 左側: 階層ボタン */}
          <div className="flex items-center gap-2 pl-2">
            {Array.from({ length: maxDepth + 1 }, (_, depth) => {
              const count = depthCounts.get(depth) || 0;
              if (count === 0) return null;

              const nodesAtDepth = flatNodes.filter((n) => n.depth === depth && n.hasChildren);
              const expandedCount = nodesAtDepth.filter((n) => n.isExpanded).length;
              const allExpanded = nodesAtDepth.length > 0 && expandedCount === nodesAtDepth.length;

              // テキストの開始位置: px-2パディング(8px) + インデント(depth * indentWidth) + w-5ボタンコンテナ(20px) + mr-1(4px)
              const leftPosition = depth * indentWidth + 13;

              return (
                <button
                  key={depth}
                  onClick={() => handleToggleDepth(depth)}
                  className="absolute flex items-center justify-center p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                  style={{ left: `${leftPosition}px` }}
                  title={`階層${depth} (${expandedCount}/${nodesAtDepth.length}展開中)`}
                >
                  {allExpanded ? (
                    <ChevronDownIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                  ) : (
                    <ChevronRightIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* 右側: ツール群 */}
          <div className="flex items-center gap-2 pr-2">
            {/* ファイル選択 */}
            <FileSelector
              files={files}
              currentFileId={currentFileId}
              onFileSelect={onFileSelect}
              onNewFile={onNewFile}
              onDeleteFile={onDeleteFile}
            />
            {/* フォントサイズ調整 */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => fontSize > 8 && setFontSize(fontSize - 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="フォントサイズを小さく"
              >
                <MinusIcon style={{ width: '12px', height: '12px' }} />
              </button>
              <span className="text-xs font-mono w-6 text-center">{fontSize}</span>
              <button
                onClick={() => fontSize < 24 && setFontSize(fontSize + 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="フォントサイズを大きく"
              >
                <PlusIcon style={{ width: '12px', height: '12px' }} />
              </button>
            </div>

            <button onClick={handleExpandAll} className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded">
              全展開
            </button>
            <button onClick={handleCollapseAll} className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded">
              全折畳
            </button>
            <button onClick={onSwitchToEditor} className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded">
              エディタに切替
            </button>
          </div>
        </div>
      </div>

      {/* ツリー表示エリア */}
      <div className="flex-1 overflow-y-auto" ref={containerRef}>
        {flatNodes.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">エディタでテキストを入力してください</div>
        ) : (
          <div className="p-2">
            {flatNodes.map((node, index) => {
              const isFocused = index === focusedIndex;
              const isEditing = node.id === editingId;
              const isDragging = draggingId === node.id;
              const isDropTarget = dropTarget?.nodeId === node.id;
              const dropPosition = isDropTarget ? dropTarget.position : null;

              // ドロップターゲットのスタイルクラス
              let dropIndicatorClass = '';
              if (isDropTarget) {
                if (dropPosition === 'before') {
                  dropIndicatorClass = 'border-t-2 border-blue-500';
                } else if (dropPosition === 'after') {
                  dropIndicatorClass = 'border-b-2 border-blue-500';
                } else if (dropPosition === 'child') {
                  dropIndicatorClass = 'bg-blue-100 dark:bg-blue-900/30';
                }
              }

              return (
                <div
                  key={node.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(index, el);
                    else rowRefs.current.delete(index);
                  }}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, node.id)}
                  onDragOver={(e) => handleDragOver(e, node.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`relative flex items-start px-2 ${isFocused ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${isDragging ? 'opacity-50' : ''} ${dropIndicatorClass} transition-all cursor-move`}
                  onClick={() => {
                    setFocusedIndex(index);
                    if (node.hasChildren) {
                      handleToggle(node.id);
                    }
                  }}
                  style={{ contentVisibility: 'auto' }}
                >
                  {/* インデントガイドライン（VSCodeスタイルの縦線） */}
                  {node.depth > 0 && (
                    <div className="absolute left-4 top-0 bottom-0 flex">
                      {Array.from({ length: node.depth }, (_, i) => (
                        <div key={i} className="relative" style={{ width: `${indentWidth + 0.3}px` }}>
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-700" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* インデント */}
                  <div style={{ width: `${node.depth * indentWidth}px` }} className="flex-shrink-0" />

                  {/* 展開/折りたたみボタン */}
                  <div className="w-5 flex items-start justify-center flex-shrink-0 mr-1">
                    {node.hasChildren && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(node.id);
                        }}
                        className="flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        {node.isExpanded ? (
                          <ChevronDownIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                        ) : (
                          <ChevronRightIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                        )}
                      </button>
                    )}
                  </div>

                  {/* テキスト */}
                  <div className="flex-1 flex items-start gap-2">
                    {isEditing ? (
                      <textarea
                        defaultValue={node.text}
                        onInput={(e) => {
                          // 高さを自動調整
                          const target = e.currentTarget;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUpdateText(node.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingId(null);
                          } else if (e.key === 'Tab') {
                            e.preventDefault();
                            e.stopPropagation();
                            const currentValue = e.currentTarget.value;
                            // 空の場合は何もしない（ノードをキャンセル）
                            if (currentValue.trim() === '') {
                              handleUpdateText(node.id, currentValue);
                              return;
                            }

                            // テキストを確定してから子ノードを追加
                            // まず現在のノードのテキストを更新
                            const updateNodeText = (n: TreeNode): TreeNode => {
                              if (n.id === node.id) {
                                return { ...n, text: currentValue };
                              }
                              if (n.children) {
                                return {
                                  ...n,
                                  children: n.children.map(updateNodeText),
                                };
                              }
                              return n;
                            };

                            const nodesWithUpdatedText = nodes.map(updateNodeText);

                            // 次に子ノードを追加
                            const addChildToNode = (n: TreeNode): TreeNode => {
                              if (n.id === node.id) {
                                const newNode: TreeNode = {
                                  id: `node-${Date.now()}`,
                                  text: '',
                                  depth: n.depth + 1,
                                  children: [],
                                  isExpanded: true,
                                  parent: n,
                                };

                                return {
                                  ...n,
                                  children: [...(n.children || []), newNode],
                                  isExpanded: true,
                                };
                              }
                              if (n.children) {
                                return {
                                  ...n,
                                  children: n.children.map(addChildToNode),
                                };
                              }
                              return n;
                            };

                            const finalNodes = nodesWithUpdatedText.map(addChildToNode);
                            addToHistory(finalNodes);
                            onUpdateNodes(finalNodes);
                            setExpandedIds((prev) => new Set(prev).add(node.id));

                            // フォーカスを親ノードに移動
                            setTimeout(() => {
                              const newFlatNodes: FlatNode[] = [];
                              let index = 0;

                              const traverse = (n: TreeNode) => {
                                const isExpanded = expandedIds.has(n.id) || n.id === node.id;
                                newFlatNodes.push({
                                  id: n.id,
                                  text: n.text,
                                  depth: n.depth,
                                  hasChildren: n.children && n.children.length > 0,
                                  isExpanded,
                                  index: index++,
                                });

                                if (isExpanded && n.children) {
                                  n.children.forEach(traverse);
                                }
                              };

                              finalNodes.forEach(traverse);

                              const parentIndex = newFlatNodes.findIndex((n) => n.id === node.id);
                              if (parentIndex !== -1) {
                                setFocusedIndex(parentIndex);
                                scrollToIndex(parentIndex);
                              }

                              // 新しい子ノードを編集モードに
                              const newMap = new Map<string, TreeNode>();
                              const build = (nodeList: TreeNode[]) => {
                                nodeList.forEach((n) => {
                                  newMap.set(n.id, n);
                                  if (n.children) build(n.children);
                                });
                              };
                              build(finalNodes);

                              const updatedParent = newMap.get(node.id);
                              if (updatedParent?.children && updatedParent.children.length > 0) {
                                const newChildId = updatedParent.children[updatedParent.children.length - 1].id;
                                setEditingId(newChildId);
                              }
                            }, 50);
                          }
                        }}
                        onBlur={(e) => handleUpdateText(node.id, e.currentTarget.value)}
                        autoFocus
                        rows={1}
                        ref={(el) => {
                          if (el) {
                            // 初期の高さを1行分に設定してから、内容に応じて調整
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        className="flex-1 px-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-blue-400 font-mono resize-none overflow-hidden"
                        style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                      />
                    ) : (
                      <>
                        <span
                          className="flex-1 px-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded font-mono whitespace-normal break-words"
                          style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                          onDoubleClick={() => setEditingId(node.id)}
                        >
                          {node.text || '\u00A0'}
                        </span>

                        {isFocused && !isEditing && (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(node.id);
                              }}
                              className="p-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
                              title="編集"
                            >
                              <PencilIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSibling(node.id);
                              }}
                              className="p-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
                              title="同階層に追加"
                            >
                              <PlusIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddChild(node.id);
                              }}
                              className="p-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
                              title="子階層に追加"
                            >
                              <ArrowUturnDownIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(node.id);
                              }}
                              className="p-1 bg-red-200 hover:bg-red-300 dark:bg-red-900 dark:hover:bg-red-800 rounded"
                              title="削除"
                            >
                              <TrashIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* キーボードショートカットヘルプ */}
      <div className="p-3 text-xs text-gray-400 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 flex-wrap">
          <span>↑/↓: 1行ずつ移動</span>
          <span>Ctrl+↑/↓: 同階層を移動</span>
          <span>←: 親へ/折畳</span>
          <span>→: 子へ/展開</span>
          <span>Space: 開閉</span>
          <span>Enter: 同階層に追加</span>
          <span>Tab: 子階層に追加</span>
          <span>F2: 編集</span>
          <span>Delete: 削除</span>
          <span>Ctrl+Z: 元に戻す</span>
          <span>Ctrl+Y: やり直し</span>
        </div>
      </div>
    </div>
  );
}
