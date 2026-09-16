import type { DeckSpec } from '../../compiler/types'
import type {
  BoilerplateKind,
  BoilerplateRow,
  ClientRow,
  GovFeeTemplateRow,
  ProposalRow,
  RateCardRow,
  ScopeStepRow,
  ServiceRow,
} from './types'

/**
 * Every read and write the app performs. Swapping Supabase in is a change to
 * data/index.ts alone -- which is why the asset plumbing lives here too: it is
 * the part that differs most between the mock and Storage.
 */
export interface DataSource {
  listClients(q?: string): Promise<ClientRow[]>
  getClient(id: string): Promise<ClientRow | null>
  upsertClient(c: Omit<ClientRow, 'id' | 'updatedAt'> & { id?: string }): Promise<ClientRow>

  listServices(): Promise<ServiceRow[]>
  listScopeSteps(serviceId: string): Promise<ScopeStepRow[]>
  listGovFeeTemplate(serviceId: string): Promise<GovFeeTemplateRow[]>

  listBoilerplate(kind?: BoilerplateKind): Promise<BoilerplateRow[]>
  upsertBoilerplate(b: Omit<BoilerplateRow, 'id'> & { id?: string }): Promise<BoilerplateRow>

  listRateCard(): Promise<RateCardRow[]>

  listProposals(): Promise<ProposalRow[]>
  getProposal(id: string): Promise<ProposalRow | null>
  saveProposal(p: { id?: string; clientId: string; spec: DeckSpec }): Promise<ProposalRow>

  /** Returns the value for client.logoPath. Opaque to the rest of the app. */
  uploadLogo(file: File): Promise<string>
  /** Feeds compose(). null means "keep the template placeholder". */
  loadAsset(path: string): Promise<Uint8Array | null>
}
