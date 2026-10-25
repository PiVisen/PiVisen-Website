#!/usr/bin/env python3
"""
PiVisen AI — site helper (Python 3.8+, standard library only).

The website is plain HTML. Vercel serves the files exactly as they are in
the repository; nothing has to run before a deploy. This helper only saves
copy-and-paste work when you change shared parts or add a blog post:

  1. Copies tools/partials/header.html and footer.html into every page
     (between the <!-- @header --> and <!-- @footer --> markers) and marks
     the current page in the menu.
  2. Rebuilds every blog post in blog/ from its "POST DETAILS" block and its
     article body, using tools/partials/post.html as the layout
     (SEO tags, JSON-LD, contents list, related posts, previous/next).
  3. Rebuilds the post list on blog.html, the "Latest articles" on the home
     page, feed.xml (RSS) and sitemap.xml.

Run it from the repository root:
    python3 tools/update_site.py
"""
import datetime as dt
import html
import json
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://pivisen.com"
PARTIALS = ROOT / "tools" / "partials"
BLOG_DIR = ROOT / "blog"
CATEGORIES = ["AI", "Computer Vision", "Edge AI", "Security", "Software", "Company News"]
PAGES = [  # (file, url path) in the order they appear in the sitemap
    ("index.html", "/"),
    ("services.html", "/services"),
    ("projects.html", "/projects"),
    ("technologies.html", "/technologies"),
    ("about.html", "/about"),
    ("blog.html", "/blog"),
    ("contact.html", "/contact"),
]
AUTHORS = {
    "PiVisen AI Team": {
        "type": "Organization",
        "image": "/assets/images/logo-mark.webp",
        "bio": "PiVisen AI is a technology start-up from Bahawalpur, Pakistan. We build AI products and software for businesses, including computer vision, edge AI and cloud AI systems.",
        "link": "/about",
        "link_text": "Meet the team",
    },
    "Huzaifa Asad": {
        "type": "Person",
        "image": "/assets/images/team-huzaifa-asad.webp",
        "bio": "Founder & CEO of PiVisen AI. AI and ML engineer who leads product architecture and machine learning work.",
        "link": "https://www.linkedin.com/in/huzaifa-asad-8bba933aa/",
        "link_text": "Huzaifa on LinkedIn",
    },
    "M Tauqeer Zafar": {
        "type": "Person",
        "image": "/assets/images/team-tauqeer-zafar.webp",
        "bio": "Co-Founder & CTO of PiVisen AI. Python and full-stack engineer who leads cloud and backend systems.",
        "link": "https://www.linkedin.com/in/tauqeerzafar10/",
        "link_text": "Tauqeer on LinkedIn",
    },
    "Manaheel Hashim": {
        "type": "Person",
        "image": "/assets/images/team-manaheel-hashim.webp",
        "bio": "Co-Founder & CRO of PiVisen AI. Python developer focused on automation pipelines and data processing.",
        "link": "https://www.linkedin.com/in/manaheel-hashim-319425422/",
        "link_text": "Manaheel on LinkedIn",
    },
}
REQUIRED = ["title", "summary", "date", "author", "category", "readingTime", "cover", "coverAlt"]
ICON = '<svg class="icon" aria-hidden="true"><use href="/assets/images/icons.svg#{0}"></use></svg>'

errors = []


def esc(text):
    return html.escape(str(text), quote=True)


def read(path):
    return path.read_text(encoding="utf-8")


def write_if_changed(path, text):
    if not path.exists() or read(path) != text:
        path.write_text(text, encoding="utf-8")
        print("  updated", path.relative_to(ROOT))


def replace_region(text, name, content, path):
    """Replace everything between <!-- @name --> and <!-- /@name -->."""
    pattern = re.compile(r"(<!-- @%s(?:[\s:][^>]*)?-->)(.*?)(<!-- /@%s -->)" % (re.escape(name), re.escape(name)), re.S)
    if not pattern.search(text):
        errors.append("%s: missing <!-- @%s --> markers" % (path.relative_to(ROOT), name))
        return text
    return pattern.sub(lambda m: m.group(1) + "\n" + content.rstrip() + "\n" + m.group(3), text, count=1)


