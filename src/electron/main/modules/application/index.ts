import { checkUrlAccessible } from '@/electron/utils';
import {
  shell,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type App,
  type HandlerDetails,
  type WindowOpenHandlerResponse,
  type Event,
} from 'electron';

export interface AppPaths {
  devUrl: string | undefined;
  prodFile: string;
}

export interface Handlers {
  onWindowOpen?: (details: Electron.HandlerDetails, parentWindow: BrowserWindow) => WindowOpenHandlerResponse | void
  onWindowClose?: (event: Event, window: BrowserWindow) => void
}

export class Application {
  private readonly app: App;
  private readonly defaultOptions: BrowserWindowConstructorOptions;
  private readonly defaultPaths: AppPaths;
  private readonly handlers?: Handlers;

  /**
   * 管理所有窗口
   * - 键: string (给窗口定义的唯一ID, 如 'main', 'settings')
   * - 值: BrowserWindow 实例
   */
  private windows: Map<string, BrowserWindow> = new Map();

  constructor(
    electronApp: App,
    options: BrowserWindowConstructorOptions,
    paths: AppPaths,
    handlers?: Handlers
  ) {
    this.app = electronApp;
    // 视为“主窗口”的默认配置
    this.defaultOptions = options;
    this.defaultPaths = paths;

    this.handlers = handlers;
  }

  /**
   * 启动应用，并创建主窗口
   */
  public async run() {
    // 禁止前端控制台的安全性警告 log
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

    if (!this.app.requestSingleInstanceLock()) {
      this.app.quit();
      process.exit(0);
    }

    this.app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    this.app.on('activate', this.onActivate.bind(this));

    await this.app.whenReady();
    // 启动时，创建 "main" 窗口
    return this.createWindow('main', this.defaultOptions, this.defaultPaths);
  }

  /**
   * 在 macOS 上，如果 Dock 被点击且没有窗口，则重新创建主窗口
   */
  private onActivate() {
    if (this.windows.size === 0) {
      this.createWindow('main', this.defaultOptions, this.defaultPaths);
    }
  }

  private async onWindowAllClosed() {
    // [INFO] 开发模式优化
    // 开发模式下直接中断项目，由于 mac 端 dock 栏后台暂留的机制
    // app 可能不会退出，此处对 devUrl 特别做判断（开发模式中断项目 devUrl 将会无服务）
    const isAccessible = await checkUrlAccessible(this.defaultPaths.devUrl)

    if (process.platform !== 'darwin' || !isAccessible) {
      this.app.quit();
    }
  }

  /**
   * 创建或聚焦一个窗口
   * @param windowKey 窗口的唯一标识符 (e.g., "main", "settings")
   * @param options 窗口的 BrowserWindow 选项
   * @param paths (可选) 加载的路径。如果省略，将不加载任何内容。
   */
  public createWindow(
    windowKey: string,
    options: BrowserWindowConstructorOptions,
    paths?: Partial<AppPaths>
  ) {
    // 如果窗口存在，则聚焦它而不是创建新的
    if (this.windows.has(windowKey)) {
      const existingWindow = this.windows.get(windowKey)!;

      if (existingWindow.isMinimized()) {
        existingWindow.restore();
      }
      existingWindow.focus();
      return;
    }

    const newWindow = new BrowserWindow(options);

    newWindow.webContents.setWindowOpenHandler((details) => {
      console.log(`[WindowHandler] 父窗口 (ID: ${newWindow.id}) 请求打开: ${details.url}`);

      // 将 `newWindow` (即“父”窗口) 传递给处理程序
      const customHandler = this.handlers?.onWindowOpen?.(details, newWindow)
      if (customHandler) {
        return customHandler;
      }

      return this.handleWindowOpen(details, newWindow)
    });

    const loadPath = paths?.devUrl || this.defaultPaths.devUrl;
    const loadFile = paths?.prodFile || this.defaultPaths.prodFile;

    if (loadPath) {
      newWindow.loadURL(loadPath);
      newWindow.webContents.openDevTools();
    } else if (loadFile) {
      newWindow.loadFile(loadFile);
    } else {
      console.warn(`[App] 窗口 ${windowKey} 被创建，但没有提供 devUrl 或 prodFile。`);
    }

    newWindow
      .on('close', (event) => {
        this.handlers?.onWindowClose?.(event, newWindow)
      })
      .on('closed', () => {
        // 当窗口关闭时，从 Map 中移除
        this.windows.delete(windowKey);
        console.log(`[App] 窗口关闭: ${windowKey}. 当前窗口数: ${this.windows.size}`);
      });

    // 跟踪新窗口
    this.windows.set(windowKey, newWindow);
    console.log(`[App] 窗口创建: ${windowKey}. 当前窗口数: ${this.windows.size}`);
    return newWindow
  }

  /**
   * 默认处理窗口打开
   */
  private handleWindowOpen(
    details: HandlerDetails,
    _parentWindow: BrowserWindow
  ): WindowOpenHandlerResponse {
    // http(s) 的链接使用本机浏览器打开
    if (details.url.startsWith('http:') || details.url.startsWith('https:')) {
      // 在用户默认浏览器中打开
      shell.openExternal(details.url);
      return { action: 'deny' };
    }

    return { action: 'deny' };
  }

  /**
   * 获取窗口
   */
  public getWindow(windowKey: string): BrowserWindow | undefined {
    return this.windows.get(windowKey);
  }
}
