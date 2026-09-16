import { useEffect, useState } from 'react'
import type { ScopeStep } from '../../compiler/types'
import { Button, Callout, Card, CharCounter, Field, RepeatList, SectionHeader, Select, TextArea, TextInput } from '../../ui'
import { db } from '../data'
import type { ServiceRow } from '../data'
import { scopeStepBudget } from '../deck/budgets'
import { AGENCY_DEFAULT_BY_SLOT, AGENCY_SLOTS, SCOPE_STEP_SLOTS, agencyIndex } from '../deck/template'
import { useDispatch, useDraft } from '../state/DraftContext'

const AGENCY_OPTIONS = Object.entries(agencyIndex)
  .map(([key, v]) => ({ key, label: v.label, hasArtwork: !!v.file }))
  .sort((a, b) => a.label.localeCompare(b.label))

export function Step4Scope() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()
  const [services, setServices] = useState<ServiceRow[]>([])

  useEffect(() => {
    db.listServices().then(setServices)
  }, [])

  const block = spec.scope[0] ?? { title: '', intro: '', steps: [] }
  const steps = block.steps
  const over = steps.length > SCOPE_STEP_SLOTS

  async function seedFromService(id: string) {
    const svc = services.find((s) => s.id === id)
    if (!svc) return
    const rows = await db.listScopeSteps(id)
    dispatch({ type: 'SET_UI', patch: { serviceId: id } })
    dispatch({ type: 'SCOPE_SET_BLOCK', index: 0, patch: { title: svc.scopeTitle, intro: svc.scopeIntro } })
    dispatch({
      type: 'SCOPE_SET_STEPS',
      index: 0,
      steps: rows.map((r) => ({ label: r.label, durationDays: r.durationDays, agency: r.agency })),
    })
  }

  const setSteps = (next: ScopeStep[]) => dispatch({ type: 'SCOPE_SET_STEPS', index: 0, steps: next })
  const patchStep = (i: number, patch: Partial<ScopeStep>) =>
    setSteps(steps.map((s, j) => (j === i ? { ...s, ...patch } : s)))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader
          title="Scope block"
          slides={14}
          description="Only the first block is rendered today — see the note at the bottom of this step."
          actions={
            <Select
              value=""
              onChange={(e) => {
                void seedFromService(e.target.value)
                e.currentTarget.value = ''
              }}
              className="w-56"
              aria-label="Seed steps from a service"
            >
              <option value="">Seed from service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          }
        />
        <div className="flex flex-col gap-3 p-4">
          <Field label="Block title" slides={14} tbc={!block.title} hint="Rendered as “Scope of work | {title}:”.">
            <TextInput
              value={block.title}
              onChange={(e) => dispatch({ type: 'SCOPE_SET_BLOCK', index: 0, patch: { title: e.target.value } })}
            />
          </Field>
          <Field label="Intro paragraph" slides={14} tbc={!block.intro}>
            <TextArea
              rows={2}
              value={block.intro}
              onChange={(e) => dispatch({ type: 'SCOPE_SET_BLOCK', index: 0, patch: { intro: e.target.value } })}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="Steps"
          slides={14}
          description={`The journey graphic is drawn for ${SCOPE_STEP_SLOTS} gears. Positions ${AGENCY_SLOTS.join(', ')} carry an agency mark.`}
          actions={
            <span className="font-mono text-xs tabular-nums text-navy-300">
              {steps.length}/{SCOPE_STEP_SLOTS}
            </span>
          }
        />
        <div className="flex flex-col gap-3 p-4">
          {over && (
            <Callout tone="blocker" title={`${steps.length} steps is more than the graphic can show`}>
              The journey graphic has {SCOPE_STEP_SLOTS} slots. The extra steps are dropped from the deck — this blocks
              the download.
            </Callout>
          )}

          <RepeatList
            items={steps}
            addLabel="step"
            empty={
              ui.serviceId ? (
                <span className="flex flex-col items-center gap-2">
                  No steps yet.
                  <Button size="sm" variant="primary" onClick={() => void seedFromService(ui.serviceId!)}>
                    Seed from {services.find((s) => s.id === ui.serviceId)?.name ?? 'the selected service'}
                  </Button>
                </span>
              ) : (
                'No steps yet. Seed them from a service above, or add them one at a time.'
              )
            }
            onAdd={() => setSteps([...steps, { label: '' }])}
            onRemove={(i) => setSteps(steps.filter((_, j) => j !== i))}
            onMove={(from, to) => {
              const next = [...steps]
              const [s] = next.splice(from, 1)
              next.splice(to, 0, s)
              setSteps(next)
            }}
            rowNote={(i) => <SlotNote index={i} agency={steps[i]?.agency} />}
            renderItem={(s, i) => (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[16rem] flex-1">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-xs text-navy-500">Label</span>
                    <CharCounter value={s.label} budget={scopeStepBudget(i + 1)} />
                  </div>
                  <TextInput value={s.label} onChange={(e) => patchStep(i, { label: e.target.value })} />
                </div>
                <div className="w-52">
                  <span className="mb-0.5 block text-xs text-navy-500">Government agency</span>
                  <Select value={s.agency ?? ''} onChange={(e) => patchStep(i, { agency: e.target.value || undefined })}>
                    <option value="">— no mark —</option>
                    {AGENCY_OPTIONS.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                        {a.hasArtwork ? '' : ' (no artwork)'}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          />
        </div>
      </Card>

      {spec.scope.length > 1 ? (
        <Callout tone="check" title="A second scope block keeps slide 15, but nothing fills it">
          Slide 15 would still show the source proposal&rsquo;s text. Remove the block, or have the template fixed first.
          <div className="mt-2">
            <Button size="sm" variant="danger" onClick={() => dispatch({ type: 'SCOPE_REMOVE_BLOCK', index: 1 })}>
              Remove the second block
            </Button>
          </div>
        </Callout>
      ) : (
        <Callout tone="info">
          Only one scope block is rendered today. Adding a second keeps slide 15 in the deck but nothing fills it.
          <div className="mt-2">
            <Button size="sm" onClick={() => dispatch({ type: 'SCOPE_ADD_BLOCK' })}>
              Add a second block anyway
            </Button>
          </div>
        </Callout>
      )}
    </div>
  )
}

/** Position-specific warnings: the mark is drawn per POSITION, not per step. */
function SlotNote({ index, agency }: { index: number; agency?: string }) {
  const slot = index + 1
  const hasSlot = AGENCY_SLOTS.includes(slot)
  const fallback = AGENCY_DEFAULT_BY_SLOT.get(slot)

  if (!agency) {
    return hasSlot ? (
      <p className="mt-1 text-xs text-navy-300">
        Position {slot} carries a mark (template default: {fallback}). With no agency chosen the mark is removed rather
        than left wrong.
      </p>
    ) : null
  }

  if (!hasSlot) {
    return (
      <p className="mt-1 text-xs text-check">
        Position {slot} has no logo place on the graphic — this step renders without an agency mark.
      </p>
    )
  }

  if (!agencyIndex[agency]?.file) {
    return (
      <p className="mt-1 text-xs text-check">
        No artwork bundled for {agency}; the mark is removed rather than left showing another agency.
      </p>
    )
  }

  return null
}