def git_date(path):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(path)], cwd=ROOT,
                             capture_output=True, text=True, timeout=10).stdout.strip()
        return out or dt.date.today().isoformat()
    except Exception:
        return dt.date.today().isoformat()


def parse_date(value):
    d = dt.datetime.fromisoformat(value)
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone(dt.timedelta(hours=5)))  # Pakistan time
    return d


def human_date(d):
    return "%d %s %d" % (d.day, d.strftime("%B"), d.year)


def slugify(text):
    text = re.sub(r"<[^>]+>", "", text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "section"


# --------------------------------------------------------------------------
# 1. Shared header and footer
# --------------------------------------------------------------------------
def apply_partials(path, text):
    header = read(PARTIALS / "header.html")
    footer = read(PARTIALS / "footer.html")
    m = re.search(r'<body[^>]*data-page="([^"]*)"', text)
    page = m.group(1) if m else ""
    if page:
        header = header.replace('data-nav="%s"' % page, 'data-nav="%s" aria-current="page"' % page)
    text = replace_region(text, "header", header, path)
    text = replace_region(text, "footer", footer, path)
    return text


# --------------------------------------------------------------------------
# 2. Blog posts
# --------------------------------------------------------------------------
def load_post(path):
    text = read(path)
    m = re.search(r'<script type="application/json" id="post-data">(.*?)</script>', text, re.S)
    if not m:
        errors.append("%s: no POST DETAILS block found" % path.relative_to(ROOT))
        return None
    try:
        data = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        errors.append("%s: the POST DETAILS block is not valid JSON (%s). Check commas and quotes." % (path.relative_to(ROOT), e))
        return None
    body_m = re.search(r"<!-- @body[^>]*-->(.*?)<!-- /@body -->", text, re.S)
    if not body_m:
        errors.append("%s: missing <!-- @body --> markers" % path.relative_to(ROOT))
        return None
    missing = [k for k in REQUIRED if not data.get(k)]
    if missing:
        errors.append("%s: missing fields %s" % (path.relative_to(ROOT), ", ".join(missing)))
        return None
    if data["category"] not in CATEGORIES:
        errors.append("%s: category must be one of %s" % (path.relative_to(ROOT), ", ".join(CATEGORIES)))
    slug = path.stem
    body = body_m.group(1).strip("\n")
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    d = parse_date(data["date"])
    upd = parse_date(data.get("updated") or data["date"])
    return {
        "path": path, "slug": slug, "data": data, "body": body, "words": words,
        "date": d, "updated": upd, "url": "%s/blog/%s" % (SITE, slug), "draft": bool(data.get("draft")),
    }


def add_heading_ids(body):
    seen = set()
    toc = []

    def fix(m):
        attrs, inner = m.group(1), m.group(2)
        idm = re.search(r'id="([^"]+)"', attrs)
        hid = idm.group(1) if idm else slugify(inner)
        base, n = hid, 2
        while hid in seen:
            hid, n = "%s-%d" % (base, n), n + 1
        seen.add(hid)
        toc.append((hid, re.sub(r"<[^>]+>", "", inner).strip()))
        if idm:
            return m.group(0)
        return '<h2 id="%s"%s>%s</h2>' % (hid, attrs, inner)

    body = re.sub(r"<h2([^>]*)>(.*?)</h2>", fix, body, flags=re.S)
    return body, toc


def post_card(p, heading="h3", lazy=True):
    d = p["data"]
    search = " ".join([d["title"], d["summary"], d["category"]]).lower()
    cover = d["cover"]
    small = cover.replace(".webp", "-640.webp")
    return """            <article class="card card-link post-card" data-post data-category-name="{cat}" data-search="{search}">
              <div class="post-cover"><img src="{small}" width="640" height="360" alt="{alt}"{lazy} /></div>
              <div class="post-card-body">
                <span class="tag tag-accent">{cat}</span>
                <{h}><a class="stretched" href="/blog/{slug}">{title}</a></{h}>
                <p>{summary}</p>
                <div class="post-meta"><span><time datetime="{iso}">{date}</time></span><span>{rt} min read</span></div>
              </div>
            </article>""".format(
        cat=esc(d["category"]), search=esc(search), small=small, alt=esc(d["coverAlt"]),
        lazy=' loading="lazy"' if lazy else "", h=heading, slug=p["slug"], title=esc(d["title"]),
        summary=esc(d["summary"]), iso=p["date"].isoformat(), date=human_date(p["date"]), rt=d["readingTime"])


def org_ref():
    return {"@type": "Organization", "@id": SITE + "/#organization", "name": "PiVisen AI",
            "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/assets/images/logo.png", "width": 512, "height": 512}}


