import type { ReactNode } from 'react'
import { cx } from './cx'

export type Tone = 'blocker' | 'check' | 'info' | 'tbc' | 'neutral'

const TONES: Record<Tone, string> = {
  blocker: 'border-blocker/40 bg-blocker/5 text-blocker',
  check: 'border-check/40 bg-check/5 text-check',
  info: 'border-info/30 bg-info/5 text-info',
  tbc: 'border-tbc/40 bg-tbc/5 text-tbc',
  neutral: 'border-navy-100 bg-cream-200 text-navy-500',
}

export function Callout({ tone = 'neutral', title, children }: { tone?: Tone; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className={cx('rounded border px-3 py-2 text-xs leading-relaxed', TONES[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      {children}
    </div>
  )
}
