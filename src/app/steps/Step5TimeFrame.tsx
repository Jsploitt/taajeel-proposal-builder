import type { ScopeStep } from '../../compiler/types'
import { Button, Callout, Card, NumberInput, RepeatList, SectionHeader, TextInput, Toggle } from '../../ui'
import { useDispatch, useDraft } from '../state/DraftContext'

export function Step5TimeFrame() {
  const { spec } = useDraft()
  const dispatch = useDispatch()
  const tf = spec.timeFrame
  const scopeSteps = spec.scope[0]?.steps ?? []

  const setSteps = (steps: ScopeStep[]) => dispatch({ type: 'TIMEFRAME_SET_STEPS', steps })
  const patch = (i: number, p: Partial<ScopeStep>) => setSteps(tf.steps.map((s, j) => (j === i ? { ...s, ...p } : s)))

  const totalDays = tf.steps.reduce((a, s) => a + (s.durationDays ?? 0), 0)
  const missing = tf.steps.filter((s) => s.durationDays === undefined).length

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader title="Include the Time Frame section" slides={[16, 17, 18]} />
        <div className="flex flex-col gap-3 p-4">
          <Toggle
            checked={tf.show}
            onChange={(v) => dispatch({ type: 'SET_SECTION_SHOW', section: 'timeFrame', show: v })}
            label="Show Time Frame"
            description="Retainers usually leave this off. The compiler drops slides 16–18 when it is off OR when there are no steps."
          />
          {tf.show && tf.steps.length === 0 && (
            <Callout tone="check">
              The section is switched on but has no steps, so the compiler will still drop it. Add steps below.
            </Callout>
          )}
          {spec.engagement.type === 'retainer' && tf.show && (
            <Callout tone="info">
              This is a retainer. Time Frame is usually omitted — but that is your call, not the app&rsquo;s.
            </Callout>
          )}
        </div>
      </Card>

      {tf.show && (
        <Card>
          <SectionHeader
            title="Steps and durations"
            slides={[17, 18]}
            description="Durations are never invented: a blank box means the step shows no duration."
            actions={
              scopeSteps.length > 0 ? (
                <Button
                  size="sm"
                  onClick={() => setSteps(scopeSteps.map((s) => ({ label: s.label, durationDays: s.durationDays })))}
                >
                  Copy {scopeSteps.length} labels from Scope
                </Button>
              ) : undefined
            }
          />
          <div className="flex flex-col gap-3 p-4">
            <Callout tone="neutral">
              Time Frame labels are usually shorter than the scope labels — in the reference proposal the two lists
              differ deliberately. Copy them as a starting point, then trim.
            </Callout>

            <RepeatList
              items={tf.steps}
              addLabel="step"
              empty="No steps yet."
              onAdd={() => setSteps([...tf.steps, { label: '' }])}
              onRemove={(i) => setSteps(tf.steps.filter((_, j) => j !== i))}
              onMove={(from, to) => {
                const next = [...tf.steps]
                const [s] = next.splice(from, 1)
                next.splice(to, 0, s)
                setSteps(next)
              }}
              renderItem={(s, i) => (
                <div className="flex items-end gap-2">
                  <div className="min-w-[14rem] flex-1">
                    <span className="mb-0.5 block text-xs text-navy-500">Label</span>
                    <TextInput value={s.label} onChange={(e) => patch(i, { label: e.target.value })} />
                  </div>
                  <div className="w-28">
                    <span className="mb-0.5 block text-xs text-navy-500">Days</span>
                    <NumberInput min={0} value={s.durationDays} onValueChange={(v) => patch(i, { durationDays: v })} />
                  </div>
                </div>
              )}
            />

            {tf.steps.length > 0 && (
              <p className="text-xs text-navy-500">
                {tf.steps.length} steps · <strong className="tabular-nums">{totalDays}</strong> days entered
                {missing > 0 && <span className="text-tbc"> · {missing} without a duration</span>}
                <span className="text-navy-300"> — the app does not add, pad or estimate these.</span>
              </p>
            )}

            {tf.steps.length > 16 && (
              <Callout tone="check" title="Over 16 steps keeps the continuation slide 18">
                Slide 18 has no fills, so it stays in the deck showing template text.
              </Callout>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
