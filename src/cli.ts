#!/usr/bin/env node

import { Command } from 'commander';
import { VERSION } from './index.js';

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
  .action((_file: string, _options: Record<string, unknown>) => {
    // TODO: Implement publish command
    console.log('Publish command not yet implemented');
  });

program
  .command('lint <file>')
  .description('检查文章质量')
  .option('--strict', '严格模式')
  .action((_file: string, _options: Record<string, unknown>) => {
    // TODO: Implement lint command
    console.log('Lint command not yet implemented');
  });

program
  .command('upload <file>')
  .description('上传图片到墨问')
  .option('--api-key <key>', '墨问 API Key')
  .action((_file: string, _options: Record<string, unknown>) => {
    // TODO: Implement upload command
    console.log('Upload command not yet implemented');
  });

program.parse();
