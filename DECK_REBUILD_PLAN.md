# Deck Rebuild Plan — Taajeel Proposal Generator

**For:** Claude Code, working in `mymona-cd/rfpGenerator` on the local machine
(where the gitignored `proposal/` folder actually exists).
**Goal:** replace the current `.pptx` output — which is a find-and-replace pass over a
real client's signed deck — with a genuine Taajeel master template and a renderer that
fills layouts. Output must be visually indistinguishable from the real proposals.

**Read first, in this order:** this file → `proposal_anatomy.md` → `CLAUDE.md` →
`generator/README.md` → `generator/render_pptx_branded.py`.

---

## 0. Scope and standing constraints

Decided with the client. Do not relitigate.

| Question | Answer |
|---|---|
| Brand on generated decks | **Taajeel.** Start Saudi stays on the app chrome only. The split in `CLAUDE.md` holds. |
| External AI tools | Staff must not paste client material into ChatGPT/Gemini. **The tool itself may call the Anthropic API server-side.** `draft.py`'s `llm` vs `template` tagging stays. |
| Output format | Real `.pptx`, built from a real template. Not a prompt, not a spec, not HTML. |
| Deck language | English body. Arabic only as brand furniture (tagline, `taajeel \| تعجيل`, `صقر الشاهين`) — matching all three real proposals. |

Rules that are load-bearing and must survive this rebuild:

1. Never invent a price, fee, duration, deadline or government timeline.
2. A blank field means **unconfirmed**, never confirmed-empty. Never fill the gap with
   something plausible, never silently drop the field.
3. Text lifted from a past proposal is reproduced verbatim — never translated,
   paraphrased, or "improved".
4. Evidence strength is carried through to the output. Weak evidence means say less.
5. Never `git push` without asking.

---

## 1. What is actually wrong — the diagnosis

`generator/render_pptx_branded.py` copies
`proposal/Proposal to HAVENSTONE CONSULTING W.L.L foreign company set up.pptx` —
**a real, signed client proposal** — to the output path and mutates it in place. Every
defect below follows from that one decision.

**Provenance defects**

- The previous client's own logo and country flag are images on the cover and
  About-the-Client slides. Text replacement cannot touch them, so every generated deck
  ships with Havenstone's logo until a human swaps it in PowerPoint. The code admits
  this in a caveat string rather than fixing it.
- Client identity is removed by hardcoded string match — `NAME_VARIANTS`,
  `OLD_CONTACT_EMAIL_LINE = "Email: phil@havenstone.me"`, `OLD_ADDRESS`, `OLD_REF_NUMBER`.
  Anything not on that list survives into the new client's deck. This is a data-leak
  shape, not just an aesthetic one.

**Fidelity defects — these are why it looks bad**

- `_replace_in_paragraph()` collapses every run in a paragraph into `runs[0]` and blanks
  the rest. Any intra-paragraph formatting — a bold client name, a differently sized or
  coloured span, a superscript — is destroyed and inherits `runs[0]`'s formatting. This
  fires on every slide in the deck via the global name/subject pass. **This is the single
  largest cause of the output looking wrong.**
- `shape.text_frame.text = about_section.text` wipes the shape's paragraph structure and
  formatting entirely, then drops arbitrary-length generated prose into a box sized for
  the old text. No autofit, no wrap control, no length budget → overflow off the slide.
- The target shape is chosen by `len(shape.text_frame.text) > 100`. A heuristic, not an
  identity. It will pick the wrong box as soon as the template changes.
- Slide positions are hardcoded 0-based indices (`LETTER_SLIDE_INDEX = 4`,
  `ABOUT_CLIENT_SLIDE_INDEX = 11`, `FEES_SLIDE_INDEX = 23`,
  `SERVICE_SPECIFIC_SLIDE_INDICES = [12..21, 24]`). Edit the template in PowerPoint and
  every one of these silently points at the wrong slide.
- **When the service is not P1's service, eleven slides are deleted** — the Scope of Work
  journey, the Time Frame, Additional/Optional, Government Fees — and replaced with
  `add_bulleted_slide()` output. The most distinctive pages in the deck become plain
  bullet lists. Since each of the three real proposals is a different service, this is
  the normal path, not the edge case.
