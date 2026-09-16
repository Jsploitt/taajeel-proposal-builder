/**
 * Minimal DrawingML shape construction.
 *
 * Until now the compiler only MODIFIED shapes the template already had. The
 * Time Frame page has to be drawn from step data, so these build new ones.
 *
 * Shapes are authored as XML strings and parsed, rather than assembled through
 * the DOM: OOXML element order is strict (nvSpPr, spPr, txBody -- and inside
 * spPr, xfrm before prstGeom before fills), and a string keeps that order
 * visible and reviewable. Getting it wrong yields a file PowerPoint opens and
 * then renders incorrectly, which no exception surfaces.
 */

import { parseXml } from './dom'

export const EMU_PER_IN = 914400
export const inch = (v: number) => Math.round(v * EMU_PER_IN)

/** Measured from the real deck; see template/FORENSICS.md section 1. */
export const NAVY = '0F3353'
export const CREAM = 'F1E8D9'
export const WHITE = 'FFFFFF'
export const MID = '3C5682'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface TextOpts {
  text?: string
  sizePt?: number
  bold?: boolean
  color?: string
  align?: 'l' | 'ctr' | 'r'
  anchor?: 't' | 'ctr' | 'b'
  wrap?: boolean
  font?: string
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function txBody(o: TextOpts): string {
  const {
    text = '', sizePt = 10, bold = false, color = NAVY,
    align = 'ctr', anchor = 'ctr', wrap = true,
    // Arial is used in 132 runs of the source deck and is universally
    // available, so generated text never depends on the licensed Lama Sans.
    font = 'Arial',
  } = o
  const lines = text.split('\n')
  const paras = lines
    .map(
      (line) =>
        `<a:p><a:pPr algn="${align}"/>` +
        `<a:r><a:rPr lang="en-US" sz="${Math.round(sizePt * 100)}" b="${bold ? 1 : 0}" dirty="0">` +
        `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` +
        `<a:latin typeface="${font}"/><a:cs typeface="${font}"/></a:rPr>` +
        `<a:t xml:space="preserve">${esc(line)}</a:t></a:r></a:p>`
    )
    .join('')
  return (
    `<p:txBody><a:bodyPr wrap="${wrap ? 'square' : 'none'}" lIns="18000" rIns="18000" ` +
    `tIns="9000" bIns="9000" anchor="${anchor}"><a:noAutofit/></a:bodyPr><a:lstStyle/>` +
    `${paras}</p:txBody>`
  )
}

function spXml(
  id: number,
  name: string,
  geom: string,
  box: Box,
  fill: string | null,
  line: { color: string; widthPt: number } | null,
  text: TextOpts | null
): string {
  const fillXml = fill
    ? `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>`
    : '<a:noFill/>'
  const lineXml = line
    ? `<a:ln w="${Math.round(line.widthPt * 12700)}"><a:solidFill>` +
      `<a:srgbClr val="${line.color}"/></a:solidFill></a:ln>`
    : '<a:ln><a:noFill/></a:ln>'
  return (
    `<p:sp xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    `xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">` +
    `<p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${inch(box.x)}" y="${inch(box.y)}"/>` +
    `<a:ext cx="${inch(box.w)}" cy="${inch(box.h)}"/></a:xfrm>` +
    `<a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>${fillXml}${lineXml}</p:spPr>` +
    (text ? txBody(text) : '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>') +
    `</p:sp>`
  )
}

/** Highest shape id in use on a slide, so new shapes never collide. */
export function maxShapeId(slideDoc: Document): number {
  let max = 1
  const els = slideDoc.getElementsByTagName('p:cNvPr')
  for (let i = 0; i < els.length; i++) {
    const v = Number(els[i].getAttribute('id') ?? 0)
    if (Number.isFinite(v) && v > max) max = v
  }
  return max
}

export function spTreeOf(slideDoc: Document): Element {
  const t = slideDoc.getElementsByTagName('p:spTree')[0]
  if (!t) throw new Error('slide has no spTree')
  return t
}

/** Parse a shape XML string and append it to the slide's shape tree. */
export function appendShape(slideDoc: Document, xml: string): Element {
  const frag = parseXml(xml)
  const node = frag.documentElement
  const imported = slideDoc.importNode
    ? slideDoc.importNode(node, true)
    : node
  spTreeOf(slideDoc).appendChild(imported as Element)
  return imported as Element
}

export interface ShapeBuilder {
  rect(name: string, box: Box, fill: string | null, text?: TextOpts | null,
       line?: { color: string; widthPt: number } | null): Element
  roundRect(name: string, box: Box, fill: string | null, text?: TextOpts | null,
            line?: { color: string; widthPt: number } | null): Element
  ellipse(name: string, box: Box, fill: string | null, text?: TextOpts | null,
          line?: { color: string; widthPt: number } | null): Element
}

/** Shape factory bound to one slide, handing out unique ids. */
export function builderFor(slideDoc: Document): ShapeBuilder {
  let next = maxShapeId(slideDoc) + 1
  const mk = (geom: string) =>
    (name: string, box: Box, fill: string | null,
     text: TextOpts | null = null,
     line: { color: string; widthPt: number } | null = null) =>
      appendShape(slideDoc, spXml(next++, name, geom, box, fill, line, text))
  return {
    rect: mk('rect'),
    roundRect: mk('roundRect'),
    ellipse: mk('ellipse'),
  }
}
