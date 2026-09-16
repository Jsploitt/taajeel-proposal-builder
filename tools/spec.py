"""The template contract, authored by hand from template/INVENTORY.md.

This is the single source of truth. tools/build_template.py reads it to
(a) rename shapes to stable TJL tokens, (b) replace client data with neutral
placeholders, and (c) emit template/slide_map.json for the TS compiler.

Fill modes
----------
text    replace the whole paragraph with one run, inheriting the first run's rPr.
        Use where a paragraph is a single logical value.
runs    rebuild a paragraph from an explicit run plan. Use where tabs or mixed
        formatting do layout and sibling runs must survive.
run     replace one run's text in place, leaving every sibling run untouched.
rich    rebuild a paragraph from caller-supplied {text, bold} segments, taking
        rPr from a designated regular run and bold run on that paragraph.
picture swap the image blob behind a picture shape.
"""

# Slides that are pure boilerplate: identical in all three real proposals.
# The compiler never touches them; it only decides whether they survive.
BOILERPLATE = [2, 4, 6, 7, 8, 9, 10, 11, 13, 16, 19, 23, 26, 28, 29, 30, 31, 32, 33]

# Logical section -> the slides that carry it, in deck order.
SECTIONS = [
    ("cover",            [1]),
    ("brand_page",       [2]),
    ("toc",              [3]),
    ("div_introduction", [4]),
    ("letter",           [5]),
    ("div_about_taajeel", [6]),
    ("about_taajeel",    [7, 8, 9]),
    ("div_about_client", [10]),
    ("about_client_brand", [11]),
    ("about_client",     [12]),
    ("div_scope",        [13]),
    ("scope",            [14, 15]),
    ("div_timeframe",    [16]),
    ("timeframe",        [17, 18]),
    ("div_additional",   [19]),
    ("additional",       [20, 21, 22]),
    ("div_fees",         [23]),
    ("fees",             [24]),
    ("gov_fees",         [25]),
    ("div_signoff",      [26]),
    ("signoff",          [27]),
    ("div_terms",        [28]),
    ("terms",            [29, 30, 31, 32]),
    ("back_cover",       [33]),
]

# Sections that are dropped when the engagement does not call for them.
OPTIONAL_SECTIONS = {
    "timeframe":     ["div_timeframe", "timeframe"],
    "additional":    ["div_additional", "additional"],
    "gov_fees":      ["gov_fees"],
    "scope_second":  [],          # slide 15 handled per-slide, not per-section
}

