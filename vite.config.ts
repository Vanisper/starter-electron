import { defineConfig, type AliasOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from "vite-plugin-electron";
import { fileURLToPath } from 'node:url';

const alias: AliasOptions = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: { alias },
  plugins: [
    vue(),
    electron([
      {
        entry: 'src/electron/main/index.ts',
        vite: {
          build: { outDir: 'dist-electron/main' },
          resolve: { alias },
        }
      },
      {
        entry: 'src/electron/preload/index.ts',
        vite: {
          build: { outDir: 'dist-electron/preload' },
          resolve: { alias },
        }
      },
    ]),
  ],
})
