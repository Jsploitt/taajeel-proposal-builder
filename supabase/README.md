# Supabase — Taajeel Proposal Builder

Project ref: **`tsolvyvqngejbailyllg`**

Nothing in this directory has been applied. These are SQL files on disk, written
to be applied by a later session.

```
supabase/
  migrations/0001_init.sql      tables, triggers, indexes, column comments
  migrations/0002_rls.sql       RLS: one role, authenticated does everything
  migrations/0003_storage.sql   buckets client-logos + templates and their policies
  seed.sql                      services, scope_steps, rate_card, boilerplate
```

## How to apply

**With the Supabase CLI**

```bash
supabase link --project-ref tsolvyvqngejbailyllg
supabase db push            # runs migrations/ in filename order
psql "$DATABASE_URL" -f supabase/seed.sql
```

`supabase db push` does **not** run `seed.sql` against a linked remote project —
it only runs it on `supabase db reset` against a local stack. Apply the seed
explicitly, or paste it into the SQL editor. It is idempotent (fixed UUIDs plus
`ON CONFLICT ... DO UPDATE`), so re-running it is safe and will refresh changed
rows in place.

**With the Supabase MCP, in a session that has it**

Apply each file in order with `apply_migration` (name it after the file), then
run `seed.sql` with `execute_sql`. Same order: 0001 → 0002 → 0003 → seed.

**Notes on applying**

- `0003_storage.sql` creates policies on `storage.objects`. That needs an owner
  role. It works through `db push` and through the MCP (both connect as the
  admin role); it will fail if run as a plain `authenticated` connection.
- `0002_rls.sql` revokes from the `anon` role, which exists on every Supabase
  project but not on a bare Postgres.
- `0001_init.sql` needs `pgcrypto` and `pg_trgm`. Both ship with Supabase; the
  file creates them `if not exists`.
- `proposals.created_by` references `auth.users(id)` and defaults to
  `auth.uid()`, so rows inserted from the SQL editor (no JWT) get `NULL`.

## What is here

| Table | Rows seeded | What it is |
|---|---|---|
| `clients` | 0 | `ClientRecord`. No client is seeded — the three in `proposal/` are real customers. |
| `services` | 3 | One per real proposal: P1, P2, P3. |
| `scope_steps` | 36 | 16 from P1, 9 from P2, 11 from P3. |
| `boilerplate` | 28 | Prose reused across proposals, all `verbatim = true`. |
| `rate_card` | 10 | The "Taajeel Fees (Additional & Optional)" grid, P1 slide 24. |
| `proposals` | 0 | One row per **version**; `spec` is a whole `DeckSpec`. |

`proposals.spec` holds the entire `DeckSpec` verbatim and is never normalised
into columns. That is the point of the table: re-rendering an old row reproduces
the deck that was actually sent, even after the client record, the service
defaults and the rate card have all moved on. Versions of one proposal share a
`family_id` and are unique on `(family_id, version)`; a revision is a new row,
never an `UPDATE`.

## Where the seed data came from

Every value was read off the source proposals. Nothing was estimated.

- **P1 Havenstone** (`.pptx`) — service `Foreign Company Formation in Saudi
  Arabia`, `project`. 16 scope steps read from slide 14's journey graphic,
  labels verbatim from the live text runs, order from the numbered badges 01–16,
  cross-checked against the render at `build/renders/taajeel_master/14.png`.
- **P2 FlyAkeed** (`.pdf`) — service `Annual Confirmation …`, `project`. 9 scope
  steps from page 14. The PDF text layer emits them out of order, so each label
  was paired to its badge by coordinate and confirmed against a rendered page.
- **P3 HCP** (`.pdf`) — service `HRO & GRO with National Address and Office
  Services`, `retainer`. 11 scope steps from pages 14–15 across two scope
  blocks. No Time Frame; the 15 "Non-covered by the scope of work" items from
  page 17 are in `default_sections`.
- **Rate card** — P1 slide 24, badges 3–12, verified against the render.
  Badges 1 and 2 on that slide are the engagement fee itself (40,000 + VAT
  6,000) and are deliberately **not** seeded: a headline fee is typed per
  proposal and has no default.

## Still needs a human decision

Everything below is `NULL` or absent on purpose. `NULL` means *unconfirmed*,
never *confirmed empty*.

### 1. Durations — every `scope_steps.default_duration_days` is NULL

The Time Frame is a **different list** from the Scope of Work, so the durations
cannot be attached to scope steps without a judgement call:

