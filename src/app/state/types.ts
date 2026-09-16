import type { Caveat, DeckSpec } from '../../compiler/types'

export interface CompileState {
  status: 'idle' | 'running' | 'done' | 'error'
  /** Spec hash the result belongs to. A mismatch disables Download. */
  hash?: string
  caveats: Caveat[]
  slides: number[]
  url?: string
  filename?: string
  elapsedMs?: number
  error?: string
}

/** The three About-the-Client clauses staff may deliberately leave out. */
export interface OmittedClauses {
  incorporatedOn: boolean
  capital: boolean
  activity: boolean
}

export interface UiState {
  step: number
  clientId?: string
  serviceId?: string
  proposalId?: string
  /**
   * "Bahraini" in "is a Bahraini limited liability company". ClientRecord has
   * no field for it, so it lives here until the contract gains one; paragraph 1
   * is regenerable from the client record, so losing it on reopen is survivable.
   */
  demonym: string
  omitClauses: OmittedClauses
  /** Once staff edit paragraph 1 by hand we stop regenerating it. */
  para1Edited: boolean
  compile: CompileState
}

export interface AppState {
  spec: DeckSpec
  ui: UiState
}

/** The slice that survives a reload. Blobs and caveats never persist. */
export interface PersistedDraft {
  version: 1
  spec: DeckSpec
  ui: Omit<UiState, 'compile'>
  savedAt: string
}
