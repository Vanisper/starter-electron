import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

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
