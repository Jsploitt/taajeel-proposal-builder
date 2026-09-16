import { useEffect, useState } from 'react'
import type { RateCardItem } from '../../../compiler/types'
import { Callout, Card, SectionHeader, TextInput, Toggle, cx } from '../../../ui'
import { db } from '../../data'
import type { RateCardRow } from '../../data'
import { useDispatch, useDraft } from '../../state/DraftContext'

/**
 * The stored rate card. Staff tick which items appear and may override any
 * price; the app never computes one.
 */
export function RateCard() {
  const { spec } = useDraft()
  const dispatch = useDispatch()
  const [rows, setRows] = useState<RateCardRow[]>([])

  useEffect(() => {
    db.listRateCard().then(setRows)
  }, [])

  const items = spec.rateCard.items
  const byLabel = new Map(items.map((i) => [i.label, i]))

  function toggle(row: RateCardRow, on: boolean) {
    const next: RateCardItem[] = on
      ? [...items, { label: row.label, amount: row.amount, unit: row.unit }]
      : items.filter((i) => i.label !== row.label)
    dispatch({ type: 'RATECARD_SET_ITEMS', items: next })
  }

  function override(label: string, amount: string) {
    dispatch({ type: 'RATECARD_SET_ITEMS', items: items.map((i) => (i.label === label ? { ...i, amount } : i)) })
  }

  return (
    <Card>
      <SectionHeader
        title="Rate card"
        description="Tick what appears on this proposal. Overriding a price changes it here only, never in the stored card."
      />
      <div className="flex flex-col gap-3 p-4">
        <Toggle
          checked={spec.rateCard.show}
          onChange={(v) => dispatch({ type: 'SET_SECTION_SHOW', section: 'rateCard', show: v })}
          label="Include a rate card with this proposal"
          description="Stored with the proposal. The template has no section for it yet, so it does not reach the deck."
        />

        {spec.rateCard.show && (
          <>
            <ul className="divide-y divide-navy-100">
              {rows.map((r) => {
                const picked = byLabel.get(r.label)
                const on = !!picked
                const changed = on && picked.amount !== r.amount
                return (
                  <li key={r.id} className="flex items-center gap-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => toggle(r, e.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border-navy-300 text-navy focus:ring-navy-500"
                      aria-label={`Include ${r.label}`}
                    />
                    <span className={cx('min-w-0 flex-1 truncate text-sm', on ? 'text-navy-900' : 'text-navy-300')}>
                      {r.label}
                    </span>
                    <span className="w-20 shrink-0 text-right font-mono text-xs text-navy-300">{r.unit ?? ''}</span>
                    <TextInput
                      value={picked?.amount ?? r.amount}
                      disabled={!on}
                      onChange={(e) => override(r.label, e.target.value)}
                      className="w-28 text-right font-mono tabular-nums"
                      aria-label={`Amount for ${r.label}`}
                    />
                    <span className="w-16 shrink-0 text-xs text-check">{changed ? 'overridden' : ''}</span>
                  </li>
                )
              })}
            </ul>
            {items.length > 0 && (
              <Callout tone="info">
                {items.length} item{items.length === 1 ? '' : 's'} stored with this proposal. No template section exists
                for them yet, so they do not appear in the deck.
              </Callout>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
