# PiVisen AI website audit (before redesign v2)

Audited on 25 October 2026 from branch `main` (commit `8fe5086`).
Method: read every HTML page, `assets/css/style.css` and `assets/js/main.js`, then loaded each page with Playwright at 390 px and 1440 px wide behind a local server that copies Vercel's `cleanUrls`. The script logged console errors, failed requests, page weight, headings and links.

Pages: `index.html`, `about.html`, `services.html`, `technologies.html`, `projects.html`, `contact.html`.

---

## 1. Critical bugs

| # | Problem | Where | Impact |
|---|---------|-------|--------|
| 1 | `emailjs.init()` runs on every page, but `projects.html` and `technologies.html` never load the EmailJS SDK. `main.js` throws `ReferenceError: emailjs is not defined`. Everything after that line (typewriters, carousel, services animation) never runs. | `main.js` line 224 | Broken JS on 2 pages. If the jsDelivr CDN is slow or blocked, the same crash happens on all pages. |
| 2 | Two contact forms with **different field names**. Home uses `from_name / from_email / subject / message`, Contact uses `user_name / user_email / project_type / project_details`. One EmailJS template can only match one set, so one of the two forms most likely sends empty emails. | `index.html`, `contact.html` | Lost leads. |
| 3 | The contact page form has no validation on project details. The "Select Service" option can be submitted as a value. Success and failure use blocking `alert()` pop-ups. | `contact.html`, `main.js` | Poor UX, junk leads. |
| 4 | The Services `<h1>` is empty in the HTML and typed in by JavaScript. Search engines and screen readers may see an empty H1. | `services.html` | SEO and accessibility. |
| 5 | In-page nav links (`#about`, `#services`) only work on the home page. On other pages the logo links to `#home`, which does not exist there. | `services.html`, `projects.html`, `technologies.html` | Broken logo link. |
| 6 | Every CTA band links to `#contact`, which only exists on the home page. On About, Services, Technology, Projects and Contact the main CTA button does nothing. | All inner pages | The most important button is broken on 5 of 6 pages. |
| 7 | 15 footer links point to `href="#"` ("Cloud AI", "Edge AI & Vision", and others). | Footer, all pages | Dead links. |
| 8 | No custom 404 page. Unknown URLs show Vercel's default page. | — | Lost visitors. |

## 2. Performance (Core Web Vitals)

* **Page weight:** home 10 MB (mobile) / 21 MB (desktop). Services 30 MB. About 10 MB. Source images are 1.5–2.4 MB JPEGs at 1254–1746 px, shown at 300–600 px.
* `pivisen-og-image.webp` is 1.9 MB. Social networks expect about 1200×630 and under 300 KB.
* `logo.png` (972 KB) and `favicon.png` (908 KB) are 1254 px squares, shown at 50 px and 16 px.
* Most `<img>` tags have no `width`/`height` (10 on home, 9 on About), which causes layout shift (CLS).
* The home hero image (2.4 MB) is the LCP element. It is not preloaded and has no size attributes.
* Font Awesome (about 100 KB CSS plus fonts) loads render-blocking from a CDN, for about 20 icons. Two different versions are used (6.7.2 on home, 6.5.2 elsewhere).
* The EmailJS SDK loads without `defer` on pages with no form.
* `style.css` is 87 KB and 4,150 lines, with three separate `:root` blocks that redefine the same variables, repeated `@media` blocks, and many selectors for markup that no longer exists.
* The typewriter effects keep re-writing the DOM and delay the real H1 text.
* `vercel.json` sets no cache headers for static assets.
* Unused images in `assets/images`: `cloud-ai.jpg`, `cloud-ai&vision.jpg` (shown only on About), `edge-vision&robotics.jpg` (home only), and others. Several are near-duplicates (`cloud-ai.jpg` and `cloud-ai&vision.jpg` are the same file).

## 3. SEO

