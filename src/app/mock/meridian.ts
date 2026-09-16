/**
 * The reference spec, imported from the fixture rather than retyped.
 *
 * Importing it keeps the seeded proposal in lockstep with the compiler
 * session's fixture and makes the golden comparison meaningful: compiling this
 * in the browser must produce the same bytes as `npm run render`.
 */
import type { DeckSpec } from '../../compiler/types'
import fixture from '../../../fixtures/meridian.json'

export const meridianSpec = fixture as unknown as DeckSpec
