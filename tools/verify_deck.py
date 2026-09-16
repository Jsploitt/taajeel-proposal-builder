"""Phase 1: verification harness.

'python-pptx saved it without error' is NOT evidence the file is valid. The only
authority is real PowerPoint. This opens each deck via COM, exports to PDF, and
rasterizes for visual comparison.

Usage: python tools/verify_deck.py <deck.pptx> [more.pptx ...]
"""
import sys, os, re, zipfile
from pathlib import Path

OUT = Path("build/renders")
LEAKS = ["havenstone", "solarski", "nogueira", "sanabis", "180721",
         "0026.07.12.0633", "havenstone.me", "flyakeed", "zmutairi",
         "hcparquitectos", "muriana", "7007659084", "7052810467"]


def open_in_powerpoint(path: Path):
    """Returns (ok, slide_count_or_error). The real gate."""
    import win32com.client as win32
    import pythoncom
    pythoncom.CoInitialize()
    app = None
    try:
        app = win32.Dispatch("PowerPoint.Application")
        pres = app.Presentations.Open(str(path.resolve()), ReadOnly=1,
                                      WithWindow=0)
        n = pres.Slides.Count
        pdf = path.with_suffix(".pdf")
        pres.SaveAs(str(pdf.resolve()), 32)   # 32 = ppSaveAsPDF
        pres.Close()
        return True, n, pdf
    except Exception as e:
        return False, repr(e), None
    finally:
        if app is not None:
            try:
                app.Quit()
            except Exception:
                pass
        pythoncom.CoUninitialize()


def rasterize(pdf: Path, tag: str):
    import pymupdf
    d = pymupdf.open(pdf)
    dst = OUT / tag
    dst.mkdir(parents=True, exist_ok=True)
    for i, page in enumerate(d, 1):
        page.get_pixmap(dpi=110).save(dst / f"{i:02d}.png")
    return d.page_count, dst


def leak_check(path: Path):
    hits = {}
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if not (n.endswith(".xml") or n.endswith(".rels")):
                continue
            low = z.read(n).decode("utf8", "ignore").lower()
            for t in LEAKS:
                if t in low:
                    hits.setdefault(t, set()).add(n.split("/")[-1])
    return hits


def raster_text_check(path: Path):
    """Fail if an image known to contain baked-in text survives.

    The leak check greps XML. Text rendered into a PICTURE is invisible to it,
    so a deck can pass every textual check while showing the previous client's
    step labels as a picture. Registered by hash in tools/spec.py.
    """
    import hashlib
    sys.path.insert(0, str(Path(__file__).parent))
    try:
        from spec import RASTER_TEXT_IMAGES
    except Exception:
        return {}
    found = {}
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if not n.startswith("ppt/media/"):
                continue
            h = hashlib.sha1(z.read(n)).hexdigest()[:8]
            if h in RASTER_TEXT_IMAGES:
                found[n.split("/")[-1]] = (h, RASTER_TEXT_IMAGES[h])
    return found


def schema_order_check(path: Path):
    """A run after <a:endParaRPr> is schema-invalid.

    PowerPoint opens such a file without complaint and then silently drops the
    run, so the text is present in the XML and absent from the slide. Only a
    structural check catches it -- opening the file does not.
    """
    bad = {}
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if not re.match(r"ppt/slides/slide\d+\.xml$", n):
                continue
            x = z.read(n).decode("utf8", "ignore")
            hits = sum(
                1 for para in re.findall(r"<a:p>.*?</a:p>", x, re.S)
                if re.search(r"<a:endParaRPr[^>]*/>.*<a:r>", para, re.S)
            )
            if hits:
                bad[n.split("/")[-1]] = hits
    return bad


def placeholder_check(path: Path):
    todo = set()
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if re.match(r"ppt/slides/slide\d+\.xml$", n):
                if "TO BE CONFIRMED" in z.read(n).decode("utf8", "ignore"):
                    todo.add(n.split("/")[-1])
    return todo


def main(paths):
    fails = 0
    for p in paths:
        p = Path(p)
        tag = p.stem[:40]
        print(f"\n=== {p.name}  ({round(p.stat().st_size/1e6,1)} MB)")
        ok, info, pdf = open_in_powerpoint(p)
        if not ok:
            print(f"  FAIL  PowerPoint refused to open it:\n        {info}")
            fails += 1
            continue
        print(f"  ok    PowerPoint opened it, {info} slides")
        if pdf and pdf.exists():
            n, dst = rasterize(pdf, tag)
            print(f"  ok    exported PDF, rasterized {n} pages -> {dst}")
        raster = raster_text_check(p)
        if raster:
            print("  FAIL  image(s) with baked-in text from another service:")
            for name, (h, why) in sorted(raster.items()):
                print(f"          {name} ({h}) {why}")
            fails += 1
        else:
            print("  ok    no known baked-text rasters")

        order = schema_order_check(p)
        if order:
            print("  FAIL  run after <a:endParaRPr> (text will be silently dropped):")
            for slide, n in sorted(order.items()):
                print(f"          {slide}: {n} paragraph(s)")
            fails += 1
        else:
            print("  ok    paragraph schema order valid")

        lk = leak_check(p)
        if lk:
            print("  LEAK  other clients' identifiers present:")
            for t, parts in sorted(lk.items()):
                print(f"          {t:<18} {sorted(parts)[:6]}")
            fails += 1
        else:
            print("  ok    leak check clean")
        todo = placeholder_check(p)
        if todo:
            print(f"  note  [TO BE CONFIRMED] on {len(todo)} slide(s): {sorted(todo)[:6]}")
    print(f"\n{'PASS' if not fails else 'FAIL'} — {len(paths)} deck(s), {fails} problem(s)")
    return 1 if fails else 0


sys.exit(main(sys.argv[1:] or ["template/taajeel_master.pptx"]))
