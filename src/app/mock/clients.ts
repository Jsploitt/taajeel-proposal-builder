import type { ClientRow } from '../data/types'
import { meridianSpec } from './meridian'

/**
 * Seed clients. Entirely fictional: the .example TLD is IANA-reserved for
 * documentation, so nothing here can resolve to a real domain.
 */
export const clients: ClientRow[] = [
  { id: 'cli-meridian', updatedAt: '2026-03-15T09:00:00.000Z', ...meridianSpec.client },
  {
    id: 'cli-northwind',
    updatedAt: '2026-02-02T09:00:00.000Z',
    legalName: 'NORTHWIND TRADING EST.',
    displayName: 'Northwind Trading Est.',
    legalForm: 'sole proprietorship establishment',
    country: 'Kingdom of Saudi Arabia',
    countryCode: 'SA',
    registrationLabel: 'Commercial Registration No.',
    registrationNumber: '1010884417',
    incorporatedOn: '4 September 2021',
    capital: 'SAR 100,000',
    activity: 'wholesale trading of building materials',
    address: 'Olaya District, Riyadh 12213, Kingdom of Saudi Arabia.',
    attention: 'Mr. Faisal Al-Harbi',
    mobile: '+966 55 118 2240',
    email: 'f.alharbi@northwindtrading.example',
    web: 'www.northwindtrading.example',
  },
  {
    id: 'cli-calder',
    updatedAt: '2026-01-19T09:00:00.000Z',
    legalName: 'CALDER & VOSS PARTNERS LIMITED',
    displayName: 'Calder & Voss Partners Ltd.',
    legalForm: 'private limited company',
    country: 'United Kingdom',
    countryCode: 'GB',
    registrationLabel: 'Commercial Registration No.',
    registrationNumber: '09442187',
    incorporatedOn: '11 February 2015',
    capital: 'GBP 50,000',
    activity: 'management consultancy',
    address: '18 Pemberton Row, London EC4A 3BA, United Kingdom.',
    attention: 'Ms. Helena Voss',
    mobile: '+44 20 7946 0921',
    email: 'h.voss@caldervoss.example',
    web: 'www.caldervoss.example',
  },
]
