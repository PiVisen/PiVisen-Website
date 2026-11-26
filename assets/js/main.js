/* =====================================================================
   PiVisen AI — site script (loaded with `defer` on every page)
   ---------------------------------------------------------------------
   1. Header, mobile menu & back-to-top   6. Blog post: contents, share
   2. Scroll reveal                       7. Card spotlight
   3. Footer year                         8. Typewriter
   4. Contact form (EmailJS)              9. 3D tilt for hero visuals
   5. Blog index: search & categories
   The home page animation lives in hero-vision.js.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. HEADER, MOBILE MENU & BACK-TO-TOP ----------------------------- */
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  // Back-to-top button: shows after 300px and fills its ring as you scroll
  var topBtn = document.querySelector("[data-scroll-top]");
  var ring = topBtn && topBtn.querySelector(".ring-progress");
  var pctLabel = topBtn && topBtn.querySelector(".scroll-pct");
  if (topBtn) {
    topBtn.addEventListener("click", function () {
      topBtn.classList.remove("is-clicked");
      void topBtn.offsetWidth; // restart the highlight pulse
      topBtn.classList.add("is-clicked");
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    topBtn.addEventListener("animationend", function () { topBtn.classList.remove("is-clicked"); });
  }
  var ticking = false;
  function updateTopBtn() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    topBtn.classList.toggle("show", window.scrollY > 300);
    if (ring) ring.style.strokeDashoffset = String(100 - progress * 100);
    if (pctLabel) pctLabel.textContent = Math.round(progress * 100) + "%";
  }

  window.addEventListener("scroll", function () {
    onScroll();
    if (topBtn && !ticking) { ticking = true; requestAnimationFrame(updateTopBtn); }
  }, { passive: true });
  onScroll();
  if (topBtn) updateTopBtn();

  function setMenu(open) {
    document.documentElement.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setMenu(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) setMenu(false);
    });
  }

  /* 2. SCROLL REVEAL -------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* 3. FOOTER YEAR ---------------------------------------------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* 4. FORMS: CONTACT AND PILENS DEMO ----------------------------------
     Both forms send to the PiVisen API (api.pivisen.com), which saves the
     message, emails the team and thanks the visitor. Cloudflare Turnstile
     (the widget in each form) proves a person sent it. If the API can't be
     reached in time (network trouble, a server problem), the form falls back
     to EmailJS, as before, so a message is never lost. EmailJS gets each
     field as its own template variable: {{name}}, {{email}}, {{company}},
     {{subject}}, {{message}}. */
  var API_BASE = "https://api.pivisen.com";
  var API_TIMEOUT_MS = 10000;
  var EMAILJS = {
    serviceId: "service_ll6ox79",
    templateId: "template_bc0wtu9",
    publicKey: "jKQm7Yy0mXBAAy3sG",
    endpoint: "https://api.emailjs.com/api/v1.0/email/send"
  };

  // Resolves to { saved: true } once the API has the message, { problem: "..." }
  // when the API refused it (to show to the visitor), or { fallback: true } when
  // the API couldn't be reached and EmailJS should try.
  function sendToApi(path, payload) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, API_TIMEOUT_MS) : null;
    return fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (res.ok) return { saved: true };
        if (res.status >= 500) return { fallback: true };
        return res.json().then(
          function (body) {
            var error = body && body.error;
            if (res.status === 422) return { problem: "Please check the fields and try again." };
            return { problem: (error && error.message) || "Sorry, your message could not be sent." };
          },
          function () { return { problem: "Sorry, your message could not be sent." }; }
        );
      })
      .catch(function () { return { fallback: true }; })
      .finally(function () { if (timer) window.clearTimeout(timer); });
  }

  function sendToEmailJs(templateParams) {
    return fetch(EMAILJS.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: templateParams
      })
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (t) { throw new Error(res.status + " " + t); });
    });
  }

  // Wires up one form: field checks as the visitor types, then the API, then
  // EmailJS if the API can't be reached. `options` says what is checked, what
  // the API and EmailJS get, and what to say once it is sent.
  function setUpForm(form, options) {
    var statusBox = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var widget = form.querySelector(".cf-turnstile");
    var rules = options.rules;

    function validateField(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var result = rule(field.value);
      var error = document.getElementById(field.id + "-error");
      if (result === true) {
        field.removeAttribute("aria-invalid");
        return true;
      }
      field.setAttribute("aria-invalid", "true");
      if (error) error.textContent = result;
      return false;
    }

    form.addEventListener("blur", function (e) {
      if (rules[e.target.name] && e.target.value) validateField(e.target);
    }, true);
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true") validateField(e.target);
    });

    function showStatus(type, text) {
      statusBox.className = "form-status is-" + type;
      statusBox.textContent = text;
    }

    function resetCheck() {
      // A Turnstile token works once: get a fresh one for the next try.
      if (window.turnstile && widget) window.turnstile.reset(widget);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        var field = form.elements[name];
        if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showStatus("error", "Please fix the highlighted fields.");
        return;
      }

      var tokenField = form.elements["cf-turnstile-response"];
      var payload = options.toApi(form);
      payload.website = form.elements.website ? form.elements.website.value : "";
      payload.turnstile_token = tokenField ? tokenField.value : "";

      submitBtn.disabled = true;
      submitBtn.dataset.label = submitBtn.dataset.label || submitBtn.textContent;
      submitBtn.textContent = "Sending…";
      statusBox.className = "form-status";

      sendToApi(options.path, payload)
        .then(function (answer) {
          if (answer.saved) return true;
          if (answer.problem) {
            showStatus("error", answer.problem);
            return false;
          }
          if (payload.website) return true; // a bot: nothing to fall back to
          return sendToEmailJs(options.toEmailJs(form)).then(function () { return true; });
        })
        .then(function (sent) {
          if (!sent) return;
          var done = options.done(payload);
          form.reset();
          showStatus("success", done);
        })
        .catch(function (err) {
          if (window.console) console.warn("The form could not be sent:", err);
          showStatus("error", "Sorry, your message could not be sent. Please email us at info@pivisen.com.");
        })
        .finally(function () {
          resetCheck();
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.label;
        });
    });
  }

  function value(form, name) {
    return form.elements[name] ? form.elements[name].value.trim() : "";
  }
  var nameRule = function (v) { return v.trim().length >= 2 || "Please enter your name."; };
  var emailRule = function (v) { return /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/.test(v.trim()) || "Please enter a valid email address."; };

  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    // Pre-select a subject from links such as /contact?topic=pilens#contact-form
    var topic = new URLSearchParams(window.location.search).get("topic");
    var subjectField = contactForm.elements.subject;
    if (topic && subjectField) {
      var match = Array.prototype.find.call(subjectField.options, function (o) { return o.dataset.key === topic; });
      if (match) subjectField.value = match.value;
    }
    setUpForm(contactForm, {
      path: "/api/contact",
      rules: {
        name: nameRule,
        email: emailRule,
        subject: function (v) { return v !== "" || "Please choose what you need help with."; },
        message: function (v) { return v.trim().length >= 20 || "Please tell us a little more (at least 20 characters)."; }
      },
      toApi: function (form) {
        return {
          name: value(form, "name"),
          email: value(form, "email"),
          company: value(form, "company"),
          subject: form.elements.subject.value,
          message: value(form, "message")
        };
      },
      toEmailJs: function (form) {
        return {
          name: value(form, "name"),
          email: value(form, "email"),
          company: value(form, "company"),
          subject: form.elements.subject.value,
          message: value(form, "message")
        };
      },
      done: function (sent) {
        return "Thank you, " + sent.name + ". Your message has been sent. We will reply to " + sent.email + ".";
      }
    });
  }

  var demoForm = document.getElementById("demo-form");
  if (demoForm) {
    setUpForm(demoForm, {
      path: "/api/pilens/request",
      rules: {
        name: nameRule,
        email: emailRule,
        phone: function (v) { return v.trim() === "" || /^\+?[0-9][0-9 ()-]{5,28}[0-9]$/.test(v.trim()) || "Please enter a phone number like +92 300 1234567."; },
        site_type: function (v) { return v !== "" || "Please choose the kind of place."; },
        cameras: function (v) { return v === "" || (/^[0-9]+$/.test(v) && +v >= 1 && +v <= 1000) || "Please enter a number from 1 to 1000."; }
      },
      toApi: function (form) {
        var cameras = value(form, "cameras");
        return {
          name: value(form, "name"),
          email: value(form, "email"),
          phone: value(form, "phone"),
          organisation: value(form, "organisation"),
          site_type: form.elements.site_type.value,
          cameras: cameras ? parseInt(cameras, 10) : null,
          message: value(form, "message")
        };
      },
      toEmailJs: function (form) {
        var site = form.elements.site_type;
        return {
          name: value(form, "name"),
          email: value(form, "email"),
          company: value(form, "organisation"),
          subject: "PiLENS demo request",
          message: [
            "Phone: " + (value(form, "phone") || "-"),
            "Type of site: " + site.options[site.selectedIndex].text,
            "Cameras: " + (value(form, "cameras") || "-"),
            "",
            value(form, "message") || "(no message)"
          ].join("\n")
        };
      },
      done: function (sent) {
        return "Thank you, " + sent.name + ". We have your demo request and will contact you at " + sent.email + " to arrange it.";
      }
    });
  }

  /* 5. BLOG INDEX: SEARCH & CATEGORIES -------------------------------- */
  var blogList = document.querySelector("[data-post-list]");
  if (blogList) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-post]"));
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-category]"));
    var search = document.getElementById("blog-search");
    var countEl = document.querySelector("[data-result-count]");
    var emptyEl = document.querySelector("[data-empty]");
    var state = { category: "All", query: "" };

    var qs = new URLSearchParams(window.location.search);
    if (qs.get("category")) state.category = qs.get("category");
    if (qs.get("q")) { state.query = qs.get("q"); search.value = state.query; }

    chips.forEach(function (chip) {
      var cat = chip.dataset.category;
      var n = cat === "All" ? cards.length : cards.filter(function (c) { return c.dataset.categoryName === cat; }).length;
      var count = chip.querySelector(".count");
      if (count) count.textContent = "(" + n + ")";
      chip.addEventListener("click", function () {
        state.category = cat;
        apply(true);
      });
    });
    search.addEventListener("input", function () {
      state.query = search.value;
      apply(true);
    });

    function apply(updateUrl) {
      var q = state.query.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var okCat = state.category === "All" || card.dataset.categoryName === state.category;
        var okText = !q || card.dataset.search.indexOf(q) !== -1;
        card.hidden = !(okCat && okText);
        if (!card.hidden) shown++;
      });
      chips.forEach(function (chip) {
        chip.setAttribute("aria-pressed", String(chip.dataset.category === state.category));
      });
      countEl.textContent = shown === 1 ? "Showing 1 article" : "Showing " + shown + " articles";
      emptyEl.hidden = shown !== 0;
      if (updateUrl && window.history.replaceState) {
        var url = new URL(window.location.href);
        if (state.category !== "All") url.searchParams.set("category", state.category); else url.searchParams.delete("category");
        if (q) url.searchParams.set("q", state.query.trim()); else url.searchParams.delete("q");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    }
    apply(false);
  }

  /* 6. BLOG POST: CONTENTS & SHARE ------------------------------------ */
  var toc = document.querySelector("[data-toc]");
  if (toc && "IntersectionObserver" in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            links.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
            var link = byId[entry.target.id];
            if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "true"); }
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    Object.keys(byId).forEach(function (id) {
      var h = document.getElementById(id);
      if (h) spy.observe(h);
    });
  }

  var copyBtn = document.querySelector("[data-copy-link]");
  if (copyBtn) {
    var copyStatus = document.querySelector("[data-share-status]");
    copyBtn.addEventListener("click", function () {
      var url = copyBtn.dataset.url || window.location.href;
      var done = function () { copyStatus.textContent = "Link copied"; setTimeout(function () { copyStatus.textContent = ""; }, 2500); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
      } else {
        window.prompt("Copy this link:", url);
      }
    });
  }

  /* 7. CARD SPOTLIGHT: soft glow follows the cursor on cards --------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* 8. TYPEWRITER: types and erases a list of phrases ---------------- */
  document.querySelectorAll("[data-typewriter]").forEach(function (el) {
    var words;
    try { words = JSON.parse(el.getAttribute("data-typewriter")); } catch (err) { return; }
    if (!words || !words.length || reduceMotion) return; // keep the first phrase as static text
    var w = 0, c = words[0].length, deleting = true;
    function tick() {
      var word = words[w];
      if (deleting) {
        c--;
        el.textContent = word.slice(0, c);
        if (c === 0) { deleting = false; w = (w + 1) % words.length; return setTimeout(tick, 350); }
        return setTimeout(tick, 35);
      }
      c++;
      el.textContent = words[w].slice(0, c);
      if (c === words[w].length) { deleting = true; return setTimeout(tick, 2200); }
      setTimeout(tick, 65);
    }
    setTimeout(tick, 2200);
  });

  /* 9. 3D TILT: hero visuals lean towards the pointer ---------------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (wrap) {
      var inner = wrap.querySelector(".tilt-inner");
      var area = wrap.closest("section") || wrap;
      if (!inner) return;
      var frame = 0;
      area.addEventListener("pointermove", function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          var r = wrap.getBoundingClientRect();
          var x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          var y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          x = Math.max(-1, Math.min(1, x));
          y = Math.max(-1, Math.min(1, y));
          wrap.classList.add("is-tilting");
          inner.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
          inner.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
        });
      });
      area.addEventListener("pointerleave", function () {
        wrap.classList.remove("is-tilting");
        inner.style.setProperty("--ry", "0deg");
        inner.style.setProperty("--rx", "0deg");
      });
    });
  }
})();