def render_post(p, posts):
    d = p["data"]
    layout = read(PARTIALS / "post.html")
    body, toc = add_heading_ids(p["body"])
    author = AUTHORS.get(d["author"], AUTHORS["PiVisen AI Team"])
    published = [q for q in posts if not q["draft"]]
    idx = next((i for i, q in enumerate(published) if q["slug"] == p["slug"]), None)

    # previous = older post, next = newer post (list is newest first)
    prev_next = []
    if idx is not None and idx + 1 < len(published):
        q = published[idx + 1]
        prev_next.append('                <a class="card card-link prev" href="/blog/%s"><span class="label">%s Previous article</span><span class="title">%s</span></a>'
                         % (q["slug"], ICON.format("arrow-left"), esc(q["data"]["title"])))
    else:
        prev_next.append("                <span></span>")
    if idx is not None and idx > 0:
        q = published[idx - 1]
        prev_next.append('                <a class="card card-link next" href="/blog/%s"><span class="label">Next article %s</span><span class="title">%s</span></a>'
                         % (q["slug"], ICON.format("arrow-right"), esc(q["data"]["title"])))

    others = [q for q in published if q["slug"] != p["slug"]]
    related = [q for q in others if q["data"]["category"] == d["category"]] + [q for q in others if q["data"]["category"] != d["category"]]
    related_html = "\n".join(post_card(q) for q in related[:3])

    cover_abs = SITE + d["cover"]
    author_ld = {"@type": author["type"], "name": d["author"]}
    if author["type"] == "Organization":
        author_ld = {"@type": "Organization", "@id": SITE + "/#organization", "name": "PiVisen AI", "url": SITE + "/"}
    else:
        author_ld["url"] = author["link"]
    jsonld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "@id": p["url"] + "#article",
                "headline": d["title"],
                "description": d["summary"],
                "image": {"@type": "ImageObject", "url": cover_abs, "width": 1200, "height": 675},
                "datePublished": p["date"].isoformat(),
                "dateModified": p["updated"].isoformat(),
                "author": author_ld,
                "publisher": org_ref(),
                "mainEntityOfPage": {"@type": "WebPage", "@id": p["url"]},
                "articleSection": d["category"],
                "wordCount": p["words"],
                "timeRequired": "PT%dM" % int(d["readingTime"]),
                "inLanguage": "en",
                "isPartOf": {"@type": "Blog", "@id": SITE + "/blog#blog"},
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog"},
                    {"@type": "ListItem", "position": 3, "name": d["title"], "item": p["url"]},
                ],
            },
        ],
    }
    seo_title = d.get("seoTitle") or d["title"]
    if len(seo_title) > 60:
        print("  note: %s title is %d characters; add a shorter \"seoTitle\" (max 60)." % (p["slug"], len(seo_title)))
    if len(d["summary"]) > 160:
        print("  note: %s summary is %d characters; Google shows about 160." % (p["slug"], len(d["summary"])))
    est = max(1, round(p["words"] / 200))
    if abs(est - int(d["readingTime"])) > 1:
        print("  note: %s has %d words; readingTime %s could be %d." % (p["slug"], p["words"], d["readingTime"], est))

    values = {
        "data_json": json.dumps(d, indent=2, ensure_ascii=False),
        "seo_title": esc(seo_title),
        "title": esc(d["title"]),
        "title_attr": esc(d["title"]),
        "summary": esc(d["summary"]),
        "summary_attr": esc(d["summary"]),
        "robots": "noindex, follow" if p["draft"] else "index, follow, max-image-preview:large",
        "url": p["url"],
        "url_enc": urllib.parse.quote(p["url"], safe=""),
        "wa_text": urllib.parse.quote("%s %s" % (d["title"], p["url"]), safe=""),
        "cover": d["cover"],
        "cover_small": d["cover"].replace(".webp", "-640.webp"),
        "cover_abs": cover_abs,
        "cover_alt_attr": esc(d["coverAlt"]),
        "date_iso": p["date"].isoformat(),
        "updated_iso": p["updated"].isoformat(),
        "date_human": human_date(p["date"]),
        "category": esc(d["category"]),
        "category_url": urllib.parse.quote(d["category"]),
        "reading_time": str(d["readingTime"]),
        "author": esc(d["author"]),
        "author_image": author["image"],
        "author_bio": esc(author["bio"]),
        "author_link": author["link"],
        "author_link_text": esc(author["link_text"]),
        "cta_title": esc(d.get("ctaTitle") or "Have a project in mind?"),
        "cta_text": esc(d.get("ctaText") or "Tell us what you want to build. We will reply by email with honest next steps."),
        "toc": "\n".join('                  <li><a href="#%s">%s</a></li>' % (hid, esc(t)) for hid, t in toc),
        "body": body,
        "prev_next": "\n".join(prev_next),
        "related": related_html,
        "jsonld": json.dumps(jsonld, indent=2, ensure_ascii=False),
    }
    out = layout
    for key, val in values.items():
        out = out.replace("{{%s}}" % key, val)
    leftover = re.findall(r"\{\{\w+\}\}", out)
    if leftover:
        errors.append("%s: unknown placeholders %s" % (p["path"].name, leftover))
    return apply_partials(p["path"], out)


