/**
 * RTFファイルからプレーンテキスト（タブインデント付き）に変換
 * @param rtfContent RTFファイルの内容
 * @returns タブインデント付きテキスト
 */
export function convertRtfToTabIndentedText(rtfContent: string): string {
  const lines: string[] = [];

  // まず最初にフォントテーブルとインフォセクションを完全に削除
  let cleanedContent = rtfContent;

  // フォントテーブルを削除（複数行対応）
  cleanedContent = cleanedContent.replace(/\{\\fonttbl[^}]*\{[^}]*\}[^}]*\}/g, '');

  // インフォセクションを削除
  cleanedContent = cleanedContent.replace(/\{\\info[^}]*\{[^}]*\}[^}]*\}/g, '');

  // \parで分割して各段落を処理
  const paragraphs = cleanedContent.split('\\par');

  for (const paragraph of paragraphs) {
    // インデントレベルを取得 (\li0, \li200, \li400, \li600 など)
    const indentMatch = paragraph.match(/\\li(\d+)/);
    let currentIndent = 0;
    if (indentMatch) {
      const indentValue = parseInt(indentMatch[1]);
      // 200単位で階層を計算（li0=0階層, li200=1階層, li400=2階層）
      currentIndent = Math.floor(indentValue / 200);
    }

    // グループ {...} 全体を抽出
    const groupMatch = paragraph.match(/\{([^{}]+)\}/);
    if (!groupMatch) continue;

    let text = groupMatch[1];

    // まず全てのRTFコントロールワードを削除（Unicode除く）
    // \b0, \i0, \fs24 などを削除
    text = text.replace(/\\[a-z]+\d*/gi, (match) => {
      // \u で始まるものは残す（Unicode文字なので）
      if (match.startsWith('\\u')) {
        return match;
      }
      return '';
    });

    // Unicode文字を変換: \uNNNNN\'3f -> 対応する文字
    text = text.replace(/\\u(-?\d+)\\'3f/g, (_match, codePoint) => {
      const code = parseInt(codePoint);
      const actualCode = code < 0 ? 65536 + code : code;
      return String.fromCharCode(actualCode);
    });

    // Unicode文字（\'3fなし）も変換: \uNNNNN
    text = text.replace(/\\u(-?\d+)/g, (_match, codePoint) => {
      const code = parseInt(codePoint);
      const actualCode = code < 0 ? 65536 + code : code;
      return String.fromCharCode(actualCode);
    });

    // 残っている \'3f を削除
    text = text.replace(/\\'3f/g, '');

    // エスケープされた特殊文字を変換: \{ -> {, \} -> }, \\ -> \
    text = text.replace(/\\([{}\\])/g, '$1');

    // 改行、セミコロン、余分な空白を削除
    text = text.replace(/[\r\n;]/g, '').trim();

    // テキストがある場合のみ追加
    if (text) {
      const tabs = '\t'.repeat(currentIndent);
      lines.push(tabs + text);
    }
  }

  return lines.join('\n');
}

/**
 * マークダウンの見出しをタブインデント付きテキストに変換
 * @param markdownContent マークダウンの内容
 * @returns タブインデント付きテキスト
 */
export function convertMarkdownToTabIndentedText(
  markdownContent: string
): string {
  const lines: string[] = [];
  const rawLines = markdownContent.split('\n');

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // マークダウン見出し（#）の数でインデントを決定
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length - 1; // # = 0, ## = 1, ### = 2
      const text = headingMatch[2];
      const tabs = '\t'.repeat(level);
      lines.push(tabs + text);
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      // リスト形式の場合
      const listMatch = trimmed.match(/^[\-\*]\s+(.+)$/);
      if (listMatch) {
        // インデントの深さを検出（スペースまたはタブの数）
        const indentMatch = line.match(/^(\s+)/);
        const indentLevel = indentMatch
          ? Math.floor(indentMatch[1].length / 2)
          : 0;
        const tabs = '\t'.repeat(indentLevel);
        lines.push(tabs + listMatch[1]);
      }
    } else {
      // 通常のテキスト
      lines.push(trimmed);
    }
  }

  return lines.join('\n');
}

/**
 * ファイルの内容を読み込んでタブインデント付きテキストに変換
 * @param file ファイルオブジェクト
 * @returns タブインデント付きテキスト
 */
export async function importFile(file: File): Promise<string> {
  const content = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'rtf':
      return convertRtfToTabIndentedText(content);
    case 'md':
    case 'markdown':
      return convertMarkdownToTabIndentedText(content);
    case 'txt':
      // プレーンテキストはそのまま返す
      return content;
    default:
      throw new Error(
        `サポートされていないファイル形式です: ${extension}`
      );
  }
}