FILLS = [
    # ---------------- Slide 1 — Cover ----------------
    dict(slide=1, shape=3, token="COVER.CLIENT_NAME", mode="text",
         neutral="[CLIENT NAME]",
         note="2 runs in source: 'HAVENSTONE' + ' Consulting W.L.L'; collapsed to one"),
    dict(slide=1, shape=2, token="COVER.SUBJECT", mode="text",
         neutral="[PROPOSAL SUBJECT]"),
    dict(slide=1, shape=6, token="COVER.CLIENT_LOGO", mode="picture",
         plate=True,
         note="white knockout logo on navy; compiler puts uploaded logo on a white plate"),

    # ---------------- Slide 3 — Table of contents ----------------
    dict(slide=3, shape=3, token="TOC.TABLE", mode="table"),

    # ---------------- Slide 5 — Letter ----------------
    dict(slide=5, shape=8, token="LETTER.REFERENCE", mode="text",
         neutral="[REFERENCE]", budget=18, width_in=4.6,
         note="source '0026.07.12.0633'; scheme UNKNOWN, always an input. "
              "DEFECT FIX: the source box is 2.76in wide at 32pt, so a 15-char "
              "reference wraps to two lines and collides with the client name -- "
              "visible in template/reference_renders/05.png. Widened to fit one "
              "line rather than shrinking the type, preserving the design intent."),
    # p00 carries name + ~140 literal spaces + date. Normalised to a right tab stop
    # by build_template so the compiler can emit 'name\tdate'.
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.NAME_DATE", mode="runs", para=0,
         plan=[dict(token="LETTER.CLIENT_NAME", rpr=0, neutral="[CLIENT NAME]"),
               dict(literal="\t", rpr=0),
               dict(token="LETTER.DATE", rpr=2, neutral="[DATE]")],
         tabstop_right=True),
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.ADDRESS", mode="text", para=1,
         neutral="[CLIENT ADDRESS]",
         note="source split across 3 runs by the spellchecker"),
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.ATTENTION", mode="runs", para=2,
         plan=[dict(literal="Atte: ", rpr=0),
               dict(token="LETTER.ATTENTION", rpr=1, neutral="[CONTACT NAME]")]),
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.MOBILE", mode="runs", para=3,
         plan=[dict(literal="Mob: ", rpr=0),
               dict(token="LETTER.MOBILE", rpr=0, neutral="[CONTACT MOBILE]")]),
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.EMAIL", mode="runs", para=4,
         plan=[dict(literal="Email: ", rpr=0),
               dict(token="LETTER.EMAIL", rpr=1, neutral="[CONTACT EMAIL]")]),
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.WEB", mode="runs", para=5,
         plan=[dict(literal="Web: ", rpr=0),
               dict(token="LETTER.WEB", rpr=1, neutral="[CLIENT WEBSITE]")]),
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.SUBJECT", mode="runs", para=8,
         plan=[dict(literal="Subject: ", rpr=0),
               dict(token="LETTER.SUBJECT", rpr=1, neutral="[PROPOSAL SUBJECT]")]),
    # p10 contains the Arabic brand run 'تعجيل' which must survive verbatim.
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.OPENING", mode="runs", para=10,
         plan=[dict(literal="We would like to thank you for your trust in ", rpr=0),
               dict(literal="taajeel", rpr=1),
               dict(literal=" | ", rpr=2),
               dict(literal="تعجيل", rpr=3),
               dict(token="LETTER.OPENING_TAIL", rpr=4,
                    neutral=" to propose [SERVICE DESCRIPTION]. (“Mission”/ “Assignment”).")],
         note="Arabic brand run preserved verbatim, never translated"),
    dict(slide=5, shape=3, shape_name="LETTER.BODY", token="LETTER.ACCORDINGLY", mode="text", para=11,
         neutral="Accordingly, attached to Your Excellency in the Proposal of this scope of work."),

    # ---------------- Slide 12 — About the Client ----------------
    # The whole text frame is compiler-controlled: length varies per client.
    # The template keeps one paragraph per STYLE as an exemplar; at render time
    # the compiler clones the right exemplar N times.
    # Bold runs in the source marked exactly the variable fields -- p00 keeps a
    # bold run so the compiler has an rPr to clone for any bold segment.
    dict(slide=12, shape=3, shape_name="ABOUT_CLIENT.BODY", token="ABOUT_CLIENT.BODY", mode="frame",
         style_exemplars={"body": 0, "subhead": 4, "small": 5, "emphasis": 14},
         bold_exemplar={"para": 0, "run": 0},
         # run 0 of the body exemplar is the bold client name, so the
         # regular formatting has to be named separately.
         regular_exemplar={"para": 0, "run": 1},
         paras=[
             dict(i=0, runs=[
                 dict(text="[CLIENT LEGAL NAME]", rpr=0),
                 dict(text=" (“the Client”) is a [LEGAL FORM] registered in "
                           "[COUNTRY] under [REGISTRATION NO].", rpr=1)]),
             dict(i=1, runs=[dict(text="[OWNERSHIP AND DIRECTORS]", rpr=0)]),
             dict(i=2, runs=[dict(text="[CLIENT BACKGROUND AND INTENT]", rpr=0)]),
             # p03 carries the Arabic brand run; preserved verbatim.
             dict(i=3, runs=[
                 dict(text="Accordingly, ", rpr=0),
                 dict(text="the Client is seeking from Taajeel | ", rpr=1),
                 dict(text="تعجيل", rpr=2),
                 dict(text=" [ENGAGEMENT DESCRIPTION] (the “Mission” / the "
                           "“Assignment”).", rpr=3)]),
             dict(i=4, runs=[dict(text="[REQUIREMENTS HEADING]", rpr=0)]),
             dict(i=5, runs=[dict(text="[REQUIREMENT INTRO]", rpr=0)]),
             dict(i=6, runs=[dict(text="[REQUIREMENT ITEM]", rpr=0)]),
             dict(i=7, runs=[dict(text="[REQUIREMENT ITEM]", rpr=0)]),
             dict(i=9, runs=[dict(text="[DOCUMENTS HEADING]", rpr=0)]),
             dict(i=10, runs=[dict(text="[DOCUMENT ITEM]", rpr=0)]),
             dict(i=11, runs=[dict(text="[DOCUMENT ITEM]", rpr=0)]),
             dict(i=12, runs=[dict(text="[DOCUMENT ITEM]", rpr=0)]),
             dict(i=13, runs=[dict(text="[DOCUMENT ITEM]", rpr=0)]),
             dict(i=14, runs=[dict(text="[ATTESTATION NOTE]", rpr=0)]),
         ]),
    dict(slide=12, shape=8, token="ABOUT_CLIENT.CLIENT_LOGO", mode="picture"),
    dict(slide=12, shape=18, token="ABOUT_CLIENT.COUNTRY_FLAG", mode="picture",
         note="source was the Bahrain flag -- client country of origin"),

    # ---------------- Slide 14 — Scope journey ----------------
    dict(slide=14, shape=2, token="SCOPE.TITLE", mode="text",
         neutral="Scope of work | [SERVICE NAME]:"),
    dict(slide=14, shape=3, token="SCOPE.INTRO", mode="text", para=0,
         neutral="[SCOPE INTRO]"),
    dict(slide=14, shape=13, token="SCOPE.CLIENT_LOGO", mode="picture"),

    # ---------------- Slide 24 — Fees ----------------
    dict(slide=24, shape=6, token="FEES.AMOUNT", mode="text",
         neutral="[FEE]",
         note="source '40,00'+'0' across two runs; collapsed"),
    dict(slide=24, shape=9, token="FEES.VAT", mode="text",
         neutral="[VAT]",
         note="deterministic: 15% of FEES.AMOUNT"),
    dict(slide=24, shape=15, token="FEES.PAYMENT_METHOD", mode="text_multi",
         neutral=["Payment Method:", "[PAYMENT TERM 1]", "[PAYMENT TERM 2]", "[PAYMENT TERM 3]"],
         keep_para0=True),

    # ---------------- Slide 27 — Signoff ----------------
    # p06 run 5 sits between tab runs that do the column layout.
    dict(slide=27, shape=3, token="SIGNOFF.CLIENT_NAME", mode="run", para=6, run=5,
         neutral="[CLIENT LEGAL NAME]"),
]

