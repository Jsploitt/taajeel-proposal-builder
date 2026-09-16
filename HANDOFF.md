# Handoff — Proposal Brief Builder (Taajeel / Start Saudi)

Written to move this task from a chat session into Cowork. Upload this file **and**
`rfp-brief-builder.html` together at the start of the Cowork session.

---

## 1. What this is

A rebuild of an existing Streamlit RFP generator. The original app drafted proposals itself.
This version does not. It collects inputs and emits **one portable prompt** — a self-contained
build brief that gets pasted into whatever AI agent Taajeel or Start Saudi chooses, and that
agent builds the deck.

The app is a **single self-contained HTML file**. No build step, no dependencies, no server.
Open it in a browser and it runs. Keep it that way unless there's a reason not to.

Deadline context: this was built for a demo. It works end to end today. Everything below
marked "next" is improvement, not repair.

---

## 2. Decisions already made (don't relitigate without reason)

| Question | Answer |
|---|---|
| Does Step 3 show a draft? | **No.** Inputs go straight to one assembled brief. No draft sections, no per-section editing. |
| What does the brief tell the agent to build? | **A branded .pptx file.** |
| Which original features carried over? | AR/EN toggle with RTL flip; evidence badges and confidence labels; client search plus research-and-fill. |
| Which were dropped? | **The Control Panel** (the live re-theming mini-CMS). Cut for time. Colours are now seven hex values in `:root`. |

Two judgement calls made without asking, flagged to the user and not objected to:

- **The brief body is always English**, even when the UI is in Arabic. Agent instruction-following
  degrades in Arabic, and the deck language is specified explicitly *inside* the brief anyway.
  There's a UI string (`promptLangNote`) explaining this, currently not displayed anywhere —
  wire it up if it comes up in the demo.
- **Text lifted from past proposals is never translated**, in either UI language. This was already
  a rule in the original app: translating evidence misrepresents it.

---

## 3. Brand and design direction

Derived from start-saudi.com (deep ink chrome, cream wordmarks, Taajeel as the endorsing mark,
plain declarative voice — the site literally says "The durations above are the government's, not ours").
The colours are an informed approximation, not sampled from a brand book. If you get the real
tokens, they change in one place.

```
--ink    #0C1C24   --cream  #F4EDE1   --paper  #F7F4EE
--brass  #A8801F   --green  #1A6B4F   --clay   #A8481B   --slate #5C6B72
```

Type: IBM Plex Sans + IBM Plex Sans Arabic + IBM Plex Mono, from Google Fonts. Chosen as a
genuinely coherent bilingual pair with a registry/technical feel. The same palette and type
scale are written into the brief's design-system block, so what the agent builds matches the tool.

---

## 4. File map — `rfp-brief-builder.html` (~1,230 lines)

Single file: CSS in `<style>`, markup, then one `<script>` at the end. Sections are commented.

| Lines | What |
|---|---|
| 1–195 | CSS. Tokens in `:root`. `html[dir="rtl"]` swaps the font stack; layout uses logical properties so RTL flips for free. |
| 199–258 | Step 1 markup — search, hits container, new-client form. |
| 260–292 | Step 2 markup — chosen client, service picker, evidence caption, task, deck language, date. |
| 294–350 | Step 3 markup — prompt slab, brief options, evidence ledger, open-questions panel. |
| 358–503 | `I18N` — every UI string in `en` and `ar`. `paint()` re-renders all `[data-i]` nodes. |
| 508–688 | **Demo data.** `CLIENTS` (6 synthetic), `SECTIONS` (9-slide skeleton), `SERVICES` (6, each with per-section sources, citations, and core/conditional/optional scope). |
| 681–688 | `BLANK_SERVICE` — the fallback shape for "Other", everything set to needs-human. |
| 721–851 | Step 1 logic — search, `research()` (live API call), `applySuggestion()`, `createClient()`. |
| 856–890 | Step 2 logic — service options, `currentService()`, evidence caption. |
| 903–1194 | Step 3 logic. **`buildPrompt()` at 957 is the heart of the whole thing.** |
| 1196–1220 | Render, copy, download. |

