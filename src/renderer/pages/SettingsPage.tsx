import { useSettings } from '../context/SettingsContext';
import { Settings as SettingsIcon, Volume2, Play } from 'lucide-react';
import { SOUNDS, previewSound } from '../utils/sounds';
import { SoundChoice } from '../types';

function NumberInput({ label, value, onChange, min, max, suffix }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          min={min}
          max={max}
          style={{
            width: 64,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 14,
            textAlign: 'center',
          }}
        />
        {suffix && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: value ? 'var(--accent-work)' : 'var(--border)',
          position: 'relative',
          transition: 'background var(--transition)',
        }}
      >
        <div style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          transition: 'left var(--transition)',
        }} />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      padding: '16px 20px',
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <SettingsIcon size={24} color="var(--text-muted)" />
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Section title="Timer Durations">
          <NumberInput label="Focus duration" value={settings.workDuration} onChange={v => updateSettings({ workDuration: v })} min={1} max={120} suffix="min" />
          <NumberInput label="Short break" value={settings.shortBreakDuration} onChange={v => updateSettings({ shortBreakDuration: v })} min={1} max={30} suffix="min" />
          <NumberInput label="Long break" value={settings.longBreakDuration} onChange={v => updateSettings({ longBreakDuration: v })} min={1} max={60} suffix="min" />
          <NumberInput label="Long break after" value={settings.longBreakInterval} onChange={v => updateSettings({ longBreakInterval: v })} min={2} max={10} suffix="sessions" />
        </Section>

        <Section title="Goals">
          <NumberInput label="Daily pomodoro goal" value={settings.dailyGoal} onChange={v => updateSettings({ dailyGoal: v })} min={1} max={30} suffix="sessions" />
        </Section>

        <Section title="Automation">
          <Toggle label="Auto-start breaks" value={settings.autoStartBreaks} onChange={v => updateSettings({ autoStartBreaks: v })} />
          <Toggle label="Auto-start pomodoros" value={settings.autoStartPomodoros} onChange={v => updateSettings({ autoStartPomodoros: v })} />
        </Section>

        <Section title="Notifications">
          <Toggle label="Sound alerts" value={settings.soundEnabled} onChange={v => updateSettings({ soundEnabled: v })} />
          <Toggle label="Desktop notifications" value={settings.notificationsEnabled} onChange={v => updateSettings({ notificationsEnabled: v })} />
        </Section>

        {settings.soundEnabled && (
          <Section title="Notification Sound">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(SOUNDS) as SoundChoice[]).map(key => {
                const sound = SOUNDS[key];
                const selected = settings.soundType === key;
                return (
                  <div
                    key={key}
                    onClick={() => updateSettings({ soundType: key })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: selected ? 'rgba(255,107,107,0.12)' : 'transparent',
                      border: selected ? '1.5px solid var(--accent-work)' : '1.5px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: selected ? '5px solid var(--accent-work)' : '2px solid var(--border)',
                      background: selected ? 'var(--accent-work)' : 'transparent',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{sound.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sound.description}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); previewSound(key); }}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-secondary)',
                        transition: 'background 0.15s ease',
                      }}
                      title={`Preview ${sound.label}`}
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '8px 0' }}>
              <Volume2 size={16} color="var(--text-muted)" />
              <input
                type="range"
                min={10} max={100} step={5}
                value={settings.soundVolume}
                onChange={e => updateSettings({ soundVolume: Number(e.target.value) })}
                style={{ flex: 1, accentColor: 'var(--accent-work)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>
                {settings.soundVolume}%
              </span>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
