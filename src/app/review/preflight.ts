/**
 * Everything Review can tell the user without paying for a compile.
 *
 * Two buckets:
 *  - unconfirmed: fields that will print [TO BE CONFIRMED]
 *  - findings: structural problems the compiler will also raise
 *
 * The TBC list is NOT re-derived here. buildValues() is the compiler's own
 * flattening of the spec into the strings that reach the slides; duplicating
 * its rules would guarantee eventual divergence.
 */
import { buildValues } from '../../compiler/compose'
import { TBC } from '../../compiler/types'
import type { CaveatSeverity, DeckSpec } from '../../compiler/types'
import { AGENCY_SLOTS, agencyIndex, SCOPE_STEP_SLOTS } from '../deck/template'
import { scopeStepBudget } from '../deck/budgets'
import { fieldFor } from './tokenFields'
import type { TokenField } from './tokenFields'

export interface UnconfirmedItem {
  token: string
  field?: TokenField
  /** True when TBC is embedded mid-sentence rather than being the whole value. */
  partial: boolean
}

export interface Finding {
  severity: CaveatSeverity
  message: string
  where?: string
  step?: number
}

export function unconfirmedFields(spec: DeckSpec): UnconfirmedItem[] {
  const values = buildValues(spec)
  const out: UnconfirmedItem[] = []
  for (const [token, v] of Object.entries(values)) {
    // includes, not ===: LETTER.OPENING_TAIL embeds TBC inside a sentence.
    if (typeof v === 'string' && v.includes(TBC)) {
      out.push({ token, field: fieldFor(token), partial: v !== TBC })
    }
  }
  return out.sort((a, b) => (a.field?.step ?? 99) - (b.field?.step ?? 99))
}

/** Structural problems, mirroring what compose() will report. */
export function localFindings(spec: DeckSpec): Finding[] {
  const out: Finding[] = []

  if (!spec.engagement.referenceNumber) {
    out.push({
      severity: 'blocker',
      message: 'No reference number. The scheme is undocumented, so it is always an input.',
      where: 'Letter',
      step: 2,
    })
  }

  if (!spec.fees.headline) {
    out.push({
      severity: 'blocker',
      message: 'No fee entered. A fee is a commercial commitment and is never derived.',
      where: 'Fees',
      step: 7,
    })
  }

  if (spec.aboutClient.length === 0) {
    out.push({ severity: 'blocker', message: 'About the Client has no content.', where: 'slide 12', step: 3 })
  }

  const split = spec.fees.paymentSplit ?? []
  if (split.length > 0) {
    const total = split.reduce((a, s) => a + s.pct, 0)
    if (total !== 100) {
      out.push({ severity: 'blocker', message: `Payment split totals ${total}%, not 100%.`, where: 'Fees', step: 7 })
    }
  }

  const steps = spec.scope[0]?.steps ?? []
  if (steps.length > SCOPE_STEP_SLOTS) {
    out.push({
      severity: 'blocker',
      message: `${steps.length} scope steps but the journey graphic only has ${SCOPE_STEP_SLOTS} slots; the extra steps are not shown.`,
      where: 'Scope of work',
      step: 4,
    })
  } else if (steps.length > 0 && steps.length < SCOPE_STEP_SLOTS) {
    out.push({
      severity: 'check',
      message: `The journey graphic is drawn for ${SCOPE_STEP_SLOTS} gears but this service has ${steps.length} steps; the surplus gear artwork remains and needs a designer.`,
      where: 'Scope of work',
      step: 4,
    })
  }

  if (!spec.client.logoPath) {
    out.push({
      severity: 'check',
      message: 'No client logo; the cover and About-the-Client pages keep the placeholder.',
      where: 'Cover',
      step: 1,
    })
  }

  // Character budgets, so a shrink caveat is not a surprise at the gate.
  steps.forEach((s, i) => {
    const budget = scopeStepBudget(i + 1)
    if (budget && s.label.length > budget) {
      out.push({
        severity: 'check',
        message: `Scope step ${i + 1} is ${s.label.length} characters against a budget of ${budget}; the type will be shrunk to fit.`,
        where: 'slide 14',
        step: 4,
      })
    }
  })

  // Agency marks: positions without artwork, and agencies with no logo file.
  const unplaced = steps
    .map((s, i) => ({ s, slot: i + 1 }))
    .filter(({ s, slot }) => s.agency && !AGENCY_SLOTS.includes(slot))
  if (unplaced.length) {
    out.push({
      severity: 'info',
      message: `The journey graphic has no logo position for ${unplaced
        .map(({ s, slot }) => `${s.agency} (step ${slot})`)
        .join(', ')}; those steps render without an agency mark.`,
      where: 'Scope of work',
      step: 4,
    })
  }

  const noArtwork = [...new Set(steps.map((s) => s.agency).filter(Boolean) as string[])].filter(
    (k) => !agencyIndex[k]?.file
  )
  if (noArtwork.length) {
    out.push({
      severity: 'check',
      message: `No artwork for agency ${noArtwork.join(', ')}; the mark is removed rather than left showing another agency.`,
      where: 'Scope of work',
      step: 4,
    })
  }

  return out
}

