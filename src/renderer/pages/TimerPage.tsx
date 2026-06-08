import { useTimer } from '../context/TimerContext';
import { getModeColor, getModeLabel } from '../types';
import ProgressRing from '../components/ProgressRing';
import TimerControls from '../components/TimerControls';
import ModeSelector from '../components/ModeSelector';
import TaskInput from '../components/TaskInput';
import SessionCounter from '../components/SessionCounter';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TimerPage() {
  const { mode, status, timeLeft, totalTime } = useTimer();
  const progress = totalTime > 0 ? timeLeft / totalTime : 1;
  const color = getModeColor(mode);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 32,
    }}>
      <ModeSelector
        currentMode={mode}
        onChange={() => {}}
        disabled={status !== 'idle'}
      />

      <ProgressRing progress={progress} mode={mode} size={320}>
        <span style={{
          fontSize: 56,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-primary)',
          letterSpacing: '-2px',
        }}>
          {formatTime(timeLeft)}
        </span>
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color,
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          {getModeLabel(mode)}
        </span>
      </ProgressRing>

      <TimerControls />
      <TaskInput />
      <SessionCounter />
    </div>
  );
}
