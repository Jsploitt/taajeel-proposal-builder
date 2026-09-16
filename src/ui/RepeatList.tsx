import type { ReactNode } from 'react'
import { Button } from './Button'
import { EmptyState } from './Card'

export interface RepeatListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  onAdd?: () => void
  onRemove?: (index: number) => void
  onMove?: (from: number, to: number) => void
  addLabel?: string
  /** Hard cap. The Add control disables at this length. */
  max?: number
  empty?: ReactNode
  /** Rendered between the ordinal and the row, e.g. a per-position warning. */
  rowNote?: (index: number) => ReactNode
}

/**
 * Ordered list with add / remove / move. Reordering matters structurally:
 * the journey graphic draws an agency mark per POSITION, so moving a step
 * moves which mark sits beside it.
 */
export function RepeatList<T>({
  items,
  renderItem,
  onAdd,
  onRemove,
  onMove,
  addLabel = 'Add',
  max,
  empty,
  rowNote,
}: RepeatListProps<T>) {
  const atMax = max !== undefined && items.length >= max
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && empty ? <EmptyState>{empty}</EmptyState> : null}

      <ol className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 rounded border border-navy-100 bg-white px-2 py-1.5">
            <span className="mt-1.5 w-5 shrink-0 text-right font-mono text-xs tabular-nums text-navy-300">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              {renderItem(item, i)}
              {rowNote?.(i)}
            </div>
            <div className="flex shrink-0 flex-col gap-0.5">
              {onMove && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Move item ${i + 1} up`}
                    disabled={i === 0}
                    onClick={() => onMove(i, i - 1)}
                    className="h-5 px-1 leading-none"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Move item ${i + 1} down`}
                    disabled={i === items.length - 1}
                    onClick={() => onMove(i, i + 1)}
                    className="h-5 px-1 leading-none"
                  >
                    ↓
                  </Button>
                </>
              )}
              {onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => onRemove(i)}
                  className="h-5 px-1 leading-none text-blocker hover:bg-blocker/5 hover:text-blocker"
                >
                  ✕
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {onAdd && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onAdd} disabled={atMax}>
            + {addLabel}
          </Button>
          {atMax && <span className="text-xs text-check">Maximum of {max} reached.</span>}
        </div>
      )}
    </div>
  )
}
