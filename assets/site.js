/* =========================================================================
   PACS AI – site settings
   Change these before the site goes live. Every WhatsApp button, phone
   number and address on every page is filled in from here.
   ========================================================================= */
const SITE = {
  // WhatsApp number: country code + number, digits only (e.g. 919876543210)
  whatsapp: "918867240600",
  // Phone number exactly as it should appear on the page
  phone: "+91 88672 40600",
  email: "info@pacsglobal.in",
  instagram: "https://www.instagram.com/pacs.ai/",
  // The full office address, shown in every footer and on the contact page
  address: "PACS Office, 4th Floor, PVS Sadan, Kodialbail, Mangalore, Karnataka 575003",
  // The "Get directions" link: the Google listing for the office
  mapsUrl: "https://share.google/wSD5nGk2nQYzYpPFw",
  // Next Demo Day, e.g. "2027-03-14T10:00:00+05:30". Leave empty to show no countdown.
  demoDay: "",
  // AI Song Challenge: the Google Apps Script web app address that saves entries
  // to your Google Sheet (it ends in /exec). See song-challenge-backend/SETUP.md.
  // While it's empty, entries are handed to WhatsApp instead.
  songEntries: "https://script.google.com/macros/s/AKfycbw4eXH_1CNAstVAli2ljb_cNBKWXn1S-xfACfnXYOLx0cUgzeZuETjmPFl2xArt3Lk5xA/exec",
  // Skill lists (AI for everyone page and the home page's "Help me choose"): a SEPARATE
  // Apps Script web app that copies the WhatsApp message into its own sheet. It ends in /exec.
  // See learn-requests-backend/SETUP.md. While it's empty, lists only go to WhatsApp.
  learnPicks: "https://script.google.com/macros/s/AKfycbxVsHB9aGSVigEMidfZJjCXUIGyZfNLVJUTqsAQkfGGaGLNLrs4aJv4UBJbrv-Eky3xwg/exec",
  // Innovators & Hustlers Meetup: it runs every alternate Saturday, 3 to 5 pm, at the
  // office. Put ANY ONE meetup date below (a Saturday, YYYY-MM-DD) and meetup.html
  // works out every date after it by itself, for good. Nothing needs changing monthly.
  meetupStart: "2026-09-26",
  meetupEveryDays: 14,
  meetupFrom: "15:00",
  meetupTo: "17:00",
  // Registration closes this many hours before a meetup starts. After that the form
  // quietly saves seats for the next one instead, and says so on the page.
  meetupClosesHours: 3,
  // Meetup registrations: a SEPARATE Apps Script web app that saves them to its own
  // sheet (it ends in /exec). See meetup-backend/SETUP.md.
  // While it's empty, registrations are handed to WhatsApp instead.
  meetupRsvps: "https://script.google.com/macros/s/AKfycbwaAVmwiorP8rLMYOIk96gg5mmv2ZTzQKsDTUpYh8HCm_DNrYDpWJQBSJXEKEjEojFXJA/exec",
};

