import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  app: {
    notify: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
    setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('set-always-on-top', value),
    minimize: () => ipcRenderer.invoke('minimize-window'),
    close: () => ipcRenderer.invoke('close-window'),
    toggleCompact: () => ipcRenderer.invoke('toggle-compact'),
    getCompactState: () => ipcRenderer.invoke('get-compact-state'),
    updateTimerState: (state: { status: string; mode: string; timeLeft: string }) =>
      ipcRenderer.send('timer-state-update', state),
    onCompactModeChanged: (callback: (isCompact: boolean) => void) => {
      ipcRenderer.on('compact-mode-changed', (_, val) => callback(val));
    },
    onTrayToggleTimer: (callback: () => void) => {
      ipcRenderer.on('tray-toggle-timer', () => callback());
    },
    onTraySkip: (callback: () => void) => {
      ipcRenderer.on('tray-skip', () => callback());
    },
    onToggleCompact: (callback: () => void) => {
      ipcRenderer.on('toggle-compact', () => callback());
    },
  },
});
