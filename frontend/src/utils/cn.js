import cn from 'classnames';

/**
 * Minimal classnames helper so components can build
 * "btn btn--primary btn--lg" strings cleanly.
 */
export default function cn() {
  return Array.from(arguments)
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}

export { cn };