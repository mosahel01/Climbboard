import { Link } from 'react-router-dom';
import Avatar from './ui/Avatar.jsx';
import RankBadge from './ui/RankBadge.jsx';
import cx from '../utils/cx.js';
import { formatScore, initials } from '../utils/format.js';

function TrendCell({ trend }) {
  if (trend == null) return <span className="trend trend--flat">—</span>;
  if (trend > 0)
    return (
      <span className="trend trend--up" title={`Up ${trend} rank${trend > 1 ? 's' : ''}`}>
        ▲ {trend > 1 ? trend : ''}
      </span>
    );
  return (
    <span className="trend trend--down" title={`Down ${-trend} rank${-trend > 1 ? 's' : ''}`}>
      ▼ {Math.abs(trend) > 1 ? Math.abs(trend) : ''}
    </span>
  );
}

export default function LeaderboardTable({ entries, highlightUserId, showTrend = false }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🏁</div>
        <h4 className="empty-state__title">No scores yet</h4>
        <p className="empty-state__message">Be the first to jump in and set the bar.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 70 }}>Rank</th>
            <th>Player</th>
            <th style={{ width: 110, textAlign: 'right' }}>Score</th>
            {showTrend && <th style={{ width: 60, textAlign: 'right' }}>Δ</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const top = entry.rank <= 3;
            const isYou = highlightUserId && entry.userId === highlightUserId;
            return (
              <tr
                key={entry.userId}
                className={cx(isYou && 'table__row--you', top && `table__row--top${entry.rank}`)}
              >
                <td>
                  <RankBadge rank={entry.rank} />
                </td>
                <td>
                  <div className="table__user">
                    <Avatar size="sm" seed={entry.username}>
                      {initials(entry.username)}
                    </Avatar>
                    {isYou ? (
                      <span className="table__username table__you">You</span>
                    ) : (
                      <Link to={`/profile/${entry.userId}`} className="table__username table__link">
                        {entry.username}
                      </Link>
                    )}
                    {isYou && <span className="badge badge--primary">you</span>}
                  </div>
                </td>
                <td className="num" style={{ textAlign: 'right' }}>
                  {formatScore(entry.score)}
                </td>
                {showTrend && (
                  <td style={{ textAlign: 'right' }}>
                    <TrendCell trend={entry.trend} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}