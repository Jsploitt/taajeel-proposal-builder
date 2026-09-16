import type { DeckSpec } from '../../compiler/types'
import type { Action, ToggleSection } from './actions'
import { initialSpec, initialUi } from './initialSpec'
import type { AppState, CompileState } from './types'

export const IDLE_COMPILE: CompileState = { status: 'idle', caveats: [], slides: [] }

export function initialState(): AppState {
  return { spec: initialSpec(), ui: initialUi() }
}

/** Any spec change makes the last compile stale. */
function invalidate(ui: AppState['ui']): AppState['ui'] {
  return ui.compile.status === 'idle' ? ui : { ...ui, compile: IDLE_COMPILE }
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** Blank means unconfirmed: an empty string is stored as undefined, not ''. */
function optional(value: string): string | undefined {
  return value === '' ? undefined : value
}

const ARRAY_KEY: Record<ToggleSection, 'steps' | 'blocks' | 'items' | 'rows'> = {
  timeFrame: 'steps',
  additional: 'blocks',
  nonCovered: 'items',
  rateCard: 'items',
  govFees: 'rows',
}

export function reducer(state: AppState, action: Action): AppState {
  const spec = state.spec
  const withSpec = (next: DeckSpec): AppState => ({ spec: next, ui: invalidate(state.ui) })

  switch (action.type) {
    // ------------------------------------------------------------- UI only
    case 'GOTO_STEP':
      return { ...state, ui: { ...state.ui, step: action.step } }

    case 'SET_UI':
      return { ...state, ui: { ...state.ui, ...action.patch } }

    case 'SET_OMIT_CLAUSE':
      return {
        ...state,
        ui: { ...state.ui, omitClauses: { ...state.ui.omitClauses, [action.clause]: action.value } },
      }

    // -------------------------------------------------------------- client
    case 'LOAD_CLIENT':
      return {
        spec: { ...spec, client: { ...action.client } },
        ui: { ...invalidate(state.ui), clientId: action.clientId, para1Edited: false },
      }

    case 'SET_CLIENT_FIELD': {
      const { field, value } = action
      // legalName and displayName are required strings; the rest are optional.
      const next =
        field === 'legalName' || field === 'displayName'
          ? { ...spec.client, [field]: value }
          : { ...spec.client, [field]: optional(value) }
      return withSpec({ ...spec, client: next })
    }

    case 'SET_LOGO':
      return withSpec({ ...spec, client: { ...spec.client, logoPath: action.logoPath } })

    // ---------------------------------------------------------- engagement
    case 'SET_ENGAGEMENT_FIELD': {
      const { field, value } = action
      const next =
        field === 'referenceNumber'
          ? { ...spec.engagement, referenceNumber: optional(value) }
          : { ...spec.engagement, [field]: value }
      return withSpec({ ...spec, engagement: next })
    }

    case 'SET_ENGAGEMENT_TYPE': {
      // The compiler keys the retainer path off an EMPTY paymentSplit, not off
      // engagement.type, so the two are kept consistent here rather than hoped
      // to agree. Switching to retainer drops the split; switching back leaves
      // it empty for the Fees step to offer the 50/35/15 default.
      const fees =
        action.value === 'retainer'
          ? { ...spec.fees, paymentSplit: undefined }
          : { ...spec.fees, period: undefined }
      return withSpec({ ...spec, engagement: { ...spec.engagement, type: action.value }, fees })
    }

    // -------------------------------------------------------- about client
    case 'ABOUT_SET':
      return withSpec({ ...spec, aboutClient: action.paras })

    case 'ABOUT_SET_PARA':
      return withSpec({
        ...spec,
        aboutClient: spec.aboutClient.map((p, i) => (i === action.index ? action.para : p)),
      })

    case 'ABOUT_ADD':
      return withSpec({ ...spec, aboutClient: [...spec.aboutClient, action.para] })

    case 'ABOUT_REMOVE':
      return withSpec({ ...spec, aboutClient: spec.aboutClient.filter((_, i) => i !== action.index) })

    case 'ABOUT_MOVE':
      return withSpec({ ...spec, aboutClient: move(spec.aboutClient, action.from, action.to) })

    // --------------------------------------------------------------- scope
    case 'SCOPE_SET_BLOCK':
      return withSpec({
        ...spec,
        scope: spec.scope.map((b, i) => (i === action.index ? { ...b, ...action.patch } : b)),
      })

    case 'SCOPE_SET_STEPS':
      return withSpec({
        ...spec,
        scope: spec.scope.map((b, i) => (i === action.index ? { ...b, steps: action.steps } : b)),
      })

    case 'SCOPE_ADD_BLOCK':
      return withSpec({ ...spec, scope: [...spec.scope, { title: '', intro: '', steps: [] }] })

    case 'SCOPE_REMOVE_BLOCK':
      return withSpec({ ...spec, scope: spec.scope.filter((_, i) => i !== action.index) })

    // --------------------------------------------------- optional sections
    case 'SET_SECTION_SHOW': {
      const key = ARRAY_KEY[action.section]
      const section = spec[action.section] as { show: boolean } & Record<string, unknown>
      return withSpec({ ...spec, [action.section]: { ...section, show: action.show, [key]: section[key] } })
    }

    case 'TIMEFRAME_SET_STEPS':
      return withSpec({ ...spec, timeFrame: { ...spec.timeFrame, steps: action.steps } })

    case 'ADDITIONAL_SET_BLOCKS':
      return withSpec({ ...spec, additional: { ...spec.additional, blocks: action.blocks } })

    case 'NONCOVERED_SET_ITEMS':
      return withSpec({ ...spec, nonCovered: { ...spec.nonCovered, items: action.items } })

    case 'RATECARD_SET_ITEMS':
      return withSpec({ ...spec, rateCard: { ...spec.rateCard, items: action.items } })

    case 'GOVFEES_SET_ROWS':
      return withSpec({ ...spec, govFees: { ...spec.govFees, rows: action.rows } })

    // ---------------------------------------------------------------- fees
    case 'SET_FEES_FIELD': {
      // Never writes vatAmount: a stored VAT snapshot would silently win over
      // a later headline edit. compose() derives it via computeVat instead.
      const { field, value } = action
      const next =
        field === 'currency' ? { ...spec.fees, currency: value } : { ...spec.fees, [field]: optional(value) }
      return withSpec({ ...spec, fees: next })
    }

    case 'FEES_SET_SPLIT':
      return withSpec({ ...spec, fees: { ...spec.fees, paymentSplit: action.split } })

    case 'FEES_SET_NOTES':
      return withSpec({ ...spec, fees: { ...spec.fees, notes: action.notes } })

    // ------------------------------------------------------------- compile
    case 'COMPILE_START':
      return { ...state, ui: { ...state.ui, compile: { ...IDLE_COMPILE, status: 'running' } } }

    case 'COMPILE_DONE':
      return { ...state, ui: { ...state.ui, compile: { status: 'done', ...action.result } } }

    case 'COMPILE_ERROR':
      return {
        ...state,
        ui: { ...state.ui, compile: { ...IDLE_COMPILE, status: 'error', error: action.error } },
      }

    // ------------------------------------------------------ whole document
    case 'LOAD_DRAFT':
      return { spec: action.spec, ui: { ...action.ui, compile: IDLE_COMPILE } }

    case 'LOAD_SPEC':
      return {
        spec: action.spec,
        ui: {
          ...initialUi(),
          step: state.ui.step,
          proposalId: action.proposalId,
          clientId: action.clientId,
          // Reopened text is somebody's edited prose; never regenerate over it.
          para1Edited: action.spec.aboutClient.length > 0,
        },
      }

    case 'RESET':
      return initialState()

    default:
      return state
  }
}
