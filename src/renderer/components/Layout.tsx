import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Timer, BarChart3, History, Settings, Minimize2 } from 'lucide-react';

const navItems = [
  { path: '/', icon: Timer, label: 'Timer' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children, onCompactClick }: { children: ReactNode; onCompactClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <nav style={{
        width: 72,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        gap: 8,
        WebkitAppRegion: 'drag',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 18,
          marginBottom: 20,
          WebkitAppRegion: 'no-drag',
        }}>
          F
        </div>

        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={item.label}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'var(--transition)',
                WebkitAppRegion: 'no-drag',
              }}
            >
              <item.icon size={22} />
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <button
          onClick={onCompactClick}
          title="Compact Mode"
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            color: 'var(--text-muted)',
            transition: 'var(--transition)',
            marginBottom: 16,
            WebkitAppRegion: 'no-drag',
          }}
        >
          <Minimize2 size={20} />
        </button>
      </nav>

      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: 32,
      }}>
        {children}
      </main>
    </div>
  );
}
