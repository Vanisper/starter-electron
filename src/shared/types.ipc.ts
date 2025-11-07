import type { IpcMainEvent, IpcMainInvokeEvent } from "electron";

export type EventReturn<T = any> = {
  success: boolean
  message?: string
  data?: T
}

/**
 * 同步处理器
 * @param event Electron 的 IpcMainEvent
 * @param args 来自 IpcInvokeMap 的强类型参数
 * @returns 必须返回 EventReturn<T>
 */
export type SyncHandler<K extends keyof IpcInvokeMap, T> =
  (
    context: T,
    event: IpcMainEvent,
    ...args: Parameters<IpcInvokeMap[K]>
  ) => EventReturn<ReturnType<IpcInvokeMap[K]>>;

/**
 * 异步处理器
 * @param event Electron 的 IpcMainInvokeEvent
 * @param args 来自 IpcInvokeMap 的强类型参数
 * @returns 必须返回 Promise<EventReturn<T>>
 */
export type AsyncHandler<K extends keyof IpcInvokeMap, T> =
  (
    context: T,
    event: IpcMainInvokeEvent,
    ...args: Parameters<IpcInvokeMap[K]>
  ) => Promise<EventReturn<ReturnType<IpcInvokeMap[K]>>>;

/**
 * 单向消息处理器
 * @param event Electron 的 IpcMainEvent
 * @param args 来自 IpcSendMap 的强类型参数
 */
export type SendHandler<K extends keyof IpcSendMap, T> =
  (
    context: T,
    event: IpcMainEvent,
    ...args: Parameters<IpcSendMap[K]>
  ) => void;

/**
 * 'on' 方法的回调函数签名
 * TArgs 是一个数组，代表回调函数应接收的参数
 */
type OnCallback<TArgs extends any[]> = (...args: TArgs) => void;
/**
 * 'on' 方法的返回值，用于清除监听器
 */
type ClearExec = () => void;

/**
 * ipc通信事件信道key枚举
 * @description 不同种类的事件即使是一样的 key，也能互不影响地工作
 *
 * 所以一个 key 可以用于不同事件类型；可以利用此机制实现类似 RESTful-Api `动词 + 宾语`的效果
 */
export const IpcChannel = {
  GET_WINDOW_ID: 'get-window-id',

  APP_MINMIZE: 'app:minmize',
  APP_MAXMIZE: 'app:maxmize',
  APP_QUIT: 'app:quit',
  APP_QUIT_CONFIRM: 'app:quit-confirm',

  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',

  CUSTOM_EVENT: 'custom:event',
  TIME_UPDATE: 'time:update',
} as const

export type IpcApi = {
  /**
   * 同步调用主进程 (对应 ipcRenderer.sendSync)
   * - Channel 被约束为 IpcInvokeMap 的键
   * - args 被推断为映射表中对应函数的参数
   * - 返回值被推断为 EventReturn<映射表中函数的返回值>
   */
  invoke: <K extends keyof IpcInvokeMap>(
    channel: K,
    ...args: Parameters<IpcInvokeMap[K]>
  ) => EventReturn<ReturnType<IpcInvokeMap[K]>>;

  /**
   * 异步调用主进程 (对应 ipcRenderer.invoke)
   */
  invokeAsync: <K extends keyof IpcInvokeMap>(
    channel: K,
    ...args: Parameters<IpcInvokeMap[K]>
  ) => Promise<EventReturn<ReturnType<IpcInvokeMap[K]>>>;

  /**
   * 监听主进程消息
   * - Channel 被约束为 IpcOnMap 的键
   * - callback 的参数被推断为映射表中对应函数的参数
   */
  on: <K extends keyof IpcOnMap>(
    channel: K,
    callback: OnCallback<Parameters<IpcOnMap[K]>>,
    once?: boolean
  ) => ClearExec;

  /**
   * 发送消息到主进程 (单向)
   * - Channel 被约束为 IpcSendMap 的键
   * - args 被推断为映射表中对应函数的参数
   */
  send: <K extends keyof IpcSendMap>(
    channel: K,
    ...args: Parameters<IpcSendMap[K]>
  ) => void;
};

/**
 * -----------------------------------------------------------------
 * 映射表定义 (MAPPING DEFINITION)
 *
 * TODO: 在这里添加新的 Channel 并定义它们的签名。
 * -----------------------------------------------------------------
 */

/**
 * 用于 invoke/invokeAsync
 * - 键: Channel
 * - 值: (函数参数) => 返回值 (这将是 EventReturn<T> 中的 T)
 */
export interface IpcInvokeMap {
  /** 传入路径，返回文件内容 */
  [IpcChannel.FILE_READ]: (path: string) => string;
  /** 传入路径和内容，返回是否成功 */
  [IpcChannel.FILE_WRITE]: (path: string, content: string) => boolean;
  /** 无参数，返回窗口 ID */
  [IpcChannel.GET_WINDOW_ID]: () => number;
}

/**
 * 用于 send (渲染器 -> 主进程，单向)
 * - 键: Channel
 * - 值: (函数参数) => void
 */
export interface IpcSendMap {
  [IpcChannel.APP_MINMIZE]: () => void;
  [IpcChannel.APP_MAXMIZE]: () => void;
  [IpcChannel.APP_QUIT]: () => void;
  [IpcChannel.APP_QUIT_CONFIRM]: () => void;
  // TODO: 自定义 send
  [IpcChannel.CUSTOM_EVENT]: (payload: { id: number; data: string }) => void;
}

/**
 * 用于 on (主进程 -> 渲染器，监听)
 * - 键: Channel
 * - 值: (监听器回调参数) => void
 */
export interface IpcOnMap {
  [IpcChannel.APP_QUIT]: () => void;
  [IpcChannel.TIME_UPDATE]: (time: Date) => void;
  // TODO: 自定义监听事件
  [IpcChannel.CUSTOM_EVENT]: (payload: { id: number; data: string }) => void;
}
