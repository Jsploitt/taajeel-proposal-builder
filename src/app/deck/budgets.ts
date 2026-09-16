import { slideMap } from './template'

/**
 * Character budgets live in slide_map.json, not in the types. Read them at
 * runtime so a template change moves the counters with it.
 */
const BUDGETS = new Map<string, number>(
  slideMap.fills.filter((f) => f.budget).map((f) => [f.token, f.budget!])
)

export function budgetFor(token: string): number | undefined {
  return BUDGETS.get(token)
}

/** Scope step labels all share one budget; index is 1-based. */
export function scopeStepBudget(index1: number): number | undefined {
  return budgetFor(`SCOPE.STEP_${String(index1).padStart(2, '0')}`) ?? budgetFor('SCOPE.STEP_01')
}
