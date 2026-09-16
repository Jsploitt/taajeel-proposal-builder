import { cx } from './cx'

/**
 * The "slide 12" chip every field carries. A hard product requirement: staff
 * must be able to see which slide each field lands on.
 */
export function SlideTag({ slides, className }: { slides: number | number[]; className?: string }) {
  const list = Array.isArray(slides) ? slides : [slides]
  if (list.length === 0) return null
  const label = list.length === 1 ? `slide ${list[0]}` : `slides ${list[0]}\u2013${list[list.length - 1]}`
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded border border-navy-100 bg-white px-1.5 py-px',
        'font-mono text-xs uppercase tracking-wide text-navy-500',
        className
      )}
    >
      {label}
    </span>
  )
}
