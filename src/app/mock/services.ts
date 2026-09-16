import type { ServiceRow } from '../data/types'
import { meridianSpec } from './meridian'

/**
 * Scope titles and intros are reproduced verbatim from past proposals --
 * never translated, paraphrased or "improved".
 */
export const services: ServiceRow[] = [
  {
    id: 'svc-foreign-company',
    name: 'Foreign company formation',
    defaultEngagementType: 'project',
    scopeTitle: meridianSpec.scope[0].title,
    scopeIntro: meridianSpec.scope[0].intro,
    defaultSubject:
      'Proposal for Professional Services of Foreign Company Formation in Saudi Arabia',
    defaultServiceDescription:
      'professional services of foreign company formation in Saudi Arabia',
  },
  {
    id: 'svc-annual-confirmation',
    name: 'Annual confirmation (retainer)',
    defaultEngagementType: 'retainer',
    scopeTitle: 'Annual Confirmation',
    scopeIntro: '',
    defaultSubject: 'Proposal for Annual Confirmation Services',
    defaultServiceDescription: 'annual confirmation services',
  },
]
