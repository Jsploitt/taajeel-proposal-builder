# FORENSICS — Taajeel proposal deck

Measured from `proposal/` on 2026-09-16. Every claim here came from reading the package or
looking at a render. Anything I could not determine is marked **Unknown**, not guessed.

Reproduce with: `python tools/inventory.py`, `python tools/runs.py <slide> [shape_id]`,
`python tools/prepare_template.py`, `python tools/verify_deck.py`.

---

## 1. Package facts (P1 Havenstone, 33 slides)

| | |
|---|---|
| Slide size | `12192000 x 6858000` EMU = 13.333 x 7.5 in, 16:9 |
| Parts | 279 → 273 after strip |
| Media | 115 files, 51 MB, **0 orphaned** in the original |
| Layouts | 14, of which **`slideLayout3` and `slideLayout7` are used by no slide** |
| Shapes | 540 across 33 slides |
| Author metadata | `Abdulrahmman M. Tayfor` / `Abdulrahman AlTaifour`, revision 92 — must be reset |

### Theme is decorative only

`ppt/theme/theme1.xml` carries a **stock PowerPoint palette** (`dk1 335B74`, `accent1 1CADE4`,
`accent3 27CED7`…). None of it matches Taajeel brand colour. All brand colour is applied
directly on shapes. **Do not attempt to re-theme — the theme controls nothing visible.**

### Fonts — the brand typography is only partially applied

Run-level census across all 33 slides:

| Face | Runs |
|---|---|
| Arial | 132 |
| Calibri | 121 |
| Lama Sans SemiBold | 110 |
| Andalus | 38 |
| DIN NEXT ARABIC LIGHT | 20 |
| DIN Next LT Arabic | 14 |
| Lama Sans | 9 |
| Wingdings / Wingdings 2 | 10 |

`embeddedFontLst` in `presentation.xml` is **empty**. Consequences:

- Most of the deck is Arial/Calibri, which every recipient has. It renders identically anywhere.
- Only the ~119 Lama Sans runs fall back on machines without the licensed font — a **pre-existing
  defect in the decks Taajeel sends today**, not something the generator introduces.
- Nine different faces on one deck is drift, not a type system.

### Colour — five navies where there should be one

Frequency of `srgbClr` across slides:

| Hex | Uses | Role |
|---|---|---|
| **`0F3353`** | **271** | the real brand navy |
| `FFFFFF` | 113 | white |
| `F1E8D9` / `F2E8D9` | 34 / 28 | cream — two variants of the same intent |
| `3C5682` | 27 | mid blue |
| `5E312A` | 26 | brown |
| `0E314F`, `044969`, `0F3D79`, `0F3352` | 24/20/15/2 | **navy drift — near-duplicates of `0F3353`** |
| `BAA38F` | 14 | warm tan |
| `956C43`, `A6862A` | 7 / 3 | golds |

The brand-guidelines values quoted in `DECK_REBUILD_PLAN.md` (navy `0F3251`, tan `B9A290`,
brown `564334`) **do not match the deck**. The deck is what clients have received for two years.
Generated content standardises on `0F3353` / `F1E8D9`.

---

## 2. Deck skeleton — a closed vocabulary of section types

~19 of 33 slides are client-independent boilerplate. The section list varies by **engagement
type**, not by client.

| Section | P1 formation (33pp) | P2 annual confirmation (28pp) | P3 HRO/GRO retainer (27pp) |
|---|---|---|---|
| Cover / brand page / TOC | yes | yes | yes |
| Introduction + Letter | yes | yes | yes |
| About Taajeel x3 | identical | identical | identical |
| About the Client | yes | yes | yes |
| Scope of work | 2 slides | 1 slide | 2 slides |
| **Time Frame** | 2 slides | 1 slide | **absent** |
| **Non-covered by scope** | absent | absent | **present** |
| **Additional & Optional** | 3 slides | 1 slide | absent |
| **Government fees** | present | absent | absent |
| Fees | 40,000 + VAT 6,000 | 10,000 | 4,400/mo + VAT 660 |
| Payment split | 50/35/15 | 50/35/15 | monthly, no split |
| Signoff / T&C x4 / back cover | identical | identical | identical |

**Deterministic, no lookup needed:** VAT 15% (exact in all three: 40,000→6,000; 10,000→1,500;
4,400→660). Signatory *Muath Abdullah A AlZahrani, General Manager*. Back-cover block
(CR 1010941670, +966 92000 6247, 7697 Abi Baker Siddiq AlTaawun, www.taajeel.sa).

**Only in P3 (n=1):** "Non-covered by the scope of work". Do not treat as a retainer rule yet.

---

## 3. Text structure — why find-and-replace fails

Run splits are arbitrary. The letter's address on slide 5 is one sentence in three runs:

```
r0 'Building 470, Road 1010, Flat 1831, Block 410, '
r1 'Sanabis'
r2 ', Kingdom of Bahrain.'
```

The letter date is right-aligned with **literal spaces**, not a tab:

