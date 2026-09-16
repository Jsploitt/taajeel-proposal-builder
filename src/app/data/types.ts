/**
 * Row types mirroring the planned Supabase tables. proposals.spec holds the
 * whole DeckSpec as jsonb, so any past proposal re-renders or re-opens as the
 * next version.
 */
import type { ClientRecord, DeckSpec, EngagementType, ParaStyle, TextSegment } from '../../compiler/types'

export interface ClientRow extends ClientRecord {
  id: string
  updatedAt: string
}

export interface ServiceRow {
  id: string
  name: string
  /** Seeds engagement.type, but the user can override it. */
  defaultEngagementType: EngagementType
  /** Verbatim from past proposals. Never paraphrased. */
  scopeTitle: string
  scopeIntro: string
  defaultSubject: string
  defaultServiceDescription: string
}

export interface ScopeStepRow {
  id: string
  serviceId: string
  position: number
  label: string
  durationDays?: number
  /** Agency key from template/assets/agencies/index.json. */
  agency?: string
}

export type BoilerplateKind =
  | 'about_para'
  | 'scope_intro'
  | 'fee_note'
  | 'payment_term'
  | 'non_covered'
  | 'additional_block'

export interface BoilerplateRow {
  id: string
  kind: BoilerplateKind
  /** Shown in the picker. Not part of the deck. */
  label: string
  style?: ParaStyle
  /** Stored as segments, not markdown, so reuse is byte-exact. */
  segments?: TextSegment[]
  /** Plain-text snippets (fee notes, non-covered items, additional steps). */
  text?: string
  /** For additional_block: the block's ordered steps. */
  steps?: string[]
  /** For payment_term: the percentage it is normally used at. */
  pct?: number
  /** For about_para: whether the text is fixed brand furniture (Arabic run). */
  locked?: boolean
}

export interface RateCardRow {
  id: string
  label: string
  amount: string
  unit?: string
  /** Ticked by default in the Fees step. Staff choose per proposal. */
  defaultOn: boolean
}

export interface GovFeeTemplateRow {
  id: string
  serviceId: string
  label: string
  amount: string
  note?: string
}

export interface ProposalRow {
  id: string
  clientId: string
  /** The whole contract, verbatim. */
  spec: DeckSpec
  createdAt: string
  updatedAt: string
}
