/* =====================================================================
   PiVisen AI — site script (loaded with `defer` on every page)
   1. Header & mobile menu   4. Contact form (EmailJS)
   2. Scroll reveal          5. Blog index: search & categories
   3. Footer year            6. Blog post: contents, share links
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. HEADER & MOBILE MENU ------------------------------------------- */
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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

  /* 4. CONTACT FORM (EmailJS) -----------------------------------------
     Same EmailJS account as before: service, template and public key are
     unchanged. We call the EmailJS REST endpoint directly, so no extra
     script has to load. Both the old home-page and old contact-page field
     names are sent, so the existing email template keeps working. */
  var EMAILJS = {
    serviceId: "service_ll6ox79",
    templateId: "template_bc0wtu9",
    publicKey: "jKQm7Yy0mXBAAy3sG",
    endpoint: "https://api.emailjs.com/api/v1.0/email/send"
  };

  var form = document.getElementById("contact-form");
  if (form) {
    var statusBox = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');

    // Pre-select a topic from links such as /contact?topic=pilens#contact-form
    var params = new URLSearchParams(window.location.search);
    var topic = params.get("topic");
    if (topic && form.topic) {
      var match = Array.prototype.find.call(form.topic.options, function (o) { return o.dataset.key === topic; });
      if (match) form.topic.value = match.value;
    }

    var rules = {
      name: function (v) { return v.trim().length >= 2 || "Please enter your name."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address."; },
      topic: function (v) { return v !== "" || "Please choose what you need help with."; },
      message: function (v) { return v.trim().length >= 20 || "Please tell us a little more (at least 20 characters)."; }
    };

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
      if (form.elements.website && form.elements.website.value) return; // spam trap

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        company: form.elements.company ? form.elements.company.value.trim() : "",
        topic: form.elements.topic.value,
        message: form.elements.message.value.trim()
      };
      var fullMessage = data.message + (data.company ? "\n\nCompany: " + data.company : "");
      var templateParams = {
        // field names used by the old home-page form
        from_name: data.name,
        from_email: data.email,
        subject: "Website enquiry: " + data.topic,
        message: fullMessage,
        // field names used by the old contact-page form
        user_name: data.name,
        user_email: data.email,
        project_type: data.topic,
        project_details: fullMessage,
        // extras
        reply_to: data.email,
        company: data.company,
        page: window.location.href
      };

      submitBtn.disabled = true;
      submitBtn.dataset.label = submitBtn.dataset.label || submitBtn.textContent;
      submitBtn.textContent = "Sending…";
      statusBox.className = "form-status";

      fetch(EMAILJS.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS.serviceId,
          template_id: EMAILJS.templateId,
          user_id: EMAILJS.publicKey,
          template_params: templateParams
        })
      })
        .then(function (res) {
          if (!res.ok) return res.text().then(function (t) { throw new Error(res.status + " " + t); });
          form.reset();
          showStatus("success", "Thank you, " + data.name + ". Your message has been sent. We will reply to " + data.email + ".");
        })
        .catch(function (err) {
          if (window.console) console.warn("Contact form could not be sent:", err);
          showStatus("error", "Sorry, your message could not be sent. Please email us at info@pivisen.com or call +92 302 0022779.");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.label;
        });
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
})();
