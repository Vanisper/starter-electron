import path from 'path';
import { mergeConfig } from 'vite';
import type { LibraryFormats, PluginOption, ResolvedConfig } from 'vite';
import electron, { type ElectronOptions } from "vite-plugin-electron";
import { build, type Configuration } from 'electron-builder';

import { defineConfig } from './config.js';
import { LibraryFormat } from './types.js';
import type { CustomElectronOptions, ElectronPaths } from './types.js';

import { VIRTUAL_MODULE_ID } from './constant.js';
import { createVirtualModulePlugin } from './virtual-module.js';

const defaultTargetElectron = ['electron', 'cjs'] as const
const [defaultName, defaultLibFormat] = defaultTargetElectron;

/**
 * Electron All-In-One
 */
export function electronUnified(customOptions: CustomElectronOptions) {
  const {
    target = defaultTargetElectron,
    config: customConfig,
    virtualModule: virtualModuleOptions = {},
  } = customOptions;

  // 虚拟模块配置，默认启用
  const {
    enabled = true,
    devEnhancement = true,
  } = virtualModuleOptions;

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

  // 创建 Electron 路径配置对象
  const electronPaths: ElectronPaths = {
    __main_dist_entry__: config.get__main_dist_entry__(libExt),
    __preload_dist_entry__: config.get__preload_dist_entry__(libExt),
    __renderer_dist_entry__: config.__renderer_dist_entry__,
    __main_output__: config.__main_output__,
    __preload_output__: config.__preload_output__,
  };

  const isCustom = customElectronPkg !== defaultName
  console.warn(`[Vite Build] ℹ️ 主进程构建格式为: ${libFormat}`);

  const rendererRoot = config.renderer.root;
  const rendererDist = rendererRoot ? path.join(process.cwd(), config.renderer.dist) : undefined;
  const electronRoot = rendererRoot ? process.cwd() : undefined;

  const electronConfig: ElectronOptions[] = [
    {
      vite: {
        root: electronRoot,
        build: {
          lib: {
            entry: config.mainEntryPath,
            ...libOptions,
          },
          outDir: config.mainOutDir,
        },
        plugins: enabled ? [
          createVirtualModulePlugin(electronPaths, { devEnhancement }),
          {
            name: 'electron-unified:usage-hint',
            configResolved(_config: ResolvedConfig) {
              if (process.env.NODE_ENV !== 'production' && enabled) {
                console.log(`[Electron Unified] 📦 虚拟模块已启用: ${VIRTUAL_MODULE_ID}`);
                console.log('[Electron Unified] 💡 在主进程中使用以下方式导入路径配置:');
                console.log(`  import electronPaths from "${VIRTUAL_MODULE_ID}";`);
                console.log('  // 或');
                console.log(`  import { __main_dist_entry__ } from "${VIRTUAL_MODULE_ID}";`);
              }
            }
          }
        ] : undefined,
        ...mergeConfig(config.electron.vite ?? {}, config.electron.main.vite ?? {}),
      },
      onstart(args) {
        if (isCustom) {
          console.log('[Custom Hook] Electron Downgrade Check...');
          console.warn(`[Electron Downgrade] 🚨 使用别名包: ${customElectronPkg}`);
        }

        // 启动参数：指定主进程文件路径
        const argv = [electronPaths.__main_dist_entry__ ?? '.', '--no-sandbox'];
        args.startup(argv, undefined, customElectronPkg);
      },
    },
    {
      vite: {
        root: electronRoot,
        build: {
          lib: {
            entry: config.preloadEntryPath,
            ...libOptions,
          },
          outDir: config.preloadOutDir,
        },
        ...mergeConfig(config.electron.vite ?? {}, config.electron.preload.vite ?? {}),
      }
    },
  ];

  const plugins: PluginOption[] = [
    config.renderer.vite?.plugins,
    {
      name: 'electron-unified:config',
      config(userConfig) {
        return mergeConfig(userConfig, mergeConfig({ root: rendererRoot, build: { outDir: rendererDist } }, config.renderer.vite ?? {}));
      },
    },
    electron(electronConfig),
    {
      name: 'electron-unified:builder-wrapper',
      closeBundle: async () => {
        if (process.env.NODE_ENV === 'production') {
          console.log('[Build] Vite build complete. Starting post-build...');

          console.log('📦 [Build] Starting electron-builder...');
          try {
            const buildConfig: Configuration = {
              extraMetadata: {
                'main': electronPaths.__main_dist_entry__,
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
