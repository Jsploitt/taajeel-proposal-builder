import { useEffect, useState } from 'react'
import { Button, Callout, Field, NumberInput, Select, TextArea, cx } from '../../../ui'
import { db } from '../../data'
import type { BoilerplateRow } from '../../data'
import { useDispatch, useDraft } from '../../state/DraftContext'

/**
 * The payment-method shape on slide 24 has a heading plus three term lines. A
 * longer split is truncated by the compiler with no caveat at all, so the cap
 * is enforced here.
 */
const MAX_TERMS = 3

/** P1 and P2 both use 50/35/15. Offered, never applied silently. */
const DEFAULT_PCTS = [50, 35, 15]

export function PaymentSplit() {
  const { spec } = useDraft()
  const dispatch = useDispatch()
  const [terms, setTerms] = useState<BoilerplateRow[]>([])

  useEffect(() => {
    db.listBoilerplate('payment_term').then(setTerms)
  }, [])

  const split = spec.fees.paymentSplit ?? []
  const total = split.reduce((a, s) => a + s.pct, 0)
  const isRetainer = spec.engagement.type === 'retainer'

  const set = (next: typeof split) => dispatch({ type: 'FEES_SET_SPLIT', split: next.length ? next : undefined })

  if (isRetainer) {
    return (
      <div className="flex flex-col gap-3">
        <Callout tone="info" title="Retainer — no payment split">
          The compiler treats an empty split as the retainer path and prints the period on the first term line instead.
        </Callout>
        <Field label="Period" slides={24} hint="e.g. monthly subscription. Typed, never derived.">
          <input
            className="w-full rounded border border-navy-100 bg-white px-2 py-1.5 text-sm"
            value={spec.fees.period ?? ''}
            onChange={(e) => dispatch({ type: 'SET_FEES_FIELD', field: 'period', value: e.target.value })}
          />
        </Field>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cx(
            'font-mono text-xs tabular-nums',
            split.length === 0 ? 'text-navy-300' : total === 100 ? 'text-navy-500' : 'text-blocker'
          )}
        >
          total {total}%
        </span>
        {split.length === 0 && (
          <Button
            size="sm"
            onClick={() =>
              set(
                DEFAULT_PCTS.map((pct, i) => ({
                  pct,
                  when: terms.find((t) => t.pct === pct)?.text ?? terms[i]?.text ?? '',
                }))
              )
            }
          >
            Use the 50 / 35 / 15 default
          </Button>
        )}
      </div>

      {split.length > 0 && total !== 100 && (
        <Callout tone="blocker" title={`The split totals ${total}%, not 100%`}>
          The compiler refuses to build a deck with a split that does not add up.
        </Callout>
      )}

      <ol className="flex flex-col gap-2">
        {split.map((s, i) => (
          <li key={i} className="flex items-start gap-2 rounded border border-navy-100 p-2">
            <div className="w-20 shrink-0">
              <span className="mb-0.5 block text-xs text-navy-500">%</span>
              <NumberInput
                min={0}
                max={100}
                value={s.pct}
                onValueChange={(v) => set(split.map((x, j) => (j === i ? { ...x, pct: v ?? 0 } : x)))}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-0.5 block text-xs text-navy-500">
                Reads as “{s.pct}% {s.when || '…'}”
              </span>
              <TextArea
                rows={2}
                value={s.when}
                onChange={(e) => set(split.map((x, j) => (j === i ? { ...x, when: e.target.value } : x)))}
                className="text-xs"
              />
              {terms.length > 0 && (
                <Select
                  value=""
                  aria-label={`Insert a stored term for line ${i + 1}`}
                  className="mt-1 text-xs"
                  onChange={(e) => {
                    const t = terms.find((x) => x.id === e.target.value)
                    if (t) set(split.map((x, j) => (j === i ? { ...x, when: t.text ?? '' } : x)))
                  }}
                >
                  <option value="">Insert a stored term…</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-4 text-blocker hover:bg-blocker/5 hover:text-blocker"
              onClick={() => set(split.filter((_, j) => j !== i))}
              aria-label={`Remove term ${i + 1}`}
            >
              ✕
            </Button>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={split.length >= MAX_TERMS} onClick={() => set([...split, { pct: 0, when: '' }])}>
          + term
        </Button>
        {split.length >= MAX_TERMS && (
          <span className="text-xs text-navy-500">
            Slide 24 has {MAX_TERMS} term lines; a fourth would be dropped silently.
          </span>
        )}
      </div>
    </div>
  )
}
