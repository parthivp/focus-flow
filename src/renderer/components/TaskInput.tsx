import { useState } from 'react';
import { Target } from 'lucide-react';
import { useTimer } from '../context/TimerContext';

export default function TaskInput() {
  const { currentTask, setCurrentTask, status } = useTimer();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing || !currentTask) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        padding: '8px 12px',
        border: '1px solid var(--border)',
        maxWidth: 280,
      }}>
        <Target size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="What are you working on?"
          value={currentTask}
          onChange={e => setCurrentTask(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={e => e.key === 'Enter' && setIsEditing(false)}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => status === 'idle' && setIsEditing(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        padding: '8px 12px',
        color: 'var(--text-secondary)',
        fontSize: 14,
        border: '1px solid var(--border)',
        cursor: status === 'idle' ? 'pointer' : 'default',
      }}
    >
      <Target size={16} />
      {currentTask}
    </button>
  );
}
