import { cx } from './cx'

/**
 * Budget-aware counter. Budgets come from slide_map.json, never hardcoded --
 * exceeding one makes the compiler shrink the type and raise a `check` caveat,
 * so staff should see it coming while they type.
 */
export function CharCounter({ value, budget }: { value: string; budget?: number }) {
  if (!budget) return null
  const n = value.length
  const over = n > budget
  const near = !over && n >= budget * 0.9
  return (
    <span
      className={cx(
        'font-mono text-xs tabular-nums',
        over ? 'text-blocker' : near ? 'text-check' : 'text-navy-300'
      )}
      title={over ? 'Over budget: the compiler will shrink this text to fit and raise a caveat.' : undefined}
    >
      {n}/{budget}
    </span>
  )
}
