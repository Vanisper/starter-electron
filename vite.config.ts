import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from "vite-plugin-electron";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'src/electron/main/index.ts',
        vite: {
          build: { outDir: 'dist-electron/main' }
        }
      },
      {
        entry: 'src/electron/preload/index.ts',
        vite: {
          build: { outDir: 'dist-electron/preload' }
        }
      },
    ]),
  ],
})
