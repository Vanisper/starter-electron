import { onMounted, onUnmounted, ref } from "vue"

export const useDemo = () => {
  const timer = ref<Date>()
  const clearTimer = window.ipcApi.on('time:update', (time) => {
    timer.value = time
  })

  const clearEvent = window.ipcApi.on('custom:event', (payload) => {
    console.log(payload);
  }, true) // 只监听一次

  onMounted(() => {
    console.log('当前窗口 id', window.ipcApi.invoke('get-window-id').data);
  })

  onUnmounted(() => {
    clearTimer()
    clearEvent()
  })

  const requestFile = async () => {
    const { success, data, message } = await window.ipcApi.invokeAsync('file:read', '测试文件')
    if (!success) {
      return alert('Error - file:read' + (message ? `:${message}.` : '.'))
    }
    alert(data)
  }

  return { timer, requestFile }
}