- The table of contents is never recomputed. Its page numbers are P1's, and slides have
  been added and removed. Admitted in a caveat.
- `provisional_ref` is auto-generated from today's date. `proposal_anatomy.md` established
  the reference scheme is **unknown** — the embedded date matched the letter date in only
  1 of 3 real proposals. Auto-generating a reference number on a document that is
  explicitly an "Engagement Letter" is a correctness risk.

**The root cause:** there is no template. There is one client's deck being mutated. Every
defect above is a symptom of not having a real master with real layouts.

---

## 2. Facts already established — do not re-derive

From `proposal_anatomy.md` (n=3: P1 Havenstone `.pptx` 33 slides, P2 FlyAkeed `.pdf`
28 pages, P3 HCP `.pdf` 27 pages). Treat as given; verify only where noted.

**Constant across all three (≈60% of page count, ~17 of 28 pages in P2):** Terms &
Conditions (4 pages, verbatim, nine headings, arbitration at GCC Commercial Arbitration
Centre), About Taajeel narrative + logo symbolism, mission/vision/strategy/values, both
brand image pages, the tagline page, section dividers, the signoff paragraph, the Taajeel
signatory (Muath Abdullah A AlZahrani, General Manager), the fee notes, the back-cover
contact block.

**Deterministic — no AI call, no lookup:** VAT at 15% (exact in all three:
40,000→6,000; 10,000→1,500; 4,400→660). The 50/35/15 payment split for one-off project
work. TOC assembly and page numbering. The Taajeel signatory block.

**Rate-card lookup, not generation:** translation 150 per 250 words, attestation 850 per
document — identical in P1 and P2. P1 Slide 24 carries the fullest 12-item card (bank
account 4,500/bank, address & office 2,500/mo, HRO&GRO 4,800/mo, policies 9,600/subject,
recruitment 1 month salary/employee, trademark 18,000, activity licence 15,000/licence,
temporary GM 8,000 for 3 months then 4,000/mo).

**The section list varies by service, not by client.** Project work (P1, P2) keeps Time
Frame. Retainer work (P3) drops Time Frame and adds "Non-covered by the scope of work".

**The automation blocker:** the Time Frame step labels in P1 live inside
`ppt/media/image65.png` (602 KB) — only the durations are live text. The 16-step journey
graphic is likewise raster. **This is the thing the rebuild has to solve.**

**Template drift already causes real defects in the source proposals** — four found in
three documents: P3's letter promises a "Project Timeline" with no Time Frame section;
P2's AOA-amendment timeline contains a MISA-formation step; P1 Slide 15 says "fifteen
steps" over a 16-item list; P3's entity badge contradicts its own body text. The new
generator must **prevent** these, not inherit them. `build_proposal()` already fixes the
first one — keep that behaviour and extend the pattern.

**Taajeel brand tokens** (from `CLAUDE.md`, sourced from
`brandIdentity/Taajeel Guidelines 2024 - 04 - ملاحظات.pdf`):

```
navy    #0F3251   cream     #F1E8D9   dusty blue #8DA6C9
steel   #3E7CB1   brown     #564334   warm tan   #B9A290
```

Pair navy or cream ink with coloured backgrounds. Never use the mid-tones as body text.
Type: Arabic **Lama** (Expanded headings / Regular body), Latin **Lama Sans** (Light
Expanded headings / Regular body / Bold Condensed emphasis). Both licensed, neither on
Google Fonts. Logo PNGs already extracted at `brandIdentity/assets/taajeel_logo_navy.png`
and `taajeel_logo_cream.png`.

---

## 3. Phase 0 — Forensics on the real deck

**Nothing gets built until this is done.** Read-only; do not modify anything in
`proposal/`. Work on a copy under a scratch directory.

Deliverable: `template/FORENSICS.md` plus extracted assets.

1. Unzip P1's `.pptx`. Record the theme part verbatim: exact `srgbClr` values in
   `ppt/theme/theme1.xml`, the major/minor font faces, the slide size in EMU.
   **Reconcile against the brand tokens above and report any mismatch** — the guidelines
   PDF and the actual deck may disagree, and the deck is what the client has been
   sending for two years.
