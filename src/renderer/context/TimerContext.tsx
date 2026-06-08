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
  const [sessions, setSessions] = useState<PomodoroSession[]>(() => {
    const saved = localStorage.getItem('focus-flow-sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const getDuration = useCallback((m: TimerMode) => {
    switch (m) {
      case 'work': return settings.workDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const totalTime = getDuration(mode);

  useEffect(() => {
    if (status === 'idle') {
      setTimeLeft(getDuration(mode));
    }
  }, [settings, mode, status, getDuration]);

  const saveSession = useCallback((m: TimerMode) => {
    const now = new Date();
    const session: PomodoroSession = {
      taskName: currentTask || 'Untitled',
      mode: m,
      duration: getDuration(m),
      completedAt: now.toISOString(),
      date: now.toISOString().split('T')[0],
    };
    setSessions(prev => {
      const next = [...prev, session];
      localStorage.setItem('focus-flow-sessions', JSON.stringify(next));
      return next;
    });
  }, [currentTask, getDuration]);

  const moveToNext = useCallback(() => {
    if (mode === 'work') {
      saveSession('work');
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
      saveSession(mode);

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
  }, [mode, sessionsCompleted, settings, saveSession]);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
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

  const start = () => {
    setStatus('running');
    startTimeRef.current = Date.now();
  };

  const pause = () => {
    setStatus('paused');
    pausedTimeRef.current = Date.now();
  };

  const resume = () => {
    setStatus('running');
  };

  const reset = () => {
    setStatus('idle');
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
      setCurrentTask, start, pause, resume, reset, skip,
    }}>
      {children}
    </TimerContext.Provider>
  );
}
