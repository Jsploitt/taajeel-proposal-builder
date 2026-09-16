"""Phase 0 step 3 + audit: strip unused layouts, GC media, report client leakage.

Does NOT yet purge client strings or rename shapes -- those are separate,
reviewable steps. This pass is strictly lossless: it removes only layouts that
no slide references, and media that nothing references.
"""
from pathlib import Path
import re, sys
sys.path.insert(0, str(Path(__file__).parent))
from pkg import Package, remove_layout

SRC = Path("proposal/Proposal to HAVENSTONE CONSULTING W.L.L foreign company set up.pptx")
DST = Path("template/taajeel_master.pptx")

# Identifiers that must not survive into a template. Audited, not yet removed.
LEAKS = ["havenstone", "phil", "solarski", "barbara", "nogueira", "sanabis",
         "180721", "+973", "BHD 1,000", "0026.07.12.0633", "havenstone.me", "bahrain"]


def used_layouts(pkg: Package) -> set[str]:
    used = set()
    for name in pkg.parts:
        m = re.match(r"ppt/slides/slide(\d+)\.xml$", name)
        if m:
            used |= set(t for t in pkg.rel_targets(name).values() if "slideLayouts/" in t)
    return used


def audit(pkg: Package) -> dict[str, list[str]]:
    hits: dict[str, list[str]] = {}
    for name, blob in pkg.parts.items():
        if not (name.endswith(".xml") or name.endswith(".rels")):
            continue
        low = blob.decode("utf8", "ignore").lower()
        for token in LEAKS:
            if token.lower() in low:
                hits.setdefault(token, []).append(name)
    return hits


def main():
    pkg = Package(SRC)
    before = pkg.size_mb()
    all_layouts = {n for n in pkg.parts if re.match(r"ppt/slideLayouts/slideLayout\d+\.xml$", n)}
    unused = sorted(all_layouts - used_layouts(pkg),
                    key=lambda s: int(re.findall(r"\d+", s)[0]))

    print(f"source            {SRC.name}")
    print(f"size              {before} MB, {len(pkg.parts)} parts")
    print(f"layouts           {len(all_layouts)} total, {len(unused)} unused -> {[u.split('/')[-1] for u in unused]}")

    for lay in unused:
        remove_layout(pkg, lay)
        print(f"  removed         {lay}")

    gone = pkg.gc_media()
    freed = before - pkg.size_mb()
    print(f"media GC          {len(gone)} orphaned parts removed")
    for g in sorted(gone):
        print(f"                  {g}")
    print(f"size after        {pkg.size_mb()} MB  (freed {round(freed,1)} MB, "
          f"{round(100*freed/before)}%)")

    pkg.save(DST)
    print(f"written           {DST}  ({round(DST.stat().st_size/1e6,1)} MB on disk)")

    print("\nCLIENT-DATA AUDIT (these must all be gone before this is a template):")
    hits = audit(pkg)
    for tok in LEAKS:
        parts = hits.get(tok, [])
        if parts:
            slides = sorted({p for p in parts if "/slides/" in p},
                            key=lambda s: int(re.findall(r"\d+", s)[0] or 0))
            print(f"  LEAK  {tok:<18} {len(parts):>3} parts   {[s.split('/')[-1] for s in slides][:8]}")
        else:
            print(f"  clean {tok}")


main()
