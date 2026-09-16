import type { ReactNode } from 'react'
import { SlideTag } from './SlideTag'
import { cx } from './cx'

export interface FieldProps {
  label: string
  /** Destination slide(s). Every field carries one. */
  slides?: number | number[]
  htmlFor?: string
  hint?: ReactNode
  error?: ReactNode
  /** Shown when the field is empty and the compiler will print [TO BE CONFIRMED]. */
  tbc?: boolean
  /** Right-aligned extra, e.g. a CharCounter. */
  aside?: ReactNode
  className?: string
  children: ReactNode
}

export function Field({ label, slides, htmlFor, hint, error, tbc, aside, className, children }: FieldProps) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-navy-900">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {aside}
          {slides !== undefined && <SlideTag slides={slides} />}
        </div>
      </div>
      {children}
      {error ? (
        <p className="text-xs text-blocker">{error}</p>
      ) : tbc ? (
        <p className="text-xs text-tbc">Blank — will render as [TO BE CONFIRMED]</p>
      ) : hint ? (
        <p className="text-xs text-navy-500">{hint}</p>
      ) : null}
    </div>
  )
}
