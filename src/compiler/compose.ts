/**
 * compose(spec, template) -> a finished .pptx
 *
 * Subtractive composition. The template ships with every section slide present;
 * we DELETE the ones this proposal does not need and fill the survivors. We
 * never clone or add a slide -- delete-then-add is what silently corrupts
 * .pptx packages, and pure deletion cannot hit that bug.
 *
 * Order matters: fills run BEFORE deletion so shape lookups use the original
 * slide numbering from slide_map.json, then deletion reindexes nothing (part
 * names are never renumbered -- sldId/rId indirection makes that unnecessary).
 */

import {
  Pkg,
  scaleParagraphFont,
  findShapeByName,
  paragraphsOf,
  runsOf,
  clearRuns,
  addRun,
  setParagraphText,
  setRunText,
  removeShape,
  cloneParagraphAfter,
} from './ooxml'
import type {
  DeckSpec,
  SlideMap,
  Fill,
  Caveat,
  CompileResult,
  TextSegment,
  ParaStyle,
} from './types'
import { TBC, VAT_RATE } from './types'
import { imageSize, fitCentred } from './image'
import { drawTimeline } from './timeline'

/**
 * TOC label per section, taken verbatim from the real decks. A section absent
 * from the final deck is absent from the contents.
 */
const TOC_LABELS: Record<string, string> = {
  div_introduction: 'Introduction',
  div_about_taajeel: 'About Taajeel',
  div_about_client: 'About The Client',
  div_scope: 'Scope of work',
  div_timeframe: 'Time Frame',
  div_noncovered: 'Non-covered by the scope of work',
  div_additional: 'Scope of work Additional "optional"',
  div_fees: 'The Fees',
  div_signoff: 'Signoff',
  div_terms: 'Terms and Conditions',
}

export interface ComposeOptions {
  /** Resolves a logo/flag path to image bytes. Absent = placeholder kept. */
  loadAsset?: (path: string) => Promise<Uint8Array | null>
  /** Resolves an agency key to its logo bytes, e.g. from the bundled library. */
  loadAgency?: (key: string) => Promise<Uint8Array | null>
}

function slidePart(n: number) {
  return `ppt/slides/slide${n}.xml`
}

function money(v: string | undefined, currency: string): string {
  if (!v) return TBC
  return v.includes(currency) ? v : v
}

/** The only arithmetic the app performs on money. */
export function computeVat(headline?: string): string | undefined {
  if (!headline) return undefined
  const n = Number(headline.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n) || n === 0) return undefined
  const vat = n * VAT_RATE
  return vat.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// ------------------------------------------------------------------ sections

/** Which sections survive, given the spec. Returns section keys in deck order. */
export function resolveSections(spec: DeckSpec, map: SlideMap): string[] {
  const drop = new Set<string>()

  if (!spec.timeFrame.show || spec.timeFrame.steps.length === 0) {
    drop.add('div_timeframe')
    drop.add('timeframe')
  }
  if (!spec.additional.show || spec.additional.blocks.length === 0) {
    drop.add('div_additional')
    drop.add('additional')
  }
  if (!spec.govFees.show || spec.govFees.rows.length === 0) {
    drop.add('gov_fees')
  }
  return map.sections.map((s) => s.key).filter((k) => !drop.has(k))
}

/** Slides to delete, as 1-based template indices. */
function slidesToDrop(spec: DeckSpec, map: SlideMap): number[] {
  const keep = new Set(resolveSections(spec, map))
  const drop: number[] = []
  for (const s of map.sections) {
    if (!keep.has(s.key)) drop.push(...s.slides)
  }
  // Scope and Time Frame ship with two exemplar slides; drop the second when
  // the proposal has only one block. P2 (FlyAkeed) is exactly this case.
  if (spec.scope.length < 2) drop.push(15)
  // Slide 18 was the continuation page for the raster timeline. The generated
  // timeline lays every step out on one page, so it is never needed.
  if (!drop.includes(18)) drop.push(18)
  return [...new Set(drop)].sort((a, b) => a - b)
}

// ------------------------------------------------------------------ fills

type FillValues = Record<string, string | undefined>

