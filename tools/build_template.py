"""Phase 0: turn the stripped Havenstone deck into a real Taajeel template.

Applies tools/spec.py:
  1. renames every fillable shape to its stable TJL token
  2. replaces client data with neutral [PLACEHOLDER] text
  3. swaps client logo images for a neutral placeholder
  4. normalises the letter's space-padded date line to a right tab stop
  5. resets document properties
  6. emits template/slide_map.json -- the contract the TS compiler binds to

Run:  python tools/build_template.py
Then: python tools/verify_deck.py template/taajeel_template.pptx
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

from pptx import Presentation
from pptx.util import Emu

sys.path.insert(0, str(Path(__file__).parent))
import spec as S

SRC = Path("template/taajeel_master.pptx")
DST = Path("template/taajeel_template.pptx")
MAP = Path("template/slide_map.json")
PLACEHOLDER_LOGO = Path("template/assets/logo_placeholder.png")
PLACEHOLDER_FLAG = Path("template/assets/flag_placeholder.png")

A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"


# ---------------------------------------------------------------- helpers
def walk(shapes):
    for sh in shapes:
        yield sh
        if sh.shape_type == 6:  # GROUP
            yield from walk(sh.shapes)


def find_shape(slide, shape_id):
    for sh in walk(slide.shapes):
        if sh.shape_id == shape_id:
            return sh
    raise KeyError(f"shape id {shape_id} not on slide")


def paragraphs(sh):
    return sh.text_frame.paragraphs


def clone_rpr(src_run, dst_run):
    """Copy a run's formatting without copying its text."""
    src = src_run._r.find(f"{A}rPr")
    if src is None:
        return
    dst = dst_run._r.find(f"{A}rPr")
    if dst is not None:
        dst.getparent().remove(dst)
    import copy
    new = copy.deepcopy(src)
    dst_run._r.insert(0, new)


def clear_runs(p):
    for r in list(p._p.findall(f"{A}r")):
        p._p.remove(r)
    # also drop any line-break elements left behind
    for br in list(p._p.findall(f"{A}br")):
        p._p.remove(br)


def add_run(p, text, rpr_source=None):
    r = p.add_run()
    if rpr_source is not None:
        clone_rpr(rpr_source, r)
    r.text = text
    return r


def set_right_tabstop(p, pos_emu):
    """Replace space-padding with a real right-aligned tab stop."""
    import copy
    from lxml import etree
    pPr = p._p.find(f"{A}pPr")
    if pPr is None:
        pPr = etree.SubElement(p._p, f"{A}pPr")
        p._p.insert(0, pPr)
    for old in pPr.findall(f"{A}tabLst"):
        pPr.remove(old)
    tabLst = etree.SubElement(pPr, f"{A}tabLst")
    tab = etree.SubElement(tabLst, f"{A}tab")
    tab.set("pos", str(int(pos_emu)))
    tab.set("algn", "r")


