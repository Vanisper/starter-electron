import { app as electronApp } from "electron";
import path from "node:path";
import { Application, setupIpc } from "./modules";
import { getDirname } from "@/electron/utils";

// https://github.com/electron-vite/vite-plugin-electron/issues/258
globalThis.__dirname = getDirname()

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
  }
);

app.run()
  .then(() => {
    setupIpc()
  })
  .catch((e) => {
    console.error('Failed to start application:', e);
  })
