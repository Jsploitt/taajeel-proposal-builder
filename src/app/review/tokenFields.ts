/**
 * Token to field, for display only.
 *
 * Which tokens fall back to [TO BE CONFIRMED] is decided by the compiler's own
 * buildValues(); this table exists purely so a flagged token can be shown as
 * "Engagement · Reference number · slide 5" and linked back to its step.
 */
export interface TokenField {
  label: string
  step: number
  slide: number
}

export const TOKEN_FIELDS: Record<string, TokenField> = {
  'COVER.CLIENT_NAME': { label: 'Client · Display name', step: 1, slide: 1 },
  'COVER.SUBJECT': { label: 'Engagement · Subject', step: 2, slide: 1 },

  'LETTER.REFERENCE': { label: 'Engagement · Reference number', step: 2, slide: 5 },
  'LETTER.CLIENT_NAME': { label: 'Client · Display name', step: 1, slide: 5 },
  'LETTER.DATE': { label: 'Engagement · Letter date', step: 2, slide: 5 },
  'LETTER.ADDRESS': { label: 'Client · Address', step: 1, slide: 5 },
  'LETTER.ATTENTION': { label: 'Client · Contact name', step: 1, slide: 5 },
  'LETTER.MOBILE': { label: 'Client · Mobile', step: 1, slide: 5 },
  'LETTER.EMAIL': { label: 'Client · Email', step: 1, slide: 5 },
  'LETTER.WEB': { label: 'Client · Website', step: 1, slide: 5 },
  'LETTER.SUBJECT': { label: 'Engagement · Subject', step: 2, slide: 5 },
  'LETTER.OPENING_TAIL': { label: 'Engagement · Service description', step: 2, slide: 5 },

  'SCOPE.TITLE': { label: 'Scope · Block title', step: 4, slide: 14 },
  'SCOPE.INTRO': { label: 'Scope · Intro paragraph', step: 4, slide: 14 },

  'FEES.AMOUNT': { label: 'Fees · Headline fee', step: 7, slide: 24 },
  'FEES.VAT': { label: 'Fees · VAT (derived from the fee)', step: 7, slide: 24 },

  'SIGNOFF.CLIENT_NAME': { label: 'Client · Legal name', step: 1, slide: 27 },
}

export function fieldFor(token: string): TokenField | undefined {
  return TOKEN_FIELDS[token]
}
