import { onUnmounted } from "vue"

export const useAppQuit = () => {
  const clear = window.ipcApi.on('app:quit', () => {
    if (confirm('确认关闭？')) {
      window.ipcApi.send('app:quit-confirm')
    }
  })

  const requestQuit = () => {
    window.ipcApi.send('app:quit')
  }

  onUnmounted(() => {
    clear()
  })

  return { requestQuit }
}
