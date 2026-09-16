/**
 * Mock DataSource. Shaped exactly like the planned Supabase tables so the
 * swap in data/index.ts is the only change when the schema exists.
 *
 * Nothing outside data/ may import this file.
 */
import type { DeckSpec } from '../../compiler/types'
import { boilerplate } from '../mock/boilerplate'
import { clients } from '../mock/clients'
import { govFeeTemplate } from '../mock/govFees'
import { meridianSpec } from '../mock/meridian'
import { rateCard } from '../mock/rateCard'
import { scopeSteps } from '../mock/scopeSteps'
import { services } from '../mock/services'
import { loadAssetBytes, registerLogo } from './assets'
import type { DataSource } from './source'
import type { BoilerplateKind, BoilerplateRow, ClientRow, ProposalRow } from './types'

const CLIENTS_KEY = 'taajeel.clients.v1'
const PROPOSALS_KEY = 'taajeel.proposals.v1'
const BOILERPLATE_KEY = 'taajeel.boilerplate.v1'

/** Callers get their own copy; the "database" is never mutated by reference. */
const copy = <T>(v: T): T => structuredClone(v)

/** Enough to exercise loading states without being annoying. */
const delay = <T>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), 120))

function readStore<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    /* fall through to the seed */
  }
  return copy(seed)
}

function writeStore<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows))
  } catch {
    /* quota or private mode: the in-memory copy still works this session */
  }
}

let clientRows = readStore<ClientRow>(CLIENTS_KEY, clients)
let boilerplateRows = readStore<BoilerplateRow>(BOILERPLATE_KEY, boilerplate)

const seededProposal: ProposalRow = {
  id: 'prop-meridian',
  clientId: 'cli-meridian',
  spec: meridianSpec,
  createdAt: '2026-03-15T09:00:00.000Z',
  updatedAt: '2026-03-15T09:00:00.000Z',
}
let proposalRows = readStore<ProposalRow>(PROPOSALS_KEY, [seededProposal])

const now = () => new Date().toISOString()
const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`

export const mockSource: DataSource = {
  async listClients(q) {
    const needle = q?.trim().toLowerCase()
    const rows = needle
      ? clientRows.filter(
          (c) =>
            c.legalName.toLowerCase().includes(needle) ||
            c.displayName.toLowerCase().includes(needle) ||
            (c.registrationNumber ?? '').includes(needle)
        )
      : clientRows
    return delay(copy(rows))
  },

  async getClient(id) {
    return delay(copy(clientRows.find((c) => c.id === id) ?? null))
  },

  async upsertClient(c) {
    const row: ClientRow = { ...c, id: c.id ?? uid('cli'), updatedAt: now() } as ClientRow
    const i = clientRows.findIndex((x) => x.id === row.id)
    clientRows = i >= 0 ? clientRows.map((x, j) => (j === i ? row : x)) : [row, ...clientRows]
    writeStore(CLIENTS_KEY, clientRows)
    return delay(copy(row))
  },

  async listServices() {
    return delay(copy(services))
  },

  async listScopeSteps(serviceId) {
    return delay(copy(scopeSteps.filter((s) => s.serviceId === serviceId).sort((a, b) => a.position - b.position)))
  },

  async listGovFeeTemplate(serviceId) {
    return delay(copy(govFeeTemplate.filter((g) => g.serviceId === serviceId)))
  },

  async listBoilerplate(kind?: BoilerplateKind) {
    return delay(copy(kind ? boilerplateRows.filter((b) => b.kind === kind) : boilerplateRows))
  },

  async upsertBoilerplate(b) {
    const row: BoilerplateRow = { ...b, id: b.id ?? uid('bp') } as BoilerplateRow
    const i = boilerplateRows.findIndex((x) => x.id === row.id)
    boilerplateRows = i >= 0 ? boilerplateRows.map((x, j) => (j === i ? row : x)) : [...boilerplateRows, row]
    writeStore(BOILERPLATE_KEY, boilerplateRows)
    return delay(copy(row))
  },

  async listRateCard() {
    return delay(copy(rateCard))
  },

  async listProposals() {
    return delay(copy([...proposalRows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
  },

  async getProposal(id) {
    return delay(copy(proposalRows.find((p) => p.id === id) ?? null))
  },

  async saveProposal({ id, clientId, spec }: { id?: string; clientId: string; spec: DeckSpec }) {
    const existing = id ? proposalRows.find((p) => p.id === id) : undefined
    const row: ProposalRow = {
      id: existing?.id ?? uid('prop'),
      clientId,
      spec: copy(spec),
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    }
    proposalRows = existing ? proposalRows.map((p) => (p.id === row.id ? row : p)) : [row, ...proposalRows]
    writeStore(PROPOSALS_KEY, proposalRows)
    return delay(copy(row))
  },

  uploadLogo(file) {
    return registerLogo(file)
  },

  loadAsset(path) {
    return loadAssetBytes(path)
  },
}
