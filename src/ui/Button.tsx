import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-900 disabled:bg-navy-300',
  secondary: 'bg-white text-navy border border-navy-100 hover:border-navy-300 disabled:text-navy-300',
  ghost: 'bg-transparent text-navy-500 hover:text-navy hover:bg-cream disabled:text-navy-300',
  danger: 'bg-white text-blocker border border-blocker/40 hover:bg-blocker/5 disabled:text-navy-300',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
}

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors',
        'disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        VARIANTS[variant],
        className
      )}
    />
  )
}
