# PiVisen AI website

The company website for **PiVisen AI** — live at <https://pivisen.com>, hosted on Vercel.

Plain HTML, CSS and JavaScript. No framework and no build step: Vercel publishes the files exactly as they are in this repository. Every push to `main` goes live; every pull request gets a preview link.

## Files at a glance

| Path | What it is |
|---|---|
| `index.html`, `services.html`, `projects.html` (PiLENS), `technologies.html`, `about.html`, `contact.html` | The main pages. Clean URLs: `/services`, `/projects`, … |
| `blog.html` | Blog index (`/blog`) with featured post, categories and search |
| `blog/<slug>.html` | One file per article (`/blog/<slug>`) |
| `blog/_template.html` | Copy this to start a new article (it is not published) |
| `privacy.html` | Privacy notice (`/privacy`), linked from the footer and the contact form |
| `404.html` | "Page not found" page |
| `assets/css/style.css` | All styles, in 18 numbered sections listed at the top of the file. Colours, fonts and spacing are variables in section 2 |
| `assets/js/main.js` | Menu, back-to-top button, scroll reveal, contact form, blog search, card spotlight, typewriter, 3D tilt (9 numbered sections) |
| `assets/js/hero-vision.js` | The animated camera illustration on the home page |
| `assets/images/` | Images (WebP), icons (`icons.svg`), logo and favicons |
| `tools/partials/` | The shared header, footer and blog-post layout |
| `tools/update_site.py` | Helper that copies the header/footer into every page and rebuilds the blog lists, `feed.xml` and `sitemap.xml` |
| `sitemap.xml`, `feed.xml`, `robots.txt`, `site.webmanifest` | SEO files (sitemap and feed are generated) |
| `vercel.json` | Clean URLs, cache headers, `/products` → `/projects` redirect |
| `AUDIT.md`, `CHANGES.md` | Review of the old site and the list of removed claims |

## How to edit text

1. Open the page in any editor (VS Code, or the pencil icon on GitHub).
2. Change the words between the tags, e.g. `<p>Your new sentence.</p>`. Keep the tags themselves.
3. If you change a page's main topic, also update its `<title>` (max 60 characters) and `<meta name="description">` (max 160 characters) at the top.
4. Commit to a branch and open a pull request — Vercel posts a preview link so you can check before merging.

**Header and footer:** they are identical on every page. Edit `tools/partials/header.html` or `tools/partials/footer.html`, then run `python3 tools/update_site.py` to copy the change into every page. (If you can't run Python, edit the same block in every `.html` file — it sits between `<!-- @header -->` and `<!-- /@header -->`.)

**Honesty rule:** only publish numbers, clients and results we can prove. See `CHANGES.md`.

**Common edits on the home page (`index.html`):**
- *Typewriter phrases*: the `data-typewriter='[...]'` list on the `typeline` line in the hero (About has its own).
- *Moving lines*: the two `marquee-row` lists below the hero. The top row moves left and the bottom row moves right; keep each list duplicated once (the copy has `aria-hidden="true"`) so the loop is seamless.
- *Core values*: the "Our core values" section. Keep it in step with the values on `about.html`.
- *FAQ*: each question is a `<details class="faq-item">`. If you change a question, update the matching entry in the `FAQPage` JSON-LD at the top of the file.

**3D hero visuals:** inner pages have a 3D visual on the right of the hero (`hero-visual`, `stack3d` layers, the About `id-card` and the Contact `next-card`). Any element with `data-tilt` leans towards the mouse; this is switched off for visitors who prefer reduced motion.

**Colours and fonts:** change the variables at the top of `assets/css/style.css` (for example `--accent`). Everything else follows.

**Contact form:** it sends through EmailJS (service `service_ll6ox79`, template `template_bc0wtu9`). The settings are at the top of section 4 in `assets/js/main.js`. Each message includes these template variables: `from_name`, `from_email`, `subject`, `message` (and the same values as `user_name`, `user_email`, `project_type`, `project_details`, plus `company` and `reply_to`).

## How to add a blog post

You need Python 3 (already installed on macOS and Linux; on Windows install it from python.org).

1. **Copy the template.** Duplicate `blog/_template.html` and rename it to the web address you want, using lowercase words and hyphens, e.g. `blog/ai-for-pharmacies.html` → `https://pivisen.com/blog/ai-for-pharmacies`.
2. **Fill in the POST DETAILS block** at the top of the file:

   ```json
   {
     "title": "How AI helps pharmacies protect stock",
     "seoTitle": "AI for Pharmacies | PiVisen AI",
     "summary": "One or two sentences, under 160 characters.",
     "date": "2026-11-02T09:00:00+05:00",
     "author": "PiVisen AI Team",
     "category": "Security",
     "readingTime": 4,
     "cover": "/assets/images/blog/cover-ai-camera-alerts.webp",
     "coverAlt": "What the cover image shows"
   }
   ```

   * `category` must be one of: `AI`, `Computer Vision`, `Edge AI`, `Security`, `Software`, `Company News`.
   * `author` can be `PiVisen AI Team`, `Huzaifa Asad`, `M Tauqeer Zafar` or `Manaheel Hashim` (the author box updates automatically).
   * **Delete the line `"draft": true`** when the post is ready to publish. Drafts are hidden from the blog, feed and sitemap.
   * Optional: `"featured": true` shows the post at the top of the blog page; `"updated"` (a date) marks a later edit; `"ctaTitle"` / `"ctaText"` change the box at the end.
3. **Write the article** between `<!-- @body ... -->` and `<!-- /@body -->`. Use `<h2>` for section headings (they become the "On this page" list), `<p>` for paragraphs, `<ul><li>` for lists. `<p class="callout">` makes a highlighted box.
4. **Cover image (optional):** add two WebP files to `assets/images/blog/`: `name.webp` (1200×675) and `name-640.webp` (640×360). No stock photos of real people.
5. **Run the helper** from the repository folder:

   ```bash
   python3 tools/update_site.py
   ```

   It builds the full page (SEO tags, structured data, share buttons, related posts, previous/next) and updates `blog.html`, the home page's latest articles, `feed.xml` and `sitemap.xml`. It tells you if a field is missing or a title/summary is too long.
6. **Commit and open a pull request.** Check the Vercel preview, then merge.

## Run it locally

Any static server works, e.g. `npx serve .` then open <http://localhost:3000>. Note: clean URLs such as `/about` need a server that maps them to `about.html` (`npx serve` does this).
