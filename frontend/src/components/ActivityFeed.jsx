import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractError } from '../services/api.js';
import { subscribeToActivity } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './ui/Spinner.jsx';
import Avatar from './ui/Avatar.jsx';
import { formatScore, initials, timeAgo } from '../utils/format.js';
import cx from '../utils/cx.js';

const MAX_ITEMS = 40;

export default function ActivityFeed({ limit = 25, compact = false }) {
  const { user } = useAuth();
  const [feed, setFeed] = useState('all');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const seen = useRef(new Set());
  const followedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let followed = null;
    (async () => {
      try {
        if (feed === 'following') {
          if (!followedRef.current) {
            const res = await api.get('/users/me/following');
            followedRef.current = new Set(res.data.data.following.map((u) => u.userId));
          }
          followed = followedRef.current;
        }
        const res = await api.get('/activity', {
          params: { limit, feed: feed === 'following' ? 'following' : undefined },
        });
        if (!cancelled) {
          const list = res.data.data.entries.filter((e) => !followed || followed.has(e.userId));
          setEntries(list);
          list.forEach((e) => seen.current.add(e.id));
        }
      } catch (err) {
        if (!cancelled) setError(extractError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const unsubscribe = subscribeToActivity((evt) => {
      if (!evt?.id || seen.current.has(evt.id)) return;
      if (followed && !followed.has(evt.userId)) return;
      seen.current.add(evt.id);
      setEntries((prev) => [evt, ...prev].slice(0, MAX_ITEMS));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [limit, feed]);

  if (loading) {
    return <div className="row" style={{ justifyContent: 'center', padding: '24px 0' }}><Spinner /></div>;
  }

  if (error) {
    return <div className="activity-feed__empty muted">Couldn’t load live activity.</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="activity-feed__empty">
        <span style={{ fontSize: 18 }}>📡</span>
        <div>
          <strong>No activity yet</strong>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Live submissions will stream in here the moment they land.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('activity-feed', compact && 'activity-feed--compact')}>
      {user && (
        <div className="segmented segmented--sm activity-feed__toggle">
          <button
            className={cx('segmented__btn', feed === 'all' && 'segmented__btn--active')}
            onClick={() => setFeed('all')}
          >
            Everyone
          </button>
          <button
            className={cx('segmented__btn', feed === 'following' && 'segmented__btn--active')}
            onClick={() => setFeed('following')}
          >
            Following
          </button>
        </div>
      )}
      {entries.map((entry) => (
        <div className="activity-feed__item" key={entry.id}>
          <Link to={`/profile/${entry.userId}`} className="activity-feed__avatar">
            <Avatar size="sm" seed={entry.username}>
              {initials(entry.username)}
            </Avatar>
          </Link>
          <div className="activity-feed__body">
            <div className="activity-feed__text">
              <Link to={`/profile/${entry.userId}`} className="activity-feed__user">
                {entry.username}
              </Link>{' '}
              {entry.isNewBest ? (
                <>
                  set <strong>a new best</strong>
                </>
              ) : (
                'posted'
              )}
              <span className="activity-feed__score"> {formatScore(entry.score)}</span>
              <span className="muted"> on </span>
              <Link to={`/games/${entry.gameId}`} className="activity-feed__game">
                {entry.gameName}
              </Link>
            </div>
            <div className="activity-feed__meta">
              <span className={cx('trend', entry.rankJump > 0 && 'trend--up')}>
                {entry.rankJump > 0 ? `▲ +${entry.rankJump} ranks` : 'rank held'}
              </span>
              <span>·</span>
              <span>{timeAgo(entry.createdAt)}</span>
            </div>
          </div>
          <span className={cx('activity-feed__rank', entry.rank <= 3 && 'activity-feed__rank--top')}>
            #{entry.rank}
          </span>
        </div>
      ))}
    </div>
  );
}