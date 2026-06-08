import { useMemo, useState } from 'react';
import { History, Download, Calendar } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { getModeColor, getModeLabel } from '../types';

export default function HistoryPage() {
  const { sessions } = useTimer();
  const [filter, setFilter] = useState<'all' | 'work' | 'break'>('all');

  const filteredSessions = useMemo(() => {
    let filtered = [...sessions].reverse();
    if (filter === 'work') filtered = filtered.filter(s => s.mode === 'work');
    if (filter === 'break') filtered = filtered.filter(s => s.mode !== 'work');
    return filtered;
  }, [sessions, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filteredSessions>();
    filteredSessions.forEach(s => {
      const existing = groups.get(s.date) || [];
      existing.push(s);
      groups.set(s.date, existing);
    });
    return Array.from(groups.entries());
  }, [filteredSessions]);

  const exportData = (format: 'csv' | 'json') => {
    let content: string;
    let mime: string;
    let ext: string;

    if (format === 'json') {
      content = JSON.stringify(sessions, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else {
      const headers = 'Task,Mode,Duration (min),Completed At,Date\n';
      const rows = sessions.map(s =>
        `"${s.taskName}","${s.mode}",${s.duration / 60},"${s.completedAt}","${s.date}"`
      ).join('\n');
      content = headers + rows;
      mime = 'text/csv';
      ext = 'csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-flow-export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
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
                {items.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', borderRadius: 8,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: getModeColor(s.mode),
                      boxShadow: `0 0 6px ${getModeColor(s.mode)}66`,
                    }} />
                    <span style={{ flex: 1, fontSize: 14 }}>{s.taskName}</span>
                    <span style={{
                      fontSize: 12, color: getModeColor(s.mode), fontWeight: 600,
                      padding: '2px 8px', borderRadius: 4,
                      background: getModeColor(s.mode) + '15',
                    }}>
                      {getModeLabel(s.mode)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {s.duration / 60}m
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(s.completedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
