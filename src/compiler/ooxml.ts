/**
 * OOXML package surgery, browser-safe.
 *
 * Ports tools/pkg.py, which was verified against real PowerPoint via COM before
 * this file existed. Keep the two in step.
 *
 * A .pptx is a zip of parts joined by .rels files. Removing a part means removing
 *   1. the part
 *   2. its own .rels part
 *   3. every <Relationship> pointing at it
 *   4. its [Content_Types].xml override
 *   5. any list entry in the parent referencing that relationship id
 * Miss any one and PowerPoint refuses the file, usually without the writer noticing.
 *
 * We only ever DELETE slides, never add or clone them. That is deliberate: the
 * delete-then-add sequence is what silently corrupts .pptx packages.
 */

import JSZip from 'jszip'
import { parseXml, serializeXml } from './dom'

export const CT = '[Content_Types].xml'
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

export class Pkg {
  private parts = new Map<string, Uint8Array>()
  private dom = new Map<string, Document>()

  static async load(data: ArrayBuffer | Uint8Array): Promise<Pkg> {
    const zip = await JSZip.loadAsync(data)
    const pkg = new Pkg()
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir)
    for (const n of names) {
      pkg.parts.set(n, await zip.files[n].async('uint8array'))
    }
    return pkg
  }

  has(name: string) {
    return this.parts.has(name)
  }

  names() {
    return [...this.parts.keys()]
  }

  raw(name: string) {
    return this.parts.get(name)
  }

  setRaw(name: string, data: Uint8Array) {
    this.parts.set(name, data)
    this.dom.delete(name)
  }

  /**
   * A part's XML as text.
   *
   * Mutations live in the parsed-DOM cache until save(), so reading the raw
   * bytes after editing returns STALE content -- which silently breaks anything
   * that inspects a part it has already modified. Serialize the cached DOM when
   * there is one.
   */
  text(name: string): string {
    const doc = this.dom.get(name)
    if (doc) return serializeXml(doc)
    const b = this.parts.get(name)
    if (!b) throw new Error(`missing part ${name}`)
    return new TextDecoder('utf-8').decode(b)
  }

  setText(name: string, s: string) {
    this.parts.set(name, new TextEncoder().encode(s))
    this.dom.delete(name)
  }

  /** Parsed XML for a part, cached. Mutations are flushed on save(). */
  xml(name: string): Document {
    let d = this.dom.get(name)
    if (!d) {
      d = parseXml(this.text(name))
      const err = d.getElementsByTagName('parsererror')[0]
      if (err) throw new Error(`XML parse failed in ${name}: ${err.textContent}`)
      this.dom.set(name, d)
    }
    return d
  }

  static relsFor(part: string): string {
    const i = part.lastIndexOf('/')
    return `${part.slice(0, i)}/_rels/${part.slice(i + 1)}.rels`
  }

  private static resolve(base: string, target: string): string {
    const stack = base.split('/').filter(Boolean)
    for (const seg of target.split('/')) {
      if (seg === '..') stack.pop()
      else if (seg !== '.' && seg !== '') stack.push(seg)
    }
    return stack.join('/')
  }

  /** rId -> absolute part name, for one part's relationships. */
  relTargets(part: string): Map<string, string> {
    const rp = Pkg.relsFor(part)
    const out = new Map<string, string>()
    if (!this.has(rp)) return out
    const base = part.slice(0, part.lastIndexOf('/'))
    const doc = this.xml(rp)
    for (const rel of Array.from(doc.getElementsByTagName('Relationship'))) {
      if (rel.getAttribute('TargetMode') === 'External') continue
      const id = rel.getAttribute('Id')
      const tgt = rel.getAttribute('Target')
      if (!id || !tgt || tgt.startsWith('http')) continue
      out.set(id, Pkg.resolve(base, tgt))
    }
    return out
  }

  dropRelationship(owner: string, rid: string) {
    const rp = Pkg.relsFor(owner)
    const doc = this.xml(rp)
    for (const rel of Array.from(doc.getElementsByTagName('Relationship'))) {
      if (rel.getAttribute('Id') === rid) {
        rel.parentNode!.removeChild(rel)
        return
      }
    }
    throw new Error(`relationship ${rid} not found in ${rp}`)
  }

  dropContentType(part: string) {
    const doc = this.xml(CT)
    for (const ov of Array.from(doc.getElementsByTagName('Override'))) {
      if (ov.getAttribute('PartName') === `/${part}`) {
        ov.parentNode!.removeChild(ov)
        return
      }
    }
  }

  removePart(part: string) {
    this.parts.delete(part)
    this.dom.delete(part)
    const rp = Pkg.relsFor(part)
    this.parts.delete(rp)
    this.dom.delete(rp)
    this.dropContentType(part)
  }

  /**
   * Remove one slide completely: presentation.xml sldIdLst entry, the
   * relationship, the part and its rels, and the content-type override.
   * Surviving slide part names are NOT renumbered -- sldId/rId indirection
   * means filenames need not be contiguous, and renaming would break rels.
   */
  removeSlide(slidePart: string) {
    const pres = 'ppt/presentation.xml'
    let rid: string | undefined
    for (const [id, tgt] of this.relTargets(pres)) {
      if (tgt === slidePart) {
        rid = id
        break
      }
    }
    if (!rid) throw new Error(`${slidePart} not referenced by ${pres}`)

    const doc = this.xml(pres)
    const lst = doc.getElementsByTagNameNS(P, 'sldIdLst')[0]
    if (!lst) throw new Error('no sldIdLst')
    for (const el of Array.from(lst.getElementsByTagNameNS(P, 'sldId'))) {
      if (el.getAttributeNS(R, 'id') === rid) {
        lst.removeChild(el)
        break
      }
    }
    this.dropRelationship(pres, rid)
    this.removePart(slidePart)
  }

  /** Slide part names in presentation order. */
  slideOrder(): string[] {
    const pres = 'ppt/presentation.xml'
    const targets = this.relTargets(pres)
    const doc = this.xml(pres)
    const lst = doc.getElementsByTagNameNS(P, 'sldIdLst')[0]
    if (!lst) return []
    return Array.from(lst.getElementsByTagNameNS(P, 'sldId'))
      .map((el) => targets.get(el.getAttributeNS(R, 'id') || '') || '')
      .filter(Boolean)
  }

  /**
   * Drop image relationships whose id no longer appears in the part's XML.
   *
   * Removing a <p:pic> element leaves its <Relationship> behind, so the media
   * still looks referenced and survives garbage collection -- which is how a
   * deleted picture's bytes stay in the package. Only IMAGE relationships are
   * pruned: the slideLayout relationship is referenced implicitly, not by an
   * r:id in the slide body, and pruning it would break the slide.
   */
  pruneImageRels(part: string): string[] {
    const rp = Pkg.relsFor(part)
    if (!this.has(rp) || !this.has(part)) return []
    const body = this.text(part)
    const doc = this.xml(rp)
    const dropped: string[] = []
    for (const rel of Array.from(doc.getElementsByTagName('Relationship'))) {
      const type = rel.getAttribute('Type') ?? ''
      if (!type.endsWith('/image')) continue
      const id = rel.getAttribute('Id')
      if (!id) continue
      // r:embed="rIdN" / r:link="rIdN" -- match the quoted id exactly
      if (body.includes(`"${id}"`)) continue
      rel.parentNode!.removeChild(rel)
      dropped.push(id)
    }
    return dropped
  }

  /** Delete media parts no surviving .rels references. */
  gcMedia(): string[] {
    const referenced = new Set<string>()
    for (const name of this.names()) {
      if (!name.endsWith('.rels')) continue
      const base = name.slice(0, name.lastIndexOf('/_rels/'))
      const doc = this.xml(name)
      for (const rel of Array.from(doc.getElementsByTagName('Relationship'))) {
        const t = rel.getAttribute('Target')
        if (t && !t.startsWith('http')) referenced.add(Pkg.resolve(base, t))
      }
    }
    const removed: string[] = []
    for (const name of this.names()) {
      if (name.startsWith('ppt/media/') && !referenced.has(name)) {
        this.parts.delete(name)
        removed.push(name)
      }
    }
    return removed
  }

  async save(): Promise<Uint8Array> {
    for (const [name, doc] of this.dom) {
      this.parts.set(name, new TextEncoder().encode(serializeXml(doc)))
    }
    const zip = new JSZip()
    // [Content_Types].xml must come first in the archive
    zip.file(CT, this.parts.get(CT)!)
    for (const [name, data] of this.parts) {
      if (name !== CT) zip.file(name, data)
    }
    return zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
  }
}