# Image sha1 prefixes identified as client assets in FORENSICS.md section 5.
CLIENT_IMAGE_SHAS = {
    "db8462f0": "cover white knockout wordmark (slide 1)",
    "c3f9f79a": "dark wordmark (slides 12, 14)",
    "403c5934": "client country flag -- Bahrain in source",
}

# Strings that must not survive into the template. Audited by verify_deck.py.
LEAK_TOKENS = [
    "havenstone", "phil", "solarski", "barbara", "nogueira", "sanabis",
    "180721", "+973", "BHD 1,000", "0026.07.12.0633", "havenstone.me",
]

# ---- Slide 14: scope journey step labels -------------------------------------
# The gears are decorative pictures at hand-placed positions along a serpentine
# path; every step LABEL is live, addressable text. (DECK_REBUILD_PLAN.md claims
# this graphic is raster -- it is not, see FORENSICS.md section 4.)
#
# NOTE: 17 label shapes but only 16 numbered gears. The ordering below is a
# hypothesis verified by rendering numbered markers and reading the result, not
# derived from geometry -- the serpentine layout makes proximity unreliable.
SCOPE_LABEL_IDS = [6, 34, 7, 9, 2123, 8, 15, 37, 2121,
                   2129, 2128, 5, 10, 21, 29, 30, 22]

for _i, _sid in enumerate(SCOPE_LABEL_IDS, start=1):
    FILLS.append(dict(slide=14, shape=_sid, token="SCOPE.STEP_%02d" % _i,
                      mode="text", neutral="STEP %02d" % _i, budget=46,
                      # several labels are two paragraphs ("Notarizing" /
                      # "the Articles of Association"); without this the second
                      # line survives from the previous client's deck.
                      clear_rest=True))

# The step-count badge is driven by len(steps), which structurally prevents the
# "fifteen steps over a 16-item list" defect present in the source deck.
# The badge is two paragraphs: the count, then the word "Steps". Fill only the
# count -- overwriting paragraph 0 with "16 Steps" destroys the design.
FILLS.append(dict(slide=14, shape=1042, token="SCOPE.STEP_COUNT",
                  mode="text", para=0, neutral="00", budget=3))

