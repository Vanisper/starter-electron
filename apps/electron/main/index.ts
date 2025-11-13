import path from "path";
import { app as electronApp } from "electron";
import { checkUrlAccessible, getDirname, inferProjectRoot } from "@/electron/utils";
import { Application, setupIpc } from "./modules";

import {
  __main_output__,
  __preload_dist_entry__,
  __renderer_dist_entry__,
} from "virtual:electron-unified";

// https://github.com/electron-vite/vite-plugin-electron/issues/258
globalThis.__dirname = getDirname()

const projectRoot = inferProjectRoot(__dirname, __main_output__);

const preloadPath = path.join(projectRoot, __preload_dist_entry__);
const rendererPath = path.join(projectRoot, __renderer_dist_entry__);

console.log('---- eletron 版本 ----', process.versions.electron);

/**
 * CDN 白名单
 * @description 部分 cdn 会使用 `//cdn.xxx.com` 以兼容前端的网络协议,
 * 但是在 electron 发布模式时，此类 url 会被处理成本地文件协议 `file://`
 */
const CDN_WHITELIST: (string | { [key: string]: string | null | undefined })[] = [
  { 'at.alicdn.com': 'https' },
];

const app = new Application(
  electronApp,
  {
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: preloadPath,
    }
  },
  {
    devUrl: process.env.VITE_DEV_SERVER_URL,
    prodFile: rendererPath,
  },
  {
    async onBeforeRequest(details) {
      const originalUrl = details.url;

      // 检查是否是 file:// 协议下的请求
      if (originalUrl.startsWith('file:')) {
        try {
          // 将错误的 file:/// URL 转换为 URL 对象以便解析
          const parsedUrl = new URL(originalUrl);

          // parsedUrl.hostname 会将 'file:///cdn.example.com/...' 解析为 'cdn.example.com' (或类似)
          const hostname = parsedUrl.hostname;
          const target = CDN_WHITELIST.find(i => typeof i === 'string' ? i === hostname : typeof i[hostname] === 'string')

          if (target) {
            const prefix = typeof target === 'object' && ['http', 'https'].includes(target[hostname]!)
              ? target[hostname] as 'http' | 'https'
              : undefined

            let newUrl = `${prefix}://${hostname}${parsedUrl.pathname}`;

            if (!prefix) {
              // 强制修正为 HTTP 协议，如果无法访问则尝试 https
              newUrl = `http://${hostname}${parsedUrl.pathname}`;
              // ! checkUrlAccessible 可能会导致该资源请求阻塞
              if (!await checkUrlAccessible(newUrl)) {
                newUrl = `https://${hostname}${parsedUrl.pathname}`;
              }
              if (!await checkUrlAccessible(newUrl)) {
                return;
              }
            }

            console.log(`[CDN 修正] 错误: ${originalUrl} -> 修正: ${newUrl}`);

            // 执行重定向
            return { redirectURL: newUrl };
          }
        } catch (error) {
          // 如果 URL 解析失败（例如格式特别奇怪），则跳过重定向
          console.error('URL 解析错误，跳过重定向:', originalUrl, error);
        }
      }
    },
  },
);

app.run()
  .then(() => {
    setupIpc()
  })
  .catch((e) => {
    console.error('Failed to start application:', e);
  })
