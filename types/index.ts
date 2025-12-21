/**
 * ツリーノードの型定義
 */
export interface TreeNode {
  id: string;
  text: string;
  depth: number;
  children: TreeNode[];
  isExpanded: boolean;
  parent?: TreeNode;
}

/**
 * ツリーの状態を管理する型
 */
export interface TreeState {
  nodes: TreeNode[];
  selectedNodeId: string | null;
  expandedNodeIds: Set<string>;
}

/**
 * ツリーアクションの型
 */
export type TreeAction =
  | { type: 'SET_NODES'; payload: TreeNode[] }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'TOGGLE_NODE'; payload: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'UPDATE_NODE_TEXT'; payload: { id: string; text: string } }
  | { type: 'ADD_NODE'; payload: { parentId?: string; depth: number } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'INDENT_NODE'; payload: string }
  | { type: 'UNINDENT_NODE'; payload: string }
  | { type: 'MOVE_NODE_UP'; payload: string }
  | { type: 'MOVE_NODE_DOWN'; payload: string };

/**
 * テーマの型
 */
export type Theme = 'light' | 'dark';

/**
 * 表示モードの型
 */
export type ViewMode = 'editor' | 'browser';

/**
 * 個別ファイルのデータ型
 */
export interface FileData {
  id: string;
  name: string;
  rawText: string;
  lastModified: string;
}

/**
 * ローカルストレージに保存するデータの型
 */
export interface StorageData {
  files: FileData[];
  currentFileId: string;
  theme: Theme;
}
