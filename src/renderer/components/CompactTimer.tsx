import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { getModeColor } from '../types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CompactTimer({ onExpandClick }: { onExpandClick: () => void }) {
  const { mode, status, timeLeft, totalTime, start, pause, resume, skip } = useTimer();
  const color = getModeColor(mode);
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  return (
    <div style={{
      height: '100%',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      WebkitAppRegion: 'drag',
      overflow: 'hidden',
    }}>
      {/* Thin progress bar at very top */}
      <div style={{
        width: '100%',
        height: 3,
        background: 'var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: color,
          transition: 'width 1s linear',
        }} />
      </div>

      {/* Single slim row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        padding: '0 12px',
      }}>
        {/* Mode dot */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}88`,
          flexShrink: 0,
        }} />

        {/* Time */}
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          flex: 1,
        }}>
          {formatTime(timeLeft)}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' }}>
          {status === 'idle' && (
            <button onClick={start} style={btnStyle(color)} title="Start">
              <Play size={14} fill="white" />
            </button>
          )}
          {status === 'running' && (
            <button onClick={pause} style={btnStyle(color)} title="Pause">
              <Pause size={14} fill="white" />
            </button>
          )}
          {status === 'paused' && (
            <button onClick={resume} style={btnStyle(color)} title="Resume">
              <Play size={14} fill="white" />
            </button>
          )}
          <button onClick={skip} style={btnStyle()} title="Skip">
            <SkipForward size={13} />
          </button>
          <button onClick={onExpandClick} style={btnStyle()} title="Full View">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg?: string): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg || 'var(--bg-card)',
    color: bg ? '#fff' : 'var(--text-secondary)',
    border: bg ? 'none' : '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  };
}
