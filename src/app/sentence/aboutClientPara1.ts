/**
 * Paragraph 1 of About the Client, assembled deterministically from the client
 * record.
 *
 * This reproduces fixtures/meridian.json paragraph 1 exactly, including the
 * typographic quotes and the trailing space on the final segment. Those quote
 * characters are literal U+201C/U+201D on purpose: they are what the template's
 * exemplar run carries.
 *
 * Bold is structural, not decoration. fillAboutClient clones the template's
 * bold_exemplar run for bold segments and regular_exemplar for the rest, so the
 * alternation below is what carries the deck's typography.
 *
 * A missing value substitutes [TO BE CONFIRMED] IN PLACE, keeping the bold
 * flag, so an unconfirmed number is visibly unconfirmed rather than silently
 * dropped. A clause is only removed when staff say so explicitly.
 */
import { TBC } from '../../compiler/types'
import type { AboutClientPara, ClientRecord, TextSegment } from '../../compiler/types'
import type { OmittedClauses } from '../state/types'

/** Merges runs of plain text so the deck gets the same run count as the source. */
function merge(segments: TextSegment[]): TextSegment[] {
  const out: TextSegment[] = []
  for (const s of segments) {
    if (s.text === '') continue
    const last = out[out.length - 1]
    if (last && !!last.bold === !!s.bold) last.text += s.text
    else out.push({ ...s })
  }
  return out
}

const value = (v: string | undefined) => (v && v.trim() !== '' ? v : TBC)

export interface Para1Input {
  client: ClientRecord
  /** "Bahraini". Not in ClientRecord; supplied by the UI. */
  demonym?: string
  omit?: Partial<OmittedClauses>
}

export function buildPara1Segments({ client, demonym, omit }: Para1Input): TextSegment[] {
  const c = client
  const segs: TextSegment[] = []

  // --- identity clause, always present
  segs.push({ text: value(c.legalName), bold: true })
  segs.push({
    text:
      ' (“the Client”) is a ' +
      [value(demonym), value(c.legalForm)].join(' ') +
      ' registered in ' +
      value(c.country) +
      ' under ' +
      value(c.registrationLabel) +
      ' ',
  })
  segs.push({ text: value(c.registrationNumber), bold: true })

  // --- incorporation clause
  if (!omit?.incorporatedOn) {
    segs.push({ text: '. The company was incorporated on ' })
    segs.push({ text: value(c.incorporatedOn), bold: true })
  }

  // --- capital clause
  if (!omit?.capital) {
    segs.push({ text: ' with an authorized, issued, and paid-up capital of ' })
    segs.push({ text: value(c.capital), bold: true })
  }

  // --- activity clause
  if (!omit?.activity) {
    segs.push({ text: ', and operates through an active commercial registration in the field of ' })
    segs.push({ text: value(c.activity), bold: true })
  }

  segs.push({ text: '. ' })
  return merge(segs)
}

export function buildPara1(input: Para1Input): AboutClientPara {
  return { style: 'body', segments: buildPara1Segments(input) }
}

/** Plain-text rendering, for the live preview and for length checks. */
export function segmentsToText(segments: TextSegment[]): string {
  return segments.map((s) => s.text).join('')
}
