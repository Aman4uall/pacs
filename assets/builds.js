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
  const QUIZZES = {
    science: { name: "Science Sprint", sub: "Chapter 5 · Plants", idea: "A revision quiz for Class 8 science, with a score", qs: [
      { q: "Which gas do plants take in to make their food?", options: ["Oxygen", "Carbon dioxide", "Nitrogen"], answer: 1 },
      { q: "Where does most photosynthesis happen?", options: ["Roots", "Stem", "Leaves"], answer: 2 },
      { q: "What do plants give out during photosynthesis?", options: ["Oxygen", "Methane", "Hydrogen"], answer: 0 },
    ] },
    maths: { name: "Maths Mate", sub: "Chapter 3 · Algebra", idea: "A maths practice app for Class 8, with points", qs: [
      { q: "Solve 3x + 5 = 20. What is x?", options: ["5", "6", "15"], answer: 0 },
      { q: "What is 15% of 200?", options: ["20", "30", "35"], answer: 1 },
      { q: "How many sides does a hexagon have?", options: ["5", "6", "8"], answer: 1 },
    ] },
    geo: { name: "Map Quest", sub: "Chapter 2 · India", idea: "A geography quiz game for Class 8, with a leaderboard", qs: [
      { q: "Which sea lies along Karnataka's coast?", options: ["Bay of Bengal", "Arabian Sea", "Red Sea"], answer: 1 },
      { q: "Which is the longest river in India?", options: ["Ganga", "Godavari", "Yamuna"], answer: 0 },
      { q: "Which layer of the Earth do we live on?", options: ["Crust", "Mantle", "Core"], answer: 0 },
    ] },
  };

  function quizApp(root, pick) {
    const app = $(root, "[data-app]");
    let set = QUIZZES[pick()], QUIZ = set.qs;
    const els = {
      score: $(app, "[data-score]"), bar: $(app, "[data-bar]"), count: $(app, "[data-count]"),
      question: $(app, "[data-question]"), options: $(app, "[data-options]"), feedback: $(app, "[data-feedback]"),
    };
    const qBox = $(app, ".app-q");
    let index = 0, score = 0, locked = false, endEl = null, gen = 0;

    function render() {
      set = QUIZZES[pick()]; QUIZ = set.qs;
      const name = $(app, "[data-app-name]"), sub = $(app, "[data-app-sub]");
      if (name) name.textContent = set.name;
      if (sub) sub.textContent = set.sub;
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
      const mine = gen;
      await wait(1300);
      if (mine !== gen) return;
      index += 1;
      if (index < QUIZ.length) render();
      else finish();
    }

    function finish() {
      [qBox, els.options, els.feedback].forEach((el) => { el.hidden = true; });
      endEl = document.createElement("div");
      endEl.className = "app-end";
      endEl.innerHTML = `<strong>${score / 10}/${QUIZ.length}</strong><p class="app-sub">${set.sub.split(" · ")[0]} done. Review again tomorrow.</p><button type="button">Play again</button>`;
      endEl.querySelector("button").addEventListener("click", reset);
      $(app, ".app-tabs").before(endEl);
    }

    function reset() {
      gen += 1; index = 0; score = 0;
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
    const subjects = $$(root, "[data-subject]");
    let subject = "science";
    const app = quizApp(root, () => subject);

    let running = false, queued = false;
    async function build() {
      if (running) { queued = true; return; }
      running = true;
      replay.hidden = true;
      app.reset();
      if (reduce) { prompt.textContent = QUIZZES[subject].idea; root.classList.add("is-live"); status.textContent = "Built and live. Tap an answer."; running = false; replay.hidden = false; return; }
      root.classList.remove("is-live", "is-building");
      root.classList.add("is-armed");
      parts.forEach((p) => p.classList.remove("ghost", "on"));
      const full = QUIZZES[subject].idea;
      prompt.textContent = "";
      status.textContent = "Waiting for an idea";

      prompt.classList.add("is-typing");
      await wait(400);
      for (const ch of full) {
        if (queued) break;
        prompt.textContent += ch;
        await wait(ch === " " ? 55 : 22 + Math.random() * 30);
      }
      prompt.textContent = full;
      await wait(350);
      prompt.classList.remove("is-typing");
      root.classList.add("is-pressed");
      await wait(200);
      root.classList.remove("is-pressed");

      root.classList.add("is-building");
      const steps = ["Planning the screens", "Writing 3 questions", "Adding a score", "Testing on a phone"];
      for (let i = 0; i < parts.length; i++) {
        status.textContent = steps[Math.min(i, steps.length - 1)] + "…";
        parts[i].classList.add("ghost");
        await wait(queued ? 0 : 240);
      }
      for (const p of parts) {
        p.classList.remove("ghost");
        p.classList.add("on");
        await wait(queued ? 0 : 150);
      }
      root.classList.remove("is-building");
      root.classList.add("is-live");
      status.textContent = "Built and live. Tap an answer.";
      running = false;
      replay.hidden = false;
      if (queued) { queued = false; build(); }
    }

    subjects.forEach((chip) => chip.addEventListener("click", () => {
      buzz(6);
      subject = chip.dataset.subject;
      subjects.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      build();
    }));
    replay.addEventListener("click", build);
    if (!reduce) { root.classList.add("is-armed"); parts.forEach((p) => p.classList.remove("on")); }
    whenSeen(root, build, "0px 0px -20% 0px", 9000);
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

  /* ---------- E. Pitch deck: thumbnails, speaker notes and a Present mode ---------- */
  const DECK_NOTES = [
    "Open with the client's name and one line on why you're here.",
    "Show the pattern, not the table. Weekends peak, weekdays dip.",
    "Let a customer's own words make the point for you.",
    "Three moves, each one cheap to test in a single week.",
    "End on one number the owner can hold you to.",
  ];
  const DECK_THUMBS = ["Title", "Problem", "Voice", "Plan", "Target"];
  document.querySelectorAll("[data-deck]").forEach((root) => {
    const slides = $$(root, ".slide");
    const frame = $(root, ".deck-frame");
    const dotsBox = $(root, "[data-dots]");
    let i = 0, timer = null, visible = false;

    // Thumbnails replace the dots: each one is a tiny copy of its slide
    dotsBox.classList.add("deck-thumbs");
    const dots = slides.map((slide, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "deck-thumb";
      b.setAttribute("aria-label", `Slide ${k + 1}: ${DECK_THUMBS[k] || ""}`);
      b.innerHTML = `<b>${k + 1}</b><span>${DECK_THUMBS[k] || ""}</span>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); buzz(); show(k); play(); });
      dotsBox.appendChild(b);
      return b;
    });

    // A tool row: slide count, speaker notes and Present
    const tools = document.createElement("div");
    tools.className = "deck-tools";
    tools.innerHTML = '<span class="deck-count" aria-live="polite"><b data-deck-n>1</b> / ' + slides.length + '</span>'
      + '<button type="button" class="deck-tool" data-notes aria-pressed="false">Speaker notes</button>'
      + '<button type="button" class="deck-tool deck-present" data-present>Present <span aria-hidden="true">⤢</span></button>';
    const notes = document.createElement("p");
    notes.className = "deck-notes";
    notes.hidden = true;
    frame.after(tools, notes);
    const nOut = $(tools, "[data-deck-n]");
    const progress = document.createElement("span");
    progress.className = "deck-progress";
    progress.setAttribute("aria-hidden", "true");
    frame.appendChild(progress);

    function show(n) {
      if (n === i && slides[i].classList.contains("is-on")) return;
      slides[i].classList.remove("is-on");
      slides[i].classList.add("is-out");
      const prev = slides[i];
      setTimeout(() => prev.classList.remove("is-out"), 600);
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-on");
      dots.forEach((d, k) => { d.classList.toggle("on", k === i); d.setAttribute("aria-current", k === i ? "true" : "false"); });
      nOut.textContent = String(i + 1);
      notes.textContent = DECK_NOTES[i] || "";
      progress.style.transform = `scaleX(${(i + 1) / slides.length})`;
      // The big number counts up each time its slide arrives
      const big = $(slides[i], ".slide-big");
      if (big && !reduce) {
        const target = parseInt(big.textContent.replace(/[^0-9]/g, ""), 10) || 0;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / 700);
          big.textContent = `+${Math.round(target * (1 - Math.pow(1 - t, 3)))}%`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
    slides[0].classList.add("is-on");
    i = 0; dots[0].classList.add("on"); notes.textContent = DECK_NOTES[0]; progress.style.transform = `scaleX(${1 / slides.length})`;
    const play = () => { clearInterval(timer); if (!reduce && visible && !root.classList.contains("is-presenting")) timer = setInterval(() => show(i + 1), 3600); };
    $(root, "[data-next]").addEventListener("click", () => { buzz(); show(i + 1); play(); });
    $(root, "[data-prev]").addEventListener("click", () => { buzz(); show(i - 1); play(); });
    frame.addEventListener("click", () => { buzz(); show(i + 1); play(); });
    frame.tabIndex = 0;
    frame.setAttribute("aria-label", "Pitch deck. Use the arrow keys to change slides.");
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); play(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); play(); }
      if (e.key === "Escape" && root.classList.contains("is-presenting")) exitPresent();
    });
    root.addEventListener("pointerenter", () => clearInterval(timer));
    root.addEventListener("pointerleave", play);

    const notesBtn = $(tools, "[data-notes]");
    notesBtn.addEventListener("click", () => {
      const on = notes.hidden;
      notes.hidden = !on;
      notesBtn.setAttribute("aria-pressed", String(on));
    });

    // Present: real full screen where the browser allows it, a full-window view otherwise
    const presentBtn = $(tools, "[data-present]");
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "deck-close";
    closeBtn.setAttribute("aria-label", "Stop presenting");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", (e) => { e.stopPropagation(); exitPresent(); });
    root.appendChild(closeBtn);
    // While presenting, the deck moves up to <body> so no card or animation can box it in
    const spot = document.createComment("deck");
    function enterPresent() {
      clearInterval(timer);
      root.before(spot);
      document.body.appendChild(root);
      root.classList.add("is-presenting");
      document.documentElement.classList.add("deck-open");
      presentBtn.setAttribute("aria-pressed", "true");
      if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
      frame.focus({ preventScroll: true });
    }
    function exitPresent() {
      root.classList.remove("is-presenting");
      document.documentElement.classList.remove("deck-open");
      presentBtn.setAttribute("aria-pressed", "false");
      if (document.fullscreenElement === root && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (spot.parentNode) { spot.replaceWith(root); presentBtn.focus({ preventScroll: true }); }
      play();
    }
    presentBtn.addEventListener("click", () => (root.classList.contains("is-presenting") ? exitPresent() : enterPresent()));
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && root.classList.contains("is-presenting")) exitPresent();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : clearInterval(timer); }).observe(root);
    }
  });

  /* ---------- F. Campaign post: a small AI marketing studio ---------- */
  const POSTS = {
    bakery: {
      handle: "sample.bakery", art: "🥐", offer: "breakfast from 7:30", sticker: "From 7:30 AM", likes: 1248,
      colours: ["#F6D7A7", "#E9A15B", "#2A1B10"], tags: "#Mangalore #FreshBakes",
      bold: ["Fresh at 7:30. Gone by 9.", "Breakfast is back on weekdays. Pre-order on WhatsApp."],
      friendly: ["Your morning just got sweeter.", "Warm buns and strong chai, 7:30 every weekday. See you soon!"],
      premium: ["Slow-risen. Hand-shaped. Baked at dawn.", "Small batches every morning. Reserve yours before they're gone."],
      more: { bold: "Breakfast. 7:30. Don't be late.", friendly: "Good mornings start at our counter.", premium: "Butter, flour, patience. Nothing else." },
    },
    cafe: {
      handle: "sample.cafe", art: "☕", offer: "order ahead, skip the queue", sticker: "Order ahead", likes: 2317,
      colours: ["#3B2A22", "#7A5240", "#F7EBDD"], tags: "#Mangalore #FilterCoffee",
      bold: ["Two-minute coffee. Zero-minute wait.", "Order ahead on WhatsApp. Walk in, walk out."],
      friendly: ["Come for coffee. Stay for the chat.", "Fast Wi-Fi, comfy chairs, and filter coffee on us every Monday."],
      premium: ["Single-origin. Brewed with patience.", "Hill-estate beans, roasted in small lots every week."],
      more: { bold: "Skip the queue. Keep the coffee.", friendly: "Your usual? We've already started it.", premium: "Every cup, poured like the first." },
    },
    books: {
      handle: "sample.books", art: "📚", offer: "new arrivals every Friday", sticker: "New on Friday", likes: 864,
      colours: ["#1F3B34", "#2F5A4F", "#F3EEDD"], tags: "#Mangalore #BookLovers",
      bold: ["Your next obsession is on shelf 3.", "New arrivals every Friday. Come early."],
      friendly: ["Lost track of time? That's the idea.", "Pull up a chair and read the first chapter before you buy."],
      premium: ["Rare finds for careful readers.", "First editions and out-of-print treasures, by appointment."],
      more: { bold: "Friday. New books. Be early.", friendly: "Come in for one book. Leave with three.", premium: "Stories worth waiting for." },
    },
  };
  const FORMATS = { post: "feed post", story: "story", whatsapp: "WhatsApp message" };
  const CTA = { post: "Order on WhatsApp", story: "Send us a message", whatsapp: "Reply ORDER" };
  const BIZ = { bakery: "bakery", cafe: "café", books: "bookshop" };

  document.querySelectorAll("[data-post]").forEach((root) => {
    const state = { biz: "bakery", tone: "bold", format: "post", version: 0 };
    const post = $(root, ".post");
    const img = $(root, "[data-img]");
    const art = $(root, "[data-art]");
    const sticker = $(root, "[data-sticker]");
    const headline = $(root, "[data-headline]");
    const caption = $(root, "[data-caption]");
    const handle = $(root, "[data-handle]");
    const sub = $(root, "[data-sub]");
    const avatar = $(root, "[data-avatar]");
    const likes = $(root, "[data-likes]");
    const cta = $(root, "[data-cta]");
    const brief = $(root, "[data-brief]");
    const checks = $$(root, "[data-checks] li");
    let run = 0;

    // Type text in, a few characters at a time; a newer run cancels an older one
    async function type(el, text, id, speed) {
      if (reduce) { el.textContent = text; return; }
      el.textContent = "";
      el.classList.add("is-typing");
      for (let i = 1; i <= text.length; i += 2) {
        if (id !== run) return;
        el.textContent = text.slice(0, i);
        await wait(speed);
      }
      el.textContent = text;
      el.classList.remove("is-typing");
    }

    async function render() {
      const id = ++run;
      const p = POSTS[state.biz];
      const [first, cap] = p[state.tone];
      const text = state.version % 2 ? p.more[state.tone] : first;
      checks.forEach((c) => c.classList.remove("is-done"));
      results.hidden = true;
      post.classList.remove("has-results");
      liked = 0;
      post.dataset.format = state.format;
      post.classList.add("is-generating");
      type(brief, `Write a ${state.tone} ${FORMATS[state.format]} for a ${BIZ[state.biz]} in Mangalore. Offer: ${p.offer}. End with one clear call to action.`, id, 12);

      await wait(650);
      if (id !== run) return;
      img.style.setProperty("--c1", p.colours[0]);
      img.style.setProperty("--c2", p.colours[1]);
      img.style.setProperty("--c3", p.colours[2]);
      avatar.style.background = `linear-gradient(135deg, ${p.colours[0]}, ${p.colours[1]})`;
      handle.textContent = p.handle;
      sub.textContent = state.format === "whatsapp" ? "Business account · online" : "Mangalore · Sponsored";
      art.textContent = p.art;
      sticker.textContent = p.sticker;
      cta.textContent = CTA[state.format];
      headline.className = state.tone;
      caption.innerHTML = `<b>${p.handle}</b> ${cap} <span class="tags">${p.tags}</span>`;
      post.classList.remove("is-generating");

      await type(headline, text, id, 28);
      if (id !== run) return;
      // Likes climb, and the checklist ticks off one by one
      const start = performance.now();
      const climb = (now) => {
        if (id !== run) return;
        const t = reduce ? 1 : Math.min(1, (now - start) / 900);
        likes.textContent = Math.round(p.likes * (1 - Math.pow(1 - t, 3))).toLocaleString("en-IN");
        if (t < 1) requestAnimationFrame(climb);
      };
      requestAnimationFrame(climb);
      for (const c of checks) {
        await wait(260);
        if (id !== run) return;
        c.classList.add("is-done");
      }
    }

    // Tools: a new version, copy the caption, and publish to see how it might do
    const tools = document.createElement("div");
    tools.className = "pm-tools";
    tools.innerHTML = '<button type="button" class="pm-tool" data-pm-regen><span aria-hidden="true">↻</span> New version</button>'
      + '<button type="button" class="pm-tool" data-pm-copy><span aria-hidden="true">⧉</span> Copy caption</button>'
      + '<button type="button" class="pm-tool pm-publish" data-pm-publish>Publish <span aria-hidden="true">→</span></button>';
    $(root, "[data-checks]").after(tools);
    const results = document.createElement("div");
    results.className = "post-results";
    results.hidden = true;
    results.innerHTML = '<p class="pr-head">24 hours later<small>Sample numbers, for practice</small></p>'
      + '<div class="pr-stats"><span><b data-r="reach">0</b>people reached</span><span><b data-r="taps">0</b>tapped the offer</span><span><b data-r="orders">0</b>orders</span></div>'
      + '<svg class="pr-spark" viewBox="0 0 120 34" aria-hidden="true"><polyline pathLength="1" points="2,30 20,27 38,24 56,17 74,19 92,9 118,4"/></svg>'
      + '<button type="button" class="pr-again" data-pm-again>Try another version</button>';
    img.appendChild(results);
    const heartBurst = document.createElement("span");
    heartBurst.className = "post-heart";
    heartBurst.setAttribute("aria-hidden", "true");
    heartBurst.textContent = "♥";
    img.appendChild(heartBurst);
    let liked = 0;

    const TONE_PULL = { bold: 1.15, friendly: 1, premium: .85 };
    const FORMAT_REACH = { post: 1, story: 1.35, whatsapp: .32 };
    function publish() {
      const p = POSTS[state.biz];
      const reach = Math.round(p.likes * 3.2 * TONE_PULL[state.tone] * FORMAT_REACH[state.format] * (state.version % 2 ? 1.08 : 1));
      const taps = Math.round(reach * (state.format === "whatsapp" ? .19 : .045) * TONE_PULL[state.tone]);
      const orders = Math.max(3, Math.round(taps * .22));
      const goal = { reach, taps, orders };
      results.hidden = false;
      post.classList.add("has-results");
      const start = performance.now();
      const tick = (now) => {
        const t = reduce ? 1 : Math.min(1, (now - start) / 1100);
        $$(results, "[data-r]").forEach((b) => { b.textContent = Math.round(goal[b.dataset.r] * (1 - Math.pow(1 - t, 3))).toLocaleString("en-IN"); });
        if (t < 1 && !results.hidden) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    function like() {
      if (liked) return;
      liked = 1;
      likes.textContent = (POSTS[state.biz].likes + 1).toLocaleString("en-IN");
      heartBurst.classList.remove("is-on");
      void heartBurst.offsetWidth;
      heartBurst.classList.add("is-on");
      buzz(10);
    }
    img.addEventListener("dblclick", like);
    const heartIcon = $(root, ".post-actions svg");
    if (heartIcon) { heartIcon.style.cursor = "pointer"; heartIcon.addEventListener("click", like); }
    $(tools, "[data-pm-regen]").addEventListener("click", () => { buzz(6); state.version += 1; render(); });
    $(tools, "[data-pm-publish]").addEventListener("click", () => { buzz([8, 40, 8]); publish(); });
    $(results, "[data-pm-again]").addEventListener("click", () => { state.version += 1; render(); });
    const copyBtn = $(tools, "[data-pm-copy]");
    copyBtn.addEventListener("click", async () => {
      const text = `${headline.textContent}
${caption.textContent}`;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { /* clipboard blocked */ }
      copyBtn.innerHTML = ok ? '<span aria-hidden="true">✓</span> Copied' : "Select and copy it";
      copyBtn.classList.add("is-done");
      setTimeout(() => { copyBtn.innerHTML = '<span aria-hidden="true">⧉</span> Copy caption'; copyBtn.classList.remove("is-done"); }, 1600);
    });

    $$(root, "[data-group]").forEach((group) => {
      $$(group, "button").forEach((b) => b.addEventListener("click", () => {
        buzz(6);
        $$(group, "button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        state[group.dataset.group] = b.dataset.v;
        state.version = 0;
        render();
      }));
    });

    // Play the first generation when the demo comes into view
    if ("IntersectionObserver" in window && !reduce) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); render(); } }, { threshold: 0.35 });
      io.observe(root);
    } else {
      checks.forEach((c) => c.classList.add("is-done"));
    }
  });

  /* ---------- G. Storyboard: an idea becomes a four-shot film ---------- */
  const FILMS = {
    robot: { sound: "Hopeful piano, slow build", scenes: [
      { art: "🌆", shot: "Wide shot", line: "A small robot wakes up in an empty city.", bg: ["#2B3A55", "#E07A5F"] },
      { art: "🤖", shot: "Close-up", line: "Its screen blinks: HOME NOT FOUND.", bg: ["#1D2B3A", "#3D5A80"] },
      { art: "🐕", shot: "Tracking shot", line: "A stray dog follows it through the rain.", bg: ["#33415C", "#98C1D9"] },
      { art: "🏠", shot: "Final shot", line: "Home was never a place. It was a friend.", bg: ["#F2CC8F", "#E07A5F"] },
    ] },
    mango: { sound: "Playful ukulele, quick tempo", scenes: [
      { art: "🌳", shot: "Wide shot", line: "The last mango on the tree refuses to fall.", bg: ["#A7C957", "#6A994E"] },
      { art: "🥭", shot: "Close-up", line: "One windy afternoon, it lifts off.", bg: ["#F4D35E", "#EE964B"] },
      { art: "🌊", shot: "Aerial shot", line: "It sails over paddy fields and the Arabian Sea.", bg: ["#8ECAE6", "#219EBC"] },
      { art: "🏆", shot: "Final shot", line: "It lands at the school science fair. First prize.", bg: ["#FFB703", "#FB8500"] },
    ] },
    cricket: { sound: "Drums and strings, rising", scenes: [
      { art: "🌧️", shot: "Wide shot", line: "Final over. Six to win. The rain is coming.", bg: ["#4A5759", "#8D99AE"] },
      { art: "🏏", shot: "Close-up", line: "The last batter has never hit a six.", bg: ["#2F3E46", "#52796F"] },
      { art: "⚡", shot: "Slow motion", line: "Thunder. The ball climbs into the clouds.", bg: ["#22223B", "#4A4E69"] },
      { art: "🎉", shot: "Final shot", line: "The whole ground runs onto the field.", bg: ["#F51E2B", "#FFB703"] },
    ] },
  };
  document.querySelectorAll("[data-film]").forEach((root) => {
    const frame = $(root, "[data-film-frame]");
    const art = $(root, "[data-film-art]");
    const shot = $(root, "[data-film-shot]");
    const line = $(root, "[data-film-line]");
    const bar = $(root, "[data-film-bar]");
    const strip = $(root, "[data-film-strip]");
    const playBtn = $(root, "[data-film-play]");
    const sound = $(root, "[data-film-sound]");
    let story = "robot", at = 0, run = 0, playing = false;

    function paint(k) {
      const sc = FILMS[story].scenes[k];
      at = k;
      frame.style.setProperty("--f1", sc.bg[0]);
      frame.style.setProperty("--f2", sc.bg[1]);
      art.textContent = sc.art;
      shot.textContent = `Scene ${k + 1} · ${sc.shot}`;
      line.textContent = sc.line;
      frame.classList.remove("is-cut");
      void frame.offsetWidth;
      frame.classList.add("is-cut");
      $$(strip, "button").forEach((b, j) => { b.classList.toggle("on", j === k); b.classList.toggle("seen", j < k); });
    }
    function buildStrip() {
      strip.innerHTML = "";
      FILMS[story].scenes.forEach((sc, k) => {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button";
        b.style.setProperty("--f1", sc.bg[0]);
        b.style.setProperty("--f2", sc.bg[1]);
        b.setAttribute("aria-label", `Scene ${k + 1}: ${sc.shot}`);
        b.innerHTML = `<span aria-hidden="true">${sc.art}</span><small>${k + 1}</small>`;
        b.addEventListener("click", () => { buzz(); stop(); paint(k); bar.style.width = `${((k + 1) / 4) * 100}%`; });
        li.appendChild(b);
        strip.appendChild(li);
      });
      sound.textContent = FILMS[story].sound;
    }
    function stop() { run += 1; playing = false; root.classList.remove("is-playing"); playBtn.textContent = "▶ Play the film"; }
    async function play() {
      const id = ++run;
      playing = true;
      root.classList.add("is-playing");
      playBtn.textContent = "❚❚ Pause";
      const scenes = FILMS[story].scenes;
      for (let k = 0; k < scenes.length; k++) {
        if (id !== run) return;
        paint(k);
        bar.style.transition = "none";
        bar.style.width = `${(k / scenes.length) * 100}%`;
        void bar.offsetWidth;
        bar.style.transition = reduce ? "none" : "width 1.9s linear";
        bar.style.width = `${((k + 1) / scenes.length) * 100}%`;
        await wait(2000);
      }
      if (id !== run) return;
      playing = false;
      root.classList.remove("is-playing");
      playBtn.textContent = "↻ Play it again";
    }
    playBtn.addEventListener("click", () => { buzz(); playing ? stop() : play(); });
    $$(root, "[data-film-ideas] button").forEach((chip, _, all) => chip.addEventListener("click", () => {
      buzz(6);
      all.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      story = chip.dataset.v;
      stop();
      buildStrip();
      paint(0);
      play();
    }));
    buildStrip();
    paint(0);
    whenSeen(root, () => { if (!reduce) play(); });
  });

  /* ---------- Home: switch between the Class 8–12 and BBA demos ---------- */
  document.querySelectorAll("[data-demo-switch]").forEach((sw) => {
    const tabs = $$(sw, "[role=tab]");
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const more = sw.closest("section").querySelector("[data-demo-more]");
    const pill = document.createElement("span");
    pill.className = "demo-switch-pill";
    pill.setAttribute("aria-hidden", "true");
    sw.prepend(pill);
    const place = (tab) => {
      pill.style.width = `${tab.offsetWidth}px`;
      pill.style.transform = `translateX(${tab.offsetLeft - 5}px)`;
    };
    function select(k, focus) {
      tabs.forEach((t, j) => {
        const on = j === k;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      place(tabs[k]);
      if (focus) tabs[k].focus();
      if (more) { more.href = panels[k].dataset.more; more.textContent = panels[k].dataset.moreText; }
      if (!reduce) $$(panels[k], ".build").forEach((b, j) => b.animate(
        [{ opacity: 0, transform: "translateY(22px) scale(.98)" }, { opacity: 1, transform: "none" }],
        { duration: 600, delay: j * 90, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
    }
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => { buzz(6); select(k); });
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          select((k + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length, true);
        }
      });
    });
    sw.classList.add("is-ready");
    tabs.forEach((t, j) => { t.tabIndex = j ? -1 : 0; panels[j].hidden = j !== 0; });
    requestAnimationFrame(() => place(tabs[0]));
    addEventListener("resize", () => place(tabs.find((t) => t.getAttribute("aria-selected") === "true")));
    document.fonts && document.fonts.ready.then(() => place(tabs.find((t) => t.getAttribute("aria-selected") === "true")));
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