2. **Check `embeddedFontLst` in `presentation.xml`.** Lama and Lama Sans are licensed
   and not web-available. If the fonts are embedded, the new master must preserve that
   embedding. If they are not, every recipient without Lama installed already sees a
   fallback — say so explicitly, and propose a decision rather than silently substituting.
3. Enumerate every slide layout in `ppt/slideLayouts/`. For each: name, which real slides
   use it, placeholder types, indices and exact EMU geometry.
   `CONTENT_LAYOUT_INDEX = 10` ("1_Custom Layout") is the one the current code uses —
   confirm whether that is actually the layout the real bulleted slides use, or a guess.
4. Inventory `ppt/media/`. For every image: filename, dimensions, bytes, MD5, and which
   slides reference it. Classify each as **brand asset** (falcon photography, tagline
   images, logo, pattern) or **client asset** (Havenstone logo, Bahrain flag) or
   **content raster** (`image65.png` — the Time Frame labels; the 16-step journey).
   The byte-identical 71,493-byte 1217×687 JPEG confirmed in P2 and P3 is a brand asset.
5. Extract the SmartArt from `ppt/diagrams/data1–9.xml` (the Additional/Optional
   sub-steps) as structured data.
6. For each of the 23 sections in `proposal_anatomy.md`'s master table, record: which
   slide(s), which layout, which shapes carry text, and the exact character count and
   line count of the real content. **These counts become the length budgets in Phase 2.**
7. Render all 33 slides to PNG and look at them. Use PyMuPDF (already a dependency) to
   rasterize — `pdftoppm` is not available on this machine, per the anatomy doc's tooling
   note. On Windows, PowerPoint COM also works and was used before. Save to
   `template/reference_renders/` — these are the visual ground truth for Phase 4.

Acceptance: `FORENSICS.md` answers, for every slide in P1, "what layout, what shapes,
what content, how long, brand or client asset" — with no "unknown" rows except ones
explicitly flagged as needing a human.

---

## 4. Phase 1 — Build the real master template

Deliverable: `template/taajeel_master.pptx` (or `.potx`), containing **zero client data**.

Build it by **stripping a copy of P1**, not by recreating the look. The theme, the
licensed fonts, the falcon photography, the Terms & Conditions pages and the back cover
are genuine artifacts that cannot be recreated faithfully — keep them. Remove everything
that belongs to Havenstone.

1. Copy P1. Delete every client-specific slide's *content* while keeping the slide as a
   layout-bearing exemplar, or delete the slide and promote its structure into a layout —
   whichever the forensics show is cleaner.
2. **Delete every client asset identified in Phase 0 §4** — the Havenstone logo, the
   Bahrain flag. Replace each with an empty picture placeholder in the layout, sized and
   positioned identically. A client with no logo must render with the frame absent, not
   with an empty grey box.
3. Purge every trace of Havenstone: search all slide XML, `docProps/core.xml`,
   `docProps/app.xml`, and every diagram and notes part for the client name, `havenstone`,
   `phil`, `+973`, the Bahrain address, `180721`, the fee figures, and the reference
   number `0026.07.12.0633`. **Grep the unzipped package, do not trust a string list.**
   Reset `docProps/core.xml` author and revision.
4. Define named layouts for every recurring page shape found in Phase 0. At minimum:
   Cover, Brand Image (falcon), TOC, Section Divider, Letter, About-the-Client,
   Scope Journey, Time Frame, Additional & Optional, Fees, Government Fees,
   Non-covered, Signoff, T&C, Back Cover. Give each placeholder a stable, meaningful name
   — the renderer addresses placeholders **by name, never by index**.
5. Write `template/layout_spec.py`: a single module mapping each logical section to its
   layout name, its placeholder names, and the character/line budget for each from
   Phase 0 §6. This file is the contract between the template and the renderer. Nothing
   else in the codebase may hardcode a slide index or an EMU coordinate.

