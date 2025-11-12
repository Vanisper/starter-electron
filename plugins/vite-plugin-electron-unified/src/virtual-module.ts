import type { Plugin } from 'vite';
import type { ElectronPaths, VirtualModuleOptions } from './types.js';
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from './constant.js';

/**
 * 创建虚拟模块插件
 * @param paths Electron 路径配置
 * @param options 插件选项
 * @returns Vite 插件
 */
export function createVirtualModulePlugin(
  paths: ElectronPaths,
  options: VirtualModuleOptions = {}
): Plugin {
  const { devEnhancement = true } = options;

  return {
    name: 'electron-unified:virtual-module',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return generateVirtualModuleContent(paths, { devEnhancement });
      }
    },
  };
}

/**
 * 生成虚拟模块内容
 * @param paths Electron 路径配置
 * @param options 选项
 * @returns 模块内容
 */
function generateVirtualModuleContent(
  paths: ElectronPaths,
  options: { devEnhancement?: boolean }
): string {
  const { devEnhancement } = options;

  // 基础导出内容
  let content = `
export const __main_dist_entry__ = ${JSON.stringify(paths.__main_dist_entry__)};
export const __preload_dist_entry__ = ${JSON.stringify(paths.__preload_dist_entry__)};
export const __renderer_dist_entry__ = ${JSON.stringify(paths.__renderer_dist_entry__)};
export const __main_output__ = ${JSON.stringify(paths.__main_output__)};
export const __preload_output__ = ${JSON.stringify(paths.__preload_output__)};

// 默认导出所有路径配置
export default {
  __main_dist_entry__,
  __preload_dist_entry__,
  __renderer_dist_entry__,
  __main_output__,
  __preload_output__,
};
`;

  // 开发环境增强
  if (devEnhancement && process.env.NODE_ENV !== 'production') {
    content += `
// 开发环境增强功能
if (import.meta.hot) {
  try {
    const fs = require('fs');
    // 检查文件是否存在
    const checkFileExists = (path) => {
      try {
        return fs.existsSync(path);
      } catch {
        return false;
      }
    };

    // 验证路径有效性
    const validatePaths = () => {
      const filesToCheck = [
        __main_dist_entry__,
        __preload_dist_entry__,
        __renderer_dist_entry__
      ];

      const missing = filesToCheck.filter(filePath => filePath && !checkFileExists(filePath));

      if (missing.length > 0) {
        console.warn('[Electron Paths] 以下文件不存在:', missing);
      }
    };

    // 初始验证
    validatePaths();

    // 监听文件变化
    import.meta.hot.on('electron-paths-update', (data) => {
      console.log('[Electron Paths] 路径配置已更新:', data);
      // TODO:
    });
  } catch (e) {
    console.warn('[Electron Paths] 无法加载 fs 模块进行路径验证:', e);
  }
}
`;
  }
  return content;
}
