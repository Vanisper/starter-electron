/**
 * electron 统一插件虚拟模块
 * - electron 路径配置
 */
declare module "virtual:electron-unified" {
  /** 主进程构建入口文件路径 */
  export const __main_dist_entry__: string;

  /** 预加载脚本构建入口文件路径 */
  export const __preload_dist_entry__: string;

  /** 渲染进程构建入口文件路径 */
  export const __renderer_dist_entry__: string;

  /** 主进程输出目录 */
  export const __main_output__: string;

  /** 预加载脚本输出目录 */
  export const __preload_output__: string;

  /** electron 路径配置 */
  const paths: import("./src/types").ElectronPaths;
  export default paths;
}
