import { useMemo, useState } from 'react'
import { resolveSections } from '../../compiler/compose'
import { TBC } from '../../compiler/types'
import type { Caveat } from '../../compiler/types'
import { Button, Callout, Card, CaveatRow, SectionHeader, Spinner } from '../../ui'
import { db } from '../data'
import { compileDraft, specHash } from '../deck/compile'
import { makeDeckUrl, triggerDownload } from '../deck/download'
import { slideMap } from '../deck/template'
import { localFindings, notRendered, unconfirmedFields } from '../review/preflight'
import type { Finding } from '../review/preflight'
import { useDispatch, useDraft } from '../state/DraftContext'

export function Step8Review() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()
  const [saving, setSaving] = useState<string | null>(null)

  const hash = useMemo(() => specHash(spec), [spec])
  const unconfirmed = useMemo(() => unconfirmedFields(spec), [spec])
  const findings = useMemo(() => localFindings(spec), [spec])
  const gaps = useMemo(() => notRendered(spec), [spec])
  const sections = useMemo(() => resolveSections(spec, slideMap), [spec])

  const compile = ui.compile
  const current = compile.status === 'done' && compile.hash === hash
  const blockers = compile.caveats.filter((c) => c.severity === 'blocker')
  const checks = compile.caveats.filter((c) => c.severity === 'check')
  const infos = compile.caveats.filter((c) => c.severity === 'info')
  const localBlockers = findings.filter((f) => f.severity === 'blocker')
  const canDownload = current && blockers.length === 0

  async function run() {
    dispatch({ type: 'COMPILE_START' })
    try {
      const res = await compileDraft(spec)
      dispatch({
        type: 'COMPILE_DONE',
        result: {
          hash: res.hash,
          caveats: res.caveats,
          slides: res.slides,
          filename: res.filename,
          elapsedMs: res.elapsedMs,
          url: makeDeckUrl(res.blob),
        },
      })
    } catch (e) {
      dispatch({ type: 'COMPILE_ERROR', error: String(e) })
    }
  }

  async function save() {
    setSaving('saving')
    try {
      const row = await db.saveProposal({
        id: ui.proposalId,
        clientId: ui.clientId ?? 'unsaved',
        spec,
      })
      dispatch({ type: 'SET_UI', patch: { proposalId: row.id } })
      setSaving(`saved ${new Date(row.updatedAt).toLocaleTimeString()}`)
    } catch (e) {
      setSaving(String(e))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader
          title="The gate"
          description="Download is enabled only when a current check comes back with no blockers."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => void save()}>
                {saving === 'saving' ? <Spinner /> : null} Save proposal
              </Button>
              <Button variant="primary" onClick={() => void run()} disabled={compile.status === 'running'}>
                {compile.status === 'running' ? <Spinner /> : null}
                {compile.status === 'running' ? 'Compiling…' : current ? 'Re-check' : 'Compile & check'}
              </Button>
              <Button
                variant={canDownload ? 'primary' : 'secondary'}
                disabled={!canDownload}
                onClick={() => compile.url && compile.filename && triggerDownload(compile.url, compile.filename)}
              >
                Download .pptx
              </Button>
            </div>
          }
        />
        <div className="flex flex-col gap-3 p-4">
          {saving && saving !== 'saving' && <p className="text-xs text-navy-500">{saving}</p>}

          {compile.status === 'error' && (
            <Callout tone="blocker" title="The compile failed">
              {compile.error}
            </Callout>
          )}

          {compile.status === 'idle' && (
            <Callout tone="neutral" title="Not checked yet">
              The findings below are what we can tell without building the deck. Run the check to get the compiler&rsquo;s
              own caveats — it takes a couple of seconds.
            </Callout>
          )}

          {compile.status === 'done' && !current && (
            <Callout tone="check" title="The spec changed since the last check">
              Re-check before downloading — otherwise you would be shipping a file built from an older version.
            </Callout>
          )}

          {current && blockers.length === 0 && (
            <Callout tone="info" title="Clear to download">
              {compile.slides.length} slides, built in {compile.elapsedMs} ms.{' '}
              {checks.length > 0 && `${checks.length} thing${checks.length === 1 ? '' : 's'} to look at, but nothing blocking.`}
            </Callout>
          )}

          {current && blockers.length > 0 && (
            <Callout tone="blocker" title={`${blockers.length} blocker${blockers.length === 1 ? '' : 's'}`}>
              Download stays disabled until these are fixed.
            </Callout>
          )}

          {compile.status === 'idle' && localBlockers.length > 0 && (
            <Callout tone="blocker" title={`${localBlockers.length} problem${localBlockers.length === 1 ? '' : 's'} will block the download`}>
              Fix these before running the check.
            </Callout>
          )}
        </div>
      </Card>

      {current && compile.caveats.length > 0 && (
        <FindingCard
          title="From the compiler"
          description="Reported by compose() against the deck it actually built."
          items={[...blockers, ...checks, ...infos].map((c) => ({ ...c }))}
        />
      )}

      {findings.length > 0 && (
        <FindingCard
          title="Checks"
          description="Structural problems, available without compiling."
          items={findings}
          onGo={(step) => dispatch({ type: 'GOTO_STEP', step })}
        />
      )}

      <Card>
        <SectionHeader
          title={`Unconfirmed — ${unconfirmed.length} field${unconfirmed.length === 1 ? '' : 's'}`}
          description={`Each of these prints a visible ${TBC} on the slide. That is a legitimate output, not an error — but it should be deliberate.`}
        />
        {unconfirmed.length === 0 ? (
          <p className="px-4 py-3 text-xs text-navy-500">Nothing unconfirmed.</p>
        ) : (
          <ul>
            {unconfirmed.map((u) => (
              <CaveatRow
                key={u.token}
                severity="tbc"
                where={u.field ? `slide ${u.field.slide} · ${u.token}` : u.token}
                message={
                  <>
                    {u.field?.label ?? u.token}
                    {u.partial && <span className="text-navy-300"> — inside a sentence</span>}
                  </>
                }
                action={
                  u.field ? (
                    <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'GOTO_STEP', step: u.field!.step })}>
                      Go →
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </ul>
        )}
      </Card>

      {gaps.length > 0 && (
        <FindingCard
          title="Captured, but not rendered by the current template"
          description="Your input is stored with the proposal. These are gaps in the compiler and template, not in what you entered."
          items={gaps}
          onGo={(step) => dispatch({ type: 'GOTO_STEP', step })}
        />
      )}

      <Card>
        <SectionHeader title="Sections this deck will contain" description="Computed by the compiler's own resolveSections()." />
        <p className="px-4 py-3 font-mono text-xs leading-relaxed text-navy-500">{sections.join(' · ')}</p>
      </Card>
    </div>
  )
}

function FindingCard({
  title,
  description,
  items,
  onGo,
}: {
  title: string
  description: string
  items: (Finding | Caveat)[]
  onGo?: (step: number) => void
}) {
  return (
    <Card>
      <SectionHeader title={title} description={description} />
      <ul>
        {items.map((f, i) => {
          const step = (f as Finding).step
          return (
            <CaveatRow
              key={i}
              severity={f.severity}
              where={f.where}
              message={f.message}
              action={
                onGo && step ? (
                  <Button size="sm" variant="ghost" onClick={() => onGo(step)}>
                    Go →
                  </Button>
                ) : undefined
              }
            />
          )
        })}
      </ul>
    </Card>
  )
}
