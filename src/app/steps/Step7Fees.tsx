import { useEffect, useState } from 'react'
import { computeVat } from '../../compiler/compose'
import { VAT_RATE } from '../../compiler/types'
import { Button, Callout, Card, Field, RepeatList, SectionHeader, TextArea, TextInput } from '../../ui'
import { db } from '../data'
import type { BoilerplateRow } from '../data'
import { useDispatch, useDraft } from '../state/DraftContext'
import { GovFees } from './step7/GovFees'
import { PaymentSplit } from './step7/PaymentSplit'
import { RateCard } from './step7/RateCard'

export function Step7Fees() {
  const { spec } = useDraft()
  const dispatch = useDispatch()
  const fees = spec.fees
  const [notes, setNotes] = useState<BoilerplateRow[]>([])

  useEffect(() => {
    db.listBoilerplate('fee_note').then(setNotes)
  }, [])

  // The only money the app calculates. Imported from the compiler so the
  // preview and the deck can never disagree; vatAmount is left unset in the
  // spec so a later fee edit cannot be beaten by a stale snapshot.
  const vat = computeVat(fees.headline)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader title="The fee" slides={24} />
        <div className="flex flex-col gap-3 p-4">
          <div className="field-grid">
            <Field
              label="Headline fee"
              slides={24}
              tbc={!fees.headline}
              hint="Typed per proposal. Never computed from the scope, the rate card or anything else."
            >
              <TextInput
                value={fees.headline ?? ''}
                placeholder="e.g. 35,000"
                onChange={(e) => dispatch({ type: 'SET_FEES_FIELD', field: 'headline', value: e.target.value })}
                className="text-right font-mono tabular-nums"
              />
            </Field>
            <Field label="Currency" slides={24} hint="Stored with the proposal but never printed — see below.">
              <TextInput
                value={fees.currency}
                onChange={(e) => dispatch({ type: 'SET_FEES_FIELD', field: 'currency', value: e.target.value })}
                className="font-mono"
              />
            </Field>
            <Field
              label={`VAT at ${VAT_RATE * 100}%`}
              slides={24}
              hint="Read-only. The only arithmetic the app performs on money."
            >
              <TextInput
                readOnly
                value={vat ?? ''}
                placeholder="[TO BE CONFIRMED]"
                className="bg-cream-200 text-right font-mono tabular-nums"
              />
            </Field>
          </div>

          <Callout tone="neutral" title="How slide 24 will read">
            <p className="mt-1 font-mono">
              Amount: {fees.headline || '[TO BE CONFIRMED]'} · VAT: {vat ?? '[TO BE CONFIRMED]'}
            </p>
            <p className="mt-1">
              The currency code is not added to the amount by the compiler. If &ldquo;{fees.currency} {fees.headline || '35,000'}&rdquo;
              is what should appear, type it into the fee itself.
            </p>
          </Callout>
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="Payment method"
          slides={24}
          description="Percentages and the sentence that follows each one."
        />
        <div className="p-4">
          <PaymentSplit />
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="Fee notes"
          description="Stored with the proposal. Slide 24's notes are template text, so these are not printed today."
          actions={
            notes.length > 0 ? (
              <Button size="sm" onClick={() => dispatch({ type: 'FEES_SET_NOTES', notes: notes.map((n) => n.text ?? n.label) })}>
                Load {notes.length} stored notes
              </Button>
            ) : undefined
          }
        />
        <div className="p-4">
          <RepeatList
            items={fees.notes}
            addLabel="note"
            empty="No notes."
            onAdd={() => dispatch({ type: 'FEES_SET_NOTES', notes: [...fees.notes, ''] })}
            onRemove={(i) => dispatch({ type: 'FEES_SET_NOTES', notes: fees.notes.filter((_, j) => j !== i) })}
            onMove={(from, to) => {
              const next = [...fees.notes]
              const [n] = next.splice(from, 1)
              next.splice(to, 0, n)
              dispatch({ type: 'FEES_SET_NOTES', notes: next })
            }}
            renderItem={(note, i) => (
              <TextArea
                rows={2}
                value={note}
                onChange={(e) =>
                  dispatch({ type: 'FEES_SET_NOTES', notes: fees.notes.map((x, j) => (j === i ? e.target.value : x)) })
                }
                className="text-xs"
              />
            )}
          />
        </div>
      </Card>

      <GovFees />
      <RateCard />
    </div>
  )
}
