import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let db: Database.Database;

export function initDatabase(): void {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'focus-flow.db');
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT NOT NULL DEFAULT 'Untitled',
      mode TEXT NOT NULL CHECK(mode IN ('work', 'shortBreak', 'longBreak')),
      planned_duration INTEGER NOT NULL,
      actual_duration INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(mode);
  `);
}

export function getDbPath(): string {
  return path.join(app.getPath('userData'), 'focus-flow.db');
}

// --- Sessions ---

export interface SessionRow {
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

export function startSession(taskName: string, mode: string, plannedDuration: number): number {
  const now = new Date();
  const stmt = db.prepare(`
    INSERT INTO sessions (task_name, mode, planned_duration, actual_duration, completed, started_at, date)
    VALUES (?, ?, ?, 0, 0, ?, ?)
  `);
  const result = stmt.run(taskName || 'Untitled', mode, plannedDuration, now.toISOString(), now.toISOString().split('T')[0]);
  return result.lastInsertRowid as number;
}

export function updateSessionProgress(id: number, elapsedSeconds: number): void {
  db.prepare('UPDATE sessions SET actual_duration = ? WHERE id = ?').run(elapsedSeconds, id);
}

export function completeSession(id: number, elapsedSeconds: number): void {
  const now = new Date();
  db.prepare(`
    UPDATE sessions SET actual_duration = ?, completed = 1, completed_at = ? WHERE id = ?
  `).run(elapsedSeconds, now.toISOString(), id);
}

export function getSessions(startDate?: string, endDate?: string): SessionRow[] {
  if (startDate && endDate) {
    return db.prepare('SELECT * FROM sessions WHERE date >= ? AND date <= ? ORDER BY started_at DESC').all(startDate, endDate) as SessionRow[];
  }
  return db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all() as SessionRow[];
}

export function getSessionsByDate(date: string): SessionRow[] {
  return db.prepare('SELECT * FROM sessions WHERE date = ? ORDER BY started_at DESC').all(date) as SessionRow[];
}

export function getStats(startDate: string, endDate: string) {
  const row = db.prepare(`
    SELECT
      COUNT(*) as total_sessions,
      SUM(CASE WHEN mode = 'work' THEN 1 ELSE 0 END) as work_sessions,
      SUM(CASE WHEN mode = 'work' AND completed = 1 THEN 1 ELSE 0 END) as completed_pomodoros,
      SUM(CASE WHEN mode = 'work' THEN actual_duration ELSE 0 END) as total_work_seconds,
      SUM(actual_duration) as total_seconds
    FROM sessions
    WHERE date >= ? AND date <= ?
  `).get(startDate, endDate) as any;
  return row;
}

export function getDailyStats(startDate: string, endDate: string) {
  return db.prepare(`
    SELECT
      date,
      COUNT(*) as total_sessions,
      SUM(CASE WHEN mode = 'work' THEN 1 ELSE 0 END) as work_sessions,
      SUM(CASE WHEN mode = 'work' AND completed = 1 THEN 1 ELSE 0 END) as completed_pomodoros,
      SUM(CASE WHEN mode = 'work' THEN actual_duration ELSE 0 END) as work_seconds
    FROM sessions
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC
  `).all(startDate, endDate);
}

export function getHourlyStats() {
  return db.prepare(`
    SELECT
      CAST(strftime('%H', started_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM sessions
    WHERE mode = 'work'
    GROUP BY hour
    ORDER BY hour ASC
  `).all();
}

export function getTaskBreakdown(startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return db.prepare(`
      SELECT task_name, COUNT(*) as count, SUM(actual_duration) as total_seconds
      FROM sessions WHERE mode = 'work' AND date >= ? AND date <= ?
      GROUP BY task_name ORDER BY total_seconds DESC
    `).all(startDate, endDate);
  }
  return db.prepare(`
    SELECT task_name, COUNT(*) as count, SUM(actual_duration) as total_seconds
    FROM sessions WHERE mode = 'work'
    GROUP BY task_name ORDER BY total_seconds DESC
  `).all();
}

export function getStreak(): number {
  const rows = db.prepare(`
    SELECT DISTINCT date FROM sessions WHERE mode = 'work' AND completed = 1 ORDER BY date DESC
  `).all() as { date: string }[];

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = today.toISOString().split('T')[0];
    if (rows.some(r => r.date === dateStr)) {
      streak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// --- Settings ---

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function exportAllData(format: 'csv' | 'json'): string {
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all() as SessionRow[];

  if (format === 'json') {
    return JSON.stringify(sessions, null, 2);
  }

  const headers = 'ID,Task,Mode,Planned Duration (min),Actual Duration (min),Completed,Started At,Completed At,Date\n';
  const rows = sessions.map(s =>
    `${s.id},"${s.task_name}","${s.mode}",${Math.round(s.planned_duration / 60)},${Math.round(s.actual_duration / 60)},${s.completed ? 'Yes' : 'No'},"${s.started_at}","${s.completed_at || ''}","${s.date}"`
  ).join('\n');
  return headers + rows;
}

export function closeDatabase(): void {
  if (db) db.close();
}