# --------------------------------------------------------------------------
# 3. Blog index, home page, RSS feed and sitemap
# --------------------------------------------------------------------------
def build_blog_index(posts):
    path = ROOT / "blog.html"
    text = read(path)
    published = [p for p in posts if not p["draft"]]
    featured = next((p for p in published if p["data"].get("featured")), published[0] if published else None)
    if featured:
        d = featured["data"]
        feat = """          <article class="card card-link featured-post">
            <div class="post-cover"><img src="{cover}" srcset="{small} 640w, {cover} 1200w" sizes="(min-width: 900px) 640px, 100vw" width="1200" height="675" alt="{alt}" fetchpriority="high" /></div>
            <div class="post-card-body">
              <span class="tag tag-accent">Featured · {cat}</span>
              <h2><a class="stretched" href="/blog/{slug}">{title}</a></h2>
              <p>{summary}</p>
              <div class="post-meta"><span><time datetime="{iso}">{date}</time></span><span>{rt} min read</span><span>By {author}</span></div>
            </div>
          </article>""".format(cover=d["cover"], small=d["cover"].replace(".webp", "-640.webp"), alt=esc(d["coverAlt"]),
                               cat=esc(d["category"]), slug=featured["slug"], title=esc(d["title"]), summary=esc(d["summary"]),
                               iso=featured["date"].isoformat(), date=human_date(featured["date"]), rt=d["readingTime"], author=esc(d["author"]))
        text = replace_region(text, "featured", feat, path)
        text = replace_region(text, "featured-preload", '    <link rel="preload" as="image" href="{0}" imagesrcset="{1} 640w, {0} 1200w" imagesizes="(min-width: 900px) 640px, 100vw" fetchpriority="high" />'.format(d["cover"], d["cover"].replace(".webp", "-640.webp")), path)
    text = replace_region(text, "posts", "\n".join(post_card(p) for p in published), path)
    blog_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Blog",
                "@id": SITE + "/blog#blog",
                "name": "PiVisen AI Blog",
                "description": "Plain-English articles on AI, computer vision, edge AI, security and software for businesses.",
                "url": SITE + "/blog",
                "inLanguage": "en",
                "publisher": org_ref(),
                "blogPost": [{"@type": "BlogPosting", "headline": p["data"]["title"], "url": p["url"],
                              "datePublished": p["date"].isoformat(), "image": SITE + p["data"]["cover"]} for p in published],
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog"},
                ],
            },
        ],
    }
    text = replace_region(text, "blog-jsonld", '    <script type="application/ld+json">\n%s\n    </script>' % json.dumps(blog_ld, indent=2, ensure_ascii=False), path)
    write_if_changed(path, apply_partials(path, text))


