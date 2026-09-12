import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { formatDateTime, formatScore, initials, ordinal } from '../utils/format.js';

const GAME_ICONS = { 'g-1': '🏃', 'g-2': '🧩', 'g-3': '🧮', 'g-4': '📖', 'g-5': '🧠', 'g-6': '⚡', 'g-7': '🎨' };

export default function Profile() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const { success } = useToast();
  const [data, setData] = useState(null);
  const [social, setSocial] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/users/${userId}`);
        setData(res.data.data);
        setSocial(res.data.data.social);
      } catch (err) {
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const toggleFollow = async () => {
    if (busy || !me || me.id === userId) return;
    setBusy(true);
    try {
      const res = await api[social.isFollowing ? 'delete' : 'post'](`/users/${userId}/follow`);
      setSocial((prev) => ({
        ...prev,
        followerCount: res.data.data.followerCount,
        isFollowing: res.data.data.isFollowing,
      }));
      success(social.isFollowing ? 'Unfollowed.' : `Now following ${data.user.username}.`);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const { user, stats, badges, recentScores } = data;
  const isYou = me?.id === user.id;

  return (
    <div>
      <div className="profile-head">
        <Avatar size="xl" seed={user.username}>
          {initials(user.username)}
        </Avatar>
        <div className="profile-head__info">
          <div className="row" style={{ gap: 10 }}>
            <h1 className="page-head__title">{user.username}</h1>
            {isYou && <Badge color="primary">you</Badge>}
            {user.role === 'admin' && <Badge color="primary">admin</Badge>}
            {stats.globalRank === 1 && <Badge color="gold">👑 #1 global</Badge>}
          </div>
          <p className="page-head__subtitle">
            Joined {formatDateTime(user.createdAt)}
            {stats.globalRank != null &&
              ` · Global rank ${ordinal(stats.globalRank)} of ${stats.gamesPlayed.length} games`}
          </p>
        </div>
      </div>

      {social && (
        <div className="follow-bar">
          <div className="follow-bar__stats">
            <span className="follow-bar__stat">
              <b>{social.followerCount}</b> followers
            </span>
            <span className="follow-bar__stat">
              <b>{social.followingCount}</b> following
            </span>
          </div>
          {!isYou && me && (
            <button
              className={!social.isFollowing ? 'btn btn--primary' : 'btn'}
              onClick={toggleFollow}
              disabled={busy}
            >
              {busy ? '…' : social.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon="🌍" label="Global rank" value={stats.globalRank != null ? ordinal(stats.globalRank) : 'Unranked'} sub={stats.globalScore != null ? `Best total ${formatScore(stats.globalScore)}` : 'No score yet'} accent="primary" />
        <StatCard icon="🎯" label="Games participated" value={stats.gamesParticipated} sub={`of ${stats.gamesPlayed.length} games`} accent="success" />
        <StatCard icon="⚡" label="Best score" value={formatScore(stats.totalBestScore)} sub="Sum of personal bests" accent="warn" />
        <StatCard icon="📝" label="Recent activity" value={recentScores.length ? 'Active' : 'Quiet'} sub={recentScores.length ? `${formatDateTime(recentScores[0].submittedAt)}` : 'No submissions yet'} accent="danger" />
      </div>

      <div className="dash-grid">
        <Card title="Achievements" subtitle={`${badges.length} badge${badges.length === 1 ? '' : 's'} unlocked`}>
          {badges.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🎖️</div>
              <h4 className="empty-state__title">No badges yet</h4>
              <p className="empty-state__message">Submit scores and climb the boards to earn one.</p>
            </div>
          ) : (
            <div className="badge-grid">
              {badges.map((b) => (
                <div className="badge-tile" key={b.id} title={b.description}>
                  <div className="badge-tile__emoji">{b.emoji}</div>
                  <div className="badge-tile__name">{b.name}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Per-game ranks" subtitle="Personal bests on each board">
          {stats.gamesPlayed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🎮</div>
              <h4 className="empty-state__title">Hasn’t played yet</h4>
            </div>
          ) : (
            stats.gamesPlayed.map((g) => (
              <div className="best-row" key={g.gameId}>
                <div className="game-card__emoji" style={{ width: 40, height: 40, fontSize: 20 }}>
                  {GAME_ICONS[g.gameId] || '🎮'}
                </div>
                <div className="best-row__info">
                  <div className="best-row__name">
                    <Link to={`/games/${g.gameId}`}>{g.name || g.gameId}</Link>
                  </div>
                  <div className="best-row__rank">Rank {g.rank != null ? ordinal(g.rank) : '—'}</div>
                </div>
                <div className="num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {formatScore(g.score)}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card className="mt-16" title="Recent submissions" subtitle="Latest attempts on record">
        {recentScores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🕰️</div>
            <h4 className="empty-state__title">Nothing yet</h4>
          </div>
        ) : (
          recentScores.map((s, i) => (
            <div className="best-row" key={`${s.gameId}-${i}`}>
              <div className="game-card__emoji" style={{ width: 40, height: 40, fontSize: 20 }}>
                {GAME_ICONS[s.gameId] || '🎮'}
              </div>
              <div className="best-row__info">
                <div className="best-row__name">
                  <Link to={`/games/${s.gameId}`}>{s.gameName}</Link>
                </div>
                <div className="best-row__rank">{formatDateTime(s.submittedAt)}</div>
              </div>
              <div className="num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {formatScore(s.score)}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}