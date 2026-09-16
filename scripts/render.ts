/**
 * CLI: render one or more DeckSpec fixtures to .pptx.
 *
 *   npm run render fixtures/havenstone.json [...]
 *
 * Output goes to build/. Verify with:
 *   python tools/verify_deck.py build/*.pptx
 * "It saved without error" is not evidence the file is valid -- only real
 * PowerPoint is.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { compose } from '../src/compiler/compose'
import type { DeckSpec, SlideMap } from '../src/compiler/types'

const TEMPLATE = 'template/taajeel_template.pptx'
const MAP = 'template/slide_map.json'
const OUT = 'build'

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('usage: npm run render <fixture.json> [...]')
    process.exit(2)
  }

  const template = await readFile(TEMPLATE)
  const map: SlideMap = JSON.parse(await readFile(MAP, 'utf8'))
  await mkdir(OUT, { recursive: true })

  let worst = 0
  for (const path of args) {
    const spec: DeckSpec = JSON.parse(await readFile(path, 'utf8'))
    const t0 = Date.now()

    const loadAsset = async (p: string) => {
      try {
        return new Uint8Array(await readFile(p))
      } catch {
        return null
      }
    }

    const agencyIndex = JSON.parse(
      await readFile('template/assets/agencies/index.json', 'utf8')
    ) as Record<string, { file: string | null }>

    const loadAgency = async (key: string) => {
      const entry = agencyIndex[key]
      if (!entry?.file) return null
      try {
        return new Uint8Array(await readFile(join('template/assets/agencies', entry.file)))
      } catch {
        return null
      }
    }

    const res = await compose(spec, template, map, { loadAsset, loadAgency })
    const out = join(OUT, `${basename(path, '.json')}.pptx`)
    await writeFile(out, res.blob)

    const kept = res.slides.length
    console.log(`\n=== ${basename(path)} -> ${out}`)
    console.log(`    ${kept} slides, ${(res.blob.length / 1e6).toFixed(1)} MB, ${Date.now() - t0}ms`)
    console.log(`    filename: ${res.filename}`)

    const blockers = res.caveats.filter((c) => c.severity === 'blocker')
    const checks = res.caveats.filter((c) => c.severity === 'check')
    if (blockers.length) {
      console.log(`    BLOCKERS (${blockers.length}):`)
      for (const c of blockers) console.log(`      ! ${c.where ?? ''} ${c.message}`)
      worst = 1
    }
    if (checks.length) {
      console.log(`    check (${checks.length}):`)
      for (const c of checks) console.log(`      - ${c.where ?? ''} ${c.message}`)
    }
    const infos = res.caveats.filter((c) => c.severity === 'info')
    if (infos.length) {
      console.log(`    info (${infos.length}):`)
      for (const c of infos) console.log(`      . ${c.where ?? ''} ${c.message}`)
    }
    if (!res.caveats.length) console.log('    no caveats')
  }
  process.exit(worst)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