```
p00  r0 'Havenstone'   r1 ' Consulting W.L.L   <~140 spaces>'   r2 '12 June 2026'
```

Three shapes on slide 24 are all named `Rectangle 45`. Other real names: `Picture 6` twice,
`صورة 15` twice, `Google Shape;370;p12`, and many empty strings.

**Conclusions:**

1. Nothing can be addressed by shape name until the template is prepared. Renaming every
   fillable shape to a unique `TJL.*` token is mandatory, not cosmetic.
2. Replacement must rebuild runs from a rich-text model, never assign `text_frame.text`
   (wipes formatting) and never do run-level find-and-replace (matches nothing).

### The About-the-Client paragraph is already a template

Slide 12's bold runs mark **exactly** the variable fields; regular runs are boilerplate:

> **HAVENSTONE CONSULTING W.L.L** ("the Client") is a Bahraini limited liability company
> registered in the Kingdom of Bahrain under Commercial Registration No. **180721**. The company
> was incorporated on **5 December 2024** with an authorized, issued, and paid-up capital of
> **BHD 1,000**, and operates through an active commercial registration in the field of
> **management consultancy activities**.

The document annotates its own slots. Form fields map 1:1 onto the bold runs.

---

## 4. The two diagram slides — assumption corrected

`DECK_REBUILD_PLAN.md` states the 16-step journey graphic is raster. **That is wrong**, and it
changes the plan.

**Slide 14 — Scope journey (84 shapes: 28 pictures, 30 autoshapes, 20 text boxes)**

A serpentine gear chain. The gears are decorative pictures at hand-placed positions; every
**step label is live, addressable text** (`Rectangle 5` = "Workshop with Client", `Rectangle 6` =
"Submit the AOA in platform SBC", …). Government agency logos (MISA, MOC, SBC, HRSD, QIWA, GOSI,
Muqeem, National Address, ZATCA, Riyadh Chamber, Aamaly) are separate pictures.

→ **No native regeneration needed.** Use slot-based subtraction: keep the gear path, fill the
labels, hide the slots beyond `len(steps)`. The design survives intact.

**Slides 17–18 — Time Frame (41 shapes)**

Alternating above/below timeline. Durations **are** live text in uniform `0.87 x 0.337 in`
text boxes (`TextBox 35` = "01 Day"…). The **step labels are baked into `image65.png` /
`image66.png`** (588 KB + 1.4 MB). This is the only genuine automation blocker found.

→ Either overlay native label text boxes on a delabelled background, or rebuild the timeline
natively — it is regular enough (icon circle + label + duration chip, alternating along an axis).
Icons can be extracted from existing media.

**Slides 20–22 — Additional & Optional** use 9 SmartArt diagrams (`ppt/diagrams/data1–9.xml`).
Structure extractable as data. **Unknown:** whether SmartArt can be safely regenerated
browser-side; may be better handled by slot subtraction like slide 14.

---

## 5. Client data leakage in P1

Confined to **4 slides + docProps**:

| Identifier | Location |
|---|---|
| `havenstone` | `docProps/app.xml`, slides 1, 5, 12, 27 |
| `solarski`, `phil`, `havenstone.me` | slides 5, 12 |
| `barbara`, `nogueira` | slide 12 |
| `sanabis`, `+973`, `bahrain` | slides 5, 12 |
| `180721`, `BHD 1,000` | slide 12 |
| `0026.07.12.0633` (reference no.) | slide 5 |

Plus **image assets**: the Havenstone wordmark on the cover (slide 1, `Picture 5` at
4.471, 5.688, 3.651 x 0.927 in), on slide 12, and again top-right of slide 14. Text replacement
cannot touch these — they need picture-placeholder treatment.

---

## 6. Lossless strip — done and verified

`tools/prepare_template.py` removes the two unused layouts, their master `sldLayoutId` entries,
their relationships and content-type overrides, then garbage-collects unreferenced media.

```
53.0 MB / 279 parts  ->  27.9 MB / 273 parts   (47% freed)
on disk: 25.7 MB     ->  11.5 MB
removed: slideLayout3, slideLayout7, image7.emf, image8.emf, image9.emf, image14.jpg
```

**Verified in real PowerPoint via COM: opens clean, 33 slides, exports to PDF, all 33 pages
rasterize.** Cover render is visually identical to the original.

This retires the largest technical risk: subtractive OOXML package surgery is sound, and the
browser-side compiler can use the same algorithm.

The 11.5 MB figure also removes the template-weight concern — no EMF→PNG conversion needed.

---

## 7. Open questions for Taajeel

1. **Reference-number scheme.** `0026.07.12.0633`. The date group matched the letter date in only
   1 of 3 proposals. **Unknown.** Until documented it is a required input, never generated.
2. **Lama Sans licence** — may it be embedded in outgoing decks? Currently it is not, so recipients
   already see a fallback.
3. **Client logos** — supply per client, or ship without?
4. Is "Non-covered by the scope of work" standard for all retainers? n=1.
5. Are P1/P3 won or lost? Without outcomes nothing can learn what wins.
