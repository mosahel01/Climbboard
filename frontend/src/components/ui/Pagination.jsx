import cx from '../../utils/cx.js';

export default function Pagination({ page, total, limit, onChange, className }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <nav className={cx('pagination', className)} aria-label="Pagination">
      <button className="pagination__btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        ←
      </button>
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="pagination__ellipsis">
            …
          </span>
        ) : (
          <button
            key={p}
            className={cx('pagination__btn', p === page && 'pagination__btn--active')}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button className="pagination__btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
        →
      </button>
    </nav>
  );
}