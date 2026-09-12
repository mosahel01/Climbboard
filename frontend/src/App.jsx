import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Games from './pages/Games.jsx';
import GameLeaderboard from './pages/GameLeaderboard.jsx';
import GamePlay from './pages/GamePlay.jsx';
import GlobalLeaderboard from './pages/GlobalLeaderboard.jsx';
import ScoreHistory from './pages/ScoreHistory.jsx';
import Reports from './pages/Reports.jsx';
import NotFound from './pages/NotFound.jsx';
import Profile from './pages/Profile.jsx';
import Achievements from './pages/Achievements.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:gameId/play" element={<GamePlay />} />
        <Route path="/games/:gameId" element={<GameLeaderboard />} />
        <Route path="/leaderboard" element={<GlobalLeaderboard />} />
        <Route path="/history" element={<ScoreHistory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile/:userId" element={<Profile />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}