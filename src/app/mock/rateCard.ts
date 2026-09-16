import type { RateCardRow } from '../data/types'

/**
 * The stored rate card. Staff tick which items appear on a given proposal and
 * may override any price; nothing here is ever computed.
 */
export const rateCard: RateCardRow[] = [
  { id: 'rc-visa', label: 'Work visa issuance (per visa)', amount: '2,000', unit: 'per visa', defaultOn: false },
  { id: 'rc-iqama', label: 'Iqama issuance and renewal (per employee)', amount: '1,500', unit: 'per employee', defaultOn: false },
  { id: 'rc-gosi', label: 'GOSI registration and monthly filing', amount: '1,200', unit: 'per month', defaultOn: false },
  { id: 'rc-payroll', label: 'Payroll processing (WPS)', amount: '2,500', unit: 'per month', defaultOn: false },
  { id: 'rc-vat', label: 'VAT return filing', amount: '1,800', unit: 'per quarter', defaultOn: false },
  { id: 'rc-address', label: 'National address renewal', amount: '600', unit: 'per year', defaultOn: false },
  { id: 'rc-po', label: 'Registered office / PO box subscription', amount: '3,500', unit: 'per year', defaultOn: false },
]