# ---------------------------------------------------------------- fills
def apply_fill(slide, f, report):
    sh = find_shape(slide, f["shape"])
    token = f["token"]
    mode = f["mode"]

    # Every addressed shape gets a stable, unique name. Several fills may share
    # one shape (the letter is a single text frame holding nine values), so the
    # SHAPE name and the FILL token are deliberately different things.
    sh.name = f.get("shape_name", token)

    # Geometry corrections for defects inherited from the source deck.
    if f.get("width_in"):
        sh.width = Emu(int(f["width_in"] * 914400))
    if f.get("height_in"):
        sh.height = Emu(int(f["height_in"] * 914400))

    if mode == "name":
        # rename only: the compiler needs a stable handle to delete it at render
        report.append((token, "named", f"shape {f['shape']}"))
        return

    if mode == "remove":
        sh._element.getparent().remove(sh._element)
        report.append((token, "removed", f"shape {f['shape']}"))
        return

    if mode == "picture":
        if f.get("plate"):
            add_logo_plate(slide, sh)
            report.append((token, "picture+plate", sh.name))
        else:
            report.append((token, "picture", sh.name))
        return

    if mode == "table":
        report.append((token, "table", f"{len(sh.table.rows)}x{len(sh.table.columns)}"))
        return

    ps = paragraphs(sh)

    if mode == "text":
        pi = f.get("para", 0)
        p = ps[pi]
        src = p.runs[0] if p.runs else None
        clear_runs(p)
        add_run(p, f["neutral"], src)
        if f.get("clear_rest"):
            for extra in ps[pi + 1:]:
                clear_runs(extra)
        report.append((token, f"text p{pi}", f["neutral"][:40]))

    elif mode == "text_multi":
        vals = f["neutral"]
        start = 1 if f.get("keep_para0") else 0
        for i, val in enumerate(vals):
            if i < start:
                continue
            if i >= len(ps):
                break
            p = ps[i]
            src = p.runs[0] if p.runs else None
            clear_runs(p)
            add_run(p, val, src)
        report.append((token, "text_multi", f"{len(vals)} paragraphs"))

    elif mode == "run":
        p = ps[f["para"]]
        rs = p.runs
        idx = f["run"]
        if idx >= len(rs):
            raise IndexError(f"{token}: para {f['para']} has {len(rs)} runs, wanted {idx}")
        rs[idx].text = f["neutral"]
        report.append((token, f"run p{f['para']}r{idx}", f["neutral"][:40]))

    elif mode == "runs":
        p = ps[f["para"]]
        originals = list(p.runs)
        if f.get("tabstop_right"):
            # right edge of the text frame, less a small inset
            set_right_tabstop(p, (sh.width or Emu(0)) - Emu(90000))
        plan = f["plan"]
        clear_runs(p)
        for step in plan:
            rpr_i = step.get("rpr", 0)
            src = originals[rpr_i] if rpr_i < len(originals) else (
                originals[0] if originals else None)
            text = step["literal"] if "literal" in step else step["neutral"]
            add_run(p, text, src)
        report.append((token, f"runs p{f['para']}", f"{len(plan)} runs"))

    elif mode == "frame":
        # Rebuild every addressed paragraph, preserving each one's pPr and the
        # rPr of the runs named in the plan. Unaddressed paragraphs are left
        # alone (they are empty spacers).
        for plan in f["paras"]:
            p = ps[plan["i"]]
            originals = list(p.runs)
            if not originals:
                continue
            clear_runs(p)
            for step in plan["runs"]:
                ri = step.get("rpr", 0)
                src = originals[ri] if ri < len(originals) else originals[0]
                add_run(p, step["text"], src)
        report.append((token, "frame",
                       f"{len(f['paras'])} paras, styles={list(f['style_exemplars'])}"))

    elif mode == "rich":
        p = ps[f["para"]]
        originals = list(p.runs)
        reg = originals[f.get("rpr_regular", 0)] if originals else None
        bold = originals[f.get("rpr_bold", 0)] if originals else None
        clear_runs(p)
        add_run(p, f["neutral"], reg)
        # keep a bold exemplar so the compiler can clone its rPr at runtime
        report.append((token, f"rich p{f['para']}",
                       f"regular=r{f.get('rpr_regular')} bold=r{f.get('rpr_bold')}"))
        f["_rich_meta"] = dict(regular=f.get("rpr_regular"), bold=f.get("rpr_bold"))
        _ = (reg, bold)

    else:
        raise ValueError(f"unknown mode {mode}")


def add_logo_plate(slide, pic, pad_in: float = 0.14):
    """Put a white rounded rectangle behind the cover logo.

    The source deck used a white knockout wordmark supplied per client, which
    only works if every client hands over a white version of their logo. Clients
    supply one logo, so a navy mark would vanish on the navy cover. The plate
    guarantees any logo stays legible. It is a deliberate, visible departure
    from the original cover treatment.
    """
    from pptx.enum.shapes import MSO_SHAPE
    from pptx.dml.color import RGBColor

    pad = Emu(int(pad_in * 914400))
    plate = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        pic.left - pad, pic.top - pad,
        pic.width + 2 * pad, pic.height + 2 * pad,
    )
    plate.name = "COVER.CLIENT_LOGO_PLATE"
    plate.fill.solid()
    plate.fill.fore_color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    plate.line.fill.background()
    plate.shadow.inherit = False
    # modest corner radius; the adjustment is a fraction of the short side
    try:
        plate.adjustments[0] = 0.08
    except Exception:
        pass
    # z-order is document order: move the plate immediately before the picture
    sp_tree = pic._element.getparent()
    sp_tree.remove(plate._element)
    sp_tree.insert(list(sp_tree).index(pic._element), plate._element)
    return plate