/** Flatten the spec into token -> string, matching spec.py's token names. */
export function buildValues(spec: DeckSpec): FillValues {
  const c = spec.client
  const e = spec.engagement
  const vat = spec.fees.vatAmount ?? computeVat(spec.fees.headline)

  return {
    'COVER.CLIENT_NAME': c.displayName || TBC,
    'COVER.SUBJECT': e.subject || TBC,

    'LETTER.REFERENCE': e.referenceNumber || TBC,
    'LETTER.CLIENT_NAME': c.displayName || TBC,
    'LETTER.DATE': e.letterDate || TBC,
    'LETTER.ADDRESS': c.address || TBC,
    'LETTER.ATTENTION': c.attention || TBC,
    'LETTER.MOBILE': c.mobile || TBC,
    'LETTER.EMAIL': c.email || TBC,
    'LETTER.WEB': c.web || TBC,
    'LETTER.SUBJECT': e.subject || TBC,
    'LETTER.OPENING_TAIL': ` to propose ${e.serviceDescription || TBC}. (“Mission”/ “Assignment”).`,
    'LETTER.ACCORDINGLY':
      'Accordingly, attached to Your Excellency in the Proposal of this scope of work.',

    'SCOPE.TITLE': spec.scope[0] ? `Scope of work | ${spec.scope[0].title}:` : TBC,
    'SCOPE.INTRO': spec.scope[0]?.intro || TBC,
    // Badge count is driven by the data, which structurally prevents the
    // "fifteen steps over a 16-item list" defect present in the source deck.
    'SCOPE.STEP_COUNT': String(spec.scope[0]?.steps.length ?? 0),
    ...Object.fromEntries(
      (spec.scope[0]?.steps ?? []).flatMap((st, i) => [
        [`SCOPE.STEP_${String(i + 1).padStart(2, '0')}`, st.label],
        [`SCOPE.BADGE_${String(i + 1).padStart(2, '0')}`, String(i + 1).padStart(2, '0')],
      ])
    ),

    'FEES.AMOUNT': money(spec.fees.headline, spec.fees.currency),
    'FEES.VAT': vat ?? TBC,

    'SIGNOFF.CLIENT_NAME': c.legalName || TBC,
  }
}

function applyFill(pkg: Pkg, fill: Fill, values: FillValues, caveats: Caveat[], spec: DeckSpec) {
  const part = slidePart(fill.slide)
  if (!pkg.has(part)) return // slide already dropped
  const doc = pkg.xml(part)
  const shapeName = fill.shape_name ?? fill.token
  const shape = findShapeByName(doc, shapeName)
  if (!shape) {
    // A slot removed on purpose (a surplus journey gear) is not a failure.
    if (/^SCOPE\.(STEP|BADGE)_\d{2}$/.test(fill.token)) return
    caveats.push({
      severity: 'blocker',
      message: `template shape "${shapeName}" not found on slide ${fill.slide}`,
      where: `slide ${fill.slide}`,
    })
    return
  }

  // 'name' fills exist only so the Time Frame generator has a stable handle to
  // delete; several are pictures and graphics with no text at all.
  if (fill.mode === 'name') return

  const paras = paragraphsOf(shape)
  if (paras.length === 0 && fill.mode !== 'picture' && fill.mode !== 'table') {
    caveats.push({
      severity: 'blocker',
      message: `shape "${shapeName}" has no paragraphs; fill "${fill.token}" did nothing`,
      where: `slide ${fill.slide}`,
    })
    return
  }

  const missing = (what: string) =>
    caveats.push({
      severity: 'blocker',
      message: `fill "${fill.token}" could not resolve ${what}`,
      where: `slide ${fill.slide}`,
    })

  switch (fill.mode) {
    case 'text': {
      const p = paras[fill.para ?? 0]
      if (!p) return missing(`paragraph ${fill.para ?? 0}`)
      const v = values[fill.token]
      if (v === undefined) return missing('a value')
      const over = checkBudget(fill, v, caveats)
      setParagraphText(p, v)
      if (over) scaleParagraphFont(p, over)
      if (fill.clear_rest) {
        for (const extra of paras.slice((fill.para ?? 0) + 1)) clearRuns(extra)
      }
      break
    }

    case 'runs': {
      const p = paras[fill.para ?? 0]
      if (!p) return missing(`paragraph ${fill.para ?? 0}`)
      if (!fill.plan) return missing('a run plan')
      const originals = runsOf(p)
      clearRuns(p)
      for (const step of fill.plan) {
        const src = originals[step.rpr ?? 0] ?? originals[0] ?? null
        const text =
          step.literal !== undefined
            ? step.literal
            : values[step.token ?? ''] ?? step.neutral ?? TBC
        addRun(p, text, src)
      }
      break
    }

    case 'run': {
      const p = paras[fill.para ?? 0]
      if (!p) return missing(`paragraph ${fill.para ?? 0}`)
      const r = runsOf(p)[fill.run ?? 0]
      const v = values[fill.token]
      if (!r) return missing(`run ${fill.run ?? 0} of paragraph ${fill.para ?? 0}`)
      if (v === undefined) return missing('a value')
      setRunText(r, v)
      break
    }

    case 'text_multi': {
      fillPaymentMethod(paras, spec, caveats)
      break
    }

    case 'frame': {
      fillAboutClient(paras, fill, spec, caveats)
      break
    }

    case 'name':
      // a stable handle only; the Time Frame generator deletes these
      break

    case 'picture':
    case 'table':
      // handled separately: pictures need asset bytes, the TOC needs the final
      // slide order, neither of which is available here.
      break
  }
}

