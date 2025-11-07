import { BrowserWindow } from "electron";
import type { IpcManager } from "./core";

/**
 * - app:maxmize
 * - app:minmize
 * - app:quit
 */
export const initAppHandlers = (ipcManager: IpcManager) => {
  // 最大化指令
  ipcManager.registerSend('app:maxmize', (_ctx, event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.maximize();
  });
  ipcManager.registerSend('app:minmize', (_ctx, event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  // #region 安全退出指令
  // 渲染线程发起关闭请求指令 -> 主线程发起询问
  // -> 渲染线程ui交互反馈、二次确认，发起确认关闭指令 -> 主线程响应确认指令，执行窗口关闭事件
  ipcManager.registerSend('app:quit', (_ctx, event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      ipcManager.sendToWindow(window.id, 'app:quit');
    }
  });
  ipcManager.registerSend('app:quit-confirm', (_ctx, event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      // destroy 会关闭窗口，但是不会触发 window 的 close 事件
      // 防止可能存在的死循环
      window.destroy();
    }
  });
  // #endregion
}