Acceptance: the master opens clean in real PowerPoint; a grep of the unzipped package for
every Havenstone identifier returns nothing; every layout renders correctly with
placeholder text; the T&C and About-Taajeel pages are pixel-identical to
`template/reference_renders/`.

---

## 5. Phase 2 — Renderer that fills layouts

Deliverable: `generator/render_deck.py`, replacing `render_pptx_branded.py`.
Keep the old file until Phase 4 passes, then delete it and `render_pptx.py`'s direct use.

Architectural rules — these are the point of the rebuild:

- **Compose, never mutate.** Start from the master, add slides from layouts in the order
  the assembled section list dictates. Never copy a finished deck and edit it. Never
  delete a slide. The `python-pptx` partname-collision corruption bug documented in
  `generator/README.md` (`HRESULT 0x80CB4404`) disappears entirely under composition —
  it was a symptom of delete-then-add.
- **Never find-and-replace.** No `NAME_VARIANTS`, no `OLD_*` constants. Content goes into
  named placeholders. If a value is absent it renders as a visible `[TO BE CONFIRMED]`,
  never as the previous client's value, and never silently omitted.
- **Never assign `text_frame.text`.** That wipes formatting. Seed each layout placeholder
  with a single empty run carrying the intended formatting, then set `run.text`. Where
  a paragraph genuinely needs mixed formatting, build runs explicitly from a small
  rich-text model — do not collapse them.
- **Length budgets are enforced at build time.** Every placeholder has a budget from
  `layout_spec.py`. Content that exceeds it raises, and the caller either shortens it or
  the section reports a caveat. `python-pptx` cannot compute autofit, so overflow must be
  prevented by contract rather than detected after the fact. Set `word_wrap = True` and
  `auto_size = MSO_AUTO_SIZE.NONE` explicitly everywhere.
- **The TOC is generated last**, from the assembled deck, with real page numbers. Section
  list and page numbers are read off the built deck, not written by hand.
- **The reference number is an input, never generated.** Until Taajeel documents the
  scheme (see §8), require it from the intake form. If absent, render
  `[REFERENCE NUMBER — TO BE CONFIRMED]`. Delete `provisional_ref`.
- **Fees stay `[NEEDS HUMAN INPUT]`** for the headline price, per the existing design.
  VAT computes deterministically at 15% once a price exists. The rate card is a lookup
  table in code, sourced from Phase 0.
- Preserve the existing evidence model end to end: a section classified `Standard` in
  `learning_pipeline/knowledge/section_patterns.json` is reused verbatim with its citation;
  `Insufficient evidence` pre-checks nothing. Carry the `llm` vs `template` tag on every
  drafted section through to the caveat list.

Input contract: `render_deck(draft: ProposalDraft, client: dict, out_path) -> (Path, list[Caveat])`.
Keep the signature shape so `app/app.py` needs minimal change. Make `Caveat` a dataclass
with a severity, not a bare string — the UI should distinguish "enter the real price
before sending" from "verify the dates".

---

## 6. Phase 3 — Native diagrams (the biggest visual win)

The Scope of Work journey, the Time Frame, and the Government Fees table are the pages
that make the deck look like a real consultancy proposal. Today they are raster images
tied to one service, so every other service loses them. Rebuild them as **native
PowerPoint shapes generated from data**.

1. From `template/reference_renders/`, derive the visual grammar of P1's 16-step journey
   and Time Frame: shape geometry, connector style, numbering, the step-count badge, the
   duration chips, colour roles, type sizes. Document it in `template/DIAGRAM_SPEC.md`
   with measured EMU values.
2. Implement `generator/diagrams.py`: functions that take a list of steps (or
   step + duration pairs) and emit native autoshapes, connectors and text — laid out to
   the spec, wrapping to multiple slides when the step count demands it.
3. Drive the step-count badge **from `len(steps)`**. This structurally prevents P1's
   "fifteen steps" over a 16-item list defect.
4. Validate against the source: generating P1's own 16 steps must produce a diagram that
   reads as the same design as `image65.png`. Compare renders side by side and look.
5. Same treatment for the itemised Government Fees table — a real table from data, with
   an explicit unknown row where P1 had `#,### Yet to be determine once billed`.