/**
 * Returns the shrink factor to apply, or null when the value fits.
 *
 * Overflow is prevented by contract rather than detected after the fact: no
 * .pptx writer can measure rendered text, so each shape carries a character
 * budget measured from the real proposals. Exceeding it warns the human AND
 * shrinks the type, so a long value degrades instead of spilling off the slide.
 */
function checkBudget(fill: Fill, value: string, caveats: Caveat[]): number | null {
  if (!fill.budget || value.length <= fill.budget) return null
  const factor = fill.budget / value.length
  caveats.push({
    severity: 'check',
    message: `"${fill.token}" is ${value.length} characters against a budget of ${fill.budget}; type shrunk to ${Math.round(Math.max(0.7, factor) * 100)}% to fit`,
    where: `slide ${fill.slide}`,
  })
  return factor
}

// ------------------------------------------------------------------ fees

function fillPaymentMethod(paras: Element[], spec: DeckSpec, caveats: Caveat[]) {
  const split = spec.fees.paymentSplit ?? []
  if (split.length === 0) {
    // retainer: no split. Keep the heading, clear the term lines.
    for (let i = 1; i < paras.length; i++) {
      if (paras[i]) setParagraphText(paras[i], i === 1 ? spec.fees.period ?? '' : '')
    }
    return
  }
  const total = split.reduce((a, s) => a + s.pct, 0)
  if (total !== 100) {
    caveats.push({
      severity: 'blocker',
      message: `payment split totals ${total}%, not 100%`,
      where: 'Fees',
    })
  }
  for (let i = 0; i < Math.max(split.length, paras.length - 1); i++) {
    const p = paras[i + 1]
    if (!p) break
    const s = split[i]
    setParagraphText(p, s ? `${s.pct}% ${s.when}` : '')
  }
}

// ------------------------------------------------------------- about client

function fillAboutClient(paras: Element[], fill: Fill, spec: DeckSpec, caveats: Caveat[]) {
  const exemplars = fill.style_exemplars
  if (!exemplars) return

  // Capture formatting exemplars BEFORE mutating anything.
  const at = (ref?: { para: number; run: number }) =>
    ref ? runsOf(paras[ref.para] ?? paras[0])[ref.run] ?? null : null

  const boldRun = at(fill.bold_exemplar)
  // Run 0 of the body exemplar is the bold client name, so "regular" must be
  // named explicitly rather than assumed to be the first run.
  const bodyRegular = at(fill.regular_exemplar)

  const regularRunFor = (style: ParaStyle): Element | null => {
    const idx = exemplars[style] ?? 0
    if (fill.regular_exemplar && idx === fill.regular_exemplar.para) return bodyRegular
    const p = paras[idx]
    return p ? runsOf(p)[0] ?? null : null
  }

  const wanted = spec.aboutClient
  if (wanted.length === 0) {
    caveats.push({
      severity: 'blocker',
      message: 'About the Client has no content',
      where: 'slide 12',
    })
    return
  }

  // Build each paragraph by cloning its style exemplar, which preserves pPr
  // (bullets, indents, justification) exactly. Insert after a moving cursor:
  // cloning repeatedly "after the exemplar" stacks the results in reverse.
  const built: Element[] = []
  let cursor: Element | null = null
  for (const para of wanted) {
    const ex = paras[exemplars[para.style] ?? 0]
    if (!ex) continue
    const node = cloneParagraphAfter(cursor ?? ex)
    cursor = node
    clearRuns(node)
    const regular = regularRunFor(para.style)
    for (const seg of para.segments) {
      addRun(node, seg.text, seg.bold ? boldRun ?? regular : regular)
    }
    built.push(node)
  }

  // drop the exemplar paragraphs, which still hold placeholder text
  for (const p of paras) {
    if (!built.includes(p)) p.parentNode?.removeChild(p)
  }
}

