import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { getModeColor, getModeLabel } from '../types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CompactTimer({ onExpandClick }: { onExpandClick: () => void }) {
  const { mode, status, timeLeft, totalTime, start, pause, resume, skip, sessionsCompleted, currentTask } = useTimer();
  const color = getModeColor(mode);
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  return (
    <div style={{
      height: '100%',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 16px 12px',
      WebkitAppRegion: 'drag',
    }}>
      {/* Progress bar at top */}
      <div style={{
        width: '100%',
        height: 3,
        background: 'var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8,
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
          transition: 'width 1s linear',
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>

      {/* Main row: timer + controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        WebkitAppRegion: 'no-drag',
      }}>
        {/* Time display */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-primary)',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: 2,
          }}>
            {getModeLabel(mode)}
            {currentTask && (
              <span style={{ color: 'var(--text-muted)', marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                — {currentTask}
              </span>
            )}
          </div>
        </div>

        {/* Session dots */}
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i < (sessionsCompleted % 4) ? color : 'var(--border)',
                  boxShadow: i < (sessionsCompleted % 4) ? `0 0 4px ${color}66` : 'none',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{sessionsCompleted}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          {status === 'idle' && (
            <button onClick={start} style={btnStyle(color)} title="Start">
              <Play size={16} fill="white" />
            </button>
          )}
          {status === 'running' && (
            <button onClick={pause} style={btnStyle(color)} title="Pause">
              <Pause size={16} fill="white" />
            </button>
          )}
          {status === 'paused' && (
            <button onClick={resume} style={btnStyle(color)} title="Resume">
              <Play size={16} fill="white" />
            </button>
          )}
          <button onClick={skip} style={btnStyle()} title="Skip">
            <SkipForward size={14} />
          </button>
          <button onClick={onExpandClick} style={btnStyle()} title="Full View">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg?: string): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg || 'var(--bg-card)',
    color: bg ? '#fff' : 'var(--text-secondary)',
    border: bg ? 'none' : '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
}
