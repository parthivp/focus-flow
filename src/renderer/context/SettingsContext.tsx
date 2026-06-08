import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings, DEFAULT_SETTINGS } from '../types';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType>(null!);

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function load() {
      if (window.electronAPI?.db) {
        const stored = await window.electronAPI.db.getSettings();
        if (stored.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored.settings) });
        }
      } else {
        const saved = localStorage.getItem('focus-flow-settings');
        if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    }
    load();
  }, []);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (window.electronAPI?.db) {
        window.electronAPI.db.setSetting('settings', JSON.stringify(next));
      } else {
        localStorage.setItem('focus-flow-settings', JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
