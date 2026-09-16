import type { BoilerplateRow } from '../data/types'
import { meridianSpec } from './meridian'

/**
 * The snippet library. Text lifted from past proposals is reproduced verbatim
 * -- never translated, paraphrased or "improved" -- so these are derived from
 * the fixture's own paragraphs rather than retyped. Segments, not markdown, so
 * bold runs and the typographic quotes survive byte-exact.
 */
const para = (i: number) => meridianSpec.aboutClient[i]

export const boilerplate: BoilerplateRow[] = [
  // --- About the Client: reusable narrative and the MISA requirement block
  {
    id: 'bp-about-accordingly',
    kind: 'about_para',
    label: 'Accordingly — the Client is seeking from Taajeel …',
    style: para(3).style,
    segments: para(3).segments,
    locked: true, // carries the Arabic brand run; edit the tail, not the run
  },
  {
    id: 'bp-about-req-head',
    kind: 'about_para',
    label: 'Subhead — The Investment requirements:',
    style: para(4).style,
    segments: para(4).segments,
  },
  {
    id: 'bp-about-req-intro',
    kind: 'about_para',
    label: 'Foreign LLC — MISA investment licence requirements',
    style: para(5).style,
    segments: para(5).segments,
  },
  {
    id: 'bp-about-req-capital',
    kind: 'about_para',
    label: 'There are no minimum capital requirements.',
    style: para(6).style,
    segments: para(6).segments,
  },
  {
    id: 'bp-about-req-commit',
    kind: 'about_para',
    label: 'No minimum investment commitment in the first five years.',
    style: para(7).style,
    segments: para(7).segments,
  },
  {
    id: 'bp-about-docs-head',
    kind: 'about_para',
    label: 'Subhead — documents the client must provide',
    style: para(8).style,
    segments: para(8).segments,
  },
  { id: 'bp-about-doc-aoa', kind: 'about_para', label: 'Document — Article of Association', style: para(9).style, segments: para(9).segments },
  { id: 'bp-about-doc-licence', kind: 'about_para', label: 'Document — Trade Licence', style: para(10).style, segments: para(10).segments },
  { id: 'bp-about-doc-financials', kind: 'about_para', label: 'Document — Financial Statements', style: para(11).style, segments: para(11).segments },
  { id: 'bp-about-doc-poa', kind: 'about_para', label: 'Document — Power of Attorney', style: para(12).style, segments: para(12).segments },
  {
    id: 'bp-about-doc-attestation',
    kind: 'about_para',
    label: 'Emphasis — MOFA and Saudi Embassy attestation',
    style: para(13).style,
    segments: para(13).segments,
  },

  // --- Scope intros
  { id: 'bp-scope-intro-foreign', kind: 'scope_intro', label: 'Foreign company formation intro', text: meridianSpec.scope[0].intro },

  // --- Payment terms (the `when` sentence that follows the percentage)
  ...(meridianSpec.fees.paymentSplit ?? []).map((s, i) => ({
    id: `bp-pay-${i + 1}`,
    kind: 'payment_term' as const,
    label: s.when,
    text: s.when,
    pct: s.pct,
  })),

  // --- Fee notes
  ...meridianSpec.fees.notes.map((n, i) => ({
    id: `bp-feenote-${i + 1}`,
    kind: 'fee_note' as const,
    label: n,
    text: n,
  })),

  // --- Non-covered items
  {
    id: 'bp-nc-gov',
    kind: 'non_covered',
    label: 'Government fees are not covered',
    text: 'Government fees and any third-party charges are not covered by this scope of work.',
  },
  {
    id: 'bp-nc-translation',
    kind: 'non_covered',
    label: 'Legal translation and attestation',
    text: 'Legal translation, notarisation and embassy attestation of client documents are not covered by this scope of work.',
  },
  {
    id: 'bp-nc-tax',
    kind: 'non_covered',
    label: 'Tax and audit advisory',
    text: 'Tax advisory, bookkeeping and statutory audit are not covered by this scope of work.',
  },

  // --- Additional / optional blocks
  ...meridianSpec.additional.blocks.map((b, i) => ({
    id: `bp-add-${i + 1}`,
    kind: 'additional_block' as const,
    label: b.title,
    text: b.title,
    steps: b.steps,
  })),
]
