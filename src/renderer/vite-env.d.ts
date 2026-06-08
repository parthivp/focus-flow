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
}

interface Window {
  electronAPI?: ElectronAPI;
}
