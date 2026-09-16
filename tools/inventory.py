"""Phase 0 forensics: full shape inventory of a .pptx.

Read-only. Emits template/inventory.json (machine) + template/INVENTORY.md (human).
Every fillable shape we later rename to a TJL.* token is chosen from this report.
"""
import json, sys, re
from pathlib import Path
from pptx import Presentation
from pptx.util import Emu

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else
           "proposal/Proposal to HAVENSTONE CONSULTING W.L.L foreign company set up.pptxreplace("|", "\|")
OUT = Path("templatereplace("|", "\|")

def shape_text(sh):
    if not sh.has_text_frame:
        return None
    return "\n".join(p.text for p in sh.text_frame.paragraphs)

def runs_of(sh):
    """Run count per paragraph — exposes the run-splitting that breaks find-and-replace."""
    if not sh.has_text_frame:
        return []
    return [len(p.runs) for p in sh.text_frame.paragraphs]

def walk(shapes, depth=0):
    for sh in shapes:
        yield sh, depth
        if sh.shape_type == 6:  # GROUP
            yield from walk(sh.shapes, depth + 1)

def main():
    prs = Presentation(SRC)
    doc = {
        "source": SRC.name,
        "slide_w_emu": prs.slide_width, "slide_h_emu": prs.slide_height,
        "slide_w_in": round(prs.slide_width / 914400, 3),
        "slide_h_in": round(prs.slide_height / 914400, 3),
        "slides": [],
    }
    for idx, slide in enumerate(prs.slides, start=1):
        rec = {
            "n": idx,
            "layout": slide.slide_layout.name,
            "shapes": [],
        }
        for sh, depth in walk(slide.shapes):
            txt = shape_text(sh)
            rec["shapes"].append({
                "id": sh.shape_id,
                "name": sh.name,
                "depth": depth,
                "type": str(sh.shape_type),
                "is_ph": sh.is_placeholder,
                "ph_type": str(sh.placeholder_format.type) if sh.is_placeholder else None,
                "l": sh.left, "t": sh.top, "w": sh.width, "h": sh.height,
                "l_in": round(sh.left / 914400, 3) if sh.left is not None else None,
                "t_in": round(sh.top / 914400, 3) if sh.top is not None else None,
                "w_in": round(sh.width / 914400, 3) if sh.width is not None else None,
                "h_in": round(sh.height / 914400, 3) if sh.height is not None else None,
                "text": txt,
                "chars": len(txt) if txt else 0,
                "runs_per_para": runs_of(sh),
            })
        doc["slides"].append(rec)

    OUT.mkdir(exist_ok=True)
    (OUT / "inventory.jsonreplace("|", "\|").write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf8")

    # human report
    L = [f"# Shape inventory — {SRC.name}", "",
         f"Slide size {doc['slide_w_in']} x {doc['slide_h_in']} in "
         f"({doc['slide_w_emu']} x {doc['slide_h_emu']} EMU)", ""]
    dupes_total = 0
    for s in doc["slides"]:
        names = [sh["name"] for sh in s["shapes"]]
        dupes = {n for n in names if names.count(n) > 1}
        dupes_total += len(dupes)
        L.append(f"## Slide {s['n']:02d} — layout `{s['layout']}` — {len(s['shapes'])} shapes"
                 + (f"  **DUPLICATE NAMES: {sorted(dupes)}**" if dupes else "replace("|", "\|"))
        L.append("replace("|", "\|")
        L.append("| id | name | type | pos in (l,t,w,h) | chars | runs/para | text |replace("|", "\|")
        L.append("|---|---|---|---|---|---|---|replace("|", "\|")
        for sh in s["shapes"]:
            t = (sh["text"] or "replace("|", "\|").replace("\n", " ⏎ ").replace("|", "\|")
            if len(t) > 90:
                t = t[:90] + "…"
            pos = f"{sh['l_in']},{sh['t_in']},{sh['w_in']},{sh['h_in']}"
            ind = "› " * sh["depth"]
            rp = ",".join(map(str, sh["runs_per_para"][:6]))
            L.append(f"| {sh['id']} | {ind}`{sh['name']}` | {sh['type'].split(' ')[0]} "
                     f"| {pos} | {sh['chars']} | {rp} | {t} |replace("|", "\|")
        L.append("replace("|", "\|")
    L.append(f"\n**Slides with duplicate shape names: {dupes_total}**replace("|", "\|")
    (OUT / "INVENTORY.mdreplace("|", "\|").write_text("\n".join(L), encoding="utf8")

    tot = sum(len(s["shapes"]) for s in doc["slides"])
    print(f"slides={len(doc['slides'])} shapes={tot} -> template/inventory.json, template/INVENTORY.mdreplace("|", "\|")

main()