- P1 slide 17's timeline has **16 labels but only 15 duration chips**, and its
  labels are not the scope labels (the timeline has `MUDAD`, which is not a
  scope step; the scope has `Company name reservation`, which is not on the
  timeline). By x-position the chips pair as: Workshop 1, Apply for MISA License
  5, Submit AOA 5, Get Approval 2, Notarize AOA 1, Pay Government Fees 1,
  Advertise AOA 1, Receive Commercial Register 3, Ratify Signatures 3, Zakat Tax
  and Customs Authority 1, National address 1, Human Resources and Social
  Development 1, QIWA 1, General Organization for Social Insurance 2, MUDAD 3 —
  and **Muqeem gets none**. Whether Muqeem genuinely has no duration or a chip
  is missing from the deck is unknown.
- P2 page 16's Time Frame has **8 duration chips against 7 labels**, for a scope
  of 9 steps, and one of its labels reads "Submission of Industrial MISA
  license" — an apparent copy-paste leftover, since P2 is an annual confirmation
  with no MISA step.
- P3 has no Time Frame section at all.

**Decide:** whether Time Frame is its own list (it looks like it is, in which
case it wants its own table and `scope_steps.default_duration_days` should be
dropped), and what the missing 16th P1 duration is.

Note also that `fixtures/meridian.json` gives all 16 P1 scope steps a duration.
The first 15 match P1 slide 17's chips in order; the 16th (`3` on "Registration
in Muqeem platform") has no counterpart in the source deck. Treat the fixture's
durations as synthetic.

### 2. P1 — the fixture and the real deck disagree

The brief said to reuse `fixtures/meridian.json`'s `scope[0].steps`. That
fixture is explicitly synthetic and it does **not** match the Havenstone deck,
so the seed follows the deck instead (rules: never reword lifted text, never
show the wrong agency mark). Differences:

| | fixture | P1 deck |
|---|---|---|
| Order | Workshop, MISA, SBC, MOC approval, name reservation, pay fees, notarize, advertise, **receive CR**, QIWA, HRSD, GOSI, TAX, VAT, national address, Muqeem | Workshop, MISA, SBC, MOC approval, name reservation, pay fees, notarize, advertise, **HRSD**, QIWA, Muqeem, GOSI, national address, TAX, VAT, **Ratification of partner signatures** |
| Labels | shortened ("Registration in QIWA Platform") | full ("Registration in QIWA Platform for management the engagement with Employees") |
| Missing | — | "Ratification the signatures of the partners" (badge 16) is absent from the fixture |
| `agency` on "Get approval from MOC" | `moc` | **no mark in the deck** |
| `agency` on "Company name reservation" | `moc` | **no mark in the deck** |
| `agency` on "Pay the fees" | none | **`moc`** — the single MOC mark sits above this gear |

**Decide:** is the deck's mark placement correct, or is the MOC logo simply
mis-positioned in the source file? Steps 04 and 05 are seeded with `agency =
NULL`, which removes the mark rather than printing a wrong one.

**Also unresolved:** the P1 journey draws a large unnumbered gear labelled
"Receive a Commercial Register" between badges 08 and 09. The deck says
"sixteen steps" and numbers exactly 16, so it is seeded as a milestone that is
*not* a scope step — i.e. it is **not** in `scope_steps`. If the compiler's
slot-subtraction expects 17 labels on slide 14, this is the missing one.

### 3. P1 has a second scope block that is not seeded

Slide 15, "Issue the resident visa the main General Manager", is a second
15-step scope block, and P1's fee slide covers "Set up foreign company & Issue
resident visa for main General Manager". The brief scoped P1 to 16 steps, so
those 15 steps were left out. The text is intact in the source deck if they
should be added as `block_ordinal = 2`.

### 4. Agency keys that have no artwork or no key

- `misa` is in `template/assets/agencies/index.json` but its `file` is `null`
  ("not extracted — supply artwork"). P1 step 02 references it.
- **MUDAD** has no key in the agency index at all, so P3's "Payroll submission
  in MUDAD a platform" is seeded with `agency = NULL`. MUDAD also appears as a
  P1 Time Frame label. Add a key + artwork, or accept no mark.
- P3's National Address block (page 15) shows National Address, SBC/TAYSEER and
  MISA logos as a row at the side, not beside individual steps, so those three
  steps carry `agency = NULL`.

### 5. Ordering that the source does not define

- **P3 HRO wheel** (page 14): three segments of a cycle with no numbers and no
  start marker. Seeded clockwise from the top-right segment. Each segment has a
  heading and a caption in two separate text boxes; both lines are kept in one
  `label`, separated by a newline, so nothing is lost — but a single-run text
  fill will need to handle that.
