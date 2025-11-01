# starter-electron

- [Electron](https://www.electronjs.org)
- [Vue3](https://vuejs.org)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev): use `rolldown-vite@7`

The current project initial template is created by:
``` shell
bun create vite starter-electron --template vue-ts
```

## Integrated Electron

### install `electron` & `electron-builder`
```shell
bun add electron electron-builder -D
```

### vite-plugin-electron
#### 1. install
```shell
bun add vite-plugin-electron -D
```
#### 2. basic file-tree
```shell
src
├── electron
│   ├── main
│   │   └── index.ts
│   └── preload
│       └── index.ts
└── renderer
    ├── App.vue
    ├── assets
    │   └── vue.svg
    ├── components
    │   └── HelloWorld.vue
    ├── main.ts
    └── style.css
```
#### 3. basic config
``` js
// vite.config.*
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
```
``` json
// package.json
{
  // ...
  "main": "dist-electron/main/index.js",
  // ...
}
```
``` html
<!-- index.html -->
<!-- ... -->
<script type="module" src="/src/renderer/main.ts"></script>
<!-- ... -->
```

> Now, you can try running `bun dev`.
