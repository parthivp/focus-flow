import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TimerProvider } from './context/TimerContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import CompactTimer from './components/CompactTimer';
import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    window.electronAPI?.app.getCompactState().then(setIsCompact);
    window.electronAPI?.app.onCompactModeChanged(setIsCompact);
    window.electronAPI?.app.onToggleCompact(() => {
      window.electronAPI?.app.toggleCompact();
    });
  }, []);

  const toggleCompact = () => {
    window.electronAPI?.app.toggleCompact().then(setIsCompact);
  };

  return (
    <SettingsProvider>
      <TimerProvider>
        {isCompact ? (
          <CompactTimer onExpandClick={toggleCompact} />
        ) : (
          <Layout onCompactClick={toggleCompact}>
            <Routes>
              <Route path="/" element={<TimerPage onCompactClick={toggleCompact} />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        )}
      </TimerProvider>
    </SettingsProvider>
  );
}
