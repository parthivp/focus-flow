/// <reference types="vite/client" />

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

interface ElectronAPI {
  db: {
    getSessions: (filter?: { startDate?: string; endDate?: string }) => Promise<any[]>;
    saveSession: (session: any) => Promise<any>;
    getSettings: () => Promise<any>;
    saveSettings: (settings: any) => Promise<void>;
    getTasks: () => Promise<any[]>;
    saveTask: (task: any) => Promise<any>;
    deleteTask: (id: number) => Promise<void>;
    exportData: (format: 'csv' | 'json') => Promise<string>;
  };
  app: {
    notify: (title: string, body: string) => void;
    setAlwaysOnTop: (value: boolean) => void;
    minimize: () => void;
    close: () => void;
    playSound: (sound: 'work' | 'break') => void;
  };
}

interface Window {
  electronAPI: ElectronAPI;
}
