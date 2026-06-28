/**
 * 表格渲染模块
 *
 * 将 Markdown 表格转换为高质量图片
 */

import type { Browser } from 'playwright';

export interface TableImage {
  index: number;
  fileId: string;
  marker: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface RenderOptions {
  width?: number;
  outputFormat?: 'png' | 'jpeg';
}

/**
 * 从 Markdown 中提取表格
 */
export function extractTables(mdContent: string): Array<{ table: TableData; startIndex: number; endIndex: number }> {
  const tables: Array<{ table: TableData; startIndex: number; endIndex: number }> = [];
  const lines = mdContent.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 检测表格开始（包含 | 的行）
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const startIndex = i;

      // 解析表头
      const headers = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell !== '');

      // 跳过分隔行
      i += 2;

      // 解析数据行
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i]
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell !== '');
        rows.push(row);
        i++;
      }

      tables.push({
        table: { headers, rows },
        startIndex,
        endIndex: i - 1,
      });
    } else {
      i++;
    }
  }

  return tables;
}

/**
 * 生成表格 HTML
 */
export function generateTableHtml(table: TableData): string {
  const headerHtml = table.headers
    .map((cell) => `<th>${cell}</th>`)
    .join('');

  const rowsHtml = table.rows
    .map((row) => {
      const cells = row.map((cell) => `<td>${cell}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background: linear-gradient(180deg, #1a365d 0%, #2d4a7a 100%);
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background-color: #f7fafc;
    }
    tr:hover {
      background-color: #edf2f7;
    }
  </style>
</head>
<body>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 替换 Markdown 中的表格为图片标记
 */
export function replaceTablesWithMarkers(
  mdContent: string,
  tableImages: TableImage[]
): string {
  let result = mdContent;

  // 从后往前替换，避免索引偏移
  const sortedImages = [...tableImages].sort((a, b) => b.index - a.index);

  for (const img of sortedImages) {
    const tables = extractTables(result);
    if (tables[img.index]) {
      const { startIndex, endIndex } = tables[img.index];
      const lines = result.split('\n');
      const before = lines.slice(0, startIndex);
      const after = lines.slice(endIndex + 1);
      result = [...before, img.marker, '', ...after].join('\n');
    }
  }

  return result;
}

/**
 * 使用 Playwright 渲染表格为图片
 */
export async function renderTableToImage(
  table: TableData,
  outputPath: string,
  options: RenderOptions = {}
): Promise<void> {
  const { width = 1000, outputFormat = 'png' } = options;

  // 动态导入 Playwright
  const { chromium } = await import('playwright');

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const html = generateTableHtml(table);
    await page.setContent(html);
    await page.setViewportSize({ width, height: 800 });

    // 等待表格渲染完成
    await page.waitForSelector('table');

    // 截图
    const tableElement = await page.$('table');
    if (tableElement) {
      await tableElement.screenshot({
        path: outputPath,
        type: outputFormat,
      });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 渲染所有表格并返回图片路径
 */
export async function renderAllTables(
  mdContent: string,
  outputDir: string,
  options: RenderOptions = {}
): Promise<TableImage[]> {
  const tables = extractTables(mdContent);
  const results: TableImage[] = [];

  for (let i = 0; i < tables.length; i++) {
    const outputPath = `${outputDir}/table_${i}.png`;
    await renderTableToImage(tables[i].table, outputPath, options);
    results.push({
      index: i,
      fileId: `table_${i}`,
      marker: `<!-- TABLE_IMAGE_${i}:table_${i} -->`,
    });
  }

  return results;
}
