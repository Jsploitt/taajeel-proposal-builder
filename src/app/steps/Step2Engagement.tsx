import { useEffect, useState } from 'react'
import type { EngagementType } from '../../compiler/types'
import { Button, Callout, Card, CharCounter, Field, SectionHeader, Select, TextArea, TextInput } from '../../ui'
import { db } from '../data'
import type { ServiceRow } from '../data'
import { budgetFor } from '../deck/budgets'
import { useDispatch, useDraft } from '../state/DraftContext'

export function Step2Engagement() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()
  const e = spec.engagement
  const [services, setServices] = useState<ServiceRow[]>([])

  useEffect(() => {
    db.listServices().then(setServices)
  }, [])

  const set = (field: 'subject' | 'letterDate' | 'referenceNumber' | 'serviceDescription') => (value: string) =>
    dispatch({ type: 'SET_ENGAGEMENT_FIELD', field, value })

  function applyService(id: string) {
    const svc = services.find((s) => s.id === id)
    dispatch({ type: 'SET_UI', patch: { serviceId: id || undefined } })
    if (!svc) return
    // Seeds the wording from the service catalog, verbatim. Staff can edit it;
    // nothing is invented and the scope itself is seeded on step 4.
    dispatch({ type: 'SET_ENGAGEMENT_FIELD', field: 'subject', value: svc.defaultSubject })
    dispatch({ type: 'SET_ENGAGEMENT_FIELD', field: 'serviceDescription', value: svc.defaultServiceDescription })
    dispatch({ type: 'SET_ENGAGEMENT_TYPE', value: svc.defaultEngagementType })
  }

  const refBudget = budgetFor('LETTER.REFERENCE')

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader
          title="Service"
          description="Picking one seeds the subject, the service description and the scope steps on step 4."
        />
        <div className="p-4">
          <Field label="Service" hint="Optional — you can type everything by hand instead.">
            <Select value={ui.serviceId ?? ''} onChange={(ev) => applyService(ev.target.value)}>
              <option value="">— none —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Letter" slides={[1, 5]} />
        <div className="field-grid p-4">
          <Field
            label="Subject"
            slides={[1, 5]}
            tbc={!e.subject}
            className="md:col-span-2"
            hint="Appears on the cover and after “Subject: ” in the letter."
          >
            <TextArea rows={2} value={e.subject} onChange={(ev) => set('subject')(ev.target.value)} />
          </Field>

          <Field
            label="Letter date"
            slides={5}
            tbc={!e.letterDate}
            hint="Typed as it should read, e.g. 15 March 2026. Never taken from today’s date."
          >
            <TextInput value={e.letterDate} onChange={(ev) => set('letterDate')(ev.target.value)} />
          </Field>

          <Field
            label="Reference number"
            slides={5}
            tbc={!e.referenceNumber}
            aside={<CharCounter value={e.referenceNumber ?? ''} budget={refBudget} />}
            hint="Always an input — the scheme is undocumented and is never generated from a date."
          >
            <TextInput
              value={e.referenceNumber ?? ''}
              onChange={(ev) => set('referenceNumber')(ev.target.value)}
              className="font-mono"
            />
          </Field>

          <Field
            label="Service description"
            slides={5}
            tbc={!e.serviceDescription}
            className="md:col-span-2"
            hint="The tail of the opening sentence, after the Arabic brand run."
          >
            <TextArea rows={2} value={e.serviceDescription} onChange={(ev) => set('serviceDescription')(ev.target.value)} />
            <p className="mt-1 rounded border border-navy-100 bg-cream-200 px-2 py-1.5 text-xs leading-relaxed text-navy-500">
              We would like to thank you for your trust in <strong>taajeel</strong> | <strong>تعجيل</strong> to propose{' '}
              <strong>{e.serviceDescription || '[TO BE CONFIRMED]'}</strong>. (“Mission”/ “Assignment”).
            </p>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="Engagement type"
          slides={24}
          description="Projects carry a payment split; retainers carry a period instead."
        />
        <div className="flex flex-col gap-3 p-4">
          <Field label="Type" slides={24}>
            <Select
              value={e.type}
              onChange={(ev) => dispatch({ type: 'SET_ENGAGEMENT_TYPE', value: ev.target.value as EngagementType })}
            >
              <option value="project">Project</option>
              <option value="retainer">Retainer</option>
            </Select>
          </Field>
          {e.type === 'retainer' && (
            <Callout tone="info" title="Retainer">
              The payment split has been cleared — the compiler treats an empty split as the retainer path and prints
              the period instead. Set the period on step 7, and consider turning Time Frame off on step 5.
            </Callout>
          )}
        </div>
      </Card>

      {ui.serviceId && (
        <div>
          <Button onClick={() => dispatch({ type: 'GOTO_STEP', step: 4 })}>
            Seed the scope from this service →
          </Button>
        </div>
      )}
    </div>
  )
}
