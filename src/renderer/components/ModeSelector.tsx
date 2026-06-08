import { TimerMode, getModeColor, getModeLabel } from '../types';

interface ModeSelectorProps {
  currentMode: TimerMode;
  onChange: (mode: TimerMode) => void;
  disabled?: boolean;
}

const modes: TimerMode[] = ['work', 'shortBreak', 'longBreak'];

export default function ModeSelector({ currentMode, onChange, disabled }: ModeSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      background: 'var(--bg-secondary)',
      borderRadius: 12,
      padding: 4,
    }}>
      {modes.map(m => {
        const isActive = m === currentMode;
        const color = getModeColor(m);
        return (
          <button
            key={m}
            onClick={() => !disabled && onChange(m)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: isActive ? color + '22' : 'transparent',
              color: isActive ? color : 'var(--text-muted)',
              border: isActive ? `1px solid ${color}44` : '1px solid transparent',
              transition: 'all var(--transition)',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {getModeLabel(m)}
          </button>
        );
      })}
    </div>
  );
}