def build_home_latest(posts):
    path = ROOT / "index.html"
    text = read(path)
    latest = [p for p in posts if not p["draft"]][:3]
    text = replace_region(text, "latest-posts", "\n".join(post_card(p) for p in latest), path)
    write_if_changed(path, text)


def build_feed(posts):
    items = []
    for p in [q for q in posts if not q["draft"]][:20]:
        d = p["data"]
        items.append("""    <item>
      <title>{title}</title>
      <link>{url}</link>
      <guid isPermaLink="true">{url}</guid>
      <pubDate>{date}</pubDate>
      <category>{cat}</category>
      <dc:creator>{author}</dc:creator>
      <description>{summary}</description>
      <enclosure url="{img}" type="image/webp" length="{length}" />
    </item>""".format(title=esc(d["title"]), url=p["url"], date=p["date"].strftime("%a, %d %b %Y %H:%M:%S %z"),
                      cat=esc(d["category"]), author=esc(d["author"]), summary=esc(d["summary"]), img=SITE + d["cover"],
                      length=(ROOT / d["cover"].lstrip("/")).stat().st_size if (ROOT / d["cover"].lstrip("/")).exists() else 0))
    last = max([p["updated"] for p in posts if not p["draft"]], default=dt.datetime.now(dt.timezone.utc))
    feed = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>PiVisen AI Blog</title>
    <link>{site}/blog</link>
    <atom:link href="{site}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Plain-English articles on AI, computer vision, edge AI, security and software for businesses.</description>
    <language>en</language>
    <lastBuildDate>{last}</lastBuildDate>
    <image>
      <url>{site}/assets/images/logo.png</url>
      <title>PiVisen AI Blog</title>
      <link>{site}/blog</link>
    </image>
{items}
  </channel>
</rss>
""".format(site=SITE, last=last.strftime("%a, %d %b %Y %H:%M:%S %z"), items="\n".join(items))
    write_if_changed(ROOT / "feed.xml", feed)


def build_sitemap(posts):
    urls = []
    for file, loc in PAGES:
        urls.append((SITE + loc, git_date(ROOT / file)))
    for p in posts:
        if not p["draft"]:
            urls.append((p["url"], p["updated"].date().isoformat()))
    body = "\n".join("  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n  </url>" % (u, d) for u, d in urls)
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % body
    write_if_changed(ROOT / "sitemap.xml", sitemap)


def main():
    print("PiVisen AI site helper")
    posts = [p for p in (load_post(f) for f in sorted(BLOG_DIR.glob("*.html"))) if p]
    posts.sort(key=lambda p: p["date"], reverse=True)

    for p in posts:
        write_if_changed(p["path"], render_post(p, posts))

    build_blog_index(posts)
    build_home_latest(posts)
    build_feed(posts)
    build_sitemap(posts)

    for f in sorted(ROOT.glob("*.html")):
        if f.name == "blog.html":
            continue
        text = read(f)
        if "<!-- @header" in text:
            write_if_changed(f, apply_partials(f, text))

    if errors:
        print("\nPlease fix:")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print("Done. %d published post(s)." % len([p for p in posts if not p["draft"]]))


if __name__ == "__main__":
    main()
