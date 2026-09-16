import type { GovFeeTemplateRow } from '../data/types'
import { meridianSpec } from './meridian'

/** Government fee amounts are never computed -- these are stored figures. */
export const govFeeTemplate: GovFeeTemplateRow[] = meridianSpec.govFees.rows.map((r, i) => ({
  id: `govfee-foreign-${i + 1}`,
  serviceId: 'svc-foreign-company',
  label: r.label,
  amount: r.amount,
  note: r.note,
}))
