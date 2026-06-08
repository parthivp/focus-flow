/// <reference types="vite/client" />

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

interface ElectronAPI {
  app: {
    notify: (title: string, body: string) => void;
    setAlwaysOnTop: (value: boolean) => void;
    minimize: () => void;
    close: () => void;
    toggleCompact: () => Promise<boolean>;
    getCompactState: () => Promise<boolean>;
    updateTimerState: (state: { status: string; mode: string; timeLeft: string }) => void;
    onCompactModeChanged: (callback: (isCompact: boolean) => void) => void;
    onTrayToggleTimer: (callback: () => void) => void;
    onTraySkip: (callback: () => void) => void;
    onToggleCompact: (callback: () => void) => void;
  };
  db: {
    startSession: (taskName: string, mode: string, plannedDuration: number) => Promise<number>;
    updateProgress: (id: number, elapsedSeconds: number) => Promise<void>;
    completeSession: (id: number, elapsedSeconds: number) => Promise<void>;
    getSessions: (startDate?: string, endDate?: string) => Promise<any[]>;
    getStats: (startDate: string, endDate: string) => Promise<any>;
    getDailyStats: (startDate: string, endDate: string) => Promise<any[]>;
    getHourlyStats: () => Promise<any[]>;
    getTaskBreakdown: (startDate?: string, endDate?: string) => Promise<any[]>;
    getStreak: () => Promise<number>;
    getSettings: () => Promise<Record<string, string>>;
    setSetting: (key: string, value: string) => Promise<void>;
    exportData: (format: 'csv' | 'json') => Promise<string>;
    getDbPath: () => Promise<string>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
