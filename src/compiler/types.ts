/**
 * The compiler contract.
 *
 * A DeckSpec is everything needed to build one proposal. It is stored verbatim
 * in Supabase (proposals.spec) so any past proposal re-renders identically or
 * re-opens as the next version.
 *
 * Rules encoded here, from template/FORENSICS.md:
 *  - No fee, duration, date or reference number is ever computed by the app,
 *    except VAT (a fixed 15%) and the payment-split arithmetic.
 *  - A missing value renders a visible [TO BE CONFIRMED], never a blank and
 *    never a previous client's value.
 *  - Text lifted from past proposals is emitted verbatim, never rewritten.
 */

export type EngagementType = 'project' | 'retainer'

/** Shown wherever a required value is absent. Never silently omit. */
export const TBC = '[TO BE CONFIRMED]'

/** Fixed by Saudi law, exact in all three source proposals. */
export const VAT_RATE = 0.15

export interface ClientRecord {
  /** Full legal name, e.g. "HAVENSTONE CONSULTING W.L.L" (signoff, about-client). */
  legalName: string
  /** Cover treatment, e.g. "HAVENSTONE Consulting W.L.L". */
  displayName: string
  /** e.g. "limited liability company". */
  legalForm?: string
  country?: string
  /** ISO 3166-1 alpha-2, drives the bundled flag. Absent = flag shape removed. */
  countryCode?: string
  /** "Commercial Registration No." | "Unified National Number" | "MISA License No." */
  registrationLabel?: string
  registrationNumber?: string
  incorporatedOn?: string
  capital?: string
  activity?: string
  address?: string
  attention?: string
  mobile?: string
  email?: string
  web?: string
  /** Supabase Storage path. One logo; the cover puts it on a white plate. */
  logoPath?: string
}

export interface Engagement {
  /** Letter + cover subject line. */
  subject: string
  /** Rendered as given. Never derived from today's date. */
  letterDate: string
  /** Scheme UNKNOWN -- always an input. Absent renders [TO BE CONFIRMED]. */
  referenceNumber?: string
  type: EngagementType
  /** Tail of the letter's opening sentence, after the Arabic brand run. */
  serviceDescription: string
}

export interface TextSegment {
  text: string
  bold?: boolean
}

export type ParaStyle = 'body' | 'subhead' | 'small' | 'emphasis'

export interface AboutClientPara {
  style: ParaStyle
  segments: TextSegment[]
}

export interface ScopeStep {
  label: string
  /** Time Frame only. Never invented -- absent means the step shows no duration. */
  durationDays?: number
  /**
   * Government agency key from template/assets/agencies/index.json
   * (misa, sbc, moc, notary, aamaly, qiwa, hrsd, gosi, muqeem,
   * national_address, zatca, riyadh_chamber).
   *
   * The journey graphic draws an agency mark beside certain gears. Without
   * this the mark is whatever the source deck happened to have, so reordering
   * steps silently shows the wrong government logo beside a step.
   * Absent = the mark is removed rather than left wrong.
   */
  agency?: string
}

export interface ScopeBlock {
  /** e.g. "Setup the Company". */
  title: string
  intro: string
  steps: ScopeStep[]
}

export interface Fees {
  /** Typed per proposal. Never computed from scope. */
  headline?: string
  currency: string
  /** Derived: headline * VAT_RATE. The only money the app calculates. */
  vatAmount?: string
  /** Retainers only, e.g. "monthly subscription". */
  period?: string
  /** Project work only. P1 and P2 both use 50/35/15. */
  paymentSplit?: { pct: number; when: string }[]
  notes: string[]
}

export interface RateCardItem {
  label: string
  amount: string
  unit?: string
}

export interface GovFeeRow {
  label: string
  amount: string
  note?: string
}

export interface DeckSpec {
  client: ClientRecord
  engagement: Engagement
  aboutClient: AboutClientPara[]
  scope: ScopeBlock[]
  timeFrame: { show: boolean; steps: ScopeStep[] }
  additional: { show: boolean; blocks: { title: string; steps: string[] }[] }
  nonCovered: { show: boolean; items: string[] }
  fees: Fees
  rateCard: { show: boolean; items: RateCardItem[] }
  govFees: { show: boolean; rows: GovFeeRow[] }
}

export type CaveatSeverity = 'blocker' | 'check' | 'info'

export interface Caveat {
  severity: CaveatSeverity
  message: string
  /** Where in the deck the reader should look. */
  where?: string
}

export interface CompileResult {
  blob: Uint8Array
  caveats: Caveat[]
  /** Slides kept, in final order, for the TOC and for debugging. */
  slides: number[]
  filename: string
}

// ---------------------------------------------------------------- slide map

export type FillMode =
  | 'text' | 'text_multi' | 'run' | 'runs' | 'frame' | 'rich'
  | 'picture' | 'table' | 'remove' | 'name'

export interface FillPlanStep {
  literal?: string
  token?: string
  neutral?: string
  rpr?: number
}

export interface Fill {
  slide: number
  shape: number
  /** Stable name of the SHAPE in the template. Several fills can share one. */
  shape_name?: string
  /** Identifies the VALUE this fill supplies. Unique across the deck. */
  token: string
  mode: FillMode
  para?: number
  run?: number
  neutral?: string | string[]
  plan?: FillPlanStep[]
  paras?: { i: number; runs: { text: string; rpr?: number }[] }[]
  style_exemplars?: Record<ParaStyle, number>
  bold_exemplar?: { para: number; run: number }
  regular_exemplar?: { para: number; run: number }
  keep_para0?: boolean
  clear_rest?: boolean
  tabstop_right?: boolean
  budget?: number
  agency_slot?: number
  agency_default?: string
  plate?: boolean
  note?: string
}

export interface SlideMap {
  template: string
  slide_count: number
  boilerplate_slides: number[]
  sections: { key: string; slides: number[] }[]
  optional_sections: Record<string, string[]>
  fills: Fill[]
}
