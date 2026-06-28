#!/usr/bin/env node

import { Command } from 'commander';
import { VERSION } from './index.js';
import { lint } from './core/lint.js';
import { readFileSync } from 'fs';

const program = new Command();

program
  .name('mowen-publish')
  .description('墨问文章发布 CLI 工具')
  .version(VERSION);

program
  .command('publish <file>')
  .description('发布 Markdown 文章到墨问')
  .option('-c, --cover <image>', '封面图路径')
  .option('--no-table', '跳过表格转换')
  .option('--strict', '严格模式')
  .option('--api-key <key>', '墨问 API Key')
  .action(async (file: string, options: Record<string, unknown>) => {
    console.log('Publish command - work in progress');
    console.log('File:', file);
    console.log('Options:', options);
  });

program
  .command('lint <file>')
  .description('检查文章质量')
  .option('--strict', '严格模式')
  .option('--min-chars <number>', '最小字数', '100')
  .option('--max-chars <number>', '最大字数', '10000')
  .action((file: string, options: Record<string, unknown>) => {
    try {
      const mdContent = readFileSync(file, 'utf-8');
      const result = lint(mdContent, {
        strict: options.strict as boolean,
        minChars: parseInt(options.minChars as string, 10),
        maxChars: parseInt(options.maxChars as string, 10),
      });

      console.log('\n🔍 质量检查报告\n');
      console.log('='.repeat(50));

      for (const r of result.results) {
        const status = r.passed ? '✅' : '❌';
        console.log(`\n${status} ${r.message}`);
        if (r.details) {
          console.log(`   ${r.details}`);
        }
      }

      console.log('\n' + '='.repeat(50));
      console.log(`\n总计：${result.summary}`);

      if (!result.passed) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program
  .command('upload <file>')
  .description('上传图片到墨问')
  .option('--api-key <key>', '墨问 API Key')
  .action(async (file: string, options: Record<string, unknown>) => {
    console.log('Upload command - work in progress');
    console.log('File:', file);
    console.log('Options:', options);
  });

program.parse();
