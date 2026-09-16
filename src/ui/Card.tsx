import type { ReactNode } from 'react'
import { SlideTag } from './SlideTag'
import { cx } from './cx'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded border border-navy-100 bg-white', className)}>{children}</section>
}

export function SectionHeader({
  title,
  slides,
  description,
  actions,
}: {
  title: string
  slides?: number | number[]
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-navy-100 px-4 py-2.5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-navy">
          {title}
          {slides !== undefined && <SlideTag slides={slides} />}
        </h2>
        {description && <p className="mt-0.5 max-w-3xl text-xs text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded border border-dashed border-navy-100 px-3 py-4 text-center text-xs text-navy-300">
      {children}
    </p>
  )
}
