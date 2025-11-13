import type { IpcApi } from "@/shared/types.ipc";

declare global {
  interface Window {
    ipcApi: IpcApi
  }
}
