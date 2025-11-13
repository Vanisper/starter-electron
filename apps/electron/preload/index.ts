import { contextBridge, ipcRenderer } from "electron";
import { type IpcApi } from "@/shared/types.ipc";

/**
 * contextBridge: 必须在 preload 中使用
 * 使用 contextBridge 安全暴露有限 API，提供发送/监听能力
 * 保持最小权限原则
 */
const api: IpcApi = {
  invoke: (channel, ...args) => {
    return ipcRenderer.sendSync('ipc:invoke', channel, ...args);
  },
  send: (channel, ...args) => {
    ipcRenderer.send('ipc:send', channel, ...args);
  },
  invokeAsync: async (channel, ...args) => {
    return await ipcRenderer.invoke('ipc:invokeAsync', channel, ...args);
  },
  on: (channel, callback, once = false) => {
    const subscription = (_ev: any, ...args: any[]) => callback(...args as any)
    if (once === true) {
      ipcRenderer.once(channel, subscription)
    } else {
      ipcRenderer.on(channel, subscription)
    }

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('ipcApi', api)
