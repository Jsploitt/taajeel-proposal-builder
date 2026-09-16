import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx } from './cx'

const BASE =
  'w-full rounded border border-navy-100 bg-white px-2 py-1.5 text-sm text-navy-900 ' +
  'placeholder:text-navy-300 focus:border-navy-500 disabled:bg-cream-200 disabled:text-navy-300'

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...rest} className={cx(BASE, className)} />
}

export function TextArea({ className, rows = 3, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} {...rest} className={cx(BASE, 'resize-y leading-snug', className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(BASE, 'pr-6', className)}>
      {children}
    </select>
  )
}

/**
 * Durations are never invented: an empty box stays empty (undefined), it does
 * not become 0.
 */
export function NumberInput({
  value,
  onValueChange,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number | undefined
  onValueChange: (v: number | undefined) => void
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value.trim()
        if (raw === '') return onValueChange(undefined)
        const n = Number(raw)
        onValueChange(Number.isFinite(n) ? n : undefined)
      }}
      {...rest}
      className={cx(BASE, 'tabular-nums', className)}
    />
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-2', disabled && 'cursor-not-allowed opacity-60')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy-300 text-navy focus:ring-navy-500"
      />
      <span>
        <span className="block text-sm font-medium text-navy-900">{label}</span>
        {description && <span className="block text-xs text-navy-500">{description}</span>}
      </span>
    </label>
  )
}
