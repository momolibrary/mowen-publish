/**
 * 墨问 API 封装模块
 */

import type { NoteAtomDoc } from '../index.js';

export type PrivacyType = 'public' | 'private' | 'rule';

export interface NoteSettings {
  autoPublish?: boolean;
  tags?: string[];
}

interface ApiOptions {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * 获取 API Key
 */
function getApiKey(options: ApiOptions): string {
  const apiKey = options.apiKey || process.env.MOWEN_API_KEY;
  if (!apiKey) {
    throw new Error('MOWEN_API_KEY is not set. Please set it via environment variable or options.');
  }
  return apiKey;
}

/**
 * 通用 API 调用
 */
async function callApi<T>(
  endpoint: string,
  method: string,
  body: Record<string, unknown>,
  options: ApiOptions
): Promise<T> {
  const apiKey = getApiKey(options);
  const baseUrl = options.baseUrl || 'https://open.mowen.cn';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if ('reason' in data && data.reason) {
    throw new Error(`API error: ${data.reason}`);
  }

  return data as T;
}

/**
 * 墨问 API 类
 */
export class MowenAPI {
  private options: ApiOptions;

  constructor(options: ApiOptions = {}) {
    this.options = options;
  }

  /**
   * 创建笔记
   */
  async createNote(
    body: NoteAtomDoc,
    settings: NoteSettings = {}
  ): Promise<{ noteId: string }> {
    return callApi<{ noteId: string }>(
      '/api/open/api/v1/note/create',
      'POST',
      {
        body,
        settings: {
          autoPublish: settings.autoPublish ?? false,
          tags: settings.tags ?? [],
        },
      },
      this.options
    );
  }

  /**
   * 编辑笔记
   */
  async editNote(noteId: string, body: NoteAtomDoc): Promise<void> {
    await callApi<unknown>(
      '/api/open/api/v1/note/edit',
      'POST',
      { noteId, body },
      this.options
    );
  }

  /**
   * 设置笔记隐私
   */
  async setPrivacy(
    noteId: string,
    privacy: PrivacyType,
    options: { noShare?: boolean; expireAt?: number | null } = {}
  ): Promise<void> {
    await callApi<unknown>(
      '/api/open/api/v1/note/set',
      'POST',
      {
        noteId,
        section: 1,
        settings: {
          privacy: {
            type: privacy,
            noShare: options.noShare ?? false,
            expireAt: options.expireAt ?? null,
          },
        },
      },
      this.options
    );
  }
}
