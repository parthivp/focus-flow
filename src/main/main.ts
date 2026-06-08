import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isCompact = false;
let timerState = { status: 'idle', mode: 'work', timeLeft: '25:00' };

const isDev = !app.isPackaged;

const FULL_SIZE = { width: 900, height: 680, minWidth: 750, minHeight: 550 };
const COMPACT_SIZE = { width: 320, height: 140, minWidth: 320, minHeight: 140 };

function createTrayIcon(color: string = '#ff6b6b'): Electron.NativeImage {
  const size = 16;
  const canvas = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="none" stroke="${color}" stroke-width="2"/>
      <circle cx="8" cy="8" r="3" fill="${color}"/>
    </svg>`;
  return nativeImage.createFromBuffer(
    Buffer.from(canvas),
    { width: size, height: size }
  );
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
    tray.setImage(createTrayIcon(color));
  } catch {
    // SVG tray icons may not work on all platforms; fallback handled below
  }

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
  let icon: Electron.NativeImage;
  try {
    icon = createTrayIcon('#ff6b6b');
  } catch {
    icon = nativeImage.createEmpty();
  }
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
