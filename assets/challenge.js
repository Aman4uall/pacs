/* =========================================================================
   PACS AI – AI Song Challenge
   The idea machine and the entry form (the playable card is songplayer.js).
   Entries go to a Google Sheet through SITE.songEntries (see site.js and
   song-challenge-backend/SETUP.md). Until that is set, the form hands the
   entry to WhatsApp instead, so nothing is ever lost.
   ========================================================================= */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cfg = typeof SITE !== "undefined" ? SITE : {};
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => [...root.querySelectorAll(sel)];
  // Change this whenever terms.html changes, so the sheet records which version each entry agreed to
  const TERMS_VERSION = "2026-09-23-v2";

  /* ---------- Step 1: the idea machine ---------- */
  const TOPICS = {
    exams: { title: "One More Page", about: "the night before an exam", hook: "One more page, then I'm done" },
    chapter: { title: "Chapter 5", about: "a chapter you just can't stand", hook: "Chapter 5, you won't beat me" },
    monsoon: { title: "Monsoon Mode", about: "Mangalore in the monsoon", hook: "Rain on the roof, chai in my hand" },
    friend: { title: "Same Bench", about: "your best friend", hook: "Same bench since Class 1" },
    cricket: { title: "Last Ball Six", about: "Sunday cricket with your friends", hook: "Six on the last ball" },
    future: { title: "Build Tomorrow", about: "the job you dream of", hook: "Watch me build tomorrow" },
  };
  const MOODS = {
    hype: "energetic, upbeat",
    chill: "relaxed, warm, mellow",
    funny: "playful, quirky, fun",
    emotional: "heartfelt, emotional, soaring chorus",
  };
  const STYLES = {
    bollywood: "Bollywood pop, dhol and synths",
    rap: "Indian hip-hop, punchy drums, rap vocals",
    lofi: "lo-fi, soft piano, gentle beat",
    rock: "pop rock, electric guitars, big drums",
    acoustic: "indie acoustic, guitar and claps",
    edm: "EDM, bright synths, big drop",
  };

  const machine = document.querySelector("[data-machine]");
  if (machine) {
    const state = { topic: "exams", mood: "hype", style: "bollywood" };
    const out = {
      title: $(machine, '[data-out="title"]'),
      style: $(machine, '[data-out="style"]'),
      lyrics: $(machine, '[data-out="lyrics"]'),
    };
    const lyricsFor = (t) => [
      "[Verse]",
      `✎ Line 1 about ${t.about}: where are you?`,
      "✎ Line 2: what's happening?",
      "✎ Line 3",
      "✎ Line 4",
      "",
      "[Chorus]",
      t.hook,
      "✎ One or two more lines everyone can sing",
      "",
      "[Verse]",
      "✎ Four more lines: what changes by the end?",
      "",
      "[Chorus]",
      t.hook,
      "✎ Repeat your chorus lines",
    ].join("\n");

    function render(flash) {
      const t = TOPICS[state.topic];
      const next = {
        title: t.title,
        style: `${STYLES[state.style]}, ${MOODS[state.mood]}, catchy chorus`,
        lyrics: lyricsFor(t),
      };
      Object.keys(next).forEach((k) => {
        if (out[k].textContent === next[k]) return;
        out[k].textContent = next[k];
        if (flash && !reduce) {
          const box = out[k].closest(".mock-field");
          box.classList.remove("is-new");
          void box.offsetWidth; // restart the flash
          box.classList.add("is-new");
        }
      });
    }
    function pick(group, value) {
      state[group] = value;
      $$(machine, `[data-pick="${group}"] .chip`).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.v === value)));
    }
    $$(machine, "[data-pick]").forEach((row) => {
      row.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        pick(row.dataset.pick, chip.dataset.v);
        render(true);
      });
    });

    // Surprise me: the chips spin like a slot machine, then land on a random mix
    const surprise = $(machine, "[data-surprise]");
    surprise.addEventListener("click", async () => {
      surprise.disabled = true;
      const groups = { topic: Object.keys(TOPICS), mood: Object.keys(MOODS), style: Object.keys(STYLES) };
      const spins = reduce ? 1 : 9;
      for (let i = 0; i < spins; i++) {
        Object.entries(groups).forEach(([g, keys]) => pick(g, keys[Math.floor(Math.random() * keys.length)]));
        if (i < spins - 1) await new Promise((r) => setTimeout(r, 70 + i * 12));
      }
      render(true);
      surprise.disabled = false;
    });

    // Copy buttons, so it's one tap to paste into Suno
    $$(machine, "[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = out[btn.dataset.copy].textContent;
        let ok = false;
        try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
          const area = document.createElement("textarea");
          area.value = text;
          area.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(area);
          area.select();
          try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
          area.remove();
        }
        btn.textContent = ok ? "Copied" : "Select it";
        btn.classList.toggle("is-done", ok);
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("is-done"); }, 1600);
      });
    });
    render(false);
  }

  /* ---------- Step 3: the entry form ---------- */
  const form = document.querySelector("[data-entry]");
  if (!form) return;
  const steps = $$(form, "[data-step]");
  const bars = $$(form, ".stepper li");
  const status = $(form, "[data-status]");
  const sendBtn = $(form, "[data-send]");
  const done = document.querySelector("[data-done]");
  let current = 0;

  form.classList.add("is-stepped");

  function show(n, focus) {
    current = n;
    steps.forEach((s, i) => s.classList.toggle("is-current", i === n));
    bars.forEach((b, i) => { b.classList.toggle("on", i === n); b.classList.toggle("done", i < n); });
    status.textContent = "";
    status.classList.remove("is-error");
    if (!focus) return;
    // Bring the top of the form back into view on phones, then focus the first field
    if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    const first = $(steps[n], "input:not([type=hidden]):not([hidden]), textarea");
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
  }

  // Check only the fields in the step on screen; the browser explains what's missing
  function valid(step) {
    const fields = $$(step, "input, textarea, select").filter((el) => !el.hidden && !el.closest("[hidden], .hp"));
    for (const el of fields) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  $$(form, "[data-next]").forEach((b) => b.addEventListener("click", () => { if (valid(steps[current])) show(current + 1, true); }));
  $$(form, "[data-back]").forEach((b) => b.addEventListener("click", () => show(current - 1, true)));

  // "Another website" asks which one
  const otherInput = $(form, "[data-other-input]");
  $$(form, 'input[name="tool"]').forEach((r) => r.addEventListener("change", () => {
    const isOther = $(form, "[data-other]").checked;
    otherInput.hidden = !isOther;
    otherInput.required = isOther;
    if (isOther) otherInput.focus();
  }));

  // Phone number: digits only, 10 of them
  const phone = form.elements.namedItem("parentPhone");
  phone.addEventListener("input", () => { phone.value = phone.value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").slice(0, 10); });
  phone.addEventListener("invalid", () => {
    phone.setCustomValidity(phone.validity.patternMismatch || phone.validity.tooShort ? "Enter a 10-digit mobile number, like 9876543210." : "");
  });
  phone.addEventListener("input", () => phone.setCustomValidity(""));

  const songLink = form.elements.namedItem("songLink");
  songLink.addEventListener("invalid", () => {
    songLink.setCustomValidity(songLink.validity.typeMismatch ? "Paste the full link, starting with https://" : "");
  });
  songLink.addEventListener("input", () => songLink.setCustomValidity(""));

  // Pressing Enter moves to the next step instead of sending early
  form.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.tagName === "TEXTAREA" || e.target.type === "submit") return;
    if (current < steps.length - 1) {
      e.preventDefault();
      if (valid(steps[current])) show(current + 1, true);
    }
  });

  function collect() {
    const v = (name) => {
      const el = form.elements.namedItem(name);
      if (!el) return "";
      if (el instanceof RadioNodeList) return el.value;
      return el.type === "checkbox" ? el.checked : el.value.trim();
    };
    return {
      studentName: v("studentName"),
      class: v("class"),
      school: v("school"),
      city: v("city"),
      songTitle: v("songTitle"),
      songLink: v("songLink"),
      tool: v("tool") === "Other" ? `Other: ${v("toolOther")}` : v("tool"),
      lyricsBy: v("lyricsBy"),
      about: v("about"),
      parentName: v("parentName"),
      parentPhone: "+91" + v("parentPhone"),
      consentTerms: v("consentTerms"),
      consentUpdates: v("consentUpdates"),
      termsVersion: TERMS_VERSION,
      website: v("website"),
    };
  }

  function whatsappText(d) {
    return [
      "Hi PACS AI, here is our AI Song Challenge entry.",
      `Entrant: ${d.studentName}, Class ${d.class}${d.school ? `, ${d.school}` : ""}, ${d.city}`,
      `Song: ${d.songTitle}`,
      `Link: ${d.songLink}`,
      `Made with: ${d.tool}. Words by: ${d.lyricsBy}`,
      `About: ${d.about}`,
      `Contact: ${d.parentName}, ${d.parentPhone}`,
      `We agree to the Terms and Conditions (${d.termsVersion}). Course news: ${d.consentUpdates ? "Yes" : "No"}.`,
    ].join("\n");
  }
  const openWhatsApp = (d) => window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(whatsappText(d))}`, "_blank", "noopener");

  function finish(idText) {
    form.hidden = true;
    done.hidden = false;
    $(done, "[data-done-text]").innerHTML = idText;
    done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    done.focus({ preventScroll: true });
  }

  function fail(d) {
    status.classList.add("is-error");
    status.innerHTML = 'That didn\'t go through. Check your internet and try again, or <button type="button" class="link" data-wa-fallback>send it on WhatsApp instead</button>.';
    $(status, "[data-wa-fallback]").addEventListener("click", () => {
      openWhatsApp(d);
      finish("Your entry has opened in WhatsApp. <b>Press send there</b> to finish.");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!valid(steps[current])) return;
    const d = collect();
    if (d.website) return; // a bot filled the hidden field
    if (!["8", "9", "10", "11", "12"].includes(d.class)) {
      show(0, true);
      status.classList.add("is-error");
      status.textContent = "Only Class 8–12 students can enter.";
      return;
    }

    // No Google Sheet connected yet: hand the entry to WhatsApp
    if (!cfg.songEntries) {
      openWhatsApp(d);
      finish("Your entry has opened in WhatsApp. <b>Press send there</b> to finish.");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    status.classList.remove("is-error");
    status.textContent = "";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      // Plain text keeps this a "simple" request, which Google Apps Script accepts
      const res = await fetch(cfg.songEntries, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(d),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const reply = await res.json();
      if (!reply.ok) throw new Error(reply.error || "Not saved");
      const id = String(reply.id).replace(/[^\w-]/g, "");
      finish(`Your entry number is <b>${id}</b>. Keep it safe.`);
    } catch (err) {
      fail(d);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send my entry";
    }
  });

  // Send a better version: keep the student and parent, clear the song and the ticks
  document.querySelector("[data-again]")?.addEventListener("click", () => {
    ["songTitle", "songLink", "toolOther", "about"].forEach((n) => { form.elements.namedItem(n).value = ""; });
    ["tool", "lyricsBy"].forEach((n) => $$(form, `input[name="${n}"]`).forEach((r) => { r.checked = false; }));
    ["consentTerms", "consentUpdates"].forEach((n) => { form.elements.namedItem(n).checked = false; });
    otherInput.hidden = true;
    otherInput.required = false;
    done.hidden = true;
    form.hidden = false;
    show(1, true);
  });

  show(0, false);
})();

/* ---------- Page motion: things rise in as they arrive, ₹500 counts up, the winning record moves ---------- */
(function () {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("song-anim");
  const seen = (el, fn, opts) => new IntersectionObserver((entries, io) => entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }), opts || { threshold: .25 }).observe(el);

  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty("--i", i));
    seen(group, (g) => g.classList.add("is-in"), { threshold: .15 });
  });

  const count = document.querySelector("[data-count-to]");
  if (count) {
    const to = +count.dataset.countTo;
    count.textContent = "0";
    seen(count, () => {
      const start = performance.now(), ms = 1300;
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms);
        count.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .6 });
  }

  // One of ten records lights up at a time: any song could be the one
  const odds = document.querySelector("[data-odds]");
  if (odds) {
    const discs = [...odds.querySelectorAll("i")];
    let n = 0, timer = 0;
    const tick = () => { discs.forEach((d, i) => d.classList.toggle("is-win", i === n)); n = (n + 3) % discs.length; };
    tick();
    new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) timer = setInterval(tick, 900); }).observe(odds);
  }
})();
