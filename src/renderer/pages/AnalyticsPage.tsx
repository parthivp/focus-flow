import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { BarChart3, Flame, Clock, Target, TrendingUp } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { useSettings } from '../context/SettingsContext';

const COLORS = ['#ff6b6b', '#4ecdc4', '#a78bfa', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: color + '22',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { sessions } = useTimer();
  const { settings } = useSettings();

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const workSessions = sessions.filter(s => s.mode === 'work');
    const todaySessions = workSessions.filter(s => s.date === today);
    const totalMinutes = workSessions.reduce((sum, s) => sum + s.duration / 60, 0);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration / 60, 0);

    const dateSet = new Set(workSessions.map(s => s.date));
    const dates = Array.from(dateSet).sort();
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      todayPomodoros: todaySessions.length,
      todayMinutes: Math.round(todayMinutes),
      totalPomodoros: workSessions.length,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      streak,
      uniqueDays: dates.length,
    };
  }, [sessions, today]);

  const weeklyData = useMemo(() => {
    const data: { day: string; pomodoros: number; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en', { weekday: 'short' });
      const daySessions = sessions.filter(s => s.date === dateStr && s.mode === 'work');
      data.push({
        day: dayName,
        pomodoros: daySessions.length,
        minutes: Math.round(daySessions.reduce((sum, s) => sum + s.duration / 60, 0)),
      });
    }
    return data;
  }, [sessions]);

  const taskBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    sessions.filter(s => s.mode === 'work').forEach(s => {
      map.set(s.taskName, (map.get(s.taskName) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [sessions]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    sessions.filter(s => s.mode === 'work').forEach(s => {
      const h = new Date(s.completedAt).getHours();
      hours[h].count++;
    });
    return hours.filter(h => h.count > 0);
  }, [sessions]);

  const tooltipStyle = {
    contentStyle: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      fontSize: 12,
      color: 'var(--text-primary)',
    },
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <BarChart3 size={24} color="var(--text-muted)" />
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analytics</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard icon={Target} label="Today's pomodoros" value={stats.todayPomodoros} sub={`Goal: ${settings.dailyGoal}`} color="#ff6b6b" />
        <StatCard icon={Clock} label="Today's focus" value={`${stats.todayMinutes}m`} color="#4ecdc4" />
        <StatCard icon={Flame} label="Current streak" value={`${stats.streak}d`} color="#feca57" />
        <StatCard icon={TrendingUp} label="Total focus" value={`${stats.totalHours}h`} sub={`${stats.totalPomodoros} sessions`} color="#a78bfa" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
            Weekly Overview
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="pomodoros" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
            Focus by Task
          </h3>
          {taskBreakdown.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={taskBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {taskBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {hourlyData.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
            Peak Productivity Hours
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: '#8888aa' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={h => `${h}:00`}
              />
              <YAxis tick={{ fontSize: 11, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#48dbfb" strokeWidth={2} dot={{ fill: '#48dbfb', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
