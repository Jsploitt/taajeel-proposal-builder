import type { ReactNode } from 'react'
import type { CaveatSeverity } from '../compiler/types'
import { cx } from './cx'

const DOT: Record<CaveatSeverity | 'tbc' | 'notrendered', string> = {
  blocker: 'bg-blocker',
  check: 'bg-check',
  info: 'bg-info',
  tbc: 'bg-tbc',
  notrendered: 'bg-info',
}

export function CaveatRow({
  severity,
  where,
  message,
  action,
}: {
  severity: CaveatSeverity | 'tbc' | 'notrendered'
  /** Free text from the compiler -- a mix of "slide 5" and section names. Display, never parse. */
  where?: string
  message: ReactNode
  action?: ReactNode
}) {
  return (
    <li className="flex items-start gap-2 border-b border-navy-100 px-3 py-2 last:border-b-0">
      <span className={cx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', DOT[severity])} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-navy-900">{message}</p>
        {where && <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-navy-300">{where}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </li>
  )
}
