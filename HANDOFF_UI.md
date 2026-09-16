# Parallel session brief — React intake UI

Paste this whole file as the opening message of a new Claude Code session in
`C:\Users\mouta\Desktop\Trellis\Start_Saudi`.

---

## What this project is

A web app for **Taajeel** (taajeel.sa), a Saudi corporate-services firm, that generates
client proposal decks as real `.pptx` files. Today staff copy a previous client's signed deck
and find-and-replace the names, which leaks the previous client's logo and identity.

**Architecture, already decided — do not relitigate:**

| | |
|---|---|
| AI in the pipeline | **None.** Deterministic template + content library only. Client data must never reach a third-party model. |
| Hosting | Netlify (static) + Supabase (Postgres, Storage, Auth). **No backend server.** |
| Deck assembly | **In the browser**, by a TypeScript OOXML compiler. Already built and working. |
| Stack | Vite + React + TypeScript + Tailwind. Dependencies already installed. |
| Roles | Single role. Everyone can do everything. No approval gate. |
| Deck language | English body; Arabic only as existing brand furniture. |

## Your scope: the intake UI only

**Build in `src/app/**` and `src/ui/**`. Create them.**

**Do NOT modify** — another session is actively working in these:
- `src/compiler/**` — the deck compiler
- `tools/**` — template preparation and verification (Python)
- `template/**` — the master template and `slide_map.json`
- `fixtures/**` — DeckSpec fixtures

Treat `src/compiler/types.ts` as a **read-only contract**. If you need a field that isn't
there, write it down and raise it rather than editing the file — the compiler and the
template spec are generated against it.

## The contract

Read `src/compiler/types.ts` first. The whole app produces one `DeckSpec` object.

```ts
import { compose } from '../compiler/compose'
const res = await compose(spec, templateBytes, slideMap, { loadAsset })
// res.blob      -> Uint8Array, the .pptx
// res.caveats   -> { severity: 'blocker'|'check'|'info', message, where }[]
// res.filename  -> suggested download name
```

Working reference: `scripts/render.ts` and `fixtures/meridian.json` (a complete, valid spec).
Run it with `npm run render fixtures/meridian.json` to see a real deck come out.

## What to build

A wizard **whose step order mirrors the deck's section order** — that is a hard product
requirement, so staff can see which slide each field lands on. Label every field with its
destination slide.

1. **Client** — search/select existing, or create. Fields map 1:1 onto the About-the-Client
   sentence: legal name, display name (cover treatment), legal form, country, registration
   label + number, incorporation date, capital, activity, address, contact name, mobile,
   email, web, logo upload.
2. **Engagement & letter** — subject, letter date, reference number, project vs retainer,
   service description.
3. **About the Client** — paragraph 1 is a **sentence-builder** assembled from the fields
   above (show a live preview of the real sentence). The background/intent paragraphs come
   from an editable **snippet library**. Each paragraph carries a style:
   `body | subhead | small | emphasis`, and segments with an optional `bold` flag.
4. **Scope** — pick a service, then edit its ordered steps (add/remove/reorder, and each
   step names a government agency).
5. **Time Frame** — per-step durations in days. Toggle the whole section off for retainers.
6. **Additional & Optional** — optional blocks.
7. **Fees** — headline fee typed per proposal (never computed), currency, payment split
   (50/35/15 default for projects), notes. VAT is computed at 15% and shown read-only.
   A stored rate card where staff **tick which items appear** and may override any price.
8. **Review** — the gate. List every `blocker` and `check` caveat from `compose()`, plus
   every field that will render as `[TO BE CONFIRMED]`. Download is enabled only when there
   are no blockers.

## Rules that are load-bearing — do not soften these

1. **Never invent a price, fee, duration, date or reference number.** The only arithmetic
   the app performs is VAT at 15% and the payment-split percentages.
2. **A blank field means unconfirmed, never confirmed-empty.** It renders a visible
   `[TO BE CONFIRMED]` in the deck — never a blank, never a previous client's value.
3. **Text reused from past proposals is reproduced verbatim** — never translated,
   paraphrased or "improved".
4. The reference-number scheme is **undocumented**. It is always a required input, never
   generated from a date.

## Data

Supabase project ref `tsolvyvqngejbailyllg`. **The schema does not exist yet** and the MCP
server is not yet authenticated, so:

- Build against local mock data in `src/app/mock/` shaped like the tables below.
- Put all data access behind a thin `src/app/data/` layer so swapping in the Supabase client
  is a one-file change.

Planned tables: `clients`, `services`, `scope_steps`, `boilerplate`, `proposals`
(`proposals.spec` holds the whole `DeckSpec` as jsonb, so any past proposal re-renders or
re-opens as the next version).

## Design

Match the deck: navy `#0F3353`, cream `#F1E8D9`, white. Those are measured from the real
deck — the brand-guidelines PDF disagrees with it, and the deck wins.

Sober and dense over playful: this is an internal tool for staff producing legal engagement
letters, used many times a day.

## Verify

```bash
npm run dev          # the app
npm run typecheck    # must stay clean
npm run render fixtures/meridian.json   # compiler sanity check
```

The real test: fill the wizard end to end, download the `.pptx`, and open it in PowerPoint.
"It downloaded" is not evidence it is valid.
