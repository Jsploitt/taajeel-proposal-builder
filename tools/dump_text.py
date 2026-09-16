"""Dump slide text from a .pptx in presentation order.

Note the regex: `<a:t[^>]*>` also matches <a:tblPr> and <a:tblGrid>, which makes
table slides look like corrupted XML. Anchor on the tag boundary instead.
"""
import zipfile, re, html, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf8", errors="replace")

T = re.compile(r"<a:t(?:\s[^>]*)?>(.*?)</a:t>", re.S)

path = sys.argv[1]
want = {int(a) for a in sys.argv[2:]} or None
z = zipfile.ZipFile(path)
pres = z.read("ppt/presentation.xml").decode("utf8")
rels = z.read("ppt/_rels/presentation.xml.rels").decode("utf8")
rmap = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
order = [rmap[m] for m in re.findall(r'<p:sldId[^>]*r:id="([^"]+)"', pres)]

for pos, tgt in enumerate(order, 1):
    if want and pos not in want:
        continue
    n = "ppt/" + tgt.replace("../", "")
    x = z.read(n).decode("utf8")
    parts = [html.unescape(m).strip() for m in T.findall(x)]
    print(f"== pos {pos:02d} ({tgt.split('/')[-1]})")
    print("   " + " | ".join(p for p in parts if p)[:600])
    print()
