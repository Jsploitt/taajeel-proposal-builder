/**
 * The Time Frame page, drawn from step data.
 *
 * The source deck built this page from three raster images: two timeline strips
 * with the step icons and labels baked in, plus a flattened copy of the scope
 * journey. Only the duration chips were live text. That means the page was
 * correct for exactly one service and silently wrong for every other -- and a
 * textual leak check cannot see it, because the wrong content is a picture.
 *
 * So the page is generated: a horizontal axis, numbered circles alternating
 * above and below it, a label beside each, and a duration chip on the axis.
 * The bespoke line-art icons are not reproducible (they exist only inside the
 * flattened raster), so numbered circles stand in for them.
 */

import { builderFor, NAVY, CREAM, WHITE, MID, type Box } from './shapes'
import { findShapeByName, removeShape } from './ooxml'
import type { ScopeStep, Caveat } from './types'

/** Slide geometry, in inches. Slide is 13.333 x 7.5. */
const LEFT = 0.62
const RIGHT = 12.71
const AXIS_Y = 4.45
const AXIS_H = 0.022
const CIRCLE_D = 0.46
const CIRCLE_OFFSET = 0.95   // centre distance from the axis
const LABEL_H = 1.00
const LABEL_GAP = 0.08
const DUR_W = 0.86
const DUR_H = 0.30

/** Above this the labels stop being legible; caller gets a caveat. */
export const MAX_COMFORTABLE_STEPS = 18

export interface TimelineResult {
  drawn: number
  caveats: Caveat[]
}

function fmtDuration(days?: number): string | null {
  if (days === undefined || days === null) return null
  return `${String(days).padStart(2, '0')} ${days === 1 ? 'Day' : 'Days'}`
}

/**
 * Draw the timeline onto a slide, replacing whatever the template had.
 *
 * `removeNames` are the template shapes this replaces -- the raster strips and
 * the old fixed duration chips. They are removed first so nothing from the
 * previous service survives underneath the generated content.
 */
export function drawTimeline(
  slideDoc: Document,
  steps: ScopeStep[],
  removeNames: string[]
): TimelineResult {
  const caveats: Caveat[] = []

  for (const name of removeNames) {
    const sh = findShapeByName(slideDoc, name)
    if (sh) removeShape(sh)
  }

  if (steps.length === 0) {
    return { drawn: 0, caveats }
  }

  const b = builderFor(slideDoc)
  const n = steps.length
  const slotW = (RIGHT - LEFT) / n
  const labelW = Math.min(slotW * 0.98, 1.6)
  // Chips must not touch: at 16 steps the slot is ~0.75in, so a fixed 0.86in
  // chip runs into its neighbours and the row reads as one solid bar.
  const durW = Math.min(DUR_W, slotW * 0.86)

  // the axis itself
  b.rect('TIMEFRAME.AXIS', { x: LEFT, y: AXIS_Y - AXIS_H / 2, w: RIGHT - LEFT, h: AXIS_H }, MID)

  let missingDurations = 0

  steps.forEach((step, i) => {
    const cx = LEFT + slotW * (i + 0.5)
    const above = i % 2 === 0
    const circleCy = above ? AXIS_Y - CIRCLE_OFFSET : AXIS_Y + CIRCLE_OFFSET

    // stem connecting the circle to the axis
    const stemTop = above ? circleCy : AXIS_Y
    const stemH = Math.abs(circleCy - AXIS_Y)
    b.rect(
      `TIMEFRAME.STEM_${i + 1}`,
      { x: cx - 0.008, y: stemTop, w: 0.016, h: stemH },
      MID
    )

    // numbered circle standing in for the original line-art icon
    const circle: Box = {
      x: cx - CIRCLE_D / 2,
      y: circleCy - CIRCLE_D / 2,
      w: CIRCLE_D,
      h: CIRCLE_D,
    }
    b.ellipse(`TIMEFRAME.MARK_${i + 1}`, circle, NAVY, {
      text: String(i + 1).padStart(2, '0'),
      sizePt: 11,
      bold: true,
      color: WHITE,
      anchor: 'ctr',
    }, { color: CREAM, widthPt: 1 })

    // label, on the far side of the circle from the axis
    const labelY = above
      ? circleCy - CIRCLE_D / 2 - LABEL_GAP - LABEL_H
      : circleCy + CIRCLE_D / 2 + LABEL_GAP
    b.rect(
      `TIMEFRAME.LABEL_${i + 1}`,
      { x: cx - labelW / 2, y: labelY, w: labelW, h: LABEL_H },
      null,
      {
        text: step.label,
        sizePt: n > 14 ? 7.5 : 8.5,
        color: NAVY,
        anchor: above ? 'b' : 't',
        align: 'ctr',
      }
    )

    // duration chip sitting on the axis
    const dur = fmtDuration(step.durationDays)
    if (dur) {
      b.roundRect(
        `TIMEFRAME.DURATION_${i + 1}`,
        { x: cx - durW / 2, y: AXIS_Y - DUR_H / 2, w: durW, h: DUR_H },
        CREAM,
        { text: dur, sizePt: n > 12 ? 7.5 : 8.5, bold: true, color: NAVY, anchor: 'ctr' },
        { color: MID, widthPt: 0.75 }
      )
    } else {
      missingDurations++
    }
  })

  if (missingDurations) {
    caveats.push({
      severity: 'check',
      message: `${missingDurations} of ${n} Time Frame steps have no duration; those steps render without a chip rather than with an invented figure`,
      where: 'Time Frame',
    })
  }
  if (n > MAX_COMFORTABLE_STEPS) {
    caveats.push({
      severity: 'check',
      message: `${n} steps on one Time Frame slide; labels will be cramped, consider splitting the section`,
      where: 'Time Frame',
    })
  }

  return { drawn: n, caveats }
}