// ------------------------------------------------------------------ toc

function rebuildToc(pkg: Pkg, spec: DeckSpec, map: SlideMap, caveats: Caveat[]) {
  const part = slidePart(3)
  if (!pkg.has(part)) return
  const doc = pkg.xml(part)
  const shape = findShapeByName(doc, 'TOC.TABLE')
  if (!shape) {
    caveats.push({ severity: 'check', message: 'TOC table not found', where: 'slide 3' })
    return
  }

  // final 1-based position of each surviving section
  const order = pkg.slideOrder()
  const position = new Map<string, number>()
  for (const s of map.sections) {
    const first = s.slides[0]
    const idx = order.indexOf(slidePart(first))
    if (idx >= 0) position.set(s.key, idx + 1)
  }

  const entries = map.sections
    .filter((s) => TOC_LABELS[s.key] && position.has(s.key))
    .map((s) => ({ label: TOC_LABELS[s.key], page: position.get(s.key)! }))

  const rows = Array.from(shape.getElementsByTagName('a:tr'))
  // row 0 is the "Title | Page" header
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].getElementsByTagName('a:tc'))
    const entry = entries[i - 1]
    const titleP = cells[0] ? paragraphsOf(cells[0])[0] : null
    const pageP = cells[cells.length - 1] ? paragraphsOf(cells[cells.length - 1])[0] : null
    if (entry) {
      if (titleP) setParagraphText(titleP, entry.label)
      if (pageP) setParagraphText(pageP, String(entry.page))
    } else {
      if (titleP) setParagraphText(titleP, '')
      if (pageP) setParagraphText(pageP, '')
    }
  }

  if (entries.length > rows.length - 1) {
    caveats.push({
      severity: 'check',
      message: `contents has ${entries.length} sections but the table has ${rows.length - 1} rows`,
      where: 'slide 3',
    })
  }
}

// ------------------------------------------------------------------ main