This phase is what makes a 9-step annual-confirmation proposal look as good as the
formation proposal. It is the difference between the rebuild being worth doing and not.

---

## 7. Phase 4 — Verification, and the sub-agents

**No phase is complete on `python-pptx` saving without error.** The existing code has
two documented bugs that only surfaced by opening the file in real PowerPoint. Build the
harness first, then use it on every phase.

`tools/verify_deck.py`:

1. Open the output in real PowerPoint (COM, on this Windows machine) — a file that
   python-pptx wrote happily but PowerPoint refuses is the exact failure mode already hit.
2. Convert to PDF, rasterize every page with PyMuPDF, write to `build/renders/`.
3. Automated checks: no text frame overflows its shape; no placeholder still contains
   `[TO BE CONFIRMED]` that should have been filled; TOC page numbers match actual
   positions; grep the unzipped output for every identifier of every *other* client in
   the database — a leak check, run on every build; font references resolve.
4. Emit a contact sheet of all slides for a human to scan.

Sub-agents — configure these three. Each gets the constraints in §0 verbatim:

- **`template-forensics`** — Phase 0 only. Read-only on `proposal/`. Tools: file read,
  shell, image viewing. Brief: "Extract the complete structural and visual specification
  of P1. Every claim cites a slide number and an XML part. Mark anything you could not
  determine as Unknown rather than inferring it."
- **`deck-renderer`** — Phases 1–3. Brief: "Implement composition-based rendering against
  `layout_spec.py`. You may not hardcode a slide index, an EMU coordinate, or a client
  string anywhere outside the spec module. Every visual claim must be backed by a render
  you have actually looked at."
- **`visual-qa`** — Phase 4, adversarial, runs after every phase. Brief: "You are trying
  to find the deck that embarrasses Taajeel in front of a client. Render every slide and
  look at it. Report overflow, wrong fonts, stale page numbers, leftover placeholder text,
  any asset belonging to another client, and any page that looks worse than
  `template/reference_renders/`. Do not accept 'saved without error' as evidence of
  anything."

Ship gate: generate decks for all three real services — formation (P1), annual
confirmation (P2), HRO/GRO retainer (P3) — and for one service with no prior proposal.
All four must pass `visual-qa` and open clean in PowerPoint. The P3 deck must have no
Time Frame section and must have "Non-covered by the scope of work". The unseen-service
deck must pre-check no scope items at all.

---

## 8. Open questions — get answers, do not guess

1. **The reference number scheme.** `0026.07.12.0633` — the date group matched the letter
   date in only 1 of 3 proposals. Ask Taajeel for the rule. Until then it is an input.
2. **Font licensing.** Can Lama / Lama Sans be embedded in outgoing client decks? If not,
   the master needs a documented fallback and the client needs to know.
3. **Are P1 and P3 won or lost?** `proposal_anatomy.md` §3 could not determine this from
   the files. Without outcomes, nothing in the knowledge base can ever learn what wins.
   Needs CRM, invoices, or a person.
4. **Is "Non-covered by the scope of work" standard for retainers?** n=1. Do not treat it
   as a rule until there is a second retainer proposal.
5. **More proposals.** Every scope pattern currently reads `Insufficient evidence` because
   each of the three is a different service. The evidence model is working correctly and
   is starved of data. Two more proposals per service changes the product more than any
   code in this plan.

---

## 9. Order of work

```
Phase 0  forensics                    → template/FORENSICS.md, reference_renders/
Phase 4a verification harness         → tools/verify_deck.py   (build early, use throughout)
Phase 1  master template              → template/taajeel_master.pptx, layout_spec.py
Phase 2  composition renderer         → generator/render_deck.py
Phase 3  native diagrams              → generator/diagrams.py, DIAGRAM_SPEC.md
Phase 4b ship gate                    → four decks, visual-qa clean
Phase 5  wire into app/app.py, delete render_pptx_branded.py
```

`learning_pipeline/`, `database/` and `build_proposal()`'s drafting logic are **not**
touched by this plan. They are working as designed. This is a rendering rebuild.
