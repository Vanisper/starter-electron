import path from 'path';
import type {
  UserProjectConfig,
  IProcessConfig,
  IElectronConfig,
  IRendererConfig
} from './types.js';

/**
 * 💡 Electron 进程配置类 (Main/Preload)
 */
export class ProcessConfig implements IProcessConfig {
  public root: string;
  public entry: string;
  public vite?: import('vite').InlineConfig;

  /**
   * @param defaultConfig 默认配置
   * @param userConfig 用户自定义配置
   */
  constructor(defaultConfig: IProcessConfig, userConfig?: Partial<IProcessConfig>) {
    // 合并配置，用户配置覆盖默认配置
    this.root = userConfig?.root ?? defaultConfig.root;
    this.entry = userConfig?.entry ?? defaultConfig.entry;
    this.vite = userConfig?.vite ?? defaultConfig.vite;
  }

  /**
   * 源码路径计算
   * @returns 例如: 'electron/main/index.ts'
   */
  public resolveSourceEntry(electronRoot: string): string {
    return path.join(electronRoot, this.root, this.entry);
  }

  /**
   * 构建输出目录计算
   * @returns 例如: 'dist-electron/main'
   */
  public resolveOutDir(electronDist: string): string {
    return path.join(electronDist, this.root);
  }

  /**
   * 构建输出文件路径计算
   * @param electronDist Electron 构建输出根目录
   * @param ext 输出文件后缀名 (例如: 'cjs', 'js')
   * @returns 例如: 'dist-electron/main/index.cjs'
   */
  public resolveDistFile(electronDist: string, ext: string): string {
    /** 无后缀文件名称 */
    const entryName = path.basename(this.entry, path.extname(this.entry));
    return path.join(electronDist, this.root, [entryName, ext].join('.'));
  }
}

/**
 * 💡 Electron 路径配置类
 */
export class ElectronConfig implements IElectronConfig {
  public root: string;
  public dist: string;
  public main: ProcessConfig;
  public preload: ProcessConfig;
  public vite?: import('vite').InlineConfig;

  constructor(defaultConfig: IElectronConfig, userConfig?: Partial<IElectronConfig<true>>) {
    this.root = userConfig?.root ?? defaultConfig.root;
    this.dist = userConfig?.dist ?? defaultConfig.dist;
    this.vite = userConfig?.vite ?? defaultConfig.vite;

    // 分别创建 Main 和 Preload 的 ProcessConfig 实例
    this.main = new ProcessConfig(defaultConfig.main, userConfig?.main);
    this.preload = new ProcessConfig(defaultConfig.preload, userConfig?.preload);
  }
}

/**
 * 💡 Renderer 路径配置类
 */
export class RendererConfig implements IRendererConfig {
  public root: string;
  public dist: string;
  public entry: string;

  constructor(defaultConfig: IRendererConfig, userConfig?: Partial<IRendererConfig>) {
    this.root = userConfig?.root ?? defaultConfig.root;
    this.dist = userConfig?.dist ?? defaultConfig.dist;
    this.entry = userConfig?.entry ?? defaultConfig.entry;
  }

  /**
   * HTML 入口文件编译位置
   * @returns 例如: 'dist/index.html'
   */
  public resolveDistFile(): string {
    return path.join(this.dist, this.entry);
  }
}

/**
 * 💡 项目配置类
 */
export class ProjectConfig {
  /**
   * Electron 路径配置
   */
  public electron: ElectronConfig;
  /**
   * Renderer 路径配置
   */
  public renderer: RendererConfig;

  /** 默认配置 */
  readonly defaultConfig = {
    electron: {
      root: 'electron',
      dist: 'dist-electron',
      main: {
        root: 'main',
        entry: 'index.ts',
      },
      preload: {
        root: 'preload',
        entry: 'index.ts',
      },
    },
    renderer: {
      root: 'src',
      dist: 'dist',
      entry: 'index.html',
    },
  };

  constructor(userConfig?: UserProjectConfig) {
    // 实例化子配置类，并传入默认配置和用户配置
    this.electron = new ElectronConfig(this.defaultConfig.electron, userConfig?.electron);
    this.renderer = new RendererConfig(this.defaultConfig.renderer, userConfig?.renderer);
  }

  get mainEntryPath() {
    return this.electron.main.resolveSourceEntry(this.electron.root)
  }
  get preloadEntryPath() {
    return this.electron.preload.resolveSourceEntry(this.electron.root)
  }
  get mainOutDir() {
    return this.electron.main.resolveOutDir(this.electron.dist)
  }
  get preloadOutDir() {
    return this.electron.preload.resolveOutDir(this.electron.dist);
  }

  get __renderer_dist_entry__() {
    return this.renderer.resolveDistFile()
  }
  get __main_output__() {
    return this.electron.main.resolveOutDir(this.electron.dist)
  };
  get __preload_output__() {
    return this.electron.preload.resolveOutDir(this.electron.dist)
  };
  get__main_dist_entry__(libExt: string) {
    return this.electron.main.resolveDistFile(this.electron.dist, libExt)
  };
  get__preload_dist_entry__(libExt: string) {
    return this.electron.preload.resolveDistFile(this.electron.dist, libExt)
  };
}

/**
 * 定义配置的辅助函数
 */
export function defineConfig(userConfig?: UserProjectConfig) {
  return new ProjectConfig(userConfig);
}
