import { IpcChannel } from "@/shared/types.ipc";
import { ipcManager } from "./core";
import { initAppHandlers } from "./handlers.app";
/**
 * 初始化 ipc 事件
 * @description ipc 事件注册执行中心
 */
export const setupIpc = () => {
  initAppHandlers(ipcManager)
  // 同步获取窗口id
  ipcManager.register('get-window-id', (ctx, event) => {
    return ctx.ok(event.sender.id);
  });

  // 异步文件读取（模拟）
  ipcManager.registerAsync('file:read', async (ctx, event, path) => {
    console.log(`Window ${event.sender.id} is reading path: ${path}`);
    try {
      return ctx.ok(`Mock content for: ${path}`);
    } catch (error: any) {
      return ctx.error(error);
    }
  });
  // 轮训广播（消息推送）
  let i = 0
  setInterval(() => {
    ipcManager.broadcast(IpcChannel.TIME_UPDATE, new Date());
    ipcManager.broadcast(IpcChannel.CUSTOM_EVENT, { id: i, data: `${++i}` });
  }, 1000);
}

export * from './core'
