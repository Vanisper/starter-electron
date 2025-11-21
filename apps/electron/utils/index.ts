import http from 'http';
import https from 'https';
import path from 'path';
import { access } from 'fs/promises';
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

      if (parsedUrl.protocol === 'file:') {
        // Handle file:// URLs
        const filePath = fileURLToPath(parsedUrl);
        access(filePath)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      } else if (['https:', 'http:'].includes(parsedUrl.protocol)) {
        // Handle http(s):// URLs
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
      } else {
        // Unsupported protocol
        resolve(false);
      }
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

/**
 * 安全地推导项目根目录，通过检查 __dirname 与相对路径的关系
 * @param currentDir - 当前脚本的 __dirname 绝对路径 (e.g., '/Users/.../main')
 * @param relativePath - 当前脚本相对于项目根目录的相对路径 (e.g., 'dist-electron/main')
 * @param validator - 可选的回调函数，用于验证推导出的路径是否正确
 */
export function inferProjectRoot(
  currentDir: string,
  relativePath: string,
  validator?: (assumedRoot: string) => boolean
): string {
  // ----------------------------------------------------
  // A: 字符串关系验证 (必要条件)
  // ----------------------------------------------------

  // 规范化路径分隔符，确保在不同操作系统上能正确匹配
  const normalizedCurrentDir = currentDir.replace(/\\/g, path.sep);
  const normalizedRelativePath = relativePath.replace(/\\/g, path.sep);

  if (!normalizedCurrentDir.endsWith(normalizedRelativePath)) {
    throw new Error(
      `[Path Error] Inferred relationship failed. Absolute path (${currentDir}) ` +
      `does not end with relative path segment (${relativePath}). ` +
      `The relative path must be the suffix of the absolute path.`
    );
  }

  // ----------------------------------------------------
  // B: 路径推导
  // ----------------------------------------------------
  const parts = normalizedRelativePath.split(path.sep).filter(p => p.length > 0);
  const levels = parts.length;

  if (levels === 0) {
    // 如果相对路径为空，则 currentDir 本身就是根目录
    const assumedRoot = currentDir;

    // 如果提供了验证器，执行验证
    if (validator && !validator(assumedRoot)) {
      throw new Error(`[Path Error] Validation failed for assumed root: ${assumedRoot}.`);
    }

    return assumedRoot;
  }

  const upPaths = Array(levels).fill('..');
  const assumedRoot = path.resolve(currentDir, ...upPaths);

  // ----------------------------------------------------
  // C: 健壮性检查（可选）
  // ----------------------------------------------------

  if (validator) {
    if (validator(assumedRoot)) {
      // 验证通过
      return assumedRoot;
    } else {
      // 验证失败
      throw new Error(
        `[Path Error] Custom validation failed for the inferred root directory: ${assumedRoot}.`
      );
    }
  }

  // 如果没有提供 validator，默认通过
  return assumedRoot;
}