# The numbered gear badges, in step order. Addressed so unused ones can be
# hidden when a service has fewer steps than the journey graphic was drawn for.
# (Verified by rendering numbered markers -- ids 58 and 57 are 13 and 14, which
# is not the order they appear in the XML.)
SCOPE_BADGE_IDS = [2080, 35, 38, 39, 40, 49, 51, 52,
                   53, 54, 55, 56, 58, 57, 59, 60]

for _i, _sid in enumerate(SCOPE_BADGE_IDS, start=1):
    FILLS.append(dict(slide=14, shape=_sid, token="SCOPE.BADGE_%02d" % _i,
                      mode="text", neutral="%02d" % _i, budget=3))

# ---- Slide 14: government agency marks ---------------------------------------
# Slot -> the picture shape ids carrying that agency's logo, derived by nearest
# step label (see build/agency_sheet.png for the visual identification).
#
# Slots are assigned GEOMETRICALLY, not semantically: a logo appears where it is
# drawn, so the slot that owns it is the one it sits beside. The seeded
# catalogue then declares the matching agency per step, which reproduces P1
# exactly while letting any other service drive its own logos.
#
# Several agencies appear TWICE at slightly different positions -- layering
# cruft in the source deck. Both copies are addressed, so swapping one cannot
# leave the other showing the previous service's agency.
SCOPE_AGENCY_SLOTS = {
    2:  ("sbc",              [24, 2054]),
    3:  ("moc",              [2056, 25]),
    7:  ("notary",           [14]),
    8:  ("aamaly",           [36]),
    10: ("qiwa",             [2118]),
    11: ("hrsd",             [2115, 2116]),
    12: ("gosi",             [1026, 16]),
    13: ("muqeem",           [2050]),
    14: ("national_address", [17]),
    16: ("zatca",            [19, 20]),
    17: ("riyadh_chamber",   [1030]),
}

# Only the FIRST id in each list is kept. The second is a stale copy of the same
# artwork that the source deck hid by cropping or undersizing it -- refitting a
# swapped logo to its true aspect ratio makes such a copy reappear, so the deck
# would show the agency mark twice. Removing it at template-build time means the
# compiler only ever has one mark per slot to reason about.
for _slot, (_key, _ids) in sorted(SCOPE_AGENCY_SLOTS.items()):
    FILLS.append(dict(
        slide=14, shape=_ids[0],
        token="SCOPE.AGENCY_%02d" % _slot,
        mode="picture", agency_slot=_slot, agency_default=_key))
    for _dup in _ids[1:]:
        FILLS.append(dict(slide=14, shape=_dup,
                          token="SCOPE.AGENCY_%02d_STALE" % _slot,
                          mode="remove",
                          note="hidden duplicate of %s in the source deck" % _key))

# ---- Images with text baked into them -----------------------------------------
# A .pptx leak check greps XML, so a previous client's content baked into a
# PICTURE passes it silently. These are the rasters found to contain text or
# service-specific content in the source deck; verify_deck.py fails if any of
# them survives into a generated deck.
#
# Each is a flattened copy of content that is service-specific, so it is wrong
# for every service other than the one it was drawn for.
RASTER_TEXT_IMAGES = {
    "5f5565a0": "slide 17 - flattened copy of the whole scope journey, labels and '16 Steps' baked in",
    "87949bcc": "slide 18 - flattened journey copy",
    "d50fe8c4": "slide 17 - timeline strip (left): step icons and labels baked in",
    "e5fe1b95": "slide 17 - timeline strip (right): step icons and labels baked in",
    "e006e88c": "slide 18 - timeline strip",
    "0042e5b5": "slide 18 - timeline strip",
}

# ---- Slide 17: Time Frame ------------------------------------------------------
# Everything the generated timeline replaces. The three rasters carry the
# previous service's step icons and labels baked in (see RASTER_TEXT_IMAGES);
# the duration chips are live text but pinned to positions drawn for 16 steps.
# All of it goes, and src/compiler/timeline.ts draws the page from step data.
TIMEFRAME_REMOVE_IDS = [
    9,                      # decoration group: axis furniture drawn for 16 fixed slots
    5, 1028, 1030,          # journey thumbnail + the two timeline strips
    1034, 7,                # loose icon graphics
    36, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 1024, 1027,  # duration chips
]

for _i, _sid in enumerate(TIMEFRAME_REMOVE_IDS, start=1):
    FILLS.append(dict(slide=17, shape=_sid, token="TIMEFRAME.OLD_%02d" % _i,
                      mode="name",
                      note="replaced by the generated timeline"))
