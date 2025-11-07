import { app as electronApp } from "electron";
import path from "node:path";
import { Application, ipcManager, setupIpc } from "./modules";

// https://github.com/electron-vite/vite-plugin-electron/issues/258
const __dirname = path.dirname(new URL(import.meta.url).pathname)

const app = new Application(
  electronApp,
  {
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    }
  },
  {
    devUrl: process.env.VITE_DEV_SERVER_URL,
    prodFile: path.join(__dirname, '../../dist/index.html'),
  },
  {
    // 系统物理的关闭按钮会触发此处
    onWindowClose(event, window) {
      event.preventDefault()
      ipcManager.sendToWindow(window.id, 'app:quit')
    },
  }
);

app.run()
  .then(() => {
    setupIpc()
  })
  .catch((e) => {
    console.error('Failed to start application:', e);
  })
