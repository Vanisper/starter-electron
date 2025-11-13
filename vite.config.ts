import { defineConfig, type AliasOptions } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';
import electronUnified from 'vite-plugin-electron-unified';

/** electron 别名模块配置 */
const VITE_TARGET_ELECTRON = process.env['VITE_TARGET_ELECTRON'];
const [customName, customFormat, ..._rest] = VITE_TARGET_ELECTRON ? VITE_TARGET_ELECTRON.split(',') : []

const alias: AliasOptions = {
  "@": fileURLToPath(new URL("./apps", import.meta.url)),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    electronUnified({
      // @ts-ignore
      target: [customName, customFormat],
      config: {
        renderer: {
          root: 'apps/renderer',
          vite: {
            resolve: { alias },
            plugins: [vue()],
          }
        },
        electron: {
          root: 'apps/electron',
          vite: { resolve: { alias } }
        },
      }
    }),
  ],
})
