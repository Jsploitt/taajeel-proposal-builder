/**
 * The wizard's steps, in the deck's own section order.
 *
 * That order is a hard product requirement, not a convenience: staff need to
 * see which slide each field lands on. This table is the single source for the
 * step rail, the step headers and the "go to field" links on Review.
 */
export interface StepDef {
  n: number
  title: string
  /** Deck slides this step feeds. Shown on the rail and in every field's chip. */
  slides: number[]
  /** Section keys from slide_map.json, for cross-checking against resolveSections. */
  sections: string[]
  blurb: string
}

export const STEPS: StepDef[] = [
  {
    n: 1,
    title: 'Client',
    slides: [1, 5, 12, 27],
    sections: ['cover', 'letter', 'about_client', 'signoff'],
    blurb: 'Identity and contact details. These feed the cover, the letter block and the About-the-Client sentence.',
  },
  {
    n: 2,
    title: 'Engagement & letter',
    slides: [1, 5],
    sections: ['cover', 'letter'],
    blurb: 'Subject, date, reference number and what Taajeel is being asked to do.',
  },
  {
    n: 3,
    title: 'About the Client',
    slides: [12],
    sections: ['about_client'],
    blurb: 'Paragraph 1 is assembled from the client record. The rest comes from the snippet library, verbatim.',
  },
  {
    n: 4,
    title: 'Scope',
    slides: [13, 14, 15],
    sections: ['div_scope', 'scope'],
    blurb: 'The ordered steps on the journey graphic, each naming the government agency it goes through.',
  },
  {
    n: 5,
    title: 'Time Frame',
    slides: [16, 17, 18],
    sections: ['div_timeframe', 'timeframe'],
    blurb: 'Per-step durations. Turn the whole section off for a retainer.',
  },
  {
    n: 6,
    title: 'Additional & Optional',
    slides: [19, 20, 21, 22],
    sections: ['div_additional', 'additional'],
    blurb: 'Optional scope blocks, and what the scope does not cover.',
  },
  {
    n: 7,
    title: 'Fees',
    slides: [23, 24, 25],
    sections: ['div_fees', 'fees', 'gov_fees'],
    blurb: 'The fee is typed per proposal and never computed. VAT at 15% is the only money the app calculates.',
  },
  {
    n: 8,
    title: 'Review',
    slides: [],
    sections: [],
    blurb: 'Everything unconfirmed, everything the compiler flagged, and the download.',
  },
]

export const LAST_STEP = STEPS.length

export function stepDef(n: number): StepDef {
  return STEPS.find((s) => s.n === n) ?? STEPS[0]
}
