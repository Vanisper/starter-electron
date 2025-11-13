import { ipcMain, BrowserWindow, type IpcMainInvokeEvent, type IpcMainEvent } from "electron";
import type { AsyncHandler, EventReturn, IpcInvokeMap, IpcOnMap, IpcSendMap, SendHandler, SyncHandler } from "@/shared/types.ipc";
import EventEmitter from "events";

export class IpcManager extends EventEmitter {
  /**
   * 同步请求 (Sync Request-Response)
   * - `Renderer -> Main -> Renderer` | 阻塞, 直到收到 `event.returnValue`
   * - 渲染进程 ipcRenderer.sendSync 发起调用, 主进程 ipcMain.on 响应调用
   * - 这种模式会阻塞渲染器进程，应极力避免，确保事件能毫秒级处理
  */
  public static readonly CHANNEL_SYNC = 'ipc:invoke';
  /**
   * 异步请求 (Async Request-Response)
   * - `Renderer -> Main -> Renderer` | 非阻塞, `Promise-based`
   * - 渲染进程 ipcRenderer.invoke 发起调用, 主进程 ipcMain.handle 响应调用
   */
  public static readonly CHANNEL_ASYNC = 'ipc:invokeAsync';
  /**
   * 单向发送 (One-Way Send)
   * - `Renderer -> Main` | “触发并忘记”模式
   * - 用途是渲染进程向主进程发送的一个不需要指令反馈的指令（void返回）
   */
  public static readonly CHANNEL_SEND = 'ipc:send';
  /**
   * 事件推送 (Event Push)
   * - `Main -> Renderer` | 广播或定向
   * - 主进程通知渲染器状态变化（例如“下载进度更新”、“有新消息”）
   * @deprecated 事件推送不采用多路复用模式，此处只做注释说明
   */
  public static readonly CHANNEL_PUSH: never;

  private static instance: IpcManager
  private handlers: Map<string, (context: IpcManager, event: IpcMainEvent, ...args: any[]) => EventReturn<any>>
  private sendHandlers: Map<string, (context: IpcManager, event: IpcMainEvent, ...args: any[]) => void>
  private asyncHandlers: Map<string, (context: IpcManager, event: IpcMainInvokeEvent, ...args: any[]) => Promise<EventReturn<any>>>

  private constructor() {
    super()
    this.handlers = new Map()
    this.sendHandlers = new Map()
    this.asyncHandlers = new Map()
    this.initialize()
  }

  public static getInstance(): IpcManager {
    if (!IpcManager.instance) {
      IpcManager.instance = new IpcManager()
    }
    return IpcManager.instance
  }

  public emitInMain(event: string, ...args: any[]) {
    this.emit(event, ...args);
  }

  public listenInMain(event: string, listener: (...args: any[]) => void) {
    this.on(event, listener);
  }

  public ok<T>(data?: T, message?: string): EventReturn<T> {
    return { success: true, data, message }
  }

  public error(message?: any): EventReturn<never> {
    return { success: false, message: String(message) }
  }

  private initialize(): void {
    // 初始化同步处理器
    ipcMain.on(IpcManager.CHANNEL_SYNC, (event, channel, ...args) => {
      let result: EventReturn;
      try {
        const handler = this.handlers.get(channel);
        if (handler) {
          result = handler(this, event, ...args);
        } else {
          result = this.error(`No handler for channel: ${channel}`);
        }
      } catch (error) {
        result = this.error(error);
      }
      event.returnValue = result;
    });
    // 初始化单向发送处理器
    ipcMain.on(IpcManager.CHANNEL_SEND, (event, channel, ...args) => {
      try {
        const handler = this.sendHandlers.get(channel);
        if (handler) {
          handler(this, event, ...args);
        } else {
          console.error(`No send handler for channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Error in send handler for channel: ${channel}`, error);
      }
    });
    // 初始化异步处理器
    ipcMain.handle(IpcManager.CHANNEL_ASYNC, async (event, channel, ...args) => {
      try {
        const handler = this.asyncHandlers.get(channel);
        if (handler) {
          return await handler(this, event, ...args);
        } else {
          throw new Error(`No async handler for channel: ${channel}`)
        }
      } catch (error) {
        throw error
      }
    });
  }

  /**
   * 注册同步
   */
  public register<K extends keyof IpcInvokeMap>(
    channel: K,
    handler: SyncHandler<K, IpcManager>
  ) {
    this.handlers.set(channel, handler);
  }
  /**
   * 注册单向
   */
  public registerSend<K extends keyof IpcSendMap>(
    channel: K,
    handler: SendHandler<K, IpcManager>
  ) {
    this.sendHandlers.set(channel, handler);
  }
  /**
   * 注册异步
   */
  public registerAsync<K extends keyof IpcInvokeMap>(
    channel: K,
    handler: AsyncHandler<K, IpcManager>
  ) {
    this.asyncHandlers.set(channel, handler);
  }

  /**
   * 广播on事件至所有窗口
   */
  public broadcast<K extends keyof IpcOnMap>(
    channel: K,
    ...args: Parameters<IpcOnMap[K]>
  ) {
    BrowserWindow.getAllWindows().forEach(window => {
      if (window && !window.isDestroyed()) {
        window.webContents.send(channel, ...args);
      }
    });
  }

  /**
   * 发送消息给指定窗口
   */
  public sendToWindow<K extends keyof IpcOnMap>(
    windowId: number,
    channel: K,
    ...args: Parameters<IpcOnMap[K]>
  ) {
    const window = BrowserWindow.fromId(windowId);
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, ...args);
    }
  }

  /** 清理所有处理器 */
  public clear() {
    this.handlers.clear()
    this.sendHandlers.clear()
    this.asyncHandlers.clear()
    ipcMain.removeAllListeners(IpcManager.CHANNEL_SYNC);
    ipcMain.removeAllListeners(IpcManager.CHANNEL_SEND);
    ipcMain.removeAllListeners(IpcManager.CHANNEL_ASYNC);
  }
}

export const ipcManager = IpcManager.getInstance()
