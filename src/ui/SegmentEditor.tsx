import type { TextSegment } from '../compiler/types'
import { Button } from './Button'
import { TextArea } from './inputs'
import { cx } from './cx'

/**
 * Editor for TextSegment[]. The bold flag is structural, not decoration:
 * fillAboutClient clones the template's bold_exemplar run for bold segments
 * and regular_exemplar for the rest, so the alternation is what carries the
 * deck's typography.
 *
 * Text arriving from the snippet library is reproduced verbatim -- this editor
 * never normalises whitespace, quotes or the Arabic runs.
 */
export function SegmentEditor({
  segments,
  onChange,
  readOnly,
}: {
  segments: TextSegment[]
  onChange: (next: TextSegment[]) => void
  readOnly?: boolean
}) {
  const set = (i: number, patch: Partial<TextSegment>) =>
    onChange(segments.map((s, j) => (j === i ? { ...s, ...patch } : s)))

  return (
    <div className="flex flex-col gap-1">
      {segments.map((seg, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <TextArea
            rows={Math.min(5, Math.max(1, Math.ceil((seg.text.length || 1) / 90)))}
            value={seg.text}
            readOnly={readOnly}
            onChange={(e) => set(i, { text: e.target.value })}
            className={cx('font-mono text-xs', seg.bold && 'font-bold')}
            aria-label={`Segment ${i + 1}`}
          />
          <Button
            size="sm"
            variant={seg.bold ? 'primary' : 'secondary'}
            disabled={readOnly}
            aria-pressed={!!seg.bold}
            aria-label={`Toggle bold on segment ${i + 1}`}
            onClick={() => set(i, { bold: !seg.bold })}
            className="mt-0.5 h-6 w-7 font-bold"
          >
            B
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={readOnly}
            aria-label={`Remove segment ${i + 1}`}
            onClick={() => onChange(segments.filter((_, j) => j !== i))}
            className="mt-0.5 h-6 px-1 text-blocker hover:bg-blocker/5 hover:text-blocker"
          >
            ✕
          </Button>
        </div>
      ))}
      {!readOnly && (
        <Button size="sm" variant="ghost" onClick={() => onChange([...segments, { text: '' }])} className="self-start">
          + segment
        </Button>
      )}
    </div>
  )
}

/** Read-only rendering of segments as the deck will read them. */
export function SegmentPreview({ segments, className }: { segments: TextSegment[]; className?: string }) {
  return (
    <p className={cx('text-sm leading-relaxed text-navy-900', className)}>
      {segments.map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-semibold">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </p>
  )
}
