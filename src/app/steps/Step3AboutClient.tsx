import { useEffect, useMemo, useState } from 'react'
import type { AboutClientPara, ParaStyle } from '../../compiler/types'
import {
  Button,
  Callout,
  Card,
  Field,
  SectionHeader,
  SegmentEditor,
  SegmentPreview,
  Select,
  TextInput,
  cx,
} from '../../ui'
import { db } from '../data'
import type { BoilerplateRow } from '../data'
import { buildPara1Segments } from '../sentence/aboutClientPara1'
import { demonymFor } from '../sentence/demonyms'
import { useDispatch, useDraft } from '../state/DraftContext'

const STYLES: ParaStyle[] = ['body', 'subhead', 'small', 'emphasis']

const STYLE_HINT: Record<ParaStyle, string> = {
  body: 'Running prose',
  subhead: 'Bold lead-in line',
  small: 'Bulleted / smaller list line',
  emphasis: 'Standout closing line',
}

export function Step3AboutClient() {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()

  // Pre-fill the nationality adjective from the country code -- a lookup of
  // documented facts, not generation. Only ever fills a blank; a value staff
  // have confirmed or corrected is never overwritten.
  useEffect(() => {
    if (ui.demonym) return
    const guess = demonymFor(spec.client.countryCode)
    if (guess) dispatch({ type: 'SET_UI', patch: { demonym: guess } })
  }, [spec.client.countryCode, ui.demonym, dispatch])

  const generated = useMemo(
    () => buildPara1Segments({ client: spec.client, demonym: ui.demonym, omit: ui.omitClauses }),
    [spec.client, ui.demonym, ui.omitClauses]
  )

  // Paragraph 1 tracks the client record until staff edit it by hand, at which
  // point we stop and offer an explicit regenerate. Never overwrite typed text.
  useEffect(() => {
    if (ui.para1Edited) return
    const current = spec.aboutClient[0]
    const next = { style: 'body' as const, segments: generated }
    if (current && JSON.stringify(current) === JSON.stringify(next)) return
    if (current) dispatch({ type: 'ABOUT_SET_PARA', index: 0, para: next })
    else dispatch({ type: 'ABOUT_SET', paras: [next, ...spec.aboutClient] })
  }, [generated, ui.para1Edited, spec.aboutClient, dispatch])

  return (
    <div className="flex flex-col gap-4">
      <Para1Card generated={generated} />
      <ParagraphList />
      <SnippetLibrary />
    </div>
  )
}