- **P3 National Address funnel** (page 15): three unnumbered circles, seeded top
  to bottom (Saudi Address, Receive Documents, Send Documents).

### 6. Text that differs between the three proposals

One variant is stored, `boilerplate.source_proposal` names it, and the others
are recorded there too. The ones to rule on:

| Key | Variants |
|---|---|
| `about_taajeel.adding_value` | P1 "**You** are partnering", P2 "**the** are partnering" (a typo that was sent), P3 "**you** are partnering" |
| `letter.opening` | P1 sentence case, P2/P3 Title Case Every Word |
| `signoff.entity` | P1 "Taajeel Business Solutions Co L.L.C.", P2/P3 "…Co LLC" |
| `fees.note.maturity_five_days` | P1/P2 "Payments paid within…", P3 "Payments **Should** paid within…" |
| `fees.note.gov_fees_excluded` | P1 adds ", Government Fees page attached in separate slide." |
| `letter.close`, `letter.close_entity` | present in P2/P3, not live text in P1 |

Which spelling is house style is a Taajeel decision, not a data one.

### 7. Not seeded at all, on purpose

- **Reference numbers.** The scheme is UNKNOWN (`template/FORENSICS.md` §7). No
  column, no default, no generator. It lives only in `proposals.spec`
  (`engagement.referenceNumber`) and is typed in every time.
- **Letter dates.** Same: `engagement.letterDate`, never derived from today.
- **Headline fees.** `services.default_sections.fees` deliberately has no
  `headline`. The three observed headlines (40,000 / 10,000 / 4,400 per month)
  belong to those three clients, not to the service.
- **Clients.** The three in `proposal/` are real customers; seeding them would
  put live client data in a fixture file.
- **Back-cover block.** "©Taajeel Proposal 2026" and the contact block
  (CR 1010941670, +966 92000 6247, 7697 Abi Baker Siddiq AlTaawun,
  www.taajeel.sa) carry a year and are baked into the template, so they are not
  in `boilerplate`. Confirm whether the year should be dynamic.
- **Terms & Conditions.** Four identical slides in all three decks; they are
  template-baked boilerplate slides, not snippets the UI composes from.

## Where this schema and `src/compiler/types.ts` disagree

Reported, not fixed. `types.ts` was not touched.

1. **`DeckSpec.scope` is `ScopeBlock[]`; `scope_steps` is flat.** The brief's
   column list has no block grouping, but P3 genuinely has two scope blocks.
   Added three nullable columns — `block_ordinal`, `block_title`, `block_intro`
   — so `ScopeBlock[]` can be reconstructed. `ordinal` stays unique across the
   whole service, as specified.
2. **`Fees` has nowhere for P3's retainer payment terms.** P3's fee slide has a
   "Payment Method:" line with no percentage — "Advance payment every 6 months
   for the monthly subscription." — and a qualifier next to the amount, "The
   GRO&HRO is for cover from 1-5 employees". `Fees` offers only
   `paymentSplit: {pct, when}[]` and `notes: string[]`. Forcing the first into
   `paymentSplit` would require inventing `pct: 100`. Both are seeded as extra
   keys `fees.paymentMethodNote` and `fees.coverageNote` in
   `services.default_sections`. **`types.ts` needs a field, or these belong in
   `notes`.**
3. **`nonCovered.items` is `string[]`, but P3's slide has two titled rings.**
   `default_sections.nonCovered` carries the contract-shaped flat `items` array
   *and* an extra `groups` array preserving the GRO/HRO split. Also an extra
   `intro` — `nonCovered` has no intro field, but the slide has one sentence of
   intro text.
4. **`ScopeStep.label` is one string; P3's HRO segments are two text boxes.**
   Seeded as one label with an embedded newline. A `mode: 'text'` fill will
   render that as a literal newline or drop it, depending on the fill
   implementation.
5. **`rate_card` has no currency column and `RateCardItem` has no currency
   field.** Every amount in the source deck is SAR and the template draws the
   riyal glyph itself. Fine today; it breaks the first time a fee is quoted in
   another currency.
6. **`ClientRecord.registrationLabel` is documented as a three-value union** in
   the `types.ts` comment, but P3's About-the-Client text uses "License No." and
   "MISA License No." together. The column is unconstrained `text`.
7. **`Fees.currency` is required in `types.ts`** but there is no currency
   anywhere in `clients` or `services` outside `default_sections.fees.currency`,
   which a staff member can override per proposal. Intentional, but worth
   knowing.
