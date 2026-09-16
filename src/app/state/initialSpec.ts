import type { DeckSpec } from '../../compiler/types'
import type { UiState } from './types'

/**
 * A blank proposal. Every key DeckSpec requires, empty.
 *
 * Deliberately NOT seeded with sample values: a blank field means unconfirmed
 * and renders a visible [TO BE CONFIRMED]. It must never be a previous
 * client's value, and it must never be a plausible-looking default.
 */
export function initialSpec(): DeckSpec {
  return {
    client: { legalName: '', displayName: '' },
    engagement: { subject: '', letterDate: '', type: 'project', serviceDescription: '' },
    aboutClient: [],
    scope: [{ title: '', intro: '', steps: [] }],
    timeFrame: { show: false, steps: [] },
    additional: { show: false, blocks: [] },
    nonCovered: { show: false, items: [] },
    fees: { currency: 'SAR', notes: [] },
    rateCard: { show: false, items: [] },
    govFees: { show: false, rows: [] },
  }
}

export function initialUi(): UiState {
  return {
    step: 1,
    demonym: '',
    omitClauses: { incorporatedOn: false, capital: false, activity: false },
    para1Edited: false,
    compile: { status: 'idle', caveats: [], slides: [] },
  }
}
