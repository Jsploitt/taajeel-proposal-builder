import { useMemo } from 'react'
import { Button, cx } from '../ui'
import { DraftProvider, useDispatch, useDraft } from './state/DraftContext'
import { clearDraft, useAutosave, useResumableDraft } from './state/usePersistence'
import { LAST_STEP, STEPS, stepDef } from './steps'
import { Step1Client } from './steps/Step1Client'
import { Step2Engagement } from './steps/Step2Engagement'
import { Step3AboutClient } from './steps/Step3AboutClient'
import { Step4Scope } from './steps/Step4Scope'
import { Step5TimeFrame } from './steps/Step5TimeFrame'
import { Step6Additional } from './steps/Step6Additional'
import { Step7Fees } from './steps/Step7Fees'
import { Step8Review } from './steps/Step8Review'

export function App() {
  return (
    <DraftProvider>
      <Shell />
    </DraftProvider>
  )
}

const BODIES: Record<number, () => JSX.Element> = {
  1: Step1Client,
  2: Step2Engagement,
  3: Step3AboutClient,
  4: Step4Scope,
  5: Step5TimeFrame,
  6: Step6Additional,
  7: Step7Fees,
  8: Step8Review,
}

function Shell() {
  const state = useDraft()
  const dispatch = useDispatch()
  const { draft, dismiss } = useResumableDraft()
  useAutosave(state, !draft)

  const Body = BODIES[state.ui.step] ?? Step1Client
  const def = stepDef(state.ui.step)

  return (
    <div className="flex h-full flex-col">
      <Header />

      {draft && (
        <div className="flex items-center justify-between gap-4 border-b border-cream-600 bg-cream px-4 py-2">
          <p className="text-xs text-navy-900">
            An unfinished draft was saved{' '}
            <strong>{new Date(draft.savedAt).toLocaleString()}</strong>
            {draft.spec.client.displayName ? (
              <>
                {' '}
                for <strong>{draft.spec.client.displayName}</strong>
              </>
            ) : null}
            . Resume it?
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                dispatch({ type: 'LOAD_DRAFT', spec: draft.spec, ui: draft.ui })
                dismiss()
              }}
            >
              Resume
            </Button>
            <Button size="sm" onClick={() => dismiss(true)}>
              Discard and start fresh
            </Button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <StepRail />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-5">
            <header className="mb-4">
              <h1 className="text-xl font-semibold text-navy-900">
                {def.n}. {def.title}
              </h1>
              <p className="mt-0.5 max-w-3xl text-sm text-navy-500">{def.blurb}</p>
            </header>
            <Body />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}

function Header() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 bg-navy px-4 py-2 text-white">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="text-sm font-semibold tracking-wide">Taajeel · Proposal builder</span>
        <span className="truncate text-xs text-navy-100">
          {spec.client.displayName || 'New proposal'}
          {spec.engagement.referenceNumber ? ` · ${spec.engagement.referenceNumber}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-navy-300">
          {ui.compile.status === 'done' ? 'checked' : 'not checked'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="text-navy-100 hover:bg-navy-900 hover:text-white"
          onClick={() => {
            if (confirm('Discard this draft and start a new proposal? This cannot be undone.')) {
              clearDraft()
              dispatch({ type: 'RESET' })
            }
          }}
        >
          Discard draft
        </Button>
      </div>
    </header>
  )
}

function StepRail() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()

  /** Sections the compiler would drop, so the rail can grey the step out. */
  const dropped = useMemo(
    () => ({
      5: !spec.timeFrame.show || spec.timeFrame.steps.length === 0,
      6: !spec.additional.show || spec.additional.blocks.length === 0,
    }),
    [spec.timeFrame, spec.additional]
  )

  return (
    <nav className="w-56 shrink-0 overflow-y-auto border-r border-navy-100 bg-white py-2">
      <ol>
        {STEPS.map((s) => {
          const active = s.n === ui.step
          const off = (dropped as Record<number, boolean>)[s.n]
          return (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => dispatch({ type: 'GOTO_STEP', step: s.n })}
                className={cx(
                  'flex w-full items-start gap-2 border-l-2 px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-navy bg-cream-200 text-navy-900'
                    : 'border-transparent text-navy-500 hover:bg-cream-200'
                )}
              >
                <span className="mt-px w-4 shrink-0 font-mono text-xs tabular-nums text-navy-300">{s.n}</span>
                <span className="min-w-0">
                  <span className={cx('block text-sm', active && 'font-semibold')}>{s.title}</span>
                  <span className="block font-mono text-xs text-navy-300">
                    {s.slides.length === 0
                      ? '—'
                      : s.slides.length === 1
                        ? `slide ${s.slides[0]}`
                        : `slides ${s.slides[0]}–${s.slides[s.slides.length - 1]}`}
                  </span>
                  {off && <span className="block text-xs text-check">not in this deck</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Footer() {
  const { ui } = useDraft()
  const dispatch = useDispatch()
  const go = (n: number) => dispatch({ type: 'GOTO_STEP', step: Math.min(LAST_STEP, Math.max(1, n)) })
  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-navy-100 bg-white px-4 py-2">
      <Button onClick={() => go(ui.step - 1)} disabled={ui.step === 1}>
        ← {ui.step > 1 ? stepDef(ui.step - 1).title : 'Back'}
      </Button>
      <span className="font-mono text-xs text-navy-300">
        step {ui.step} of {LAST_STEP}
      </span>
      <Button variant="primary" onClick={() => go(ui.step + 1)} disabled={ui.step === LAST_STEP}>
        {ui.step < LAST_STEP ? stepDef(ui.step + 1).title : 'Review'} →
      </Button>
    </footer>
  )
}
