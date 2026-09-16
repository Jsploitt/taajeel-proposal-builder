/**
 * The entire Supabase swap surface.
 *
 * When the schema exists this becomes:
 *   import { supabaseSource } from './supabase'
 *   export const db: DataSource = supabaseSource
 *
 * Nothing else in the app changes -- no component imports ./mock directly, and
 * client.logoPath is already opaque everywhere outside this folder.
 */
import { mockSource } from './mock'
import type { DataSource } from './source'

export const db: DataSource = mockSource

export type { DataSource } from './source'
export * from './types'
