import { useTimer } from '../context/TimerContext';
import { useSettings } from '../context/SettingsContext';
import { getModeColor } from '../types';

export default function SessionCounter() {
  const { sessionsCompleted, mode } = useTimer();
  const { settings } = useSettings();
  const color = getModeColor(mode);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 20px',
      background: 'var(--bg-secondary)',
      borderRadius: 12,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: i < (sessionsCompleted % settings.longBreakInterval) ? color : 'var(--border)',
              transition: 'background var(--transition)',
              boxShadow: i < (sessionsCompleted % settings.longBreakInterval) ? `0 0 8px ${color}66` : 'none',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {sessionsCompleted} / {settings.dailyGoal} today
      </span>
    </div>
  );
}