(function () {
  const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

  // Links: WhatsApp (data-wa holds the pre-filled message), phone, maps
  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = waLink(a.dataset.wa || "Hi PACS AI");
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll("[data-phone]").forEach((el) => {
    el.textContent = SITE.phone;
    if (el.tagName === "A") el.href = "tel:" + SITE.phone.replace(/[^\d+]/g, "");
  });
  document.querySelectorAll("[data-address]").forEach((el) => { el.textContent = SITE.address; });
  document.querySelectorAll("[data-email]").forEach((a) => {
    a.href = "mailto:" + SITE.email;
    if (a.hasAttribute("data-email-text")) a.textContent = SITE.email;
  });
  document.querySelectorAll("[data-instagram]").forEach((a) => {
    a.href = SITE.instagram;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll("[data-maps]").forEach((a) => {
    a.href = SITE.mapsUrl;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Mobile menu
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    // Phones: the open menu ends with a WhatsApp button and the Song Challenge (hidden on laptops)
    const extra = document.createElement("li");
    extra.className = "menu-extra";
    extra.innerHTML = `<a class="menu-cta" href="${waLink("Hi PACS AI, I'd like to know more about your courses.")}" target="_blank" rel="noopener">WhatsApp us</a>`
      + `<a class="menu-song" href="song-challenge.html"><b>1 in 10 wins ₹500</b><span>AI Song Challenge · Class 8–12</span></a>`;
    links.append(extra);
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      links.classList.toggle("open", open);
      // The menu covers the screen, so the page behind it stays still
      document.documentElement.classList.toggle("menu-open", open);
      document.querySelectorAll('main, footer, .mobile-plan-bar, .course-action-bar').forEach(el => { el.inert = open; });
      if (open) toggle.closest(".site-header")?.classList.remove("is-hidden");
      if (open) links.querySelector('a')?.focus();
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setOpen(false); toggle.focus(); }
      if (e.key === 'Tab') {
        const targets = [toggle, ...links.querySelectorAll('a')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        const index = targets.indexOf(document.activeElement);
        e.preventDefault();
        targets[(index + (e.shiftKey ? -1 : 1) + targets.length) % targets.length].focus();
      }
    });
    matchMedia('(max-width: 880px)').addEventListener('change', () => setOpen(false));
  }

  // Swipe rows: on phones some grids become rows you swipe through (see .swipe in
  // styles.css). Mark the card in focus and show where you are in the row.
  document.querySelectorAll("[data-swipe]").forEach((row) => {
    const items = [...row.children];
    const ui = document.createElement("div");
    ui.className = "swipe-ui";
    ui.setAttribute("aria-hidden", "true");
    ui.innerHTML = '<span class="swipe-label"></span><span class="swipe-bar"><i></i></span><span class="swipe-count"></span>';
    row.after(ui);
    const label = items.some((el) => el.dataset.label) ? ui.querySelector(".swipe-label") : null;
    if (!label) ui.querySelector(".swipe-label").remove();
    const bar = ui.querySelector(".swipe-bar i");
    const count = ui.querySelector(".swipe-count");
    let active = -1;
    let started = false;

    function update() {
      if (row.scrollWidth <= row.clientWidth + 1) {
        // Laid out as a normal grid at this size
        row.classList.remove("is-ready");
        active = -1;
        return;
      }
      row.classList.add("is-ready");
      const box = row.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      let best = 0;
      let bestGap = Infinity;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const gap = Math.abs(r.left + r.width / 2 - middle);
        if (gap < bestGap) { bestGap = gap; best = i; }
      });
      if (best === active) return;
      active = best;
      items.forEach((el, i) => el.classList.toggle("is-active", i === best));
      if (label) label.textContent = items[best].dataset.label || "";
      bar.style.setProperty("--p", (best + 1) / items.length);
      count.textContent = `${best + 1} / ${items.length}`;
      // Let the animations know a new card came into focus (not on first load)
      if (started) items[best].dispatchEvent(new CustomEvent("swipe:active", { bubbles: true }));
      started = true;
    }
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  // Contact form: builds a WhatsApp message; nothing is stored or sent by the site
  const form = document.getElementById("enquiry");
  if (form) {
    const who = form.elements.namedItem("who");
    const status = document.getElementById("enquiry-status");
    const preset = new URLSearchParams(location.search).get("for");
    if (preset && [...who.options].some((o) => o.value === preset)) who.value = preset;
    const project = new URLSearchParams(location.search).get("project");
    const projectNames = {"stocks":"Learn to earn with stocks","product-ads":"Product ads","ai-presenter":"AI presenter","client-websites":"Client websites","sales-assistants":"Sales assistants","reports-on-autopilot":"Reports on autopilot","interactive-lessons":"Interactive lessons"};
    if (Object.hasOwn(projectNames, project)) form.elements.namedItem("message").value = `I'm interested in the "${projectNames[project]}" learning plan. Please share dates, fees and any extra tool costs.`;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const value = (name) => form.elements.namedItem(name).value.trim();
      const lines = [
        `Hi PACS AI, my name is ${value("fullname")}.`,
        `I am: ${who.options[who.selectedIndex].text}.`,
        value("place") && `School / college / workplace: ${value("place")}`,
        value("message"),
      ].filter(Boolean);
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      status.textContent = "WhatsApp has opened with your message. Press send there to reach us.";
    });
  }

})();

/* Save the site on the visitor's phone so repeat visits open at once, slow
   connections fall back to the saved copy, and pages still open offline.
   Once the page is idle, the rest of the site downloads in the background
   (skipped on data saver and 2G). See sw.js. */
const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
// On a local preview the saved copy hides the edit you just made, so it stays off
// unless you ask for it with ?sw=1. Any worker left over from an earlier visit is
// removed and its saved pages deleted, so localhost always serves what is on disk.
if (isLocal && !new URLSearchParams(location.search).has("sw") && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (!regs.length) return;
    Promise.all(regs.map((r) => r.unregister()))
      .then(() => caches.keys())
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => location.reload());
  }).catch(() => { /* Nothing saved to clear. */ });
} else if ("serviceWorker" in navigator && (location.protocol === "https:" || isLocal)) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then((reg) => {
      const net = navigator.connection || {};
      if (net.saveData || /2g/.test(net.effectiveType || "")) return;
      const warm = () => reg.active && reg.active.postMessage("warm");
      "requestIdleCallback" in window ? requestIdleCallback(warm, { timeout: 8000 }) : setTimeout(warm, 4000);
    }).catch(() => { /* The site works the same without it. */ });
  });
}

