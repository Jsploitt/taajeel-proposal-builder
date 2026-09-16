/**
 * Draft autosave.
 *
 * The spec goes to localStorage; logo bytes go to IndexedDB (see data/assets)
 * because a base64 logo would blow the 5 MB quota. Restoring is offered, never
 * automatic: silently reviving someone else's half-finished client on a shared
 * machine is the same class of bug as the copy-paste workflow this replaces.
 */
import { useEffect, useRef, useState } from 'react'
import type { AppState, PersistedDraft } from './types'

const KEY = 'taajeel.draft.v1'
const DEBOUNCE_MS = 500

export function readDraft(): PersistedDraft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedDraft
    if (parsed?.version !== 1 || !parsed.spec || !parsed.ui) return null
    return parsed
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* private mode */
  }
}

function writeDraft(state: AppState) {
  const { compile: _compile, ...ui } = state.ui
  const payload: PersistedDraft = {
    version: 1,
    spec: state.spec,
    ui,
    savedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // Quota or private mode. The session still works; only the resume does not.
  }
}

/** Debounced autosave. Skips the first render so an empty draft never overwrites a real one. */
export function useAutosave(state: AppState, enabled: boolean) {
  const first = useRef(true)
  useEffect(() => {
    if (!enabled) return
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => writeDraft(state), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [state, enabled])
}

/** The draft found at mount, if any, so the shell can offer to resume it. */
export function useResumableDraft() {
  const [draft, setDraft] = useState<PersistedDraft | null>(null)
  const [decided, setDecided] = useState(false)

  useEffect(() => {
    const found = readDraft()
    if (found) setDraft(found)
    else setDecided(true)
  }, [])

  return {
    draft: decided ? null : draft,
    dismiss: (alsoClear?: boolean) => {
      if (alsoClear) clearDraft()
      setDecided(true)
      setDraft(null)
    },
  }
}
