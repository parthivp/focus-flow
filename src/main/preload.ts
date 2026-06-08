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
  db: {
    startSession: (taskName: string, mode: string, plannedDuration: number) =>
      ipcRenderer.invoke('db-start-session', taskName, mode, plannedDuration),
    updateProgress: (id: number, elapsedSeconds: number) =>
      ipcRenderer.invoke('db-update-progress', id, elapsedSeconds),
    completeSession: (id: number, elapsedSeconds: number) =>
      ipcRenderer.invoke('db-complete-session', id, elapsedSeconds),
    getSessions: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db-get-sessions', startDate, endDate),
    getStats: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db-get-stats', startDate, endDate),
    getDailyStats: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db-get-daily-stats', startDate, endDate),
    getHourlyStats: () => ipcRenderer.invoke('db-get-hourly-stats'),
    getTaskBreakdown: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db-get-task-breakdown', startDate, endDate),
    getStreak: () => ipcRenderer.invoke('db-get-streak'),
    getSettings: () => ipcRenderer.invoke('db-get-settings'),
    setSetting: (key: string, value: string) => ipcRenderer.invoke('db-set-setting', key, value),
    exportData: (format: 'csv' | 'json') => ipcRenderer.invoke('db-export', format),
    getDbPath: () => ipcRenderer.invoke('db-get-path'),
  },
});
