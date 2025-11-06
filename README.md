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
```
``` json
// tsconfig.app.json
{
  // ...
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
    },
    // ...
  },
  // ...
}
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

### electron-builder config

``` json5
// electron-builder.json5
{
  "$schema": "https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json",
  // "appId": "com.electron.${name}",
  "productName": "starter-electron",
  "directories": {
    "output": "release/${version}",
    "buildResources": "build"
  },
  "files": [
    "dist",
    "dist-electron"
  ],
  "asar": true,
  "compression": "maximum",
  "mac": {
    "target": [ "dmg" ],
    "artifactName": "${productName}-Mac-${version}-Installer.${ext}"
  },
  "linux": {
    "target": [ "AppImage" ],
    "artifactName": "${productName}-Linux-${version}.${ext}"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": [ "x64", "ia32", "universal" ]
      }
    ],
    "artifactName": "${productName}-Windows-${version}-Setup.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "allowElevation": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": null,
    "uninstallDisplayName": "${productName} ${version}",
    "runAfterFinish": false,
    "include": "build/installer.nsh",
    "perMachine": false,
    "deleteAppDataOnUninstall": false
  }
}
```
``` json
// package.json
{
  // ...
  "build:electron": "vue-tsc -b && vite build && electron-builder",
  // ...
}
```
