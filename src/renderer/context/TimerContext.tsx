import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { TimerMode, TimerStatus, PomodoroSession } from '../types';
import { useSettings } from './SettingsContext';

interface TimerContextType {
  mode: TimerMode;
  status: TimerStatus;
  timeLeft: number;
  totalTime: number;
  sessionsCompleted: number;
  currentTask: string;
  sessions: PomodoroSession[];
  setCurrentTask: (task: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  refreshSessions: () => void;
}

const TimerContext = createContext<TimerContextType>(null!);

export function useTimer() {
  return useContext(TimerContext);
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [mode, setMode] = useState<TimerMode>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  const intervalRef = useRef<number | null>(null);
  const activeSessionIdRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);
  const saveIntervalRef = useRef<number | null>(null);

  const getDuration = useCallback((m: TimerMode) => {
    switch (m) {
      case 'work': return settings.workDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const totalTime = getDuration(mode);

  // Load sessions from DB on mount
  const refreshSessions = useCallback(async () => {
    if (window.electronAPI?.db) {
      const rows = await window.electronAPI.db.getSessions();
      setSessions(rows.map((r: any) => ({
        id: r.id,
        taskName: r.task_name,
        mode: r.mode as TimerMode,
        duration: r.actual_duration,
        completedAt: r.completed_at || r.started_at,
        date: r.date,
      })));
    } else {
      const saved = localStorage.getItem('focus-flow-sessions');
      if (saved) setSessions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Load today's completed count
  useEffect(() => {
    if (window.electronAPI?.db) {
      const today = new Date().toISOString().split('T')[0];
      window.electronAPI.db.getStats(today, today).then((stats: any) => {
        if (stats) setSessionsCompleted(stats.completed_pomodoros || 0);
      });
    }
  }, []);

  useEffect(() => {
    if (status === 'idle') {
      setTimeLeft(getDuration(mode));
    }
  }, [settings, mode, status, getDuration]);

  // Save progress to DB every 30 seconds while running
  const saveProgress = useCallback(() => {
    if (activeSessionIdRef.current && window.electronAPI?.db) {
      window.electronAPI.db.updateProgress(activeSessionIdRef.current, elapsedRef.current);
    }
  }, []);

  const startDbSession = useCallback(async () => {
    if (window.electronAPI?.db) {
      const id = await window.electronAPI.db.startSession(
        currentTask || 'Untitled',
        mode,
        getDuration(mode)
      );
      activeSessionIdRef.current = id;
    }
    elapsedRef.current = 0;

    // Periodic save every 30 seconds
    saveIntervalRef.current = window.setInterval(() => {
      saveProgress();
    }, 30000);
  }, [currentTask, mode, getDuration, saveProgress]);

  const completeDbSession = useCallback(async () => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    if (activeSessionIdRef.current && window.electronAPI?.db) {
      await window.electronAPI.db.completeSession(activeSessionIdRef.current, elapsedRef.current);
      activeSessionIdRef.current = null;
      refreshSessions();
    } else {
      // Fallback to localStorage
      const now = new Date();
      const session: PomodoroSession = {
        taskName: currentTask || 'Untitled',
        mode,
        duration: elapsedRef.current,
        completedAt: now.toISOString(),
        date: now.toISOString().split('T')[0],
      };
      setSessions(prev => {
        const next = [session, ...prev];
        localStorage.setItem('focus-flow-sessions', JSON.stringify(next));
        return next;
      });
    }
  }, [currentTask, mode, refreshSessions]);

  const saveAndCloseSession = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    if (activeSessionIdRef.current && window.electronAPI?.db && elapsedRef.current > 0) {
      window.electronAPI.db.updateProgress(activeSessionIdRef.current, elapsedRef.current);
    }
    activeSessionIdRef.current = null;
  }, []);

  // Save progress on page unload (user closes/hides window)
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveAndCloseSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveAndCloseSession]);

  const moveToNext = useCallback(async () => {
    await completeDbSession();

    if (mode === 'work') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);

      if (settings.notificationsEnabled) {
        try { new Notification('Focus Flow', { body: 'Great work! Time for a break.' }); } catch {}
      }

      if (newCount % settings.longBreakInterval === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
      }

      if (settings.autoStartBreaks) {
        setStatus('running');
      } else {
        setStatus('idle');
      }
    } else {
      if (settings.notificationsEnabled) {
        try { new Notification('Focus Flow', { body: 'Break is over. Ready to focus?' }); } catch {}
      }

      setMode('work');
      setTimeLeft(settings.workDuration * 60);

      if (settings.autoStartPomodoros) {
        setStatus('running');
      } else {
        setStatus('idle');
      }
    }
  }, [mode, sessionsCompleted, settings, completeDbSession]);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            moveToNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, moveToNext]);

  const start = async () => {
    await startDbSession();
    setStatus('running');
  };

  const pause = () => {
    setStatus('paused');
    saveProgress();
  };

  const resume = () => {
    setStatus('running');
  };

  const reset = () => {
    setStatus('idle');
    saveAndCloseSession();
    elapsedRef.current = 0;
    setTimeLeft(getDuration(mode));
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const skip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    moveToNext();
  };

  // Sync timer state to Electron tray
  useEffect(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    window.electronAPI?.app.updateTimerState({ status, mode, timeLeft: formatted });
  }, [timeLeft, status, mode]);

  // Listen for tray commands
  useEffect(() => {
    window.electronAPI?.app.onTrayToggleTimer(() => {
      if (status === 'idle') start();
      else if (status === 'running') pause();
      else if (status === 'paused') resume();
    });
    window.electronAPI?.app.onTraySkip(() => {
      skip();
    });
  }, [status]);

  return (
    <TimerContext.Provider value={{
      mode, status, timeLeft, totalTime,
      sessionsCompleted, currentTask, sessions,
      setCurrentTask, start, pause, resume, reset, skip, refreshSessions,
    }}>
      {children}
    </TimerContext.Provider>
  );
}