// ------------------------------------------------------------------ shapes

/** Find a shape by its stable TJL.* name, descending into groups. */
export function findShapeByName(slideDoc: Document, name: string): Element | null {
  for (const cNvPr of Array.from(slideDoc.getElementsByTagName('p:cNvPr'))) {
    if (cNvPr.getAttribute('name') === name) {
      // climb to the shape element (p:sp, p:pic, p:graphicFrame, p:grpSp)
      let el: Node | null = cNvPr
      while (el && el.parentNode) {
        const n = (el as Element).nodeName
        if (n === 'p:sp' || n === 'p:pic' || n === 'p:graphicFrame' || n === 'p:grpSp') {
          return el as Element
        }
        el = el.parentNode
      }
    }
  }
  return null
}

/**
 * @xmldom/xmldom does not implement the DOM4 `Element.children` accessor, so
 * every structural walk goes through childNodes filtered to element nodes.
 * Using `.children` silently yields undefined and fails far from the cause.
 */
export function childElements(el: Element): Element[] {
  const out: Element[] = []
  const kids = el.childNodes
  for (let i = 0; i < kids.length; i++) {
    const n = kids.item(i)
    if (n && n.nodeType === 1) out.push(n as Element)
  }
  return out
}

/** First descendant with this local name, in ANY namespace. */
export function firstDescendant(el: Element, localName: string): Element | null {
  const stack: Element[] = [el]
  while (stack.length) {
    const cur = stack.shift()!
    for (const c of childElements(cur)) {
      if (c.localName === localName) return c
      stack.push(c)
    }
  }
  return null
}