function Para1Card({ generated }: { generated: AboutClientPara['segments'] }) {
  const { spec, ui } = useDraft()
  const dispatch = useDispatch()
  const para1 = spec.aboutClient[0]

  return (
    <Card>
      <SectionHeader
        title="Paragraph 1 — assembled from the client record"
        slides={12}
        description="Bold lands on the five variable fields. That alternation is what carries the deck's typography, so keep it."
        actions={
          ui.para1Edited ? (
            <Button
              size="sm"
              onClick={() => {
                dispatch({ type: 'ABOUT_SET_PARA', index: 0, para: { style: 'body', segments: generated } })
                dispatch({ type: 'SET_UI', patch: { para1Edited: false } })
              }}
            >
              Regenerate from client fields
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-3 p-4">
        <div className="field-grid">
          <Field
            label="Nationality adjective"
            slides={12}
            hint="“is a Bahraini limited liability company”. Not stored on the client record yet — see the Review notes."
          >
            <TextInput
              value={ui.demonym}
              placeholder={demonymFor(spec.client.countryCode) || 'e.g. Bahraini'}
              onChange={(e) => dispatch({ type: 'SET_UI', patch: { demonym: e.target.value } })}
            />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-navy-900">Omit a clause</span>
            <p className="text-xs text-navy-500">
              Leaving a field blank prints [TO BE CONFIRMED]. Tick here instead to drop the clause on purpose.
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              {(['incorporatedOn', 'capital', 'activity'] as const).map((k) => (
                <label key={k} className="flex items-center gap-1.5 text-xs text-navy-900">
                  <input
                    type="checkbox"
                    checked={ui.omitClauses[k]}
                    onChange={(e) => dispatch({ type: 'SET_OMIT_CLAUSE', clause: k, value: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-navy-300 text-navy focus:ring-navy-500"
                  />
                  {k === 'incorporatedOn' ? 'incorporation date' : k}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-navy-500">
            As it will read on slide 12
          </p>
          <div className="rounded border border-navy-100 bg-cream-200 p-3">
            <SegmentPreview segments={para1?.segments ?? generated} />
          </div>
        </div>

        {para1 && (
          <details>
            <summary className="cursor-pointer text-xs text-navy-500">Edit segments by hand</summary>
            <div className="mt-2">
              <SegmentEditor
                segments={para1.segments}
                onChange={(segments) => {
                  dispatch({ type: 'ABOUT_SET_PARA', index: 0, para: { ...para1, segments } })
                  dispatch({ type: 'SET_UI', patch: { para1Edited: true } })
                }}
              />
            </div>
          </details>
        )}
      </div>
    </Card>
  )
}

function ParagraphList() {
  const { spec } = useDraft()
  const dispatch = useDispatch()
  const paras = spec.aboutClient

  return (
    <Card>
      <SectionHeader
        title="Paragraphs"
        slides={12}
        description="Paragraph 1 is above. Everything after it comes from the snippet library or is typed here."
        actions={
          <Button size="sm" onClick={() => dispatch({ type: 'ABOUT_ADD', para: { style: 'body', segments: [{ text: '' }] } })}>
            + blank paragraph
          </Button>
        }
      />
      <div className="flex flex-col gap-2 p-4">
        {paras.length === 0 && (
          <Callout tone="blocker" title="About the Client has no content">
            The compiler refuses to build a deck with an empty About-the-Client page.
          </Callout>
        )}
        {paras.map((p, i) => (
          <div key={i} className={cx('rounded border p-2', i === 0 ? 'border-cream-600 bg-cream-200' : 'border-navy-100')}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-navy-300">{i + 1}</span>
              <Select
                value={p.style}
                onChange={(e) =>
                  dispatch({ type: 'ABOUT_SET_PARA', index: i, para: { ...p, style: e.target.value as ParaStyle } })
                }
                className="w-40"
                aria-label={`Paragraph ${i + 1} style`}
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s} — {STYLE_HINT[s]}
                  </option>
                ))}
              </Select>
              <div className="ml-auto flex gap-0.5">
                <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => dispatch({ type: 'ABOUT_MOVE', from: i, to: i - 1 })}>
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={i === paras.length - 1}
                  onClick={() => dispatch({ type: 'ABOUT_MOVE', from: i, to: i + 1 })}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={i === 0}
                  title={i === 0 ? 'Paragraph 1 is generated from the client record' : 'Remove'}
                  onClick={() => dispatch({ type: 'ABOUT_REMOVE', index: i })}
                  className="text-blocker hover:bg-blocker/5 hover:text-blocker"
                >
                  ✕
                </Button>
              </div>
            </div>
            {i === 0 ? (
              <SegmentPreview segments={p.segments} className="text-xs" />
            ) : (
              <SegmentEditor
                segments={p.segments}
                onChange={(segments) => dispatch({ type: 'ABOUT_SET_PARA', index: i, para: { ...p, segments } })}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function SnippetLibrary() {
  const dispatch = useDispatch()
  const [rows, setRows] = useState<BoilerplateRow[]>([])

  useEffect(() => {
    db.listBoilerplate('about_para').then(setRows)
  }, [])

  return (
    <Card>
      <SectionHeader
        title="Snippet library"
        description="Reproduced verbatim from past proposals — never translated, paraphrased or improved."
      />
      <ul className="divide-y divide-navy-100">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-3 px-4 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-navy-900">{r.label}</p>
              <p className="font-mono text-xs uppercase tracking-wide text-navy-300">
                {r.style}
                {r.locked ? ' · contains the Arabic brand run' : ''}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                dispatch({
                  type: 'ABOUT_ADD',
                  para: { style: r.style ?? 'body', segments: structuredClone(r.segments ?? [{ text: r.text ?? '' }]) },
                })
              }
            >
              Insert
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
