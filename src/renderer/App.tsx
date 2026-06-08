import { Routes, Route } from 'react-router-dom';
import { TimerProvider } from './context/TimerContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <SettingsProvider>
      <TimerProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<TimerPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </TimerProvider>
    </SettingsProvider>
  );
}
