# Redesign v2: removed and changed claims

Rule followed in this redesign: **if we can't prove it, it isn't on the site.**
Everything below was removed or reworded. If you can prove a claim (a measurement, a signed client, a delivered project), tell us what the proof is and it can go back, worded to match that proof.

## 1. Numbers and technical claims

| Old text | Where | What happened | Restore if… |
|---|---|---|---|
| `LATENCY: < 2.5ms` | Home hero panel | Removed. The new hero is a labelled illustration with no performance numbers. | You have a measured latency, with device and conditions. |
| `STATUS: SECURE SYNC` (looked like a live readout) | Home hero panel | Removed. | — |
| "Centralized cloud hub processing **millions of daily telemetry** data points" | Home (Cloud AI Analytics Platform project) | Removed with the project card. | A real deployment processes this volume. |
| "**Ultra-Low Latency** Edge AI" | Home hero pill | Removed. | Measured latency. |
| "high accuracy in complex and low-light surveillance conditions" | Home "Why choose" | Removed. Night surveillance is now described only as a capability we build, with no accuracy claim. | Measured night-time results. |
| "ultra-clear night surveillance", "thermal mapping" | Home About | Removed. | Delivered thermal or night system. |
| "LIVE v2.6", "Active Neural Threat Detection System" | About hero card | Removed. | A released product version. |
| "**guarantee** low-latency intelligence" / "**guarantee** reliable round-the-clock security" | About, Services | Removed. No guarantees anywhere. | — |
| "zero downtime", "infinite structural expansion" | Technology | Removed. | — |
| "threat detection units running **24/7**" | Technology | Removed. | A deployed unit running continuously, with logs. |
| "high predictive accuracy", "exceptional reliability", "High-Accuracy AI Systems", "exceptional analytical accuracy", "flawless visual performance" | Services, Technology, About | Removed. | Measured results per project. |
| "Continuous learning loops designed to upgrade predictive precision over time" | Technology | Reworded to "Retraining workflows" (a service we offer, not a result). | — |
| "**Proprietary** infrastructure", "**Proprietary** neural frameworks", "Proprietary Deep Learning Model Architecture" | Technology | Removed. The Technology page now lists the real, public tools named on the old site (PyTorch, TensorFlow, PostgreSQL, Python, Raspberry Pi 5). | You want to describe a specific in-house component. |
| "defense-grade monitoring", "Hardened … high-stakes deployments", "mission-critical", "tactical" | Services, Technology, About | Removed. | — |
| "absolute real-time security", "total security" | Projects, About | Removed. | — |

## 2. Clients, projects and company status

| Old text | Where | What happened | Restore if… |
|---|---|---|---|
| "Featured **Enterprise** Projects": Autonomous Night Surveillance AI, Edge Vision Robotic Controller, Cloud AI Analytics Platform | Home | Removed. No client or result was named. The Products page now shows only PiLENS, using the three facts you supplied. | A project was delivered: add it with client permission and real results. |
| Case studies "Deep Learning Vision", "Automated Security Core", "Cloud-Edge Synchrony" | Projects | Removed. | Same as above. |
| "Why **Enterprises Choose** PiVisen AI?", "modern enterprises", "enterprise clients" | Home, Contact, everywhere | Removed. Copy now speaks to businesses, shops, pharmacies, offices and homes. | You have enterprise customers. |
| "ensuring **our clients** stay ahead" | Projects | Removed. | You have clients who agree to be named. |
| "Established Enterprise" | About | Removed. Kept "Founded 2026" and "Technology company" from the same block. | — |
| "HEADQUARTERS: **Islamabad**, Pakistan" | About, home JSON-LD | Changed to **Bahawalpur, Pakistan**, as you instructed. | If Islamabad is also an office, add it as a second location. |
| "dedicated long-term technical engineering support", "Enterprise-grade deployment standards" | Home, About | Removed. | You offer a support contract. |
| "cutting-edge R&D", "elite" engineering, "state-of-the-art", "next-generation", "pioneering", "leading", "global standard" | Many pages | Removed as unprovable superlatives. | — |
| "Driven by passion … our leadership and **technical experts**" (implied a larger team) | About | Reworded to "Three engineers who design and build PiVisen AI's products themselves." | You hire more people. |

## 3. Images that carried claims (deleted)

These AI-generated images had claims or wrong details printed inside them, so they were not reused:

| Image | Printed claim |
|---|---|
| `cloud-ai&dl_pic.jpg`, `python-backend.jpg`, `service-card-1.jpg` and other infographics | "99.99% Uptime", "Enterprise Grade Security", "SLA Ready", "Global Infrastructure" |
| `cloud-ai.jpg`, `cloud-ai&vision.jpg` | "Cloud AI Analytics Platform" with "10M+" and similar numbers |
| `computer-vision-.jpg` | Fake detection confidence numbers (98.7%, 99.2%) |
| `pivisen-og-image.webp` (kept, **edited**) | The bottom bar showed `www.pivisen.ai` and `hello@pivisen.ai`, which are not your domain or email. That strip was cropped off and the image resized to 1200×630. **Recommended:** create a new OG image with `pivisen.com` / `info@pivisen.com` if you want contact details on it. |

## 4. Links

| Old | What happened | Why |
|---|---|---|
| Footer GitHub link (`github.com/PiVisen`) | Removed from footer and Organization data. | The organisation page leads straight to the research code repository, which the brief says not to link. Personal GitHub links on the team cards are kept as they were. |
| Footer X/Twitter link (`x.com/PiVisen_ai`) | Removed. | The brief lists LinkedIn and Facebook as the company's social links. Add it back to `tools/partials/footer.html` if the account is active. |
| 15 footer links pointing to `#` | Replaced with real links to each service section. | Dead links. |

## 5. Kept on purpose (please confirm)

* **"Founded 2026"**: kept from the old About page.
* **Team titles** exactly as before, including "AI, ML Engineer & Researcher". The brief asks to keep the team "as it is now". If you'd rather avoid the word "Researcher" (an academic term), change it in `about.html`.
* **PiLENS status line**: "PiLENS is in active development. Availability depends on your site." This was added so the page doesn't imply PiLENS can be bought today. It is not a beta or trial offer. Change or remove it in `projects.html`.
* **Process promises** such as "We tell you plainly whether AI is the right tool", "We read every message and reply by email" and "test on footage from your own site". These describe how we intend to work, not past results. Remove any you don't want to commit to.

## 6. New claims added (all from your brief)

Only these numbers appear anywhere on the site, word for word:

1. "Checks each 2.4-second video clip in about 0.14 seconds on a Raspberry Pi 5 CPU."
2. "Ran 2 hours live at 30 frames per second without dropping a frame."
3. "A second AI check cut false alerts on normal test videos from 16.4% to 3.6%."

PiLENS descriptions use only the facts in the brief: real-time theft and violence detection on a Raspberry Pi 5, a second AI check before the owner is alerted, no GPU, and video kept on the premises. The audience is shops, pharmacies, offices and homes.
