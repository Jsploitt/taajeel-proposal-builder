import type {
  AboutClientPara,
  ClientRecord,
  DeckSpec,
  Engagement,
  EngagementType,
  Fees,
  GovFeeRow,
  RateCardItem,
  ScopeBlock,
  ScopeStep,
} from '../../compiler/types'
import type { CompileState, UiState } from './types'

/** Sections that share the { show, <array> } shape. */
export type ToggleSection = 'timeFrame' | 'additional' | 'nonCovered' | 'rateCard' | 'govFees'

export type Action =
  // --- navigation and UI
  | { type: 'GOTO_STEP'; step: number }
  | { type: 'SET_UI'; patch: Partial<Pick<UiState, 'clientId' | 'serviceId' | 'proposalId' | 'demonym' | 'para1Edited'>> }
  | { type: 'SET_OMIT_CLAUSE'; clause: keyof UiState['omitClauses']; value: boolean }

  // --- client
  | { type: 'LOAD_CLIENT'; client: ClientRecord; clientId?: string }
  | { type: 'SET_CLIENT_FIELD'; field: keyof ClientRecord; value: string }
  | { type: 'SET_LOGO'; logoPath?: string }

  // --- engagement
  | { type: 'SET_ENGAGEMENT_FIELD'; field: Exclude<keyof Engagement, 'type'>; value: string }
  | { type: 'SET_ENGAGEMENT_TYPE'; value: EngagementType }

  // --- about the client
  | { type: 'ABOUT_SET'; paras: AboutClientPara[] }
  | { type: 'ABOUT_SET_PARA'; index: number; para: AboutClientPara }
  | { type: 'ABOUT_ADD'; para: AboutClientPara }
  | { type: 'ABOUT_REMOVE'; index: number }
  | { type: 'ABOUT_MOVE'; from: number; to: number }

  // --- scope
  | { type: 'SCOPE_SET_BLOCK'; index: number; patch: Partial<Omit<ScopeBlock, 'steps'>> }
  | { type: 'SCOPE_SET_STEPS'; index: number; steps: ScopeStep[] }
  | { type: 'SCOPE_ADD_BLOCK' }
  | { type: 'SCOPE_REMOVE_BLOCK'; index: number }

  // --- optional sections
  | { type: 'SET_SECTION_SHOW'; section: ToggleSection; show: boolean }
  | { type: 'TIMEFRAME_SET_STEPS'; steps: ScopeStep[] }
  | { type: 'ADDITIONAL_SET_BLOCKS'; blocks: { title: string; steps: string[] }[] }
  | { type: 'NONCOVERED_SET_ITEMS'; items: string[] }
  | { type: 'RATECARD_SET_ITEMS'; items: RateCardItem[] }
  | { type: 'GOVFEES_SET_ROWS'; rows: GovFeeRow[] }

  // --- fees
  | { type: 'SET_FEES_FIELD'; field: 'headline' | 'currency' | 'period'; value: string }
  | { type: 'FEES_SET_SPLIT'; split: NonNullable<Fees['paymentSplit']> | undefined }
  | { type: 'FEES_SET_NOTES'; notes: string[] }

  // --- compile lifecycle
  | { type: 'COMPILE_START' }
  | { type: 'COMPILE_DONE'; result: Omit<CompileState, 'status'> }
  | { type: 'COMPILE_ERROR'; error: string }

  // --- whole-document
  | { type: 'LOAD_DRAFT'; spec: DeckSpec; ui: Omit<UiState, 'compile'> }
  | { type: 'LOAD_SPEC'; spec: DeckSpec; proposalId?: string; clientId?: string }
  | { type: 'RESET' }