* **Titles:** the brief says `contact.html`, `index.html` and `services.html` have an empty `<title>`. In the source they are not empty, but they wrap over several lines with leading and trailing whitespace and newlines. Some crawlers and tools then report them as empty or malformed. Titles are also over 60 characters on Home (67) and Contact (66), and Projects says "PiVisen AI & Python Solutions".
* **Meta descriptions:** home description is 176 characters (over 160).
* **Canonical:** only on the home page, and it points to `https://www.pivisen.com/`. The live site is `https://pivisen.com`.
* **Open Graph / Twitter:** only on home. Other pages have partial OG tags with no image or URL.
* **Structured data:** one `Organization` block on home only. It has address **Islamabad** (the company is in Bahawalpur), an empty `sameAs`, and URL `www`. No `WebSite`, `BreadcrumbList` or `Service` data.
* **Sitemap:** lists only the home page, with a `www` URL.
* **robots.txt:** points to the `www` sitemap and disallows folders that do not exist.
* **site.webmanifest:** name is "PiVisen", description talks about "Python … Software", the background is white on a dark site, and a 1254 px PNG is declared as 512×512.
* **Heading order:** H1 is "Next-Gen" plus JS-typed words. Footer uses H3/H4 for link lists. Section order jumps around (H2 → H3 → H2 inside cards). About's H1 reads "Engineering Architectures" before JS runs.
* **Keywords meta** (ignored by Google) and a duplicate "Projects" vs "Products" story.
* Internal links use `.html` (`about.html`). Vercel `cleanUrls` then redirects each click (an extra hop).

## 4. Accessibility

* The mobile menu button is a Font Awesome "⋮" icon. Its `aria-label` never changes. There is no Escape-to-close, no focus handling, and the menu does not close after a link is clicked.
* Team social links are **icon-only with no accessible name** (9 links on About).
* Team photos have alt text "Team Member 1/2/3" instead of names.
* Several images have alt text that does not describe them ("Edge AI Neural Brain Intelligence" for a photo of cameras).
* Emoji used as icons (⚡ 👁️ 🌙 🛡️) are read aloud by screen readers.
* Typewriter text changes constantly and is read again and again by assistive tech. It ignores `prefers-reduced-motion`. The float, pulse and scan animations also ignore it.
* No visible focus style on most links and buttons (only the browser default, which is often hidden on dark backgrounds).
* The About trust carousel moves by `scrollTo` but arrows have no state, and cards can be hidden from keyboard users.
* No "skip to content" link.
* Forms: no inline error messages, no `autocomplete` attributes, `alert()` for status.

## 5. Design and layout

* Inconsistent headers: every page has a different nav list (each omits itself), and the home page uses `#anchors` while others use `.html`.
* No sticky "Start a project" CTA in the header.
* The same giant CTA band ("Transform Your Ideas Into Intelligent Edge & Cloud Solutions With PiVisen AI"), with badges, feature tiles and trust ticks, is repeated **word for word on all 6 pages**.
* Home (mobile): the hero runs to about 1.5 screens before any content. The hero image is shown again below the CTA. The About section repeats "About PiVisen AI" as an eyebrow and in the H2.
* Home (desktop): the "Get a Consultation" button is centred under left-aligned text. The About image is a poster with its own small text, unreadable at that size.
* Services: the page shows the same six services **twice** ("Advanced Technology Services", then again as "Intelligent Technology Solutions"), with different names each time ("Deep Learning Models" vs "Deep Neural Systems").
* Projects and Technology pages are walls of near-identical cards with icons and vague text. They have no images, no proof and no single purpose.
* Many images are AI-generated infographics with **their own printed claims** ("99.99% Uptime", "10M+ data points", "98.7%" detection confidence, `hello@pivisen.ai`, `www.pivisen.ai`). These cannot be used honestly.
* Two greens (`#10b981` and `#00d284`) and a blue (`#00a8ff`) are used as competing accents. The font is system "Segoe UI".

