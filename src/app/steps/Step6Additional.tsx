import { useEffect, useState } from 'react'
import { Button, Callout, Card, RepeatList, SectionHeader, TextArea, TextInput, Toggle } from '../../ui'
import { db } from '../data'
import type { BoilerplateRow } from '../data'
import { useDispatch, useDraft } from '../state/DraftContext'

export function Step6Additional() {
  const { spec } = useDraft()
  const dispatch = useDispatch()
  const add = spec.additional
  const nc = spec.nonCovered

  const [blockSnips, setBlockSnips] = useState<BoilerplateRow[]>([])
  const [ncSnips, setNcSnips] = useState<BoilerplateRow[]>([])

  useEffect(() => {
    db.listBoilerplate('additional_block').then(setBlockSnips)
    db.listBoilerplate('non_covered').then(setNcSnips)
  }, [])

  const setBlocks = (blocks: { title: string; steps: string[] }[]) =>
    dispatch({ type: 'ADDITIONAL_SET_BLOCKS', blocks })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader title="Additional / optional scope" slides={[19, 20, 21, 22]} />
        <div className="flex flex-col gap-3 p-4">
          <Toggle
            checked={add.show}
            onChange={(v) => dispatch({ type: 'SET_SECTION_SHOW', section: 'additional', show: v })}
            label="Show the Additional section"
            description="Dropped when it is off OR when it has no blocks."
          />

          {add.show && (
            <>
              {blockSnips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-navy-500">Insert a stored block:</span>
                  {blockSnips.map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      onClick={() => setBlocks([...add.blocks, { title: s.label, steps: [...(s.steps ?? [])] }])}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              )}

              <RepeatList
                items={add.blocks}
                addLabel="block"
                empty="No optional blocks."
                onAdd={() => setBlocks([...add.blocks, { title: '', steps: [] }])}
                onRemove={(i) => setBlocks(add.blocks.filter((_, j) => j !== i))}
                onMove={(from, to) => {
                  const next = [...add.blocks]
                  const [b] = next.splice(from, 1)
                  next.splice(to, 0, b)
                  setBlocks(next)
                }}
                renderItem={(b, i) => (
                  <div className="flex flex-col gap-1.5">
                    <TextInput
                      value={b.title}
                      placeholder="Block title, e.g. Open bank Account"
                      onChange={(e) =>
                        setBlocks(add.blocks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                      }
                    />
                    <TextArea
                      rows={Math.max(2, b.steps.length)}
                      value={b.steps.join('\n')}
                      placeholder="One step per line"
                      onChange={(e) =>
                        setBlocks(
                          add.blocks.map((x, j) =>
                            j === i ? { ...x, steps: e.target.value.split('\n').filter((s) => s.trim() !== '') } : x
                          )
                        )
                      }
                      className="text-xs"
                    />
                  </div>
                )}
              />

              {add.blocks.length > 0 && (
                <Callout tone="info" title="Included, but not printed">
                  Slides 20–22 have no fills in the current template, so the section appears in the deck and the contents
                  page but these blocks are not printed on it.
                </Callout>
              )}
            </>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Not covered by the scope of work" />
        <div className="flex flex-col gap-3 p-4">
          <Toggle
            checked={nc.show}
            onChange={(v) => dispatch({ type: 'SET_SECTION_SHOW', section: 'nonCovered', show: v })}
            label="Record what the scope does not cover"
            description="Stored with the proposal. The template has no section for it yet, so it does not reach the deck."
          />

          {nc.show && (
            <>
              {ncSnips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-navy-500">Insert:</span>
                  {ncSnips.map((s) => (
                    <Button
                      key={s.id}
                      size="sm"
                      onClick={() => dispatch({ type: 'NONCOVERED_SET_ITEMS', items: [...nc.items, s.text ?? s.label] })}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              )}
              <RepeatList
                items={nc.items}
                addLabel="item"
                empty="Nothing recorded."
                onAdd={() => dispatch({ type: 'NONCOVERED_SET_ITEMS', items: [...nc.items, ''] })}
                onRemove={(i) => dispatch({ type: 'NONCOVERED_SET_ITEMS', items: nc.items.filter((_, j) => j !== i) })}
                onMove={(from, to) => {
                  const next = [...nc.items]
                  const [x] = next.splice(from, 1)
                  next.splice(to, 0, x)
                  dispatch({ type: 'NONCOVERED_SET_ITEMS', items: next })
                }}
                renderItem={(item, i) => (
                  <TextArea
                    rows={2}
                    value={item}
                    onChange={(e) =>
                      dispatch({
                        type: 'NONCOVERED_SET_ITEMS',
                        items: nc.items.map((x, j) => (j === i ? e.target.value : x)),
                      })
                    }
                    className="text-xs"
                  />
                )}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