export async function compose(
  spec: DeckSpec,
  template: ArrayBuffer | Uint8Array,
  map: SlideMap,
  opts: ComposeOptions = {}
): Promise<CompileResult> {
  const caveats: Caveat[] = []
  const pkg = await Pkg.load(template)
  const values = buildValues(spec)

  // --- required values that are absent
  if (!spec.engagement.referenceNumber) {
    caveats.push({
      severity: 'blocker',
      message: 'No reference number. The scheme is undocumented, so it is always an input.',
      where: 'Letter',
    })
  }
  if (!spec.fees.headline) {
    caveats.push({
      severity: 'blocker',
      message: 'No fee entered. A fee is a commercial commitment and is never derived.',
      where: 'Fees',
    })
  }
  if (!spec.client.logoPath) {
    caveats.push({
      severity: 'check',
      message: 'No client logo; the cover and About-the-Client pages keep the placeholder.',
      where: 'Cover',
    })
  }

  // --- 1. hide journey slots beyond the step count FIRST, so surplus slots
  // are gone before the fill loop looks for values they will never have.
  hideUnusedScopeSlots(pkg, spec, map, caveats)

  // --- 2. fill, while the template numbering still matches slide_map
  for (const fill of map.fills) {
    try {
      applyFill(pkg, fill, values, caveats, spec)
    } catch (err) {
      caveats.push({
        severity: 'blocker',
        message: `fill "${fill.token}" failed: ${String(err)}`,
        where: `slide ${fill.slide}`,
      })
    }
  }

  // --- 2b. government agency marks, driven by each step's declared agency
  await applyAgencyMarks(pkg, spec, map, opts, caveats)

  // --- 3. swap client assets
  if (opts.loadAsset && spec.client.logoPath) {
    const bytes = await opts.loadAsset(spec.client.logoPath)
    if (bytes) replaceMediaFor(pkg, map, ['COVER.CLIENT_LOGO', 'ABOUT_CLIENT.CLIENT_LOGO',
      'SCOPE.CLIENT_LOGO'], bytes)
  }

  // --- 3b. draw the Time Frame from step data, replacing the raster page
  if (spec.timeFrame.show && spec.timeFrame.steps.length > 0 && pkg.has(slidePart(17))) {
    const doc = pkg.xml(slidePart(17))
    const oldNames = map.fills
      .filter((f) => f.mode === 'name' && f.token.startsWith('TIMEFRAME.OLD_'))
      .map((f) => f.shape_name ?? f.token)
    const res = drawTimeline(doc, spec.timeFrame.steps, oldNames)
    caveats.push(...res.caveats)
  }

  // --- 4. delete unwanted slides
  const dropped = slidesToDrop(spec, map)
  for (const n of dropped) {
    const part = slidePart(n)
    if (pkg.has(part)) pkg.removeSlide(part)
  }

  // --- 5. contents, computed from what actually survived
  rebuildToc(pkg, spec, map, caveats)

  // --- 6. reclaim media orphaned by the deletions
  // Relationships must be pruned first: a removed <p:pic> leaves its
  // relationship behind, which keeps the image looking referenced.
  for (const part of pkg.slideOrder()) pkg.pruneImageRels(part)
  pkg.gcMedia()

  const blob = await pkg.save()
  const order = pkg.slideOrder()
  const safe = (s: string) => s.replace(/[^A-Za-z0-9 \-_]/g, '').trim() || 'Proposal'

  return {
    blob,
    caveats,
    slides: order.map((p) => Number(p.match(/slide(\d+)\.xml/)?.[1] ?? 0)),
    filename: `${safe(spec.client.displayName)} - ${safe(spec.engagement.subject).slice(0, 60)} v01.pptx`,
  }
}

/**
 * Point each agency mark at the logo its step declares.
 *
 * The marks are fixed decorations in the source deck, so a reordered or
 * substituted step would otherwise show the wrong government logo beside it --
 * wrong in a way nobody notices until a client does. A step with no agency has
 * its mark REMOVED rather than left showing the previous service's.
 */
async function applyAgencyMarks(
  pkg: Pkg, spec: DeckSpec, map: SlideMap, opts: ComposeOptions, caveats: Caveat[]
) {
  const part = slidePart(14)
  if (!pkg.has(part)) return
  const steps = spec.scope[0]?.steps ?? []
  const cache = new Map<string, Uint8Array | null>()
  const missing = new Set<string>()

  for (const fill of map.fills) {
    if (fill.mode !== 'picture' || fill.agency_slot === undefined) continue
    const doc = pkg.xml(part)
    const shape = findShapeByName(doc, fill.shape_name ?? fill.token)
    if (!shape) continue

    const step = steps[fill.agency_slot - 1]
    const key = step?.agency

    if (!key) {
      // no agency for this step (or no step at all): drop the mark
      removeShape(shape)
      continue
    }
    if (key === fill.agency_default) continue // already the right artwork

    if (!cache.has(key)) {
      cache.set(key, opts.loadAgency ? await opts.loadAgency(key) : null)
    }
    const bytes = cache.get(key)
    if (!bytes) {
      missing.add(key)
      removeShape(shape)
      continue
    }
    replaceShapeImage(pkg, part, shape, bytes)
  }

  // A step can declare an agency the journey graphic has no position for: the
  // artwork only has marks beside certain gears. Say so rather than dropping it.
  const slots = new Set(
    map.fills.filter((f) => f.agency_slot !== undefined).map((f) => f.agency_slot!)
  )
  const unplaced = steps
    .map((st, i) => ({ st, slot: i + 1 }))
    .filter(({ st, slot }) => st.agency && !slots.has(slot))
    .map(({ st, slot }) => `${st.agency} (step ${slot})`)
  if (unplaced.length) {
    caveats.push({
      severity: 'info',
      message: `the journey graphic has no logo position for ${unplaced.join(', ')}; those steps render without an agency mark`,
      where: 'Scope of work',
    })
  }

  if (missing.size) {
    caveats.push({
      severity: 'check',
      message: `no artwork for agency ${[...missing].join(', ')}; the mark was removed rather than left showing another agency`,
      where: 'Scope of work',
    })
  }
}

