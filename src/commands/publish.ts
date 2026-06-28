/**
 * 发布命令实现
 */

import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { lint } from '../core/lint.js';
import { markdownToNoteAtom } from '../core/markdown.js';
import { uploadImage } from '../core/upload.js';
import { MowenAPI } from '../core/api.js';
import { extractTables, renderAllTables, replaceTablesWithMarkers } from '../core/table.js';

export interface PublishOptions {
  cover?: string;
  table?: boolean;
  strict?: boolean;
  apiKey?: string;
}

export interface PublishResult {
  noteId: string;
  url: string;
}

/**
 * 发布文章到墨问
 */
export async function publish(
  file: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  let mdContent = readFileSync(file, 'utf-8');

  // Step 1: Quality check
  console.log('🔍 Step 1: Quality check...');
  const lintResult = lint(mdContent, {
    hasCover: !!options.cover,
    strict: options.strict,
  });

  if (!lintResult.passed) {
    console.error('❌ Quality check failed:');
    for (const r of lintResult.results) {
      if (!r.passed) {
        console.error(`  - ${r.message}: ${r.details}`);
      }
    }
    throw new Error('Quality check failed');
  }
  console.log('✅ Quality check passed');

  // Step 2: Upload cover image if provided
  let coverImageId: string | undefined;
  if (options.cover) {
    console.log('🖼️  Step 2: Uploading cover image...');
    const result = await uploadImage(options.cover, { apiKey: options.apiKey });
    coverImageId = result.fileId;
    console.log(`✅ Cover image uploaded: ${coverImageId}`);
  }

  // Step 3: Render and upload table images
  const tableImages: Array<{ index: number; fileId: string }> = [];
  if (options.table !== false) {
    const tables = extractTables(mdContent);
    if (tables.length > 0) {
      console.log(`📊 Step 3: Rendering ${tables.length} tables...`);

      // Create temp directory for table images
      const tempDir = join(dirname(file), '.mowen-publish-tables');
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      // Render tables to images
      const renderedTables = await renderAllTables(mdContent, tempDir);

      // Upload table images
      for (const table of renderedTables) {
        const imagePath = join(tempDir, `table_${table.index}.png`);
        const uploadResult = await uploadImage(imagePath, { apiKey: options.apiKey });
        tableImages.push({
          index: table.index,
          fileId: uploadResult.fileId,
        });
        console.log(`  ✅ Table ${table.index + 1} uploaded: ${uploadResult.fileId}`);
      }

      // Replace tables with markers in markdown
      mdContent = replaceTablesWithMarkers(mdContent, renderedTables);
      console.log('✅ Tables rendered and uploaded');
    }
  }

  // Step 4: Convert to NoteAtom
  console.log('📝 Step 4: Converting to NoteAtom...');
  const noteAtom = markdownToNoteAtom(mdContent, {
    coverImageId,
    tableImages,
  });
  console.log('✅ Conversion complete');

  // Step 5: Create note
  console.log('📤 Step 5: Creating note...');
  const api = new MowenAPI({ apiKey: options.apiKey });
  const { noteId } = await api.createNote(noteAtom, {
    autoPublish: false,
    tags: ['mowen-publish'],
  });

  const url = `https://mowen.cn/note/${noteId}`;
  console.log(`✅ Note created: ${noteId}`);

  return { noteId, url };
}
