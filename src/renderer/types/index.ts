export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export type SoundChoice = 'radar' | 'beacon' | 'chime' | 'bell' | 'alarm' | 'digital';

export interface Settings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  dailyGoal: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  alwaysOnTop: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  soundType: SoundChoice;
  soundVolume: number;
}

export interface PomodoroSession {
  id?: number;
  taskName: string;
  mode: TimerMode;
  duration: number;
  completedAt: string;
  date: string;
}

export interface Task {
  id?: number;
  name: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: string;
  isActive: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dailyGoal: 8,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  alwaysOnTop: false,
  soundEnabled: true,
  notificationsEnabled: true,
  soundType: 'alarm' as SoundChoice,
  soundVolume: 80,
};

export function getModeColor(mode: TimerMode): string {
  switch (mode) {
    case 'work': return 'var(--accent-work)';
    case 'shortBreak': return 'var(--accent-short-break)';
    case 'longBreak': return 'var(--accent-long-break)';
  }
}

export function getModeGlow(mode: TimerMode): string {
  switch (mode) {
    case 'work': return 'var(--accent-work-glow)';
    case 'shortBreak': return 'var(--accent-short-break-glow)';
    case 'longBreak': return 'var(--accent-long-break-glow)';
  }
}

export function getModeLabel(mode: TimerMode): string {
  switch (mode) {
    case 'work': return 'Focus';
    case 'shortBreak': return 'Short Break';
    case 'longBreak': return 'Long Break';
  }
}
