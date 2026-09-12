import { useCallback, useEffect, useState } from 'react';
import api, { extractError } from '../services/api.js';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Card from '../components/ui/Card.jsx';
import RankBadge from '../components/ui/RankBadge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import cx from '../utils/cx.js';
import { formatDate, formatScore, initials, todayIso } from '../utils/format.js';

const PRESETS = [
  { id: 'today', label: 'Today', from: () => todayIso(0), to: () => todayIso(0) },
  { id: '7d', label: 'Last 7 days', from: () => todayIso(-6), to: () => todayIso(0) },
  { id: '30d', label: 'Last 30 days', from: () => todayIso(-29), to: () => todayIso(0) },
];

export default function Reports() {
  const [preset, setPreset] = useState('7d');
  const [customStart, setCustomStart] = useState(todayIso(-6));
  const [customEnd, setCustomEnd] = useState(todayIso(0));
  const [useCustom, setUseCustom] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activePreset = PRESETS.find((p) => p.id === preset);

  const run = useCallback(
    async (from, to) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/reports/top-players', { params: { from, to, limit: 50 } });
        setData(res.data.data);
      } catch (err) {
        setError(extractError(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (useCustom) run(customStart, customEnd);
    else run(activePreset.from(), activePreset.to());
  }, [preset, useCustom]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxTotal = data?.entries?.[0]?.totalScore || 1;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Top players report</h1>
          <p className="page-head__subtitle">
            Who racked up the most points during a period — total score, submissions and games played.
          </p>
        </div>
      </div>

      <div className="report-toolbar">
        <div className="segmented">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={cx('segmented__btn', !useCustom && preset === p.id && 'segmented__btn--active')}
              onClick={() => {
                setPreset(p.id);
                setUseCustom(false);
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            className={cx('segmented__btn', useCustom && 'segmented__btn--active')}
            onClick={() => setUseCustom(true)}
          >
            Custom
          </button>
        </div>

        {useCustom && (
          <>
            <label className="report-toolbar__field">
              From
              <input type="date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} />
            </label>
            <label className="report-toolbar__field">
              To
              <input type="date" value={customEnd} min={customStart} max={todayIso(0)} onChange={(e) => setCustomEnd(e.target.value)} />
            </label>
            <button className="btn btn--primary btn--sm" onClick={() => run(customStart, customEnd)} disabled={loading}>
              Apply
            </button>
          </>
        )}
      </div>

      {loading && !data ? (
        <div className="page-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => run(customStart, customEnd)} />
      ) : data ? (
        data.entries.length === 0 ? (
          <Card>
            <EmptyState
              icon="📊"
              title="No submissions in this period"
              message="Pick a wider window or wait for players to post scores."
            />
          </Card>
        ) : (
          <Card
            title={`Period ${formatDate(data.range.from)} → ${formatDate(data.range.to)}`}
            subtitle={`Top ${data.entries.length} players by total score`}
          >
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Rank</th>
                    <th>Player</th>
                    <th>Total score</th>
                    <th>Submissions</th>
                    <th>Best score</th>
                    <th>Games</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.userId}>
                      <td>
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td>
                        <div className="table__user">
                          <Avatar size="sm" seed={entry.username}>
                            {initials(entry.username)}
                          </Avatar>
                          <span className="table__username">{entry.username}</span>
                          {entry.rank <= 3 && <Badge color="gold">top {entry.rank}</Badge>}
                        </div>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <span className="num" style={{ minWidth: 60, textAlign: 'right' }}>
                            {formatScore(entry.totalScore)}
                          </span>
                          <div className="score-bar" style={{ flex: 1, maxWidth: 140 }}>
                            <div
                              className="score-bar__fill"
                              style={{ width: `${Math.max(4, (entry.totalScore / maxTotal) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>{entry.numberOfSubmissions}</td>
                      <td className="num">{formatScore(entry.bestScore)}</td>
                      <td>
                        <Badge color="neutral">{entry.gamesPlayed}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : null}
    </div>
  );
}