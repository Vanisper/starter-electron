import { defineConfig, type AliasOptions } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';

import { createElectronPlugins } from './electron.config';

/** electron 别名模块配置 */
const VITE_TARGET_ELECTRON = process.env['VITE_TARGET_ELECTRON'];
const [customName, customFormat, ..._rest] = VITE_TARGET_ELECTRON ? VITE_TARGET_ELECTRON.split(',') : []

const alias: AliasOptions = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: { alias },
  plugins: [
    vue(),
    createElectronPlugins({
      // @ts-ignore
      target: [customName, customFormat],
      config: {
        electron: {
          root: 'src/electron',
          vite: { resolve: { alias } }
        },
        renderer: { root: 'src/renderer' }
      }
    }),
  ],
})
