import { TreeNode } from '@/types';

/**
 * テキストからインデント深度を計算
 * @param line テキスト行
 * @returns インデント深度（タブ1つ = 深度1）
 */
export function getIndentDepth(line: string): number {
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\t') {
      depth++;
    } else {
      break;
    }
  }
  return depth;
}

/**
 * インデント付きテキストをツリー構造に変換
 * @param text インデント付きテキスト
 * @returns TreeNodeの配列
 */
export function parseTextToTree(text: string): TreeNode[] {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const nodes: TreeNode[] = [];
  const stack: TreeNode[] = [];

  lines.forEach((line, index) => {
    const depth = getIndentDepth(line);
    const text = line.replace(/^\t+/, '').trim();

    const node: TreeNode = {
      id: `node-${Date.now()}-${index}`,
      text,
      depth,
      children: [],
      isExpanded: true,
    };

    // スタックから現在の深度より深いノードを削除
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    // 親ノードを設定
    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      node.parent = parent;
      parent.children.push(node);
    } else {
      // ルートノード
      nodes.push(node);
    }

    stack.push(node);
  });

  return nodes;
}

/**
 * ツリー構造をインデント付きテキストに変換
 * @param nodes TreeNodeの配列
 * @returns インデント付きテキスト
 */
export function serializeTreeToText(nodes: TreeNode[]): string {
  const lines: string[] = [];

  function traverse(node: TreeNode) {
    const indent = '\t'.repeat(node.depth);
    lines.push(`${indent}${node.text}`);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return lines.join('\n');
}

/**
 * ツリーをフラット配列に変換（表示順）
 * @param nodes ルートノードの配列
 * @returns フラット化されたノード配列
 */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];

  function traverse(node: TreeNode) {
    result.push(node);
    if (node.isExpanded && node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * IDからノードを検索
 * @param nodes ルートノードの配列
 * @param id 検索するノードのID
 * @returns 見つかったノード、または null
 */
export function findNodeById(
  nodes: TreeNode[],
  id: string
): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * ノードの次のノードを取得（表示順）- インデックスベース最適化版
 * @param flatNodes フラット化済みノード配列
 * @param currentIndex 現在のノードのインデックス
 * @returns 次のノード、または null
 */
export function getNextNodeByIndex(
  flatNodes: TreeNode[],
  currentIndex: number
): TreeNode | null {
  if (currentIndex < 0 || currentIndex >= flatNodes.length - 1) {
    return null;
  }
  return flatNodes[currentIndex + 1];
}

/**
 * ノードの次のノードを取得（表示順）- 最適化版
 * @param flatNodes フラット化済みノード配列
 * @param currentId 現在のノードID
 * @returns 次のノード、または null
 */
export function getNextNodeOptimized(
  flatNodes: TreeNode[],
  currentId: string
): TreeNode | null {
  const currentIndex = flatNodes.findIndex((n) => n.id === currentId);
  return getNextNodeByIndex(flatNodes, currentIndex);
}

/**
 * ノードの次のノードを取得（表示順）
 * @param nodes ルートノードの配列
 * @param currentId 現在のノードID
 * @returns 次のノード、または null
 */
export function getNextNode(
  nodes: TreeNode[],
  currentId: string
): TreeNode | null {
  const flatNodes = flattenTree(nodes);
  return getNextNodeOptimized(flatNodes, currentId);
}

/**
 * ノードの前のノードを取得（表示順）- インデックスベース最適化版
 * @param flatNodes フラット化済みノード配列
 * @param currentIndex 現在のノードのインデックス
 * @returns 前のノード、または null
 */
export function getPrevNodeByIndex(
  flatNodes: TreeNode[],
  currentIndex: number
): TreeNode | null {
  if (currentIndex <= 0 || currentIndex >= flatNodes.length) {
    return null;
  }
  return flatNodes[currentIndex - 1];
}

/**
 * ノードの前のノードを取得（表示順）- 最適化版
 * @param flatNodes フラット化済みノード配列
 * @param currentId 現在のノードID
 * @returns 前のノード、または null
 */
export function getPrevNodeOptimized(
  flatNodes: TreeNode[],
  currentId: string
): TreeNode | null {
  const currentIndex = flatNodes.findIndex((n) => n.id === currentId);
  return getPrevNodeByIndex(flatNodes, currentIndex);
}

/**
 * ノードの前のノードを取得（表示順）
 * @param nodes ルートノードの配列
 * @param currentId 現在のノードID
 * @returns 前のノード、または null
 */
export function getPrevNode(
  nodes: TreeNode[],
  currentId: string
): TreeNode | null {
  const flatNodes = flattenTree(nodes);
  return getPrevNodeOptimized(flatNodes, currentId);
}

/**
 * 同じ深さ（depth）の次のノードを取得 - インデックスベース最適化版
 * @param flatNodes フラット化済みノード配列
 * @param currentIndex 現在のノードのインデックス
 * @param targetDepth 検索する深さ
 * @returns 次の同じ深さのノード、または null
 */
export function getNextSiblingByIndex(
  flatNodes: TreeNode[],
  currentIndex: number,
  targetDepth: number
): TreeNode | null {
  if (currentIndex < 0 || currentIndex >= flatNodes.length) return null;

  // 現在のノードより後ろで、同じdepthの最初のノードを探す
  for (let i = currentIndex + 1; i < flatNodes.length; i++) {
    if (flatNodes[i].depth === targetDepth) {
      return flatNodes[i];
    }
  }

  return null;
}

/**
 * 同じ深さ（depth）の次のノードを取得 - 最適化版
 * @param flatNodes フラット化済みノード配列
 * @param nodeMap ノードマップ
 * @param currentId 現在のノードID
 * @returns 次の同じ深さのノード、または null
 */
export function getNextSiblingOptimized(
  flatNodes: TreeNode[],
  nodeMap: Map<string, TreeNode>,
  currentId: string
): TreeNode | null {
  const currentNode = nodeMap.get(currentId);
  if (!currentNode) return null;

  const currentIndex = flatNodes.findIndex((n) => n.id === currentId);
  return getNextSiblingByIndex(flatNodes, currentIndex, currentNode.depth);
}

/**
 * 同じ深さ（depth）の次のノードを取得
 * @param nodes ルートノードの配列
 * @param currentId 現在のノードID
 * @returns 次の同じ深さのノード、または null
 */
export function getNextSibling(
  nodes: TreeNode[],
  currentId: string
): TreeNode | null {
  const currentNode = findNodeById(nodes, currentId);
  if (!currentNode) return null;

  const flatNodes = flattenTree(nodes);
  const currentIndex = flatNodes.findIndex((n) => n.id === currentId);

  // 現在のノードより後ろで、同じdepthの最初のノードを探す
  for (let i = currentIndex + 1; i < flatNodes.length; i++) {
    if (flatNodes[i].depth === currentNode.depth) {
      return flatNodes[i];
    }
  }

  return null;
}

/**
 * 同じ深さ（depth）の前のノードを取得 - インデックスベース最適化版
 * @param flatNodes フラット化済みノード配列
 * @param currentIndex 現在のノードのインデックス
 * @param targetDepth 検索する深さ
 * @returns 前の同じ深さのノード、または null
 */
export function getPrevSiblingByIndex(
  flatNodes: TreeNode[],
  currentIndex: number,
  targetDepth: number
): TreeNode | null {
  if (currentIndex < 0 || currentIndex >= flatNodes.length) return null;

  // 現在のノードより前で、同じdepthの最後のノードを探す
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (flatNodes[i].depth === targetDepth) {
      return flatNodes[i];
    }
  }

  return null;
}

/**
 * 同じ深さ（depth）の前のノードを取得 - 最適化版
 * @param flatNodes フラット化済みノード配列
 * @param nodeMap ノードマップ
 * @param currentId 現在のノードID
 * @returns 前の同じ深さのノード、または null
 */
export function getPrevSiblingOptimized(
  flatNodes: TreeNode[],
  nodeMap: Map<string, TreeNode>,
  currentId: string
): TreeNode | null {
  const currentNode = nodeMap.get(currentId);
  if (!currentNode) return null;

  const currentIndex = flatNodes.findIndex((n) => n.id === currentId);
  return getPrevSiblingByIndex(flatNodes, currentIndex, currentNode.depth);
}

/**
 * 同じ深さ（depth）の前のノードを取得
 * @param nodes ルートノードの配列
 * @param currentId 現在のノードID
 * @returns 前の同じ深さのノード、または null
 */
export function getPrevSibling(
  nodes: TreeNode[],
  currentId: string
): TreeNode | null {
  const currentNode = findNodeById(nodes, currentId);
  if (!currentNode) return null;

  const flatNodes = flattenTree(nodes);
  const currentIndex = flatNodes.findIndex((n) => n.id === currentId);

  // 現在のノードより前で、同じdepthの最後のノードを探す
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (flatNodes[i].depth === currentNode.depth) {
      return flatNodes[i];
    }
  }

  return null;
}