/* Jump links (#register, "The courses ↓" and so on). Sections far down are drawn only when
   they come near (see content-visibility in motion.css), so the first jump can land a little
   off. Once the scroll ends, settle on the target, unless the visitor has scrolled themselves. */
window.settleOn = function (target) {
  let moved = false, tries = 0;
  const mark = () => { moved = true; };
  addEventListener("wheel", mark, { once: true, passive: true });
  addEventListener("touchstart", mark, { once: true, passive: true });
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const check = () => {
    if (moved || tries++ > 3) return;
    const off = target.getBoundingClientRect().top - pad;
    if (Math.abs(off) > 8) target.scrollIntoView({ block: "start", behavior: tries > 1 ? "instant" : "smooth" });
    setTimeout(check, 700);
  };
  if ("onscrollend" in window) addEventListener("scrollend", () => setTimeout(check, 60), { once: true });
  setTimeout(check, 1300);
};
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  const id = a && decodeURIComponent(a.getAttribute("href").slice(1));
  const target = id && document.getElementById(id);
  if (target) window.settleOn(target);
});

/* The tap ring (styles in refresh.css): a soft circle spreads from the point where any button,
   tab or question is pressed. One listener for the whole page, nothing measured until a press. */
(function () {
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const HOSTS = '.btn, .px-button, .px-text-button, .menu-cta, .chip, button, [role="tab"], summary';
  document.addEventListener("pointerdown", (e) => {
    if (calm.matches || e.button > 0) return;
    const host = e.target.closest && e.target.closest(HOSTS);
    if (!host || host.disabled || host.closest(".sc-flip, .app-options, [data-no-ring]")) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const r = host.getBoundingClientRect();
    const clip = document.createElement("span");
    clip.className = "tap-clip";
    clip.setAttribute("aria-hidden", "true");
    const ring = document.createElement("span");
    ring.className = "click-ring";
    ring.style.left = `${e.clientX - r.left}px`;
    ring.style.top = `${e.clientY - r.top}px`;
    clip.append(ring);
    host.append(clip);
    setTimeout(() => clip.remove(), 700);
  }, { passive: true });
})();

/* Lightweight mode for slow phones (see the end of motion.css): on phones that say they are
   small (2 GB of memory or less, 2 cores, data saver), or that turn out slow once the page has loaded,
   decorative loops pause and blurred bars go solid. */
(function () {
  const root = document.documentElement, n = navigator;
  const lite = () => root.classList.add("lite");
  if ((n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2) || (n.connection && n.connection.saveData)) return lite();
  // Otherwise time 45 frames soon after load; a slow median frame means a slow phone
  addEventListener("load", () => setTimeout(() => {
    if (document.hidden) return;
    const gaps = []; let last = 0;
    const tick = (t) => {
      if (last) gaps.push(t - last);
      last = t;
      if (gaps.length < 45) return requestAnimationFrame(tick);
      gaps.sort((a, b) => a - b);
      if (gaps[22] > 24) lite();
    };
    requestAnimationFrame(tick);
  }, 1200), { once: true });
})();

/* The pinned Song Challenge strip: tell the page how tall it is (see the end of motion.css).
   ResizeObserver reports after layout, so nothing is measured before the first paint. */
(function () {
  const strip = document.querySelector("body > .topbar");
  if (!strip || !("ResizeObserver" in window)) return;
  new ResizeObserver(([e]) => {
    const h = e.borderBoxSize && e.borderBoxSize[0] ? e.borderBoxSize[0].blockSize : strip.offsetHeight;
    document.documentElement.style.setProperty("--topbar-h", `${Math.round(h)}px`);
  }).observe(strip, { box: "border-box" }); // the outer box, padding included
  // Slim down once the visitor scrolls, full size again near the top (two thresholds, so it never flickers)
  let compact = false, queued = false;
  const check = () => {
    queued = false;
    const next = compact ? scrollY > 20 : scrollY > 80;
    if (next !== compact) { compact = next; strip.classList.toggle("is-compact", next); }
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(check); } }, { passive: true });
  requestAnimationFrame(check);
})();
