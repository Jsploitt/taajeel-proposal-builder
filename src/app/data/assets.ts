/**
 * Logo registry. An uploaded logo gets a synthetic path that looks like any
 * other storage path, so client.logoPath stays opaque to the rest of the app
 * and the Supabase swap touches nothing but uploadLogo/loadAsset.
 */
import { idbAssets } from './idb'

export const LOCAL_PREFIX = 'local://logo/'

/** Assets shipped with the repo, so the seeded Meridian proposal loads end to end. */
const bundled = import.meta.glob('../../../fixtures/assets/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const bundledByRepoPath = new Map<string, string>(
  Object.entries(bundled).map(([p, url]) => [p.replace(/^(\.\.\/)+/, ''), url])
)

interface Entry {
  bytes: Uint8Array
  mime: string
  name: string
  objectUrl: string
}

const mem = new Map<string, Entry>()

function sanitise(name: string) {
  return name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-64) || 'logo.png'
}

export async function registerLogo(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const path = `${LOCAL_PREFIX}${crypto.randomUUID()}/${sanitise(file.name)}`
  const bytes = new Uint8Array(buf)
  mem.set(path, {
    bytes,
    mime: file.type || 'image/png',
    name: file.name,
    objectUrl: URL.createObjectURL(new Blob([bytes], { type: file.type || 'image/png' })),
  })
  await idbAssets.put(path, { bytes: buf, mime: file.type || 'image/png', name: file.name })
  return path
}

/** Rehydrate the in-memory registry after a reload so a resumed draft still compiles. */
export async function rehydrateLogos(): Promise<void> {
  const keys = (await idbAssets.keys()) ?? []
  for (const k of keys) {
    const key = String(k)
    if (mem.has(key)) continue
    const stored = await idbAssets.get(key)
    if (!stored) continue
    const bytes = new Uint8Array(stored.bytes)
    mem.set(key, {
      bytes,
      mime: stored.mime,
      name: stored.name,
      objectUrl: URL.createObjectURL(new Blob([bytes], { type: stored.mime })),
    })
  }
}

/** For previews. Undefined for a path we have no bytes for. */
export function logoPreviewUrl(path?: string): string | undefined {
  if (!path) return undefined
  const hit = mem.get(path)
  if (hit) return hit.objectUrl
  return bundledByRepoPath.get(path)
}

export function logoName(path?: string): string | undefined {
  return path ? mem.get(path)?.name : undefined
}

/** null means "keep the template placeholder" -- matching scripts/render.ts. */
export async function loadAssetBytes(path: string): Promise<Uint8Array | null> {
  const hit = mem.get(path)
  if (hit) return hit.bytes

  if (path.startsWith(LOCAL_PREFIX)) {
    const stored = await idbAssets.get(path)
    return stored ? new Uint8Array(stored.bytes) : null
  }

  const url = bundledByRepoPath.get(path) ?? path
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return new Uint8Array(await r.arrayBuffer())
  } catch {
    return null
  }
}