### The two places you'll actually edit

**`buildPrompt()` (line 957).** Builds the brief as an array of lines, joined with newlines.
Ten numbered sections: rules → interview instructions → client record → engagement →
evidence pack → open questions and scope → design system → deck structure → pptx build
notes → pre-delivery checklist. Section numbering shifts depending on which optional blocks
are toggled on, which is fragile — if you add a toggle, fix the numbering properly rather than
adding another ternary.

**`SERVICES` (line 542).** Each entry: `{id, n, conf, en, ar, sections{}, core[], conditional[], optional[]}`.
`n` is the prior-proposal count, `conf` is `observed | possible | insufficient`, and each key in
`sections` is `{s: "reuse"|"template"|"ai"|"human", cite: "..."}`. This is the mock knowledge base.

---

## 5. Live API call

`research()` (line 771) calls `api.anthropic.com/v1/messages` with the `web_search_20250305`
tool, model `claude-sonnet-4-6`. The system prompt forces JSON-only output and instructs the
model to **omit any field it cannot confirm** — an omitted key means unconfirmed, never
confirmed-empty. Confirmed fields fill the form with a brass highlight and a "confirm before
saving" note. On any failure it degrades to a Google search link.

This works because artifacts in Claude proxy the API key. **In Cowork, or on a file opened
directly from disk, this call will fail** and fall back to the Google link. If you need it live
outside an artifact you'll have to supply a key or proxy it, and a raw key in a client-side HTML
file is not something to ship.

---

## 6. The demo script

1. Search `1051` (Beit Al Rayan — no CR, no NUN on record).
2. Pick **Market entry feasibility study**. One prior proposal → "Insufficient evidence"
   shows *before* anything is assembled.
3. Assemble. The brief refuses to pre-fill a single scope item and tells the agent not to infer
   a scope from general knowledge of Saudi company formation.
4. Go back, switch to **Company formation under a MISA investment licence**. Seven prior
   proposals, full core/conditional/optional scope, citations on five sections.
5. Same client, two clicks, visibly different brief. That contrast is the pitch.
6. Toggle AR at any point to show the RTL flip — and point out that the scope items stay in
   English because they came from real proposals.

---

## 7. Known gaps, roughly in priority order

1. **Real knowledge-base data.** `SERVICES` is synthetic. The single highest-value change is
   porting the actual section classifications, confidence figures, and citations out of the
   original repo, so the badges are credible rather than decorative. The repo is
   `github.com/mymona-cd/rfpGenerator` — it returns 404, presumably private, so it was never read.
   Everything here is reconstructed from a written feature summary.
2. **State resets on refresh.** Clients and services are in-memory. Persisting them needs a
   decision about where — the artifact storage API, a real backend, or accepting it for demos.
3. **The Control Panel is absent.** If it comes back, the useful version rewrites the design-system
   block inside the generated brief as well as re-theming the app, so a theme change propagates
   into the deck the agent produces.
4. **The brief assumes the agent can execute Python** to build the .pptx. If Taajeel's agent of
   choice is chat-only, change section 9 to request a structured deck spec instead of a file.
   That's one paragraph.
5. **`promptLangNote` is defined but never rendered.**
6. **No feedback log.** The original logged human corrections as evidence stronger than raw
   frequency. The brief *instructs the agent* to surface corrections, but nothing captures them
   on the way back. That round trip is the real product, and it doesn't exist yet.
7. **Section numbering in `buildPrompt()`** is computed with stacked ternaries. Fix before adding
   a fourth toggle.

---

## 8. Constraints to preserve

- Single file, no build step, opens in a browser.
- Every user-visible string goes in `I18N` in both languages. No hardcoded English in markup.
- Content that came from real proposals is never translated and never silently rewritten.
- A blank field means unconfirmed, never confirmed-empty — in the UI, in the research call,
  and in the brief. This rule is load-bearing in three places; don't soften it in one of them.
- The brief never contains a price, a duration, or a date the user didn't supply.

---

## 9. Opening line for the Cowork session

> Continuing the Proposal Brief Builder. Read HANDOFF.md, then rfp-brief-builder.html.
> Next task: [what you want].
