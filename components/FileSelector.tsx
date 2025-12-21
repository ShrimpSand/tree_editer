'use client';

import { FileData } from '@/types';
import { PlusIcon, TrashIcon } from '@heroicons/react/16/solid';

interface FileSelectorProps {
  files: FileData[];
  currentFileId: string;
  onFileSelect: (fileId: string) => void;
  onNewFile: () => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileSelector({
  files,
  currentFileId,
  onFileSelect,
  onNewFile,
  onDeleteFile,
}: FileSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {/* ファイル選択ドロップダウン */}
      <select
        value={currentFileId}
        onChange={(e) => onFileSelect(e.target.value)}
        className="px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        style={{ minWidth: '150px', maxWidth: '250px' }}
      >
        {files.map((file) => (
          <option key={file.id} value={file.id}>
            {file.name}
          </option>
        ))}
      </select>

      {/* 新規ファイル作成ボタン */}
      <button
        onClick={onNewFile}
        className="w-6 h-6 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded"
        title="新規ファイル"
      >
        <PlusIcon style={{ width: '14px', height: '14px' }} />
      </button>

      {/* ファイル削除ボタン（ファイルが1つだけの場合は無効化） */}
      {files.length > 1 && (
        <button
          onClick={() => onDeleteFile(currentFileId)}
          className="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded"
          title="ファイルを削除"
        >
          <TrashIcon style={{ width: '14px', height: '14px' }} />
        </button>
      )}
    </div>
  );
}
