/**
 * Browser-side deck compilation.
 *
 * compose() is several seconds of synchronous work over an 11 MB zip, so it
 * runs only when the user asks for it -- never on render, never on a keystroke.
 */
import { compose } from '../../compiler/compose'
import type { CompileResult, DeckSpec } from '../../compiler/types'
import { loadAgency, loadTemplateBytes, slideMap } from './template'
import { db } from '../data'

/**
 * 32-bit FNV-1a over the serialized spec. Not a security hash -- it exists so
 * a download can be refused when the spec has moved since the last compile.
 */
export function specHash(spec: DeckSpec): string {
  const s = JSON.stringify(spec)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export interface CompileOutcome extends CompileResult {
  hash: string
  elapsedMs: number
}

/**
 * Both callbacks are load-bearing. Omitting loadAgency makes applyAgencyMarks
 * strip every mark whose key differs from its slot default, silently removing
 * government logos from the journey graphic.
 */
export async function compileDraft(spec: DeckSpec): Promise<CompileOutcome> {
  const t0 = performance.now()
  const template = await loadTemplateBytes()
  const res = await compose(spec, template, slideMap, {
    loadAsset: (path) => db.loadAsset(path),
    loadAgency,
  })
  return { ...res, hash: specHash(spec), elapsedMs: Math.round(performance.now() - t0) }
}

export const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
