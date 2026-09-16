import { useEffect, useState } from 'react'
import { Button, Callout, Card, RepeatList, SectionHeader, TextInput, Toggle } from '../../../ui'
import { db } from '../../data'
import type { GovFeeTemplateRow } from '../../data'
import { useDispatch, useDraft } from '../../state/DraftContext'

export function GovFees() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()
  const [template, setTemplate] = useState<GovFeeTemplateRow[]>([])

  useEffect(() => {
    if (ui.serviceId) db.listGovFeeTemplate(ui.serviceId).then(setTemplate)
    else setTemplate([])
  }, [ui.serviceId])

  const rows = spec.govFees.rows
  const set = (next: typeof rows) => dispatch({ type: 'GOVFEES_SET_ROWS', rows: next })

  return (
    <Card>
      <SectionHeader
        title="Government fees"
        slides={25}
        description="Stored figures, typed per proposal. Nothing here is computed or totalled by the app."
        actions={
          template.length > 0 ? (
            <Button
              size="sm"
              onClick={() => set(template.map((t) => ({ label: t.label, amount: t.amount, note: t.note })))}
            >
              Load {template.length} stored rows
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-3 p-4">
        <Toggle
          checked={spec.govFees.show}
          onChange={(v) => dispatch({ type: 'SET_SECTION_SHOW', section: 'govFees', show: v })}
          label="Include the government fees slide"
          description="Slide 25 is dropped when this is off OR when there are no rows."
        />

        {spec.govFees.show && (
          <>
            <RepeatList
              items={rows}
              addLabel="row"
              empty="No rows. Load the stored rows above, or add them one at a time."
              onAdd={() => set([...rows, { label: '', amount: '' }])}
              onRemove={(i) => set(rows.filter((_, j) => j !== i))}
              onMove={(from, to) => {
                const next = [...rows]
                const [r] = next.splice(from, 1)
                next.splice(to, 0, r)
                set(next)
              }}
              renderItem={(r, i) => (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[14rem] flex-1">
                    <span className="mb-0.5 block text-xs text-navy-500">Label</span>
                    <TextInput
                      value={r.label}
                      onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    />
                  </div>
                  <div className="w-28">
                    <span className="mb-0.5 block text-xs text-navy-500">Amount</span>
                    <TextInput
                      value={r.amount}
                      onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                      className="text-right font-mono tabular-nums"
                    />
                  </div>
                  <div className="min-w-[12rem] flex-1">
                    <span className="mb-0.5 block text-xs text-navy-500">Note</span>
                    <TextInput
                      value={r.note ?? ''}
                      onChange={(e) =>
                        set(rows.map((x, j) => (j === i ? { ...x, note: e.target.value || undefined } : x)))
                      }
                    />
                  </div>
                </div>
              )}
            />

            {rows.length > 0 && (
              <Callout tone="info" title="Slide 25 is included, but not filled">
                The template has no fills for slide 25, so these rows are stored with the proposal but not printed.
              </Callout>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
