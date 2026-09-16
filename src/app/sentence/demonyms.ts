/**
 * ISO 3166-1 alpha-2 to the adjective used in "is a Bahraini limited liability
 * company".
 *
 * This is a lookup of documented facts, not generation: it only ever pre-fills
 * an editable input, and staff confirm or correct it. ClientRecord has no field
 * for this, so the value lives in UiState until the contract gains one.
 */
export const DEMONYMS: Record<string, string> = {
  AE: 'Emirati',
  BH: 'Bahraini',
  CA: 'Canadian',
  CH: 'Swiss',
  CN: 'Chinese',
  DE: 'German',
  EG: 'Egyptian',
  ES: 'Spanish',
  FR: 'French',
  GB: 'British',
  IE: 'Irish',
  IN: 'Indian',
  IT: 'Italian',
  JO: 'Jordanian',
  JP: 'Japanese',
  KW: 'Kuwaiti',
  LB: 'Lebanese',
  LU: 'Luxembourg',
  MA: 'Moroccan',
  NL: 'Dutch',
  OM: 'Omani',
  PK: 'Pakistani',
  QA: 'Qatari',
  SA: 'Saudi',
  SG: 'Singaporean',
  TR: 'Turkish',
  US: 'American',
  YE: 'Yemeni',
  ZA: 'South African',
}

/**
 * Countries staff pick from, keyed by the code the bundled flag uses.
 *
 * The name is written as it must read inside "registered in {country}", so the
 * article is part of the stored value rather than something the app generates.
 */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'SA', name: 'the Kingdom of Saudi Arabia' },
  { code: 'BH', name: 'the Kingdom of Bahrain' },
  { code: 'AE', name: 'the United Arab Emirates' },
  { code: 'KW', name: 'the State of Kuwait' },
  { code: 'OM', name: 'the Sultanate of Oman' },
  { code: 'QA', name: 'the State of Qatar' },
  { code: 'JO', name: 'the Hashemite Kingdom of Jordan' },
  { code: 'LB', name: 'the Lebanese Republic' },
  { code: 'EG', name: 'the Arab Republic of Egypt' },
  { code: 'GB', name: 'the United Kingdom' },
  { code: 'US', name: 'the United States of America' },
  { code: 'DE', name: 'the Federal Republic of Germany' },
  { code: 'FR', name: 'the French Republic' },
  { code: 'NL', name: 'the Kingdom of the Netherlands' },
  { code: 'CH', name: 'the Swiss Confederation' },
  { code: 'IN', name: 'the Republic of India' },
  { code: 'SG', name: 'the Republic of Singapore' },
  { code: 'TR', name: 'the Republic of Türkiye' },
]

export function demonymFor(countryCode?: string): string {
  return (countryCode && DEMONYMS[countryCode.toUpperCase()]) || ''
}
