'use client';

import { useState, useEffect, useRef } from 'react';
import { importFile } from '@/utils/fileImporter';
import { useFontSize } from '@/contexts/FontSizeContext';
import { MinusIcon, PlusIcon } from '@heroicons/react/16/solid';
import { FileData } from '@/types';
import { FileSelector } from './FileSelector';

interface EditorViewProps {
  files: FileData[];
  currentFileId: string;
  initialText: string;
  onSave: (text: string) => void;
  onSwitchToBrowser: () => void;
  onFileSelect: (fileId: string) => void;
  onNewFile: () => void;
  onDeleteFile: (fileId: string) => void;
}

export function EditorView({
  files,
  currentFileId,
  initialText,
  onSave,
  onSwitchToBrowser,
  onFileSelect,
  onNewFile,
  onDeleteFile,
}: EditorViewProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fontSize, setFontSize, indentWidth } = useFontSize();

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // 自動フォーカス
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // テキスト変更時に自動保存
  useEffect(() => {
    // initialTextと同じ場合は保存しない（初期化時のみ）
    if (text === initialText) return;

    // デバウンス処理（500ms待ってから保存）
    const timer = setTimeout(() => {
      onSave(text);
    }, 500);

    return () => clearTimeout(timer);
  }, [text, onSave, initialText]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedText = await importFile(file);
      setText(importedText);
      onSave(importedText);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました');
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleSwitchToBrowser = () => {
    onSave(text);
    onSwitchToBrowser();
  };

  // タブキーのデフォルト動作を防ぐ & 改行時の自動インデント
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;

    if (e.key === 'Tab') {
      e.preventDefault();

      if (e.shiftKey) {
        // Shift+Tab: インデント削除
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        if (value[lineStart] === '\t') {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + 1);
          setText(newValue);
          // カーソル位置を調整
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start - 1;
          }, 0);
        }
      } else {
        // Tab: インデント追加
        const newValue = value.substring(0, start) + '\t' + value.substring(end);
        setText(newValue);
        // カーソル位置を調整
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1;
        }, 0);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();

      // 現在行の先頭を見つける
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;

      // 現在行のインデント（先頭のタブ文字）を取得
      let indent = '';
      for (let i = lineStart; i < value.length; i++) {
        if (value[i] === '\t') {
          indent += '\t';
        } else {
          break;
        }
      }

      // 改行 + インデントを挿入
      const newValue = value.substring(0, start) + '\n' + indent + value.substring(end);
      setText(newValue);

      // カーソル位置を調整（改行 + インデントの後）
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1 + indent.length;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* ツールバー */}
      <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-2 gap-2">
        <input ref={fileInputRef} type="file" accept=".rtf,.md,.markdown,.txt" onChange={handleFileSelect} className="hidden" />

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

        <button onClick={handleOpenFile} className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded">
          ファイルを開く
        </button>
        <button onClick={handleSwitchToBrowser} className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded">
          ブラウザに切替
        </button>
      </div>

      {/* テキストエリア */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full p-2 font-mono resize-none
                 focus:outline-none dark:bg-gray-900"
        style={{
          fontSize: `${fontSize}px`,
          tabSize: `${indentWidth}px`
        }}
        placeholder="タブでインデントを作成してツリー構造を入力...&#10;&#10;例:&#10;ルートノード1&#10;&#9;子ノード1-1&#10;&#9;&#9;孫ノード1-1-1&#10;&#9;子ノード1-2&#10;ルートノード2"
        spellCheck={false}
      />

      {/* フッター（ヘルプテキスト） */}
      <div className="p-3 text-xs text-gray-400 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <span>Tab: インデント追加</span>
          <span>Shift+Tab: インデント削除</span>
        </div>
      </div>
    </div>
  );
}
