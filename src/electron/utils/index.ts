import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath, URL } from 'url';

/**
 * 检查 URL 是否可访问
 * @param url 要检查的 URL
 * @returns Promise<boolean> 返回 URL 是否可访问
 */
export function checkUrlAccessible(url?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      return resolve(false);
    }
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const request = client.request(url, { method: 'HEAD', timeout: 5000 }, (response) => {
        resolve(response.statusCode !== undefined && response.statusCode < 400);
      });

      request.on('error', () => {
        resolve(false);
      });

      request.on('timeout', () => {
        request.destroy();
        resolve(false);
      });

      request.end();
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * 获取当前文件所在的目录路径
 * @description 兼容 CommonJS (__dirname) 和 ES Module (import.meta.url) 环境
 */
export const getDirname = (() => {
  try {
    if (typeof __dirname !== 'undefined') {
      // 如果 __dirname 存在，则它是一个 CJS 环境
      // 返回一个直接返回 __dirname 的函数
      return () => __dirname;
    }
  } catch (e) {
    // 忽略 ReferenceError: __dirname is not defined
  }

  // 如果 CJS 失败 (在 ESM 环境中)，返回 ESM 获取函数
  return () => {
    const __filename = fileURLToPath(import.meta.url);
    return path.dirname(__filename);
  };
})();