/**
 * A shape's paragraphs.
 *
 * The text body element is namespace-dependent: `<p:txBody>` on a drawing shape
 * (PresentationML) but `<a:txBody>` inside a table cell (DrawingML). Matching
 * one namespace silently returns no paragraphs and every fill becomes a no-op,
 * so match on local name instead.
 */
export function paragraphsOf(shape: Element): Element[] {
  const tx = firstDescendant(shape, 'txBody')
  if (!tx) return []
  return childElements(tx).filter((c) => c.localName === 'p')
}

export function runsOf(para: Element): Element[] {
  return childElements(para).filter((c) => c.localName === 'r')
}

function rPrOf(run: Element): Element | null {
  return childElements(run).find((c) => c.localName === 'rPr') ?? null
}

/** Remove every run and line-break from a paragraph, keeping its pPr. */
export function clearRuns(para: Element) {
  for (const c of childElements(para)) {
    if (c.localName === 'r' || c.localName === 'br') para.removeChild(c)
  }
}

/**
 * Append a run carrying `text`, cloning formatting from `styleSource`.
 *
 * Never assign to a whole text frame and never do run-level find-and-replace:
 * the source deck splits single sentences across arbitrary runs (see
 * FORENSICS.md section 3), so replacement must rebuild runs from a model.
 */
export function addRun(para: Element, text: string, styleSource?: Element | null): Element {
  const doc = para.ownerDocument!
  const r = doc.createElementNS(A, 'a:r')
  const src = styleSource ? rPrOf(styleSource) : null
  if (src) r.appendChild(src.cloneNode(true))
  const t = doc.createElementNS(A, 'a:t')
  // xml:space="preserve" keeps leading/trailing spaces, which do layout here
  t.setAttribute('xml:space', 'preserve')
  t.textContent = text
  r.appendChild(t)

  // The DrawingML content model for <a:p> is pPr?, (r|br|fld)*, endParaRPr?.
  // endParaRPr MUST stay last: append after it and PowerPoint still opens the
  // file but silently ignores the run, so the text is in the XML and invisible
  // on the slide. Insert before it instead.
  const endPr = childElements(para).find((c) => c.localName === 'endParaRPr')
  if (endPr) para.insertBefore(r, endPr)
  else para.appendChild(r)
  return r
}

/** Replace a paragraph with a single run, inheriting the first run's format. */
export function setParagraphText(para: Element, text: string) {
  const src = runsOf(para)[0] ?? null
  clearRuns(para)
  addRun(para, text, src)
}

/** Replace one run's text, leaving every sibling run untouched. */
export function setRunText(run: Element, text: string) {
  for (const t of Array.from(run.getElementsByTagNameNS(A, 't'))) {
    t.setAttribute('xml:space', 'preserve')
    t.textContent = text
    // only the first a:t carries the value; blank any others
    text = ''
  }
}

/** Remove a shape from its parent. Used to hide unused diagram slots. */
export function removeShape(shape: Element) {
  shape.parentNode?.removeChild(shape)
}

/** Deep-clone a paragraph, for building N paragraphs from one style exemplar. */
export function cloneParagraphAfter(exemplar: Element): Element {
  const copy = exemplar.cloneNode(true) as Element
  exemplar.parentNode!.insertBefore(copy, exemplar.nextSibling)
  return copy
}

/**
 * Scale every run's font size in a paragraph by `factor`, clamped so text never
 * becomes illegible. Used as the overflow fallback after a budget warning:
 * python-pptx-style writers cannot measure text, so overflow is prevented by
 * contract (a character budget) and only then mitigated by shrinking.
 *
 * Returns the applied factor, or null if nothing had an explicit size.
 */
export function scaleParagraphFont(para: Element, factor: number, floor = 0.7): number | null {
  const f = Math.max(floor, Math.min(1, factor))
  let touched = false
  for (const run of runsOf(para)) {
    const rPr = childElements(run).find((c) => c.localName === 'rPr')
    if (!rPr) continue
    const sz = rPr.getAttribute('sz')
    if (!sz) continue
    // sz is in hundredths of a point; keep it an integer and never below 8pt
    const next = Math.max(800, Math.round((Number(sz) * f) / 50) * 50)
    rPr.setAttribute('sz', String(next))
    touched = true
  }
  return touched ? f : null
}
