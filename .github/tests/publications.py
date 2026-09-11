"""Run after a Jekyll build: python .github/tests/publications.py [site directory]."""
from html import unescape
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

root = Path(__file__).resolve().parents[2]
site = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "_site"
html = (site / "publications/index.html").read_text(encoding="utf-8")
cards = re.findall(r'<article class="publication-card"[^>]*>(.*?)</article>', html, re.S)
posts = list((root / "_publications").glob("*.md"))
assert len(cards) == len(posts) == 6, "Every published paper must have one card"

for post in posts:
    metadata = post.read_text(encoding="utf-8").split("---", 2)[1]

    def field(name):
        match = re.search(rf"^{name}:\s*(.+)$", metadata, re.M)
        assert match, f"{post.name}: missing {name}"
        return match[1].strip().strip("\"'")

    matching = [card for card in cards if field("title") in unescape(card)]
    assert len(matching) == 1, f"{post.name}: missing or repeated paper"
    card = matching[0]
    assert '<strong>Xiangjie Kong</strong>' in card, f"{post.name}: author emphasis"
    assert f', {field("publication_year")}</p>' in card, f"{post.name}: publication year"
    assert field("jcr_quartile") in ("Q1", "Q2", "Q3", "Q4")
    assert f'(JCR {field("jcr_quartile")})' in card, f"{post.name}: JCR quartile"
    assert f'href="{field("paperurl")}"' in unescape(card), f"{post.name}: paper link"
    citation = re.search(r'data-citation="([^"]+)"', card)
    assert citation and unescape(citation[1]) == field("citation"), f"{post.name}: citation"
    image = re.search(r'<img\s[^>]*src="([^"]+)"[^>]*>', card)
    assert image, f"{post.name}: missing figure"
    assert urlparse(image[1]).path.endswith(field("figure")), f"{post.name}: wrong figure"
    assert (root / field("figure").lstrip("/")).is_file(), f"{post.name}: missing image asset"
    assert (site / field("figure").lstrip("/")).is_file(), f"{post.name}: missing built image"
    assert f'alt="{field("figure_alt")}"' in unescape(image[0]), f"{post.name}: image alt text"
    assert field("figure_width").isdigit() and field("figure_height").isdigit()

for route in ("cv", "cv.html", "resume", "resume.html"):
    assert not (site / route).exists(), f"Hidden CV route still published: {route}"
for page in ("index.html", "publications/index.html", "sitemap/index.html", "sitemap.xml"):
    content = (site / page).read_text(encoding="utf-8")
    assert not re.search(r'(?:href="|<loc>)[^"<]*(?:/cv/?|/resume/?)\s*(?:"|</loc>)', content), page

print("PASS: all 6 publication cards are complete, JCR quartiles are shown, and CV is unpublished.")
