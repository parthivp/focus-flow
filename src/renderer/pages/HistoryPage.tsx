import { useMemo, useState, useEffect } from 'react';
import { History, Download, Calendar, Database } from 'lucide-react';
import { getModeColor, getModeLabel, TimerMode } from '../types';

interface SessionRow {
  id: number;
  task_name: string;
  mode: string;
  planned_duration: number;
  actual_duration: number;
  completed: number;
  started_at: string;
  completed_at: string | null;
  date: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'work' | 'break'>('all');
  const [dbPath, setDbPath] = useState('');

  useEffect(() => {
    async function load() {
      if (window.electronAPI?.db) {
        const rows = await window.electronAPI.db.getSessions();
        setSessions(rows);
        const p = await window.electronAPI.db.getDbPath();
        setDbPath(p);
      }
    }
    load();
  }, []);

  const filteredSessions = useMemo(() => {
    if (filter === 'work') return sessions.filter(s => s.mode === 'work');
    if (filter === 'break') return sessions.filter(s => s.mode !== 'work');
    return sessions;
  }, [sessions, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SessionRow[]>();
    filteredSessions.forEach(s => {
      const existing = groups.get(s.date) || [];
      existing.push(s);
      groups.set(s.date, existing);
    });
    return Array.from(groups.entries());
  }, [filteredSessions]);

  const exportData = async (format: 'csv' | 'json') => {
    let content: string;
    if (window.electronAPI?.db) {
      content = await window.electronAPI.db.exportData(format);
    } else {
      content = format === 'json' ? JSON.stringify(sessions, null, 2) : '';
    }
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-flow-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.round(seconds / 60);
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}m`;
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <History size={24} color="var(--text-muted)" />
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>History</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => exportData('csv')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 13,
            }}
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => exportData('json')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 13,
            }}
          >
            <Download size={14} /> JSON
          </button>
        </div>
      </div>

      {dbPath && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8, marginBottom: 16,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text-muted)',
        }}>
          <Database size={12} />
          Stored at: {dbPath}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', borderRadius: 8, padding: 4 }}>
        {(['all', 'work', 'break'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: filter === f ? 'var(--bg-hover)' : 'transparent',
              color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, color: 'var(--text-muted)',
        }}>
          <Calendar size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p>No sessions yet. Start your first pomodoro!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h3 style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8,
              }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en', {
                  weekday: 'long', month: 'short', day: 'numeric',
                })}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((s) => {
                  const modeColor = getModeColor(s.mode as TimerMode);
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px', borderRadius: 8,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: modeColor,
                        boxShadow: `0 0 6px ${modeColor}66`,
                      }} />
                      <span style={{ flex: 1, fontSize: 14 }}>{s.task_name}</span>
                      <span style={{
                        fontSize: 12, color: modeColor, fontWeight: 600,
                        padding: '2px 8px', borderRadius: 4,
                        background: modeColor + '15',
                      }}>
                        {getModeLabel(s.mode as TimerMode)}
                      </span>
                      <span style={{ fontSize: 12, color: s.completed ? 'var(--text-secondary)' : '#feca57', fontWeight: 600 }}>
                        {formatDuration(s.actual_duration)}
                        {!s.completed && ' ⚡'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(s.started_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