## 6. Repeated or vague text

* "Cloud AI, Edge AI, Computer Vision, Night Surveillance, Machine Learning, Deep Learning" is listed in nearly every paragraph on every page (more than 40 times).
* Buzzwords with no meaning for a customer: "operational dominance", "volatile operational theaters", "mission-critical tactical", "elite", "pioneering paradigms", "infinite structural expansion", "bypass hardware limitations", "redefine industrial autonomy".
* About page: "Who We Are" has two paragraphs that say the same thing. Mission and Vision repeat it again.
* Services: each service has a 70-word paragraph that is typed out letter by letter. Readers cannot skim it.
* Technology page: "Proprietary infrastructure" and "proprietary neural frameworks". Nothing proprietary is described.

## 7. Claims we cannot prove (all removed in v2; see CHANGES.md)

| Claim | Page(s) |
|-------|---------|
| `LATENCY: < 2.5ms` | Home hero |
| `STATUS: SECURE SYNC` (presented as a live system readout) | Home hero |
| "Centralized cloud hub processing **millions of daily telemetry** data points" | Home, projects |
| "Featured **Enterprise** Projects", "flagship implementations" (Autonomous Night Surveillance AI, Edge Vision Robotic Controller, Cloud AI Analytics Platform) | Home |
| "Why **Enterprises Choose** PiVisen AI?" | Home |
| "**Ultra-Low Latency** Edge AI", "Active Night Surveillance" | Home pills |
| "Specialized optic algorithms delivering **high accuracy** in complex and low-light surveillance conditions" | Home |
| "**ultra-clear** night surveillance", "thermal mapping" | Home |
| "Rigorous testing … dedicated **long-term** technical engineering support" | Home |
| "**Established Enterprise**" | About |
| "HEADQUARTERS: **Islamabad**" (company is in Bahawalpur) | About, JSON-LD |
| "Active Neural Threat Detection System — **LIVE v2.6**" | About |
| "**guarantee** low-latency intelligence" | About |
| "**total** security", "**flawless** visual performance", "Enterprise-grade deployment standards" | About |
| "high-precision **tactical** night surveillance", "**mission-critical**" | About, Services, Technology |
| "**elite** cloud and edge engineering", "cutting-edge **R&D**" | About |
| "**effortlessly** scale … across **vast enterprise deployments**" | About |
| "**guarantee** reliable round-the-clock security" | Services |
| "**high predictive accuracy**", "**exceptional reliability**", "High-Accuracy AI Systems" | Services |
| "achieve **absolute** real-time security" | Projects |
| "ensuring **our clients** stay ahead" | Projects |
| Case studies "Deep Learning Vision", "Automated Security Core", "Cloud-Edge Synchrony" (no client, no result) | Projects |
| "**Proprietary** infrastructure", "**Proprietary** neural frameworks" | Technology |
| "**zero downtime**, and **infinite** structural expansion" | Technology |
| "**defense-grade** monitoring", "Hardened … high-stakes deployments" | Technology |
| "threat detection units running **24/7**" | Technology |
| "**Deep Learning Leadership** … exceptional analytical accuracy" | Technology |
| "**Continuous learning loops** designed to upgrade predictive precision" | Technology |
| "state-of-the-art", "next-generation" (unprovable superlatives) | Many |
| Images with printed claims: "99.99% Uptime", "10M+", "98.7%"/"99.2%" confidence, `hello@pivisen.ai` | Services, Home, About, OG image |

## 8. What works and is kept

* Name, logo, favicon, tagline "Edge Vision • Unified Intelligence".
* The six services, the three founders with photos and profile links.
* Contact details: info@pivisen.com, +92 302 0022779, LinkedIn, Facebook.
* EmailJS service `service_ll6ox79`, template `template_bc0wtu9`, public key `jKQm7Yy0mXBAAy3sG`.
* `vercel.json` `cleanUrls`, the Google site-verification meta tag.
* The dark, technical look.
