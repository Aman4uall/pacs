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
  // "What do you want to learn?": the same script saves the ticked topics to a
  // second tab of the same sheet. Leave it empty to only hand the list to WhatsApp.
  learnPicks: "https://script.google.com/macros/s/AKfycbw4eXH_1CNAstVAli2ljb_cNBKWXn1S-xfACfnXYOLx0cUgzeZuETjmPFl2xArt3Lk5xA/exec",
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
        const targets = [toggle, ...links.querySelectorAll('a')];
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

  // Home closing: tick a few skills, then "Help me choose" opens WhatsApp with them written in
  document.querySelectorAll("[data-closing-picks]").forEach((form) => {
    const status = form.querySelector(".closing-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const picks = [...form.querySelectorAll('input[name="pick"]:checked')].map((b) => b.value);
      const lines = ["Hi PACS AI, I'd like help choosing where to start with AI."];
      if (picks.length) lines.push("", "I'm interested in:", ...picks.map((p) => "• " + p));
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      if (picks.length && SITE.learnPicks) {
        const ref = "H-" + Date.now().toString(36).slice(-6).toUpperCase();
        const body = JSON.stringify({ kind: "learn", ref: ref, who: "From the homepage", count: picks.length, picks: picks.join(" | "), other: "" });
        try { navigator.sendBeacon(SITE.learnPicks, new Blob([body], { type: "text/plain;charset=UTF-8" })); } catch (err) { /* saving is optional; WhatsApp already opened */ }
      }
      status.textContent = "WhatsApp has opened with your message. Press send there to reach us.";
    });
  });
})();
