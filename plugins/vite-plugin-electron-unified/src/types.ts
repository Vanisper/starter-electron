/**
 * 库格式映射
 */
export const LibraryFormat = {
  es: 'js',
  cjs: 'cjs',
} as const;

/**
 * 目标 Electron 配置类型
 */
export type TargetElectron = [string?, (keyof typeof LibraryFormat)?];

/**
 * 用户项目配置接口
 */
export interface UserProjectConfig {
  /**
   * Electron 路径配置
   */
  electron?: Partial<IElectronConfig<true>>;
  /**
   * Renderer 路径配置
   */
  renderer?: Partial<IRendererConfig>;
}

/**
 * 基础路径配置接口
 */
export interface IProcessConfig {
  /**
   * 根目录名
   * @description 会自动拼接 ElectronConfig 的基础路径
   * @default ('main'|'preload')
   * @returns `[electron.root|electron.dist]/[this.root]`
   */
  root: string;
  /**
   * 入口文件名 - 带文件后缀
   * @description 会自动拼接 ElectronConfig 和 ProcessConfig 的基础路径
   * @default 'index.ts'
   * @returns `[electron.root|electron.dist]/[this.root]/[this.entry]`
   */
  entry: string;

  vite?: import('vite').InlineConfig;
}

/**
 * Electron 路径配置接口
 */
export interface IElectronConfig<P extends boolean = false> {
  /**
   * Electron 源码根目录
   * @default 'electron'
   */
  root: string;
  /**
   * Electron 构建输出根目录
   * @default 'dist-electron'
   */
  dist: string;
  /**
   * Electron 主进程配置
   */
  main: P extends true ? Partial<IProcessConfig> : IProcessConfig;
  /**
   * Electron 预加载进程配置
   */
  preload: P extends true ? Partial<IProcessConfig> : IProcessConfig;
  vite?: import('vite').InlineConfig;
}

/**
 * Renderer 路径配置接口
 */
export interface IRendererConfig {
  /**
   * Renderer 源码根目录
   * @default 'src'
   */
  root: string;
  /**
   * Renderer 构建输出目录
   * @default 'dist'
   */
  dist: string;
  /**
   * Renderer HTML 入口
   * @default 'index.html'
   * @returns `[this.root]/[this.entry]`
   */
  entry: string;
}

/**
 * Electron 路径配置接口
 */
export interface ElectronPaths {
  /** 主进程构建入口文件路径 */
  __main_dist_entry__: string;
  /** 预加载脚本构建入口文件路径 */
  __preload_dist_entry__: string;
  /** 渲染进程构建入口文件路径 */
  __renderer_dist_entry__: string;
  /** 主进程输出目录 */
  __main_output__: string;
  /** 预加载脚本输出目录 */
  __preload_output__: string;
}

/**
 * 虚拟模块选项接口
 */
export interface VirtualModuleOptions {
  /** 是否启用虚拟模块 */
  enabled?: boolean;
  /** 是否启用开发环境增强 */
  devEnhancement?: boolean;
}

export interface CustomElectronOptions {
  /**
   * @description Electron 28 版本开始支持 ESM
   * @type [`electron-module-id`, `"cjs" | "es"`]
   * @default ["electron", "cjs"]
   */
  target?: TargetElectron;
  config?: UserProjectConfig;
  /**
   * 虚拟模块配置
   */
  virtualModule?: VirtualModuleOptions;
}
