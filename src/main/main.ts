import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as db from './database';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isCompact = false;
let timerState = { status: 'idle', mode: 'work', timeLeft: '25:00' };

const isDev = !app.isPackaged;

const FULL_SIZE = { width: 900, height: 680, minWidth: 750, minHeight: 550 };
const COMPACT_SIZE = { width: 320, height: 140, minWidth: 320, minHeight: 140 };

function getTrayIcon(): Electron.NativeImage {
  const iconPath = isDev
    ? path.join(__dirname, '../../build/tray-icon.png')
    : path.join(process.resourcesPath, 'build/tray-icon.png');
  try {
    return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    return nativeImage.createEmpty();
  }
}

function getAppIcon(): Electron.NativeImage {
  const iconPath = isDev
    ? path.join(__dirname, '../../build/icon.png')
    : path.join(process.resourcesPath, 'build/icon.png');
  try {
    return nativeImage.createFromPath(iconPath);
  } catch {
    return nativeImage.createEmpty();
  }
}

function updateTray() {
  if (!tray) return;

  const colors: Record<string, string> = {
    work: '#ff6b6b',
    shortBreak: '#4ecdc4',
    longBreak: '#a78bfa',
  };
  const statusLabels: Record<string, string> = {
    idle: 'Ready',
    running: 'Running',
    paused: 'Paused',
  };

  const color = colors[timerState.mode] || '#ff6b6b';
  const statusDot = timerState.status === 'running' ? '▶' : timerState.status === 'paused' ? '⏸' : '⏹';

  tray.setToolTip(`Focus Flow ${statusDot} ${timerState.timeLeft} — ${statusLabels[timerState.status]}`);

  try {
    tray.setImage(getTrayIcon());
  } catch {}

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `${statusDot} ${timerState.timeLeft} — ${statusLabels[timerState.status]}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: timerState.status === 'running' ? 'Pause' : timerState.status === 'paused' ? 'Resume' : 'Start',
      click: () => mainWindow?.webContents.send('tray-toggle-timer'),
    },
    {
      label: 'Skip',
      click: () => mainWindow?.webContents.send('tray-skip'),
    },
    { type: 'separator' },
    {
      label: isCompact ? 'Full View' : 'Compact View',
      click: () => {
        mainWindow?.webContents.send('toggle-compact');
      },
    },
    {
      label: 'Show Window',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        tray?.destroy();
        tray = null;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    ...FULL_SIZE,
    icon: getAppIcon(),
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a1a2e',
      symbolColor: '#8888aa',
      height: 36,
    },
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = getTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('Focus Flow');

  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  updateTray();
}

function switchToCompact() {
  if (!mainWindow || isCompact) return;
  isCompact = true;

  const display = screen.getPrimaryDisplay();
  const { width: screenW } = display.workAreaSize;

  mainWindow.setMinimumSize(COMPACT_SIZE.minWidth, COMPACT_SIZE.minHeight);
  mainWindow.setSize(COMPACT_SIZE.width, COMPACT_SIZE.height);
  mainWindow.setPosition(screenW - COMPACT_SIZE.width - 20, 20);
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setResizable(false);

  try {
    mainWindow.setTitleBarOverlay({
      color: '#0f0f1a',
      symbolColor: '#8888aa',
      height: 28,
    });
  } catch {}

  mainWindow.webContents.send('compact-mode-changed', true);
  updateTray();
}

function switchToFull() {
  if (!mainWindow || !isCompact) return;
  isCompact = false;

  mainWindow.setAlwaysOnTop(false);
  mainWindow.setResizable(true);
  mainWindow.setMinimumSize(FULL_SIZE.minWidth, FULL_SIZE.minHeight);
  mainWindow.setSize(FULL_SIZE.width, FULL_SIZE.height);
  mainWindow.center();

  try {
    mainWindow.setTitleBarOverlay({
      color: '#1a1a2e',
      symbolColor: '#8888aa',
      height: 36,
    });
  } catch {}

  mainWindow.webContents.send('compact-mode-changed', false);
  updateTray();
}

app.whenReady().then(() => {
  db.initDatabase();
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('set-always-on-top', (_, value: boolean) => {
  if (!isCompact) mainWindow?.setAlwaysOnTop(value);
});

ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.handle('close-window', () => {
  mainWindow?.hide();
});

ipcMain.handle('show-notification', (_, title: string, body: string) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('toggle-compact', () => {
  if (isCompact) {
    switchToFull();
  } else {
    switchToCompact();
  }
  return isCompact;
});

ipcMain.handle('get-compact-state', () => {
  return isCompact;
});

ipcMain.on('timer-state-update', (_, state: { status: string; mode: string; timeLeft: string }) => {
  timerState = state;
  updateTray();
});

// --- Database IPC ---

ipcMain.handle('db-start-session', (_, taskName: string, mode: string, plannedDuration: number) => {
  return db.startSession(taskName, mode, plannedDuration);
});

ipcMain.handle('db-update-progress', (_, id: number, elapsedSeconds: number) => {
  db.updateSessionProgress(id, elapsedSeconds);
});

ipcMain.handle('db-complete-session', (_, id: number, elapsedSeconds: number) => {
  db.completeSession(id, elapsedSeconds);
});

ipcMain.handle('db-get-sessions', (_, startDate?: string, endDate?: string) => {
  return db.getSessions(startDate, endDate);
});

ipcMain.handle('db-get-stats', (_, startDate: string, endDate: string) => {
  return db.getStats(startDate, endDate);
});

ipcMain.handle('db-get-daily-stats', (_, startDate: string, endDate: string) => {
  return db.getDailyStats(startDate, endDate);
});

ipcMain.handle('db-get-hourly-stats', () => {
  return db.getHourlyStats();
});

ipcMain.handle('db-get-task-breakdown', (_, startDate?: string, endDate?: string) => {
  return db.getTaskBreakdown(startDate, endDate);
});

ipcMain.handle('db-get-streak', () => {
  return db.getStreak();
});

ipcMain.handle('db-get-settings', () => {
  return db.getAllSettings();
});

ipcMain.handle('db-set-setting', (_, key: string, value: string) => {
  db.setSetting(key, value);
});

ipcMain.handle('db-export', (_, format: 'csv' | 'json') => {
  return db.exportAllData(format);
});

ipcMain.handle('db-get-path', () => {
  return db.getDbPath();
});

app.on('before-quit', () => {
  db.closeDatabase();
});
