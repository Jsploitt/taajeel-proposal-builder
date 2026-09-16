# Taajeel Proposal Builder

An internal tool for [Taajeel](https://taajeel.sa) that generates client proposal decks as real
`.pptx` files.

Today staff produce a proposal by copying a previous client's signed deck and find-and-replacing
the names, which leaks the previous client's logo and identity into a document that is a legal
engagement letter. This app builds each deck from a clean master template instead.

## How it works

| | |
|---|---|
| AI in the pipeline | **None.** A deterministic template plus a content library. Client data never reaches a third-party model. |
| Hosting | Netlify (static) + Supabase (Postgres, Storage, Auth). **No backend server.** |
| Deck assembly | **In the browser**, by a TypeScript OOXML compiler (`jszip` + `@xmldom/xmldom`). |
| Stack | Vite + React 18 + TypeScript + Tailwind |
| Roles | One role. Everyone can do everything. No approval gate. |
| Deck language | English body; Arabic only as existing brand furniture. |

Everything the app produces is a single `DeckSpec` object (`src/compiler/types.ts`), stored
verbatim in `proposals.spec` as jsonb so any past proposal re-renders identically or re-opens as
the next version.

## Rules that are load-bearing

1. **Never invent a price, fee, duration, date or reference number.** The only arithmetic the app
   performs is VAT at 15% and the payment-split percentages.
2. **A blank field means unconfirmed, never confirmed-empty.** It renders a visible
   `[TO BE CONFIRMED]` in the deck — never a blank, never a previous client's value.
3. **Text reused from past proposals is reproduced verbatim** — never translated, paraphrased or
   "improved".
4. The reference-number scheme is **undocumented**. It is always a required input, never generated
   from a date.

## Running it

Requires Node 20+. On the original Windows machine Node is installed but not on `PATH`; prefix
commands with `export PATH="/c/Program Files/nodejs:$PATH"` (bash) or
`$env:Path = "C:\Program Files\nodejs;$env:Path"` (PowerShell).

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run typecheck    # must stay clean
npm run render fixtures/meridian.json   # compile a fixture from the CLI, output in build/
python tools/verify_deck.py build/meridian.pptx   # opens it in PowerPoint and leak-checks it
```

**"It downloaded" is not evidence the file is valid.** Only real PowerPoint is.

## Layout

```
src/compiler/     the OOXML compiler and its read-only contract (types.ts)
src/app/          the intake wizard: state, data layer, steps, review gate
src/ui/           presentational primitives, no app imports
template/         the master .pptx, slide_map.json and agency artwork
fixtures/         DeckSpec fixtures (meridian.json is a complete valid spec)
scripts/render.ts CLI renderer
tools/            template preparation and verification (Python)
supabase/         migrations and seed SQL (not yet applied)
```

The wizard's step order mirrors the deck's section order, and every field is labelled with the
slide it lands on. That is a product requirement, not a layout choice.

## Not in this repo

- `proposal/` — three real signed client proposals. Gitignored deliberately; they contain real
  names, fees and contacts, and leaking a previous client's identity is the exact failure this
  project removes.
- `build/` — generated decks, PDFs and render output.
- `template/taajeel_master.pptx`, `template/taajeel_template.pdf`, `template/reference_renders/` —
  large provenance artefacts nothing in the build needs.

`template/taajeel_template.pptx` **is** tracked: the compiler cannot build a deck without it.

## Known gaps

See [`UI_NOTES_FOR_COMPILER.md`](UI_NOTES_FOR_COMPILER.md). The most important one: the country
flag on slide 12 is never swapped by the compiler, so every deck currently ships the template's
flag regardless of the client's country.
