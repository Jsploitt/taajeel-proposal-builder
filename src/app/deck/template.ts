/**
 * Template and slide-map loading for the browser.
 *
 * The master template lives in template/ and belongs to the compiler session.
 * We import it with ?url rather than copying it into public/: Vite serves it
 * from disk in dev and emits one hashed asset at build, so there is never a
 * second 11 MB copy to go stale.
 */
import type { SlideMap } from '../../compiler/types'
import templateUrl from '../../../template/taajeel_template.pptx?url'
import slideMapJson from '../../../template/slide_map.json'
import agencyIndexJson from '../../../template/assets/agencies/index.json'

export const slideMap = slideMapJson as unknown as SlideMap

export interface AgencyEntry {
  label: string
  /** null = artwork was never extracted (misa). Selecting it renders no mark. */
  file: string | null
  px?: [number, number]
  note?: string
}

/** The agency index is the single source of truth for keys and labels. */
export const agencyIndex = agencyIndexJson as unknown as Record<string, AgencyEntry>

/** Bundled agency artwork, keyed by bare filename. */
const agencyUrls = import.meta.glob('../../../template/assets/agencies/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const agencyUrlByFile = new Map<string, string>(
  Object.entries(agencyUrls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1), url])
)

let templatePromise: Promise<ArrayBuffer> | null = null

/**
 * The template bytes, fetched once. ~11.4 MB, held resident: Pkg.load copies
 * out of it, so the same buffer serves every compile.
 */
export function loadTemplateBytes(): Promise<ArrayBuffer> {
  if (!templatePromise) {
    templatePromise = fetch(templateUrl).then((r) => {
      if (!r.ok) throw new Error(`template fetch failed: ${r.status} ${r.statusText}`)
      return r.arrayBuffer()
    })
    templatePromise.catch(() => {
      templatePromise = null // let a later attempt retry
    })
  }
  return templatePromise
}

/** Warm the cache off the critical path so the first compile is not also the first download. */
export function prefetchTemplate() {
  const go = () => void loadTemplateBytes().catch(() => {})
  if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 4000 })
  else setTimeout(go, 1500)
}

const agencyBytes = new Map<string, Uint8Array | null>()

/**
 * Resolves an agency key to its logo bytes, mirroring scripts/render.ts.
 * MUST be passed to compose() -- without it every mark whose key differs from
 * its slot default is stripped, silently removing government logos.
 */
export async function loadAgency(key: string): Promise<Uint8Array | null> {
  if (agencyBytes.has(key)) return agencyBytes.get(key) ?? null
  const entry = agencyIndex[key]
  const url = entry?.file ? agencyUrlByFile.get(entry.file) : undefined
  let bytes: Uint8Array | null = null
  if (url) {
    try {
      const r = await fetch(url)
      if (r.ok) bytes = new Uint8Array(await r.arrayBuffer())
    } catch {
      bytes = null
    }
  }
  agencyBytes.set(key, bytes)
  return bytes
}

/** Journey-graphic positions that actually have agency artwork, read from the map. */
export const AGENCY_SLOTS: number[] = [
  ...new Set(slideMap.fills.filter((f) => f.agency_slot !== undefined).map((f) => f.agency_slot!)),
].sort((a, b) => a - b)

/** The slot's default artwork, for showing staff what sits there today. */
export const AGENCY_DEFAULT_BY_SLOT = new Map<number, string>(
  slideMap.fills
    .filter((f) => f.agency_slot !== undefined && f.agency_default)
    .map((f) => [f.agency_slot!, f.agency_default!])
)

/** How many gears the journey graphic is drawn for. */
export const SCOPE_STEP_SLOTS = slideMap.fills.filter((f) => /^SCOPE\.STEP_\d{2}$/.test(f.token)).length
