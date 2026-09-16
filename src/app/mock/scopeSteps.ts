import type { ScopeStepRow } from '../data/types'
import { meridianSpec } from './meridian'

/**
 * The catalog a service seeds its scope from. Derived from the fixture so the
 * labels and agency keys cannot drift from the reference proposal.
 */
export const scopeSteps: ScopeStepRow[] = meridianSpec.scope[0].steps.map((s, i) => ({
  id: `step-foreign-${String(i + 1).padStart(2, '0')}`,
  serviceId: 'svc-foreign-company',
  position: i + 1,
  label: s.label,
  durationDays: s.durationDays,
  agency: s.agency,
}))
