# vite-plugin-electron-unified

一个统一的 Vite Electron 插件，提供可配置的构建目标和简化的开发体验。

## 特性

- 🚀 统一的 Electron 开发和构建配置
- 📦 支持多种 Electron 版本和模块格式 (ESM/CJS)
- ⚙️ 灵活的路径和构建配置
- 🔧 集成 electron-builder 支持
- 🎯 TypeScript 完全支持

## 安装

```bash
# TODO: ...
```

## 使用

### 基本用法

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electronUnified from 'vite-plugin-electron-unified';

export default defineConfig({
  plugins: [
    vue(),
    electronUnified({
      config: {
        electron: { root: 'src/electron' },
        renderer: { root: 'src/renderer' }
      }
    }),
  ],
});
```

### 高级配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import electronUnified from 'vite-plugin-electron-unified';

export default defineConfig({
  plugins: [
    electronUnified({
      // 指定 Electron 版本和输出格式
      // ! 这里的 "electron-v22" 是需要提前通过别名方式安装的 electron@22 (这是最后一个支持 windowsw7 的版本）
      // ! electron@28 已经支持 es 构建，但是为了兼容旧版本，默认 cjs；可按需调整
      target: ['electron-v22', 'cjs'],
      // 自定义项目配置
      config: {
        electron: {
          root: 'src/electron',
          dist: 'dist-electron',
          main: {
            root: 'main',
            entry: 'index.ts',
            vite: {
              // 主进程特定的 Vite 配置；例如别名配置
            },
          },
          preload: {
            root: 'preload',
            entry: 'index.ts',
          },
        },
        renderer: {
          root: 'src/renderer',
          dist: 'dist',
          entry: 'index.html',
        }
      },
    }),
  ],
});
```

## API

### PluginOptions

```typescript
interface PluginOptions {
  /**
   * @description Electron 28 版本开始支持 ESM
   * @type [`electron-module-id`, `"cjs" | "es"`]
   */
  target?: TargetElectron;
  
  /**
   * 项目配置
   */
  config?: UserProjectConfig;
}
```

### UserProjectConfig

```typescript
interface UserProjectConfig {
  /**
   * Electron 路径配置
   */
  electron?: Partial<IElectronConfig<true>>;
  
  /**
   * Renderer 路径配置
   */
  renderer?: Partial<IRendererConfig>;
}
```

## 默认配置

```typescript
const defaultConfig = {
  electron: {
    root: 'electron',
    dist: 'dist-electron',
    main: {
      root: 'main',
      entry: 'index.ts',
    },
    preload: {
      root: 'preload',
      entry: 'index.ts',
    },
  },
  renderer: {
    root: 'src',
    dist: 'dist',
    entry: 'index.html',
  },
};
```
