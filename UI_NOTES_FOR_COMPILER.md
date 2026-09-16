# Notes from the intake-UI session

Written while building `src/app/**` + `src/ui/**` against `src/compiler/types.ts` as a
read-only contract. Nothing in `src/compiler/**`, `tools/**`, `template/**` or `fixtures/**`
was modified.

Verified against the contract as of 16:30 today, after the `agency` / `loadAgency` /
`timeline` changes.

## 1. One typecheck error, in your file

```
src/compiler/compose.ts(255,10): error TS2678:
  Type '"name"' is not comparable to type '"table" | "text" | ... | "remove"'.
```

`applyFill` early-returns at line 183 (`if (fill.mode === 'name') return`), which narrows
`fill.mode` so the `case 'name'` at line 255 is unreachable. Deleting the dead case clears it.
`npm run typecheck` is otherwise clean; `npm run render` is unaffected because tsx does not
typecheck.

## 2. The country flag is never swapped — this is the identity leak the project exists to close

`slide_map.json` declares an `ABOUT_CLIENT.COUNTRY_FLAG` picture fill on slide 12, noted as
"source was the Bahrain flag -- client country of origin". `compose.ts` never references that
token: `replaceMediaFor` is passed only `COVER.CLIENT_LOGO`, `ABOUT_CLIENT.CLIENT_LOGO`,
`SCOPE.CLIENT_LOGO`, and `client.countryCode` appears nowhere in the compiler.

**Every deck currently ships the template's flag on slide 12 regardless of the client's
country.** The UI collects `countryCode` and shows a standing warning about this on Review.

## 3. Sections with no fills

Collected by the wizard, stored in `proposals.spec`, but not printed:

| Section | Slides | Spec field |
|---|---|---|
| Time Frame | 17, 18 | `timeFrame.steps` (labels and durations) |
| Additional | 20–22 | `additional.blocks` |
| Government fees | 25 | `govFees.rows` |
| Scope block 2 | 15 | `scope[1]` — **keeps the source proposal's text** |

`nonCovered` has no section key in `map.sections` at all (`TOC_LABELS` has `div_noncovered`
but nothing carries it), and `rateCard` has neither section nor fills. Both `show` flags are
inert.

Review lists all of these in their own "captured, but not rendered" bucket so staff cannot
mistake them for something they left blank. `timeline.ts` looks like it is closing the Time
Frame half — when it lands, tell us and we will drop that entry.

## 4. Smaller contract gaps

1. **`ClientRecord` has no demonym/nationality field.** Paragraph 1 of the reference deck reads
   "is a **Bahraini** limited liability company". We hold it in UI state, pre-filled from an
   ISO-code lookup, so it is *not* saved in `proposals.spec` and a reopened proposal re-derives
   it. A `demonym?: string` on `ClientRecord` would fix that.
2. **`fees.currency` and `fees.notes` are never rendered**; `money()` is a no-op, so
   `FEES.AMOUNT` is `fees.headline` verbatim. The Fees step tells staff to type the currency
   into the fee itself.
3. **`engagement.type` has no effect anywhere.** The retainer path is driven solely by an empty
   `paymentSplit`. The UI keeps the two consistent in its reducer, but the compiler could key
   off `type` directly.
4. **`paymentSplit` beyond 3 entries truncates silently**, with no caveat — the payment-method
   shape has 3 term lines. The UI caps the editor at 3.
5. **17 `SCOPE.STEP_nn` fills but only 16 `SCOPE.BADGE_nn`.** A 17-step scope renders a label
   with no number badge.
6. **`agency: "misa"` has `"file": null`** in `template/assets/agencies/index.json` — artwork was
   never extracted. The UI marks it "(no artwork)" in the picker.
7. **`compose()` hard-codes `v01`** in the filename, so re-rendering a proposal as the next
   version is misnamed.

## 5. What the UI relies on — please keep these exported

`computeVat`, `resolveSections` and `buildValues` are all imported by the app rather than
reimplemented:

- `computeVat` drives the read-only VAT field, so the preview and the deck cannot disagree.
- `resolveSections` drives the "sections this deck will contain" list on Review.
- `buildValues` **is** the `[TO BE CONFIRMED]` pre-flight: we run it and look for `TBC` in the
  output. Duplicating those rules in the UI would guarantee eventual divergence.

Character budgets and agency slot positions are read out of `slide_map.json` at runtime
(`src/app/deck/budgets.ts`, `src/app/deck/template.ts`), never hardcoded, so a template change
moves the UI's counters and warnings with it.

`compose()` is called with **both** `loadAsset` and `loadAgency`.

## 6. Verified

- Browser output is byte-identical to `npm run render` for the same spec: same length, same 279
  zip entries, **zero entries with differing content** — the only differing bytes are zip
  timestamps.
- `python tools/verify_deck.py` passes on a wizard-built deck: 31 slides, PDF export, paragraph
  schema, **leak check clean**.
- Uploading a new client logo replaces both logo media parts and the previous client's logo
  bytes are entirely absent from the package.
