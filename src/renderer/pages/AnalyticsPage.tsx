import { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { BarChart3, Flame, Clock, Target, TrendingUp } from 'lucide-react';
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

function formatMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AnalyticsPage() {
  const { settings } = useSettings();
  const today = new Date().toISOString().split('T')[0];
  const [todayStats, setTodayStats] = useState<any>(null);
  const [allTimeStats, setAllTimeStats] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [taskBreakdown, setTaskBreakdown] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function load() {
      if (!window.electronAPI?.db) return;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const [ts, ats, daily, tasks, hourly, str] = await Promise.all([
        window.electronAPI.db.getStats(today, today),
        window.electronAPI.db.getStats('2000-01-01', '2099-12-31'),
        window.electronAPI.db.getDailyStats(startDate, today),
        window.electronAPI.db.getTaskBreakdown(),
        window.electronAPI.db.getHourlyStats(),
        window.electronAPI.db.getStreak(),
      ]);

      setTodayStats(ts);
      setAllTimeStats(ats);
      setStreak(str);
      setTaskBreakdown(tasks.slice(0, 7).map((t: any) => ({
        name: t.task_name,
        count: t.count,
        minutes: Math.round(t.total_seconds / 60),
      })));
      setHourlyData(hourly.map((h: any) => ({ hour: h.hour, count: h.count })));

      // Build weekly data with all 7 days
      const dailyMap = new Map(daily.map((d: any) => [d.date, d]));
      const week = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en', { weekday: 'short' });
        const row = dailyMap.get(dateStr) as any;
        week.push({
          day: dayName,
          pomodoros: row?.completed_pomodoros || 0,
          minutes: row ? Math.round(row.work_seconds / 60) : 0,
        });
      }
      setWeeklyData(week);
    }
    load();
  }, [today]);

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
        <StatCard
          icon={Target}
          label="Today's pomodoros"
          value={todayStats?.completed_pomodoros || 0}
          sub={`Goal: ${settings.dailyGoal}`}
          color="#ff6b6b"
        />
        <StatCard
          icon={Clock}
          label="Today's focus"
          value={formatMinutes(todayStats?.total_work_seconds || 0)}
          color="#4ecdc4"
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${streak}d`}
          color="#feca57"
        />
        <StatCard
          icon={TrendingUp}
          label="Total focus"
          value={formatMinutes(allTimeStats?.total_work_seconds || 0)}
          sub={`${allTimeStats?.completed_pomodoros || 0} sessions`}
          color="#a78bfa"
        />
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
                <Pie data={taskBreakdown} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {taskBreakdown.map((_: any, i: number) => (
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
                tickFormatter={(h: number) => `${h}:00`}
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
