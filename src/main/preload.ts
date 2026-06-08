import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  app: {
    notify: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
    setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('set-always-on-top', value),
    minimize: () => ipcRenderer.invoke('minimize-window'),
    close: () => ipcRenderer.invoke('close-window'),
  },
});