/**
 * Repoint one picture shape at new image bytes, preserving aspect ratio.
 *
 * Swapping only the bytes stretches the new image to the OLD one's proportions,
 * because the shape frame keeps its original extent. Every agency logo has
 * different proportions, so the frame is refitted (letterboxed inside the
 * original box) and any source crop from the old artwork is dropped.
 */
function replaceShapeImage(pkg: Pkg, part: string, shape: Element, bytes: Uint8Array) {
  const blip = shape.getElementsByTagName('a:blip')[0]
  if (!blip) return
  const rid = blip.getAttribute('r:embed')
  if (!rid) return
  const target = pkg.relTargets(part).get(rid)
  if (!target || !pkg.has(target)) return
  pkg.setRaw(target, bytes)

  // a crop was authored for the previous artwork and is meaningless now
  const fill = blip.parentNode as Element | null
  if (fill) {
    for (const sr of Array.from(fill.getElementsByTagName('a:srcRect'))) {
      sr.parentNode?.removeChild(sr)
    }
  }

  const size = imageSize(bytes)
  if (!size) return
  const off = shape.getElementsByTagName('a:off')[0]
  const ext = shape.getElementsByTagName('a:ext')[0]
  if (!off || !ext) return
  const box = {
    x: Number(off.getAttribute('x') ?? 0),
    y: Number(off.getAttribute('y') ?? 0),
    cx: Number(ext.getAttribute('cx') ?? 0),
    cy: Number(ext.getAttribute('cy') ?? 0),
  }
  if (!box.cx || !box.cy) return
  const fitted = fitCentred(size, box)
  off.setAttribute('x', String(fitted.x))
  off.setAttribute('y', String(fitted.y))
  ext.setAttribute('cx', String(fitted.cx))
  ext.setAttribute('cy', String(fitted.cy))
}

/**
 * The journey graphic is drawn for a fixed number of gears. A service with
 * fewer steps leaves empty slots, so remove the surplus label and number badge.
 *
 * The gear ARTWORK is decorative pictures that are not addressed individually,
 * so a short scope still shows the full gear chain -- reported as a caveat
 * rather than silently shipped.
 */
function hideUnusedScopeSlots(pkg: Pkg, spec: DeckSpec, map: SlideMap, caveats: Caveat[]) {
  const part = slidePart(14)
  if (!pkg.has(part)) return
  const doc = pkg.xml(part)
  const n = spec.scope[0]?.steps.length ?? 0

  let removed = 0
  for (const fill of map.fills) {
    const m = fill.token.match(/^SCOPE\.(STEP|BADGE)_(\d{2})$/)
    if (!m || fill.slide !== 14) continue
    if (Number(m[2]) <= n) continue
    const shape = findShapeByName(doc, fill.shape_name ?? fill.token)
    if (shape) {
      removeShape(shape)
      removed++
    }
  }

  const DRAWN_FOR = 17
  if (n > 0 && n < DRAWN_FOR) {
    caveats.push({
      severity: 'check',
      message: `the journey graphic is drawn for ${DRAWN_FOR} gears but this service has ${n} steps; ${removed} empty labels/badges were removed, but the surplus gear artwork remains and needs a designer`,
      where: 'Scope of work',
    })
  }
  if (n > DRAWN_FOR) {
    caveats.push({
      severity: 'blocker',
      message: `${n} scope steps but the journey graphic only has ${DRAWN_FOR} slots; the extra steps are not shown`,
      where: 'Scope of work',
    })
  }
}

/** Point every named picture shape at one new image blob, refitting each frame. */
function replaceMediaFor(pkg: Pkg, map: SlideMap, tokens: string[], bytes: Uint8Array) {
  for (const fill of map.fills) {
    if (fill.mode !== 'picture' || !tokens.includes(fill.token)) continue
    const part = slidePart(fill.slide)
    if (!pkg.has(part)) continue
    const doc = pkg.xml(part)
    const shape = findShapeByName(doc, fill.shape_name ?? fill.token)
    if (!shape) continue
    replaceShapeImage(pkg, part, shape, bytes)
  }
}