# ---------------------------------------------------------------- logo
def _placeholder(path: Path, w: int, h: int, label: str, dashed=True):
    """A neutral, obviously-placeholder asset. Never a real trademark or flag."""
    from PIL import Image, ImageDraw, ImageFont
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    navy = (15, 51, 83, 255)
    d.rounded_rectangle([4, 4, w - 4, h - 4], radius=max(6, h // 12),
                        outline=navy, width=max(3, h // 60))
    try:
        font = ImageFont.truetype("arial.ttf", max(14, h // 5))
    except Exception:
        font = None
    d.text((w // 2, h // 2), label, fill=navy, anchor="mm", font=font)
    img.save(path)
    return path


def make_placeholders():
    logo = _placeholder(PLACEHOLDER_LOGO, 1000, 250, "CLIENT LOGO")
    flag = _placeholder(PLACEHOLDER_FLAG, 250, 150, "FLAG")
    return {"db8462f0": logo.read_bytes(),
            "c3f9f79a": logo.read_bytes(),
            "403c5934": flag.read_bytes()}


def swap_client_images(pptx_path: Path, replacements: dict, shas: dict):
    """Overwrite client asset media parts at the zip level, keeping part names.

    `replacements` maps sha1[:8] -> replacement bytes, so a logo and a country
    flag get visually distinct placeholders.
    """
    with zipfile.ZipFile(pptx_path) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    swapped = []
    for name, blob in list(parts.items()):
        if not name.startswith("ppt/media/"):
            continue
        h = hashlib.sha1(blob).hexdigest()[:8]
        if h in shas:
            parts[name] = replacements[h]
            swapped.append((name, h, shas[h]))
    order = ["[Content_Types].xml"] + [n for n in parts if n != "[Content_Types].xml"]
    with zipfile.ZipFile(pptx_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for n in order:
            z.writestr(n, parts[n])
    return swapped


def reset_docprops(pptx_path: Path):
    with zipfile.ZipFile(pptx_path) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    core = parts["docProps/core.xml"].decode("utf8")
    core = re.sub(r"<dc:creator>.*?</dc:creator>", "<dc:creator>Taajeel</dc:creator>", core)
    core = re.sub(r"<cp:lastModifiedBy>.*?</cp:lastModifiedBy>",
                  "<cp:lastModifiedBy>Taajeel</cp:lastModifiedBy>", core)
    core = re.sub(r"<cp:revision>.*?</cp:revision>", "<cp:revision>1</cp:revision>", core)
    core = re.sub(r"<dc:title>.*?</dc:title>", "<dc:title>Taajeel Proposal Template</dc:title>", core)
    parts["docProps/core.xml"] = core.encode("utf8")

    app = parts["docProps/app.xml"].decode("utf8")
    app = re.sub(r"(?i)havenstone[^<]*", "Taajeel Proposal Template", app)
    parts["docProps/app.xml"] = app.encode("utf8")

    order = ["[Content_Types].xml"] + [n for n in parts if n != "[Content_Types].xml"]
    with zipfile.ZipFile(pptx_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for n in order:
            z.writestr(n, parts[n])


# ---------------------------------------------------------------- main
def main():
    if not SRC.exists():
        sys.exit(f"missing {SRC} -- run tools/prepare_template.py first")

    prs = Presentation(SRC)
    report = []
    failures = []

    by_slide: dict[int, list] = {}
    for f in S.FILLS:
        by_slide.setdefault(f["slide"], []).append(f)

    for n, fills in sorted(by_slide.items()):
        slide = prs.slides[n - 1]
        for f in fills:
            try:
                apply_fill(slide, f, report)
            except Exception as e:
                failures.append((f["token"], repr(e)))

    prs.save(DST)
    print(f"applied {len(report)} fills across {len(by_slide)} slides")
    for tok, kind, detail in report:
        print(f"  {tok:<32} {kind:<16} {detail}")
    if failures:
        print("\nFAILURES:")
        for tok, err in failures:
            print(f"  {tok:<32} {err}")

    swapped = swap_client_images(DST, make_placeholders(), S.CLIENT_IMAGE_SHAS)
    print(f"\nswapped {len(swapped)} client asset media part(s):")
    for name, h, why in swapped:
        print(f"  {name:<24} sha={h}  {why}")

    reset_docprops(DST)
    print("reset docProps core + app")

    # ---- slide_map.json : the compiler contract
    smap = {
        "template": DST.name,
        "slide_count": len(prs.slides.__iter__.__self__._sldIdLst),
        "boilerplate_slides": S.BOILERPLATE,
        "sections": [{"key": k, "slides": v} for k, v in S.SECTIONS],
        "optional_sections": S.OPTIONAL_SECTIONS,
        # "remove" fills are template-BUILD instructions: the shape is gone by
        # the time the compiler runs, so emitting them would make every render
        # report a missing shape.
        "fills": [
            {k: v for k, v in f.items() if not k.startswith("_")}
            for f in S.FILLS if f["mode"] != "remove"
        ],
    }
    MAP.write_text(json.dumps(smap, ensure_ascii=False, indent=1), encoding="utf8")
    print(f"\nwrote {MAP}")
    print(f"wrote {DST}  ({round(DST.stat().st_size/1e6,1)} MB)")

    # ---- leak audit
    with zipfile.ZipFile(DST) as z:
        blob = b"".join(z.read(n) for n in z.namelist()
                        if n.endswith(".xml") or n.endswith(".rels"))
    low = blob.decode("utf8", "ignore").lower()
    remaining = [t for t in S.LEAK_TOKENS if t.lower() in low]
    print("\nleak audit:", "CLEAN" if not remaining else f"STILL PRESENT -> {remaining}")
    return 1 if (failures or remaining) else 0


sys.exit(main())
