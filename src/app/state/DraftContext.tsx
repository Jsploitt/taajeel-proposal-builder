import { createContext, useContext, useReducer } from 'react'
import type { Dispatch, ReactNode } from 'react'
import type { Action } from './actions'
import { initialState, reducer } from './reducer'
import type { AppState } from './types'

/**
 * State and dispatch are separate contexts so components that only dispatch --
 * the step rail, the toolbar -- never re-render on a keystroke.
 */
const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function DraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useDraft(): AppState {
  const v = useContext(StateContext)
  if (!v) throw new Error('useDraft must be used inside <DraftProvider>')
  return v
}

export function useDispatch(): Dispatch<Action> {
  const v = useContext(DispatchContext)
  if (!v) throw new Error('useDispatch must be used inside <DraftProvider>')
  return v
}

export function useSpec() {
  return useDraft().spec
}

export function useUi() {
  return useDraft().ui
}
