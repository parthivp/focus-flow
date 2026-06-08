import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { getModeColor } from '../types';

export default function TimerControls() {
  const { status, mode, start, pause, resume, reset, skip } = useTimer();
  const color = getModeColor(mode);

  const buttonStyle = (primary?: boolean): React.CSSProperties => ({
    width: primary ? 64 : 48,
    height: primary ? 64 : 48,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: primary ? color : 'var(--bg-card)',
    color: primary ? '#fff' : 'var(--text-secondary)',
    border: primary ? 'none' : '1px solid var(--border)',
    transition: 'all var(--transition)',
    boxShadow: primary ? `0 4px 20px ${color}44` : 'none',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button onClick={reset} style={buttonStyle()} title="Reset">
        <RotateCcw size={20} />
      </button>

      {status === 'idle' && (
        <button onClick={start} style={buttonStyle(true)} title="Start">
          <Play size={28} fill="white" />
        </button>
      )}
      {status === 'running' && (
        <button onClick={pause} style={buttonStyle(true)} title="Pause">
          <Pause size={28} fill="white" />
        </button>
      )}
      {status === 'paused' && (
        <button onClick={resume} style={buttonStyle(true)} title="Resume">
          <Play size={28} fill="white" />
        </button>
      )}

      <button onClick={skip} style={buttonStyle()} title="Skip">
        <SkipForward size={20} />
      </button>
    </div>
  );
}
