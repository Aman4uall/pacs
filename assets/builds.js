/* =========================================================================
   PACS AI – the working builds
   The home page's hero app that builds itself, and the Build Wall tiles on
   the Class 8–12 and BBA pages. Everything works without the animation libraries.
   ========================================================================= */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => [...root.querySelectorAll(sel)];
  // A tiny vibration when a phone user taps a build (Android only; ignored elsewhere)
  const buzz = (pattern = 8) => {
    if (reduce || !touch || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* not allowed here */ }
  };

  // Start something the first time it scrolls into view (with a backup timer,
  // so a build never stays empty if the browser doesn't report visibility)
  function whenSeen(el, fn, margin = "0px 0px -15% 0px", backup = 8000) {
    let done = false;
    const fire = () => { if (!done) { done = true; fn(); } };
    if (!("IntersectionObserver" in window)) return fire();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fire(); }
    }, { rootMargin: margin });
    io.observe(el);
    setTimeout(() => { io.disconnect(); fire(); }, backup);
  }

  /* ---------- Hero: an idea becomes a working quiz app ---------- */
  const QUIZ = [
    { q: "Which gas do plants take in to make their food?", options: ["Oxygen", "Carbon dioxide", "Nitrogen"], answer: 1 },
    { q: "Where does most photosynthesis happen?", options: ["Roots", "Stem", "Leaves"], answer: 2 },
    { q: "What do plants give out during photosynthesis?", options: ["Oxygen", "Methane", "Hydrogen"], answer: 0 },
  ];

  function quizApp(root) {
    const app = $(root, "[data-app]");
    const els = {
      score: $(app, "[data-score]"), bar: $(app, "[data-bar]"), count: $(app, "[data-count]"),
      question: $(app, "[data-question]"), options: $(app, "[data-options]"), feedback: $(app, "[data-feedback]"),
    };
    const qBox = $(app, ".app-q");
    let index = 0, score = 0, locked = false, endEl = null;

    function render() {
      const item = QUIZ[index];
      els.count.textContent = `Question ${index + 1} of ${QUIZ.length}`;
      els.question.textContent = item.q;
      els.options.innerHTML = "";
      item.options.forEach((text, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.addEventListener("click", (e) => choose(i, b, e));
        els.options.appendChild(b);
      });
      els.feedback.textContent = "";
      els.score.textContent = `${score} pts`;
      els.bar.style.width = `${(index / QUIZ.length) * 100}%`;
      locked = false;
    }

    function ripple(button, x, y) {
      const r = button.getBoundingClientRect();
      const dot = document.createElement("span");
      dot.className = "tap";
      dot.style.left = `${x != null ? x - r.left : r.width / 2}px`;
      dot.style.top = `${y != null ? y - r.top : r.height / 2}px`;
      button.appendChild(dot);
      setTimeout(() => dot.remove(), 700);
    }

    async function choose(i, button, e) {
      if (locked) return;
      locked = true;
      ripple(button, e && e.clientX, e && e.clientY);
      const right = i === QUIZ[index].answer;
      if (e) buzz(right ? 14 : [20, 60, 20]);
      button.classList.add(right ? "is-right" : "is-wrong");
      if (!right) els.options.children[QUIZ[index].answer].classList.add("is-right");
      if (right) score += 10;
      els.score.textContent = `${score} pts`;
      els.feedback.style.color = right ? "" : "var(--red-deep)";
      els.feedback.textContent = right ? "Correct! +10" : "Not quite. It'll come back in Review.";
      els.bar.style.width = `${((index + 1) / QUIZ.length) * 100}%`;
      await wait(1300);
      index += 1;
      if (index < QUIZ.length) render();
      else finish();
    }

    function finish() {
      [qBox, els.options, els.feedback].forEach((el) => { el.hidden = true; });
      endEl = document.createElement("div");
      endEl.className = "app-end";
      endEl.innerHTML = `<strong>${score / 10}/${QUIZ.length}</strong><p class="app-sub">Chapter 5 done. Review again tomorrow.</p><button type="button">Play again</button>`;
      endEl.querySelector("button").addEventListener("click", reset);
      $(app, ".app-tabs").before(endEl);
    }

    function reset() {
      index = 0; score = 0;
      if (endEl) { endEl.remove(); endEl = null; }
      [qBox, els.options, els.feedback].forEach((el) => { el.hidden = false; });
      render();
    }

    render();
    return {
      reset,
      demoTap() {
        const b = els.options.children[QUIZ[0].answer];
        if (b && index === 0 && !locked) choose(QUIZ[0].answer, b);
      },
    };
  }

  document.querySelectorAll("[data-builder]").forEach((root) => {
    const prompt = $(root, "[data-prompt]");
    const status = $(root, "[data-status]");
    const replay = $(root, "[data-replay]");
    const parts = $$(root, ".bp");
    const full = prompt.textContent.trim();
    const app = quizApp(root);

    if (reduce) { root.classList.add("is-live"); return; }

    let running = false;
    async function build() {
      if (running) return;
      running = true;
      replay.hidden = true;
      app.reset();
      root.classList.remove("is-live", "is-building");
      root.classList.add("is-armed");
      parts.forEach((p) => p.classList.remove("ghost", "on"));
      prompt.textContent = "";
      status.textContent = "Waiting for an idea";

      prompt.classList.add("is-typing");
      await wait(500);
      for (const ch of full) {
        prompt.textContent += ch;
        await wait(ch === " " ? 70 : 28 + Math.random() * 38);
      }
      await wait(450);
      prompt.classList.remove("is-typing");
      root.classList.add("is-pressed");
      await wait(220);
      root.classList.remove("is-pressed");

      root.classList.add("is-building");
      const steps = ["Planning the screens", "Writing 3 questions", "Adding a score", "Testing on a phone"];
      for (let i = 0; i < parts.length; i++) {
        status.textContent = steps[Math.min(i, steps.length - 1)] + "…";
        parts[i].classList.add("ghost");
        await wait(260);
      }
      for (const p of parts) {
        p.classList.remove("ghost");
        p.classList.add("on");
        await wait(170);
      }
      root.classList.remove("is-building");
      root.classList.add("is-live");
      status.textContent = "Built and live. Tap an answer.";
      await wait(1100);
      app.demoTap();
      running = false;
      replay.hidden = false;
    }

    replay.addEventListener("click", build);
    root.classList.add("is-armed");
    parts.forEach((p) => p.classList.remove("on"));
    // On a laptop the hero is on screen as soon as the page opens, so start on a
    // timer. On a phone the app sits below the headline, so wait until it's seen.
    if (window.matchMedia("(max-width: 920px)").matches) whenSeen(root, build, "0px 0px -20% 0px", 6000);
    else setTimeout(build, 1100);
  });

  /* ---------- A. Mango sorter ---------- */
  const MANGOES = [
    { fill: "#4F8F2F", ripe: 3, name: "Green mango" },
    { fill: "#86A93A", ripe: 17, name: "Yellow-green mango" },
    { fill: "#C6B23C", ripe: 57, name: "Half-ripe mango" },
    { fill: "#EDA832", ripe: 92, name: "Yellow mango" },
    { fill: "#F2872A", ripe: 98, name: "Orange mango" },
  ];
  const mangoSVG = (fill) => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M52 10C80 12 94 38 88 62 83 84 62 95 42 91 20 87 7 68 10 46 13 25 30 8 52 10Z" fill="${fill}"/><ellipse cx="38" cy="36" rx="12" ry="8" fill="#fff" opacity=".32"/><path d="M52 11C54 5 58 3 62 2" stroke="#5A3A1A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M60 4C70 0 80 3 84 9 74 12 66 10 60 4Z" fill="#3E7B2A"/></svg>`;

  document.querySelectorAll("[data-sorter]").forEach((root) => {
    const picks = $(root, "[data-picks]");
    const stage = $(root, "[data-stage]");
    const verdict = $(root, "[data-verdict]");
    const bars = { ripe: $(root, "[data-ripe]"), raw: $(root, "[data-raw]"), ripeN: $(root, "[data-ripe-n]"), rawN: $(root, "[data-raw-n]") };
    let busy = false;

    MANGOES.forEach((m, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mango-btn";
      b.setAttribute("aria-label", m.name);
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = mangoSVG(m.fill);
      b.addEventListener("click", () => { buzz(); classify(i); });
      picks.appendChild(b);
    });

    async function classify(i) {
      if (busy) return;
      busy = true;
      const m = MANGOES[i];
      $$(picks, "button").forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
      stage.querySelector("svg")?.remove();
      stage.insertAdjacentHTML("afterbegin", mangoSVG(m.fill));
      bars.ripe.style.width = bars.raw.style.width = "0%";
      bars.ripeN.textContent = bars.rawN.textContent = "…";
      verdict.innerHTML = "Looking…<small>Comparing with what it learned</small>";
      root.classList.add("is-thinking");
      await wait(1400);
      root.classList.remove("is-thinking");
      bars.ripe.style.width = `${m.ripe}%`;
      bars.raw.style.width = `${100 - m.ripe}%`;
      bars.ripeN.textContent = `${m.ripe}%`;
      bars.rawN.textContent = `${100 - m.ripe}%`;
      verdict.innerHTML = m.ripe >= 70 ? "Ripe<small>Ready to eat.</small>"
        : m.ripe <= 30 ? "Raw<small>Give it a few days.</small>"
        : "Not sure<small>It needs more photos like this one to learn from.</small>";
      busy = false;
    }

    whenSeen(root, () => classify(3));
  });

  /* ---------- B. Challenge Coach ---------- */
  const COACH = [
    { ask: "Just give me the answer to Q4.", reply: "Nice try. I only give hints. What is Q4 asking you to find? Tell me your first step and I'll check it." },
    { ask: "I don't get photosynthesis.", reply: "Let's break it down. Something goes in, and something comes out. Name one thing a plant takes in." },
    { ask: "Check my answer: plants breathe in oxygen to make food.", reply: "Close, but flip it. To make food, a plant takes in a different gas. Which one does it take from the air?" },
  ];
  document.querySelectorAll("[data-coach]").forEach((root) => {
    const log = $(root, "[data-log]");
    let busy = false;
    const add = (cls, html) => {
      const p = document.createElement("p");
      p.className = `msg ${cls}`;
      p.innerHTML = html;
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
      return p;
    };
    $$(root, "[data-ask]").forEach((chip) => chip.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      buzz();
      const item = COACH[+chip.dataset.ask];
      add("me", item.ask);
      await wait(350);
      const dots = add("bot dots", "<span></span><span></span><span></span>");
      await wait(1100);
      dots.remove();
      add("bot", item.reply);
      busy = false;
    }));
  });

  /* ---------- C. Python text adventure ---------- */
  const STORY = {
    start: { text: "The power is out in the lab. A robot blocks the door.", choices: [["Talk to the robot", "robot"], ["Look for a torch", "torch"]] },
    torch: { text: "Under a desk you find a torch and a note: \"The robot loves riddles.\"", choices: [["Go back to the robot", "robot"]] },
    robot: { text: "ROBOT: Answer my riddle to pass. What has keys but can't open locks?", choices: [["A piano", "win"], ["A door", "lose"]] },
    win: { text: "The robot beeps twice and steps aside. You escaped! Score: 100", choices: [["Play again", "start"]], end: true },
    lose: { text: "Wrong. The robot laughs in binary: 01101000 01100001. Game over.", choices: [["Try again", "start"]], end: true },
  };
  document.querySelectorAll("[data-term]").forEach((root) => {
    const out = $(root, "[data-out]");
    const choices = $(root, "[data-choices]");
    const code = $(root, "[data-code]");
    const toggle = $(root, "[data-code-toggle]");
    let typing = false;

    async function type(text, cls) {
      const line = document.createElement("div");
      if (cls) line.className = cls;
      out.appendChild(line);
      for (const ch of text) {
        line.textContent += ch;
        out.scrollTop = out.scrollHeight;
        await wait(14);
      }
    }
    async function go(key, picked) {
      if (typing) return;
      typing = true;
      choices.innerHTML = "";
      if (picked) await type(`> ${picked}`, "p");
      if (key === "start") { out.innerHTML = ""; await type("$ python escape.py", "dim"); }
      const node = STORY[key];
      await type(node.text);
      node.choices.forEach(([label, next], i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = `${i + 1}) ${label}`;
        b.addEventListener("click", () => { buzz(); go(next, label); });
        choices.appendChild(b);
      });
      typing = false;
    }
    toggle.addEventListener("click", () => {
      const showCode = code.hidden;
      code.hidden = !showCode;
      out.hidden = choices.hidden = showCode;
      toggle.textContent = showCode ? "Play the game" : "View code";
      toggle.setAttribute("aria-pressed", String(showCode));
    });
    whenSeen(root, () => go("start"));
  });

  /* ---------- D. Break-even dashboard ---------- */
  document.querySelectorAll("[data-breakeven]").forEach((root) => {
    const input = $(root, "input[type=range]");
    const priceOut = $(root, "[data-price]");
    const unitsOut = $(root, "[data-units]");
    const dayOut = $(root, "[data-day]");
    const loss = $(root, "[data-loss]");
    const gain = $(root, "[data-gain]");
    const dot = $(root, "[data-dot]");
    const dotLabel = $(root, "[data-dot-label]");
    const COST = 15, FIXED = 36000, MAX_U = 3000;
    // Chart scale: 0–3,000 cupcakes across, -₹40,000 to +₹1,60,000 up
    const X = (u) => 40 + (u / MAX_U) * 470;
    const Y = (p) => 190 - ((p + 40000) / 200000) * 180;
    const fmt = (n) => Math.round(n).toLocaleString("en-IN");

    function update() {
      const price = +input.value;
      const margin = price - COST;
      const be = FIXED / margin;
      priceOut.textContent = `₹${price}`;
      unitsOut.textContent = fmt(Math.ceil(be));
      dayOut.textContent = be / 30 > 150 ? `That's ${fmt(Math.ceil(be / 30))} a day. Too many for one shop.` : `That's ${fmt(Math.ceil(be / 30))} a day.`;
      const profitAt = (u) => margin * u - FIXED;
      const beX = Math.min(be, MAX_U);
      loss.setAttribute("d", `M${X(0)},${Y(profitAt(0))} L${X(beX)},${Y(profitAt(beX))}`);
      if (be < MAX_U) {
        gain.setAttribute("d", `M${X(be)},${Y(0)} L${X(MAX_U)},${Y(Math.min(profitAt(MAX_U), 160000))}`);
        dot.setAttribute("cx", X(be));
        dot.style.display = dotLabel.style.display = "";
        dotLabel.setAttribute("x", Math.min(470, Math.max(80, X(be))));
      } else {
        gain.setAttribute("d", "");
        dot.style.display = dotLabel.style.display = "none";
      }
    }
    // A small tick every ₹5 while dragging, like a notched dial
    input.addEventListener("input", () => { update(); if (+input.value % 5 === 0) buzz(5); });
    update();

    // Gently sweep the price once when it first appears, so people see it's live
    whenSeen(root, async () => {
      if (reduce) return;
      for (const v of [45, 52, 60, 52, 38, 45]) {
        input.value = v;
        update();
        await wait(380);
      }
    });
  });

  /* ---------- E. Pitch deck ---------- */
  document.querySelectorAll("[data-deck]").forEach((root) => {
    const slides = $$(root, ".slide");
    const dotsBox = $(root, "[data-dots]");
    let i = 0, timer = null, visible = false;
    const dots = slides.map(() => { const d = document.createElement("i"); dotsBox.appendChild(d); return d; });
    function show(n) {
      slides[i].classList.remove("is-on");
      slides[i].classList.add("is-out");
      const prev = slides[i];
      setTimeout(() => prev.classList.remove("is-out"), 600);
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-on");
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }
    slides[0].classList.add("is-on");
    dots[0].classList.add("on");
    const play = () => { clearInterval(timer); if (!reduce && visible) timer = setInterval(() => show(i + 1), 3200); };
    $(root, "[data-next]").addEventListener("click", () => { buzz(); show(i + 1); play(); });
    $(root, "[data-prev]").addEventListener("click", () => { buzz(); show(i - 1); play(); });
    $(root, ".deck-frame").addEventListener("click", () => { buzz(); show(i + 1); play(); });
    root.addEventListener("pointerenter", () => clearInterval(timer));
    root.addEventListener("pointerleave", play);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : clearInterval(timer); }).observe(root);
    }
  });

  /* ---------- F. Campaign post ---------- */
  const POSTS = {
    bakery: {
      handle: "@sample.bakery", colours: ["#F6D7A7", "#E9A15B", "#2A1B10"],
      bold: ["Fresh at 7:30. Gone by 9.", "Breakfast is back on weekdays. Pre-order on WhatsApp."],
      friendly: ["Your morning just got sweeter.", "Warm buns, strong chai, 7:30 every weekday. See you soon!"],
      premium: ["Slow-risen. Hand-shaped. Baked at dawn.", "Small batches, every morning. Reserve yours before they're gone."],
    },
    cafe: {
      handle: "@sample.cafe", colours: ["#3B2A22", "#7A5240", "#F7EBDD"],
      bold: ["Two-minute coffee. Zero-minute wait.", "Order ahead on WhatsApp. Walk in, walk out."],
      friendly: ["Come for coffee. Stay for the chat.", "Wi-Fi's fast, the chairs are comfy, and the filter coffee is on us Monday."],
      premium: ["Single-origin. Brewed with patience.", "Hill-estate beans, roasted in small lots every week."],
    },
    books: {
      handle: "@sample.books", colours: ["#1F3B34", "#2F5A4F", "#F3EEDD"],
      bold: ["Your next obsession is on shelf 3.", "New arrivals every Friday. Come early."],
      friendly: ["Lost track of time? That's the idea.", "Pull up a chair. Read the first chapter before you buy."],
      premium: ["Rare finds for careful readers.", "First editions and out-of-print treasures, by appointment."],
    },
  };
  document.querySelectorAll("[data-post]").forEach((root) => {
    const state = { biz: "bakery", tone: "bold" };
    const img = $(root, "[data-img]");
    const headline = $(root, "[data-headline]");
    const caption = $(root, "[data-caption]");
    const handle = $(root, "[data-handle]");
    const avatar = $(root, ".post-head i");

    async function render() {
      const p = POSTS[state.biz];
      const [text, cap] = p[state.tone];
      headline.style.opacity = 0;
      await wait(200);
      img.style.setProperty("--c1", p.colours[0]);
      img.style.setProperty("--c2", p.colours[1]);
      img.style.setProperty("--c3", p.colours[2]);
      avatar.style.background = p.colours[1];
      handle.textContent = p.handle;
      headline.className = state.tone;
      headline.textContent = text;
      caption.innerHTML = `<b>${p.handle}</b> ${cap} #Mangalore`;
      headline.style.opacity = 1;
    }
    $$(root, "[data-group]").forEach((group) => {
      $$(group, "button").forEach((b) => b.addEventListener("click", () => {
        buzz(6);
        $$(group, "button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        state[group.dataset.group] = b.dataset.v;
        render();
      }));
    });
    render();
  });

  /* ---------- Demo Day countdown ---------- */
  document.querySelectorAll("[data-countdown]").forEach((box) => {
    const cfg = typeof SITE !== "undefined" ? SITE : {};
    const when = cfg.demoDay ? new Date(cfg.demoDay) : null;
    if (!when || isNaN(when) || when < new Date()) return;
    box.innerHTML = '<div class="countdown"><div><strong data-d>0</strong><span>Days</span></div><div><strong data-h>0</strong><span>Hours</span></div><div><strong data-m>0</strong><span>Minutes</span></div><div><strong data-s>0</strong><span>Seconds</span></div></div>';
    const set = (k, v) => { box.querySelector(`[data-${k}]`).textContent = String(v).padStart(2, "0"); };
    const tick = () => {
      let s = Math.max(0, Math.floor((when - new Date()) / 1000));
      set("d", Math.floor(s / 86400)); s %= 86400;
      set("h", Math.floor(s / 3600)); s %= 3600;
      set("m", Math.floor(s / 60)); set("s", s % 60);
    };
    tick();
    setInterval(tick, 1000);
  });
})();
