"""OOXML package surgery.

Deliberately mirrors what src/compiler/ooxml.ts will do in the browser, so the
approach is proven in Python (where PowerPoint COM can verify it) before being
ported to TypeScript.

Core idea: a .pptx is a zip of parts joined by .rels files. Removing a part means
removing (1) the part, (2) its own .rels part, (3) every <Relationship> pointing
at it, (4) its [Content_Types].xml override, and (5) any list entry in the parent
that references the relationship id. Miss any one and PowerPoint refuses the file
-- usually without python-pptx noticing.
"""
from __future__ import annotations
import re, zipfile, posixpath
from pathlib import Path

CT = "[Content_Types].xml"


class Package:
    def __init__(self, src: Path):
        with zipfile.ZipFile(src) as z:
            self.parts: dict[str, bytes] = {n: z.read(n) for n in z.namelist()}
        self.src = src

    # ---------- helpers ----------
    def text(self, name: str) -> str:
        return self.parts[name].decode("utf8")

    def set_text(self, name: str, s: str) -> None:
        self.parts[name] = s.encode("utf8")

    @staticmethod
    def rels_for(part: str) -> str:
        d, f = posixpath.split(part)
        return posixpath.join(d, "_rels", f + ".rels")

    def rel_targets(self, part: str) -> dict[str, str]:
        """rId -> absolute part name, for one part's relationships."""
        rp = self.rels_for(part)
        if rp not in self.parts:
            return {}
        base = posixpath.dirname(part)
        out = {}
        for m in re.finditer(r'<Relationship\b[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"[^>]*?/>',
                             self.text(rp)):
            rid, tgt = m.group(1), m.group(2)
            if tgt.startswith("http") or 'TargetMode="External"' in m.group(0):
                continue
            out[rid] = posixpath.normpath(posixpath.join(base, tgt))
        return out

    # ---------- surgery ----------
    def drop_relationship(self, owner: str, rid: str) -> None:
        rp = self.rels_for(owner)
        s = self.text(rp)
        s2 = re.sub(r'<Relationship\b[^>]*?Id="%s".*?/>' % re.escape(rid), "", s, count=1)
        if s2 == s:
            raise KeyError(f"relationship {rid} not found in {rp}")
        self.set_text(rp, s2)

    def drop_content_type(self, part: str) -> None:
        s = self.text(CT)
        self.set_text(CT, re.sub(
            r'<Override\b[^>]*?PartName="/%s"[^>]*?/>' % re.escape(part), "", s, count=1))

    def remove_part(self, part: str) -> None:
        self.parts.pop(part, None)
        self.parts.pop(self.rels_for(part), None)
        self.drop_content_type(part)

    def gc_media(self) -> list[str]:
        """Delete media parts no surviving .rels references. Returns removed names."""
        referenced = set()
        for name in list(self.parts):
            if name.endswith(".rels"):
                base = posixpath.dirname(posixpath.dirname(name))
                for t in re.findall(r'Target="([^"]+)"', self.text(name)):
                    referenced.add(posixpath.normpath(posixpath.join(base, t)))
        removed = []
        for name in list(self.parts):
            if name.startswith("ppt/media/") and name not in referenced:
                del self.parts[name]
                removed.append(name)
        return removed

    def save(self, dst: Path) -> None:
        dst.parent.mkdir(parents=True, exist_ok=True)
        # [Content_Types].xml must be the first part in the archive
        order = [CT] + [n for n in self.parts if n != CT]
        with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for n in order:
                z.writestr(n, self.parts[n])

    def size_mb(self) -> float:
        return round(sum(len(v) for v in self.parts.values()) / 1e6, 1)


def remove_layout(pkg: Package, layout_part: str) -> None:
    """Remove a slideLayout: master's sldLayoutIdLst entry, the rel, and the part."""
    master = "ppt/slideMasters/slideMaster1.xml"
    rid = next((r for r, t in pkg.rel_targets(master).items() if t == layout_part), None)
    if rid is None:
        raise KeyError(f"{layout_part} not referenced by {master}")
    s = pkg.text(master)
    s2 = re.sub(r'<p:sldLayoutId\b[^>]*?r:id="%s"\s*/>' % re.escape(rid), "", s, count=1)
    if s2 == s:
        raise KeyError(f"sldLayoutId for {rid} not found")
    pkg.set_text(master, s2)
    pkg.drop_relationship(master, rid)
    pkg.remove_part(layout_part)
