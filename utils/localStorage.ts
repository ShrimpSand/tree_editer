import { StorageData, FileData, Theme } from '@/types';
import { parseTextToTree } from './treeParser';

const STORAGE_KEY = 'tree-editor-data';
const LEGACY_KEY = 'tree-editor-data'; // 旧形式との互換性用

/**
 * テキストから最初の行を取得してファイル名とする
 * @param text テキスト
 * @returns ファイル名
 */
export function extractFileName(text: string): string {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) return '新規ファイル';

  // 最初の行からタブを除去してファイル名として使用
  const firstLine = lines[0].replace(/^\t+/, '').trim();
  return firstLine || '新規ファイル';
}

/**
 * localStorageからデータを読み込む
 * @returns 保存されたデータ、または null
 */
export function loadFromStorage(): StorageData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);

    // 旧形式のデータをマイグレーション
    if (parsed.rawText && !parsed.files) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const fileName = extractFileName(parsed.rawText);
      return {
        files: [
          {
            id: fileId,
            name: fileName,
            rawText: parsed.rawText,
            lastModified: parsed.lastModified || new Date().toISOString(),
          },
        ],
        currentFileId: fileId,
        theme: parsed.theme || 'light',
      };
    }

    const storageData = parsed as StorageData;

    // ファイルIDの重複をチェックして修正
    if (storageData.files) {
      const seenIds = new Set<string>();
      const uniqueFiles: FileData[] = [];

      storageData.files.forEach((file) => {
        if (seenIds.has(file.id)) {
          // 重複IDの場合、新しいIDを生成
          const newId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          uniqueFiles.push({ ...file, id: newId });

          // 現在のファイルIDが重複していた場合は更新
          if (storageData.currentFileId === file.id) {
            storageData.currentFileId = newId;
          }
        } else {
          seenIds.add(file.id);
          uniqueFiles.push(file);
        }
      });

      storageData.files = uniqueFiles;

      // 重複があった場合は修正後のデータを保存
      if (uniqueFiles.length !== storageData.files.length || seenIds.size < parsed.files.length) {
        saveToStorage(storageData);
      }
    }

    return storageData;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * localStorageにデータを保存する
 * @param data 保存するデータ
 */
export function saveToStorage(data: StorageData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * 特定のファイルのテキストを更新して保存
 * @param fileId ファイルID
 * @param rawText 更新するテキスト
 */
export function updateFileText(fileId: string, rawText: string): void {
  const data = loadFromStorage();
  if (!data) return;

  const fileIndex = data.files.findIndex((f) => f.id === fileId);
  if (fileIndex === -1) return;

  data.files[fileIndex].rawText = rawText;
  data.files[fileIndex].name = extractFileName(rawText);
  data.files[fileIndex].lastModified = new Date().toISOString();

  saveToStorage(data);
}

/**
 * 新しいファイルを作成
 * @param rawText ファイルのテキスト
 * @returns 作成されたファイルID
 */
export function createNewFile(rawText: string = ''): string {
  const data = loadFromStorage();
  // より一意性の高いIDを生成（タイムスタンプ + ランダム値）
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const fileName = extractFileName(rawText || getDefaultText());

  const newFile: FileData = {
    id: fileId,
    name: fileName,
    rawText: rawText || getDefaultText(),
    lastModified: new Date().toISOString(),
  };

  if (data) {
    data.files.push(newFile);
    data.currentFileId = fileId;
    saveToStorage(data);
  } else {
    saveToStorage({
      files: [newFile],
      currentFileId: fileId,
      theme: 'light',
    });
  }

  return fileId;
}

/**
 * ファイルを削除
 * @param fileId 削除するファイルID
 */
export function deleteFile(fileId: string): void {
  const data = loadFromStorage();
  if (!data) return;

  data.files = data.files.filter((f) => f.id !== fileId);

  // 削除したファイルが現在のファイルだった場合、別のファイルを選択
  if (data.currentFileId === fileId) {
    if (data.files.length > 0) {
      data.currentFileId = data.files[0].id;
    } else {
      // ファイルがなくなった場合は新規作成
      const newFileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      data.files.push({
        id: newFileId,
        name: '新規ファイル',
        rawText: getDefaultText(),
        lastModified: new Date().toISOString(),
      });
      data.currentFileId = newFileId;
    }
  }

  saveToStorage(data);
}

/**
 * 現在選択中のファイルIDを更新
 * @param fileId ファイルID
 */
export function setCurrentFile(fileId: string): void {
  const data = loadFromStorage();
  if (!data) return;

  data.currentFileId = fileId;
  saveToStorage(data);
}

/**
 * localStorageのデータをクリアする
 */
export function clearStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * デフォルトのサンプルデータを取得
 */
export function getDefaultText(): string {
  return `ルートノード1
\t子ノード1-1
\t\t孫ノード1-1-1
\t子ノード1-2
ルートノード2
\t子ノード2-1`;
}
