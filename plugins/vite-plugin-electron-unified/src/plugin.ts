import type { LibraryFormats, PluginOption } from 'vite';
import { build, type Configuration } from 'electron-builder';
import electron, { type ElectronOptions } from "vite-plugin-electron";

import { defineConfig } from './config.js';
import { LibraryFormat, type CustomElectronOptions } from './types.js';

const defaultTargetElectron = ['electron', 'cjs'] as const
const [defaultName, defaultLibFormat] = defaultTargetElectron;

/**
 * Electron All-In-One
 */
export function electronUnified(customOptions: CustomElectronOptions) {
  const {
    target = defaultTargetElectron,
    config: customConfig,
  } = customOptions;

  const config = defineConfig(customConfig);

  const [customElectronPkg = defaultName, libFormat = defaultLibFormat] = target;

  // 检查 package.json 的 type 字段来确定默认格式
  const isESM = typeof process !== 'undefined' && process.env?.npm_package_type === 'module';
  const libFormats: LibraryFormats[] = isESM ? [libFormat] : ['cjs'];
  const libExt = LibraryFormat[libFormat];

  const libOptions = {
    formats: libFormats,
    fileName: () => `[name].${libExt}`,
  };

  // 动态确定 Electron 启动的入口文件 (相对路径)
  const __main_dist_entry__ = config.get__main_dist_entry__(libExt);
  const __preload_dist_entry__ = config.get__preload_dist_entry__(libExt);
  const __main_output__ = config.__main_output__;
  const __preload_output__ = config.__preload_output__;
  const __renderer_dist_entry__ = config.__renderer_dist_entry__;

  const isCustom = customElectronPkg !== defaultName
  console.warn(`[Vite Build] ℹ️ 主进程构建格式为: ${libFormat}`);

  const electronConfig: ElectronOptions[] = [
    {
      // === main ===
      vite: {
        // 定义宏，供主进程脚本使用 (使用 path.resolve 确保路径稳定)
        // TODO: 实现虚拟模块，主进程通过虚拟模块引用
        define: {
          '__main_dist_entry__': JSON.stringify(__main_dist_entry__),
          '__preload_dist_entry__': JSON.stringify(__preload_dist_entry__),
          '__renderer_dist_entry__': JSON.stringify(__renderer_dist_entry__),
          '__main_output__': JSON.stringify(__main_output__),
          '__preload_output__': JSON.stringify(__preload_output__),
        },
        build: {
          lib: {
            entry: config.mainEntryPath,
            ...libOptions,
          },
          outDir: config.mainOutDir,
        },
        ...config.electron.vite,
        ...config.electron.main.vite,
      },
      onstart(args) {
        if (isCustom) {
          console.log('[Custom Hook] Electron Downgrade Check...');
          console.warn(`[Electron Downgrade] 🚨 使用别名包: ${customElectronPkg}`);
        }

        // 启动参数：指定主进程文件路径
        const argv = [__main_dist_entry__ ?? '.', '--no-sandbox'];
        args.startup(argv, undefined, customElectronPkg);
      },
    },
    {
      // === preload ===
      vite: {
        build: {
          lib: {
            entry: config.preloadEntryPath,
            ...libOptions,
          },
          outDir: config.preloadOutDir,
        },
        ...config.electron.vite,
        ...config.electron.preload.vite,
      }
    },
  ];

  const plugins: PluginOption[] = [
    electron(electronConfig),
    {
      name: 'electron-builder-wrapper',
      closeBundle: async () => {
        if (process.env.NODE_ENV === 'production') {
          console.log('[Build] Vite build complete. Starting post-build...');

          console.log('📦 [Build] Starting electron-builder...');
          try {
            const buildConfig: Configuration = {
              extraMetadata: {
                'main': __main_dist_entry__,
              },
              // https://github.com/electron-userland/electron-builder/issues/3747
              electronVersion: isCustom ? customElectronPkg : null,
              electronDist: ['node_modules', customElectronPkg, 'dist'].join('/'),
            };

            await build({
              config: buildConfig
            });
            console.log('✅ [Build] electron-builder finished:');
          } catch (error) {
            console.error('🚨 [Build] electron-builder failed:', error);
            throw error;
          }
        }
      }
    }
  ];

  return plugins;
}