/**
 * Data the wizard collects that the current template cannot place.
 *
 * Kept as its own bucket so nobody reads "not rendered" as "you left it blank".
 * Every item here is a gap in the compiler/template, not in the user's input.
 */
export function notRendered(spec: DeckSpec): Finding[] {
  const out: Finding[] = []

  if (spec.client.countryCode) {
    out.push({
      severity: 'info',
      message:
        'The country flag on slide 12 is never swapped by the compiler, so it keeps the template artwork regardless of the country you selected.',
      where: 'slide 12',
      step: 1,
    })
  }

  if (spec.timeFrame.show && spec.timeFrame.steps.length > 0) {
    out.push({
      severity: 'info',
      message: `You entered ${spec.timeFrame.steps.length} Time Frame steps. The template has no fills for slides 17-18, so the section is included but its labels and durations are not printed.`,
      where: 'Time Frame',
      step: 5,
    })
  }

  if (spec.additional.show && spec.additional.blocks.length > 0) {
    out.push({
      severity: 'info',
      message: `You entered ${spec.additional.blocks.length} Additional blocks. The template has no fills for slides 20-22, so the section is included but its content is not printed.`,
      where: 'Additional',
      step: 6,
    })
  }

  if (spec.nonCovered.show && spec.nonCovered.items.length > 0) {
    out.push({
      severity: 'info',
      message: 'Non-covered items are stored with the proposal but have no section in the template, so they do not appear in the deck.',
      where: 'Non-covered',
      step: 6,
    })
  }

  if (spec.govFees.show && spec.govFees.rows.length > 0) {
    out.push({
      severity: 'info',
      message: `You entered ${spec.govFees.rows.length} government fee rows. Slide 25 is included but the template has no fills for it, so the rows are not printed.`,
      where: 'slide 25',
      step: 7,
    })
  }

  if (spec.rateCard.show && spec.rateCard.items.length > 0) {
    out.push({
      severity: 'info',
      message: 'Rate card items are stored with the proposal but have no section in the template, so they do not appear in the deck.',
      where: 'Fees',
      step: 7,
    })
  }

  if (spec.scope.length > 1) {
    out.push({
      severity: 'check',
      message:
        'A second scope block keeps slide 15, but nothing fills it — it will still show the source proposal’s text. Remove the block or have the template fixed first.',
      where: 'slide 15',
      step: 4,
    })
  }

  if (spec.fees.notes.length > 0 || spec.fees.currency) {
    out.push({
      severity: 'info',
      message:
        'Fee notes and the currency code are stored but never printed: slide 24 shows the headline exactly as typed. Include the currency in the fee itself if it should appear.',
      where: 'slide 24',
      step: 7,
    })
  }

  return out
}
