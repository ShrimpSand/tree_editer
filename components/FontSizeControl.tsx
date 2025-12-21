'use client';

import { useFontSize } from '@/contexts/FontSizeContext';
import { MinusIcon, PlusIcon } from '@heroicons/react/16/solid';

export function FontSizeControl() {
  const { fontSize, setFontSize } = useFontSize();

  const handleIncrease = () => {
    if (fontSize < 24) {
      setFontSize(fontSize + 1);
    }
  };

  const handleDecrease = () => {
    if (fontSize > 8) {
      setFontSize(fontSize - 1);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      <button
        onClick={handleDecrease}
        className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
        title="フォントサイズを小さく"
      >
        <MinusIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
      </button>
      <span className="text-sm font-mono w-8 text-center">{fontSize}</span>
      <button
        onClick={handleIncrease}
        className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
        title="フォントサイズを大きく"
      >
        <PlusIcon style={{ width: `${fontSize}px`, height: `${fontSize}px` }} />
      </button>
    </div>
  );
}
