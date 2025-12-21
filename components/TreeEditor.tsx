'use client';

import { useState, useEffect, useCallback } from 'react';
import { ViewMode, TreeNode, FileData, StorageData } from '@/types';
import { EditorView } from './EditorView';
import { BrowserView } from './BrowserView';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { parseTextToTree, serializeTreeToText } from '@/utils/treeParser';
import {
  saveToStorage,
  loadFromStorage,
  getDefaultText,
  updateFileText,
  createNewFile,
  deleteFile,
  setCurrentFile,
  extractFileName,
} from '@/utils/localStorage';

export function TreeEditor() {
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string>('');
  const [rawText, setRawText] = useState('');
  const [nodes, setNodes] = useState<TreeNode[]>([]);

  // 初期データの読み込み
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData && savedData.files && savedData.files.length > 0) {
      setFiles(savedData.files);
      setCurrentFileId(savedData.currentFileId);

      const currentFile = savedData.files.find((f) => f.id === savedData.currentFileId);
      if (currentFile) {
        setRawText(currentFile.rawText);
        setNodes(parseTextToTree(currentFile.rawText));
      }
    } else {
      // 初期ファイルを作成
      const defaultText = getDefaultText();
      const fileId = createNewFile(defaultText);
      const newData = loadFromStorage();
      if (newData) {
        setFiles(newData.files);
        setCurrentFileId(fileId);
        setRawText(defaultText);
        setNodes(parseTextToTree(defaultText));
      }
    }
  }, []);

  // エディタからブラウザへの切り替え
  const handleSwitchToBrowser = useCallback(() => {
    const parsedNodes = parseTextToTree(rawText);
    setNodes(parsedNodes);
    setViewMode('browser');
  }, [rawText]);

  // ブラウザからエディタへの切り替え
  const handleSwitchToEditor = useCallback(() => {
    // ブラウザモードで編集した内容をrawTextに反映
    const updatedText = serializeTreeToText(nodes);
    setRawText(updatedText);
    if (currentFileId) {
      updateFileText(currentFileId, updatedText);

      // ファイル名が変わった可能性があるので、files配列を更新
      const data = loadFromStorage();
      if (data) {
        setFiles(data.files);
      }
    }
    setViewMode('editor');
  }, [nodes, currentFileId]);

  // ファイル選択
  const handleFileSelect = useCallback((fileId: string) => {
    // 現在のファイルを保存
    if (currentFileId) {
      updateFileText(currentFileId, rawText);
    }

    // 新しいファイルを読み込み
    setCurrentFile(fileId);
    const data = loadFromStorage();
    if (data) {
      const file = data.files.find((f) => f.id === fileId);
      if (file) {
        setCurrentFileId(fileId);
        setRawText(file.rawText);
        setNodes(parseTextToTree(file.rawText));
        setFiles(data.files);
      }
    }
  }, [currentFileId, rawText]);

  // 新規ファイル作成
  const handleNewFile = useCallback(() => {
    // 現在のファイルを保存
    if (currentFileId) {
      updateFileText(currentFileId, rawText);
    }

    const defaultText = getDefaultText();
    const fileId = createNewFile(defaultText);
    const data = loadFromStorage();
    if (data) {
      setFiles(data.files);
      setCurrentFileId(fileId);
      setRawText(defaultText);
      setNodes(parseTextToTree(defaultText));
    }
  }, [currentFileId, rawText]);

  // ファイル削除
  const handleDeleteFile = useCallback((fileId: string) => {
    if (files.length <= 1) return;

    deleteFile(fileId);
    const data = loadFromStorage();
    if (data) {
      setFiles(data.files);
      const newCurrentFile = data.files.find((f) => f.id === data.currentFileId);
      if (newCurrentFile) {
        setCurrentFileId(newCurrentFile.id);
        setRawText(newCurrentFile.rawText);
        setNodes(parseTextToTree(newCurrentFile.rawText));
      }
    }
  }, [files]);

  // テキスト保存
  const handleSaveText = useCallback((text: string) => {
    setRawText(text);
    if (currentFileId) {
      updateFileText(currentFileId, text);

      // ファイル名が変わった可能性があるので、files配列を更新
      const data = loadFromStorage();
      if (data) {
        setFiles(data.files);
      }
    }
  }, [currentFileId]);

  // ノードの展開/折りたたみトグル
  const toggleNode = useCallback((id: string) => {
    const toggleInTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children.length > 0) {
          return { ...node, children: toggleInTree(node.children) };
        }
        return node;
      });
    };
    setNodes((prev) => toggleInTree(prev));
  }, []);

  // ノードの更新（ブラウザモードでの編集）
  const handleUpdateNodes = useCallback((updatedNodes: TreeNode[]) => {
    setNodes(updatedNodes);
    // 即座にlocalStorageに保存
    const updatedText = serializeTreeToText(updatedNodes);
    setRawText(updatedText);
    if (currentFileId) {
      updateFileText(currentFileId, updatedText);

      // ファイル名が変わった可能性があるので、files配列を更新
      const data = loadFromStorage();
      if (data) {
        setFiles(data.files);
      }
    }
  }, [currentFileId]);

  return (
    <FontSizeProvider>
      {viewMode === 'editor' ? (
        <EditorView
          files={files}
          currentFileId={currentFileId}
          initialText={rawText}
          onSave={handleSaveText}
          onSwitchToBrowser={handleSwitchToBrowser}
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          onDeleteFile={handleDeleteFile}
        />
      ) : (
        <BrowserView
          files={files}
          currentFileId={currentFileId}
          nodes={nodes}
          onToggleNode={toggleNode}
          onUpdateNodes={handleUpdateNodes}
          onSwitchToEditor={handleSwitchToEditor}
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          onDeleteFile={handleDeleteFile}
        />
      )}
    </FontSizeProvider>
  );
}
