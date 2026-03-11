const { ipcRenderer, clipboard } = window.require('electron');

export function onIpc(channel, handler) {
  const wrapper = (_event, ...args) => handler(...args);
  ipcRenderer.on(channel, wrapper);
  return () => ipcRenderer.removeListener(channel, wrapper);
}

export function sendIpc(channel, ...args) {
  ipcRenderer.send(channel, ...args);
}

export function copyToClipboard(text) {
  clipboard.writeText(text);
}
