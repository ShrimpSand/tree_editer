'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FontSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  charWidth: number; // 全角1文字の幅
  indentWidth: number; // 全角2文字分の幅
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState(16);
  const [charWidth, setCharWidth] = useState(0);

  useEffect(() => {
    // 全角1文字の幅を計算
    const measureCharWidth = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // フォントを設定（Roboto Monoを優先）
      ctx.font = `${fontSize}px "Roboto Mono", "Source Code Pro", Consolas, Monaco, "Courier New", monospace`;

      // 全角文字「あ」の幅を測定
      const metrics = ctx.measureText('あ');
      const width = metrics.width;

      setCharWidth(width);
    };

    measureCharWidth();
  }, [fontSize]);

  const indentWidth = charWidth * 2; // 全角2文字分

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, charWidth, indentWidth }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
