/* =========================================================================
   PACS AI – For schools: "Beyond the Blackboard"
   The hero's first exercise (an AI draft, then the teacher's check), the map
   of CBSE's sub-themes, two activities from the CBSE Class 8 handbook, two
   exercises on copying, and the Custom AI builder. Plain JavaScript; nothing
   leaves the page.
   ========================================================================= */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const press = (buttons, on) => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === on)));
  const seen = (el, fn, threshold = 0.2) => new IntersectionObserver((entries, io) => entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }), { threshold }).observe(el);
  const joinAnd = (xs) => (xs.length > 1 ? xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1] : xs[0]);
  if (!reduce && hasIO) document.documentElement.classList.add("sc-anim");
  const anim = document.documentElement.classList.contains("sc-anim");

  /* ---------- Hero: AI drafts in seconds, the teacher checks ---------- */
  // Each draft has one mistake of the kind AI really makes. The point of the
  // exercise is the check, not the speed. [question, draft answer, correction]
  const DRAFTS = {
    science: {
      prompt: "I teach Class 7 Science. Make a 4-question worksheet on photosynthesis, with answers.",
      items: [
        ["Which gas do plants take in to make food?", "Carbon dioxide"],
        ["What is the green pigment in leaves called?", "Chlorophyll"],
        ["Where in a plant does most photosynthesis happen?", "In the leaves"],
        ["Which gas do plants give out during photosynthesis?", "Carbon dioxide", "Oxygen"],
      ],
      flag: "Answer 4 is wrong. Plants give out oxygen, not carbon dioxide.",
    },
    maths: {
      prompt: "I teach Class 6 Maths. Make 4 questions on equivalent fractions, with answers.",
      items: [
        ["1/2 = ?/8", "4/8"],
        ["2/3 = 6/?", "9"],
        ["Is 3/4 equal to 6/8?", "Yes"],
        ["Write 12/16 in its simplest form.", "4/6", "3/4"],
      ],
      flag: "Answer 4 is wrong. 12/16 simplifies to 3/4, and 4/6 is not even in its simplest form.",
    },
    social: {
      prompt: "I teach Class 8 Social Science. Give 4 revision facts on the Indian Constitution.",
      items: [
        ["Adopted by the Constituent Assembly on", "26 November 1949"],
        ["Came into force on", "15 August 1950", "26 January 1950"],
        ["Chair of the Drafting Committee:", "Dr B. R. Ambedkar"],
        ["It opens with", "the Preamble"],
      ],
      flag: "Fact 2 is wrong. It came into force on 26 January 1950, which is why that day is Republic Day.",
    },
    english: {
      prompt: "I teach Class 7 English. Give 4 sentences for spotting the tense, with answers.",
      items: [
        ["She is reading a book.", "Present continuous"],
        ["They played cricket yesterday.", "Simple past"],
        ["I will call you tomorrow.", "Simple future"],
        ["He has finished his homework.", "Simple past", "Present perfect"],
      ],
      flag: "Answer 4 is wrong. “Has finished” is the present perfect.",
    },
  };
  const draft = $("[data-draft]");
  if (draft) {
    const subjects = $$("[data-subject]", draft);
    const steps = $$(".sc-draft-steps li", draft);
    const promptEl = $("[data-draft-prompt]", draft);
    const out = $("[data-draft-out]", draft);
    const again = $("[data-draft-run]", draft);
    let subject = "science";
    let run = 0;
    const step = (n) => steps.forEach((s, i) => s.classList.toggle("on", i <= n));
    const list = (d) => "<ol>" + d.items.map(([q, a, fixTo], i) => `<li style="--i:${i}">${esc(q)} <span class="sc-ans">${fixTo ? `<mark>${esc(a)}</mark>` : esc(a)}</span></li>`).join("") + "</ol>";
    const flag = (d) => out.insertAdjacentHTML("beforeend", `<p class="sc-flag"><b>Teacher check</b>${esc(d.flag)}</p>`);
    const fix = (d) => {
      const m = $("mark", out);
      if (m) { m.textContent = d.items.find((x) => x[2])[2]; m.classList.add("is-fixed"); }
      const f = $(".sc-flag", out);
      if (f) { f.classList.add("is-fixed"); f.innerHTML = "<b>Fixed by the teacher</b>Caught before it reached a single student. That check is what the training builds."; }
    };
    const play = async () => {
      const me = ++run;
      const live = () => me === run;
      const d = DRAFTS[subject];
      again.disabled = true;
      if (reduce) {
        promptEl.textContent = d.prompt; out.innerHTML = list(d); flag(d); fix(d); step(2);
        again.disabled = false;
        return;
      }
      out.innerHTML = ""; promptEl.textContent = ""; promptEl.classList.add("sc-caret"); step(0);
      for (let i = 2; i < d.prompt.length; i += 2) {
        if (!live()) return;
        promptEl.textContent = d.prompt.slice(0, i);
        await wait(16);
      }
      if (!live()) return;
      promptEl.textContent = d.prompt; promptEl.classList.remove("sc-caret");
      await wait(350); if (!live()) return;
      step(1); out.innerHTML = list(d);
      await wait(1500); if (!live()) return;
      step(2); flag(d);
      await wait(2400); if (!live()) return;
      fix(d);
      again.disabled = false;
    };
    subjects.forEach((b) => b.addEventListener("click", () => { press(subjects, b); subject = b.dataset.subject; play(); }));
    again.addEventListener("click", play);
    promptEl.textContent = DRAFTS[subject].prompt;
    if (hasIO && !reduce) seen(draft, () => setTimeout(play, 300), 0.15); else play();
  }

  /* ---------- CBSE's seven sub-themes, mapped to the programme ---------- */
  const themeBtns = $$("[data-themes] button");
  const themesOut = $("[data-themes-out]");
  if (themesOut) {
    const hint = themesOut.innerHTML;
    const cardFor = (k) => $(`[data-topic-card="${k}"]`);
    themeBtns.forEach((b) => b.addEventListener("click", () => {
      const off = b.getAttribute("aria-pressed") === "true";
      press(themeBtns, off ? null : b);
      $$("[data-topic-card]").forEach((c) => c.classList.remove("is-hit"));
      if (off) { themesOut.innerHTML = hint; return; }
      const keys = b.dataset.topics.split(",").filter(cardFor);
      keys.forEach((k) => cardFor(k).classList.add("is-hit"));
      const topics = keys.filter((k) => k !== "H").map((k) => k.padStart(2, "0"));
      const parts = [];
      if (topics.length) parts.push(`<b>Topic${topics.length > 1 ? "s" : ""} ${joinAnd(topics)}</b>`);
      if (keys.includes("H")) parts.push("<b>the handbook module</b>");
      themesOut.innerHTML = `Sub-theme ${esc(b.querySelector("span").textContent)} is covered in ${joinAnd(parts)}, marked in the programme. <a href="#hours">See it</a>`;
    }));
  }

  /* ---------- Handbook, AI Chapter 3: Data and Fairness ---------- */
  const CAT = (c) => `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 17 9 4l9 8M32 17 31 4l-9 8" fill="${c}"/><circle cx="20" cy="22" r="13" fill="${c}"/><circle cx="15" cy="20" r="1.8" fill="#111"/><circle cx="25" cy="20" r="1.8" fill="#111"/><path d="m18 25 2 2 2-2z" fill="#df1b2b"/><path d="M5 24h9M5 28l9-2M35 24h-9M35 28l-9-2" stroke="#111" stroke-width=".8"/></svg>`;
  const DOG = (c) => `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="8" cy="18" rx="5" ry="10" fill="#6b4a2f"/><ellipse cx="32" cy="18" rx="5" ry="10" fill="#6b4a2f"/><circle cx="20" cy="21" r="12" fill="${c}"/><ellipse cx="20" cy="28" rx="6" ry="4.5" fill="#f3e7d6"/><circle cx="15" cy="19" r="1.8" fill="#111"/><circle cx="25" cy="19" r="1.8" fill="#111"/><ellipse cx="20" cy="26" rx="2.4" ry="1.7" fill="#111"/></svg>`;
  const PETS = [["cat", "#f0a64a"], ["dog", "#c98a4b"], ["cat", "#8a8580"], ["dog", "#e8d2b0"], ["cat", "#3a3a3a"], ["dog", "#a86b3c"], ["cat", "#e7c08f"], ["dog", "#d9b48a"]];
  const fairGrid = $("[data-fair-grid]");
  if (fairGrid) {
    const inputs = { dog: $('[data-fair="dogs"]'), cat: $('[data-fair="cats"]') };
    const outs = { dog: $('[data-out="dogs"]'), cat: $('[data-out="cats"]') };
    const verdict = $("[data-fair-verdict]");
    const cap = (w) => w[0].toUpperCase() + w.slice(1);
    fairGrid.innerHTML = PETS.map(([k, c], i) => `<div class="sc-pet" style="--i:${i}">${k === "cat" ? CAT(c) : DOG(c)}<span></span><small></small></div>`).join("");
    const cards = [...fairGrid.children];
    // How often it gets a kind right: it leans towards whichever kind it saw
    // more of, and it needs about a dozen photos of a kind to learn it well.
    const skill = (self, other) => Math.min(self / Math.max(self, other), Math.min(1, self / 12));
    const update = () => {
      const n = { dog: +inputs.dog.value, cat: +inputs.cat.value };
      outs.dog.textContent = n.dog; outs.cat.textContent = n.cat;
      const p = { dog: skill(n.dog, n.cat), cat: skill(n.cat, n.dog) };
      const right = { dog: Math.round(p.dog * 4), cat: Math.round(p.cat * 4) };
      const count = { dog: 0, cat: 0 };
      cards.forEach((card, i) => {
        const kind = PETS[i][0], other = kind === "cat" ? "dog" : "cat";
        const ok = count[kind]++ < right[kind];
        const conf = Math.round(55 + 40 * p[ok ? kind : other]);
        card.className = "sc-pet " + (ok ? "ok" : "no");
        card.children[1].textContent = ok ? cap(kind) : cap(other) + "?";
        card.children[2].textContent = (ok ? "Right, " : "Wrong, ") + conf + "%";
      });
      const all = right.dog === 4 && right.cat === 4;
      verdict.classList.toggle("is-good", all);
      if (all) {
        verdict.innerHTML = "<b>All 8 right.</b> Balanced data, and enough of each. That is the fix the handbook asks students to find.";
      } else if (right.dog === right.cat) {
        verdict.innerHTML = `<b>${right.dog + right.cat} of 8 right.</b> Balanced, but too few photos of each to learn from. Add more of both.`;
      } else {
        const weak = right.dog < right.cat ? "dog" : "cat", strong = weak === "dog" ? "cat" : "dog";
        verdict.innerHTML = `<b>${right[weak]} of 4 ${weak}s right, ${right[strong]} of 4 ${strong}s.</b> It saw ${n[strong]} ${strong}s but only ${n[weak]} ${weak}s. The model is not unfair on purpose. The data was.`;
      }
    };
    Object.values(inputs).forEach((inp) => inp.addEventListener("input", update));
    update();
  }

  /* ---------- Handbook, AI Chapter 1: will the parcel arrive on time? ---------- */
  const cycleOut = $("[data-cycle-out]");
  if (cycleOut) {
    const tests = $$("#lifecycle .sc-test");
    const stages = $$("#lifecycle .sc-cycle li");
    const LOOK = {
      O5: "<b>Look again.</b> O5 is short, clear and quiet, with an experienced partner. Just like O1 and O3.",
      O6: "<b>Look again.</b> O6 is long, rainy and busy, with a new partner. Just like O2 and O4.",
    };
    tests.forEach((row) => $$("button", row).forEach((b) => b.addEventListener("click", () => {
      const right = b.dataset.v === row.dataset.answer;
      $$("button", row).forEach((x) => x.classList.remove("is-right", "is-wrong"));
      b.classList.add(right ? "is-right" : "is-wrong");
      row.dataset.done = right ? "1" : "";
      const left = tests.filter((r) => r.dataset.done !== "1");
      stages.forEach((s, i) => s.classList.toggle("on", i === (left.length ? 2 : 3)));
      if (!right) cycleOut.innerHTML = LOOK[row.dataset.order];
      else if (left.length) cycleOut.innerHTML = `<b>Right.</b> Now predict ${left[0].dataset.order}.`;
      else cycleOut.innerHTML = "<b>Both right.</b> You learnt a rule from four examples and tested it on new ones. That is what a model does with data. Then the class measures it: 8 right out of 10 is 80% accuracy.";
    })));
  }

  /* ---------- Topic 06: redesign the homework ---------- */
  const REDESIGN = {
    climate: {
      task: "Ask an AI to explain climate change. Pick two claims from its answer and check both in your textbook. Find one part you would improve, rewrite it in your own words, and explain why you changed it.",
      patterns: ["Critique AI", "Explain the process"],
      oral: ["Which claim did you check, and where?", "What did you change, and why?"],
    },
    energy: {
      task: "Design a renewable-energy proposal for our school. Use AI to explore the options. State your assumptions, list what you still need to find out, and explain why your choice may or may not work.",
      patterns: ["Add local context", "Build from AI"],
      oral: ["Where did AI help?", "What would you measure at school to be sure?"],
    },
    story: {
      task: "Get three story ideas from AI. Reject two and say why. Develop the third, change at least two of its suggestions, and explain each decision.",
      patterns: ["Build from AI", "Explain the process"],
      oral: ["Why did you reject the first two?", "Which change are you proudest of?"],
    },
    water: {
      task: "Design a water-conservation campaign for our school: one poster, one thirty-second announcement, and one measurable action the school could test.",
      patterns: ["Add local context", "Build from AI"],
      oral: ["How will we know if your action worked?", "What did you change from the AI's first idea?"],
    },
  };
  const rTask = $("[data-redesign-task]");
  if (rTask) {
    const risk = $("[data-redesign-risk]");
    const go = $("[data-redesign-go]");
    const rOut = $("[data-redesign-out]");
    const setRisk = (high) => {
      risk.style.setProperty("--rv", high ? ".9" : ".16");
      risk.style.setProperty("--rc", high ? "#df1b2b" : "#2e8b4a");
      risk.querySelector("em").textContent = high ? "High" : "Low";
    };
    const reset = () => { setRisk(true); rOut.hidden = true; rOut.innerHTML = ""; go.disabled = false; go.textContent = "Redesign it"; };
    rTask.addEventListener("change", reset);
    go.addEventListener("click", () => {
      const d = REDESIGN[rTask.value];
      rOut.innerHTML =
        `<p class="sc-label" style="--i:0">The redesigned task</p>` +
        `<p class="sc-redesign-task" style="--i:1">${esc(d.task)}</p>` +
        `<div class="sc-patterns" style="--i:2">${d.patterns.map((p) => `<span>${esc(p)}</span>`).join("")}</div>` +
        `<p class="sc-oral" style="--i:3"><b>Then ask, face to face:</b> ${d.oral.map(esc).join(" ")}</p>`;
      rOut.hidden = false;
      setRisk(false);
      go.disabled = true; go.textContent = "Redesigned";
    });
    reset();
  }

  /* ---------- Topic 04: more questions, or better ones? ---------- */
  const QS = {
    basic: {
      prompt: "Give me ten questions about pollution.",
      mix: { recall: 8, understand: 2, apply: 0, reason: 0 },
      list: [
        ["recall", "What is pollution?"],
        ["recall", "Name two types of pollution."],
        ["recall", "Name one gas that pollutes the air."],
        ["understand", "Why is smoke from vehicles harmful?"],
      ],
      more: "And six more like these. Every answer is in the textbook, and in any AI.",
    },
    better: {
      prompt: "Create eight questions on pollution: two recall, two understanding, two application and two reasoning. At least one should make the student defend a decision.",
      mix: { recall: 2, understand: 2, apply: 2, reason: 2 },
      list: [
        ["recall", "Name two gases given out when petrol burns."],
        ["understand", "Why is the air often worse on winter mornings?"],
        ["apply", "Forty vehicles drop students at our gate each morning. Suggest one change, and say what it would reduce."],
        ["reason", "A factory brings 500 jobs but pollutes the river. Should the town allow it? Defend your decision."],
      ],
      more: "And four more. The reasoning ones cannot be answered by copying.",
    },
  };
  const qTabs = $$("[data-q-tabs] button");
  if (qTabs.length) {
    const qPrompt = $("[data-q-prompt]");
    const qMix = $("[data-q-mix]");
    const qList = $("[data-q-list]");
    const LABEL = { recall: "Recall", understand: "Understand", apply: "Apply", reason: "Reason" };
    qMix.innerHTML = Object.keys(LABEL).map((k) => `<i data-k="${k}"></i>`).join("");
    const show = (v) => {
      const d = QS[v];
      qTabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.v === v)));
      qPrompt.textContent = d.prompt;
      $$("i", qMix).forEach((i) => i.style.setProperty("--n", d.mix[i.dataset.k]));
      qList.innerHTML = d.list.map(([k, q], i) => `<li style="--i:${i}"><em data-k="${k}">${LABEL[k]}</em><span>${esc(q)}</span></li>`).join("") +
        `<li class="sc-more-q" style="--i:${d.list.length}">${esc(d.more)}</li>`;
    };
    qTabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.v)));
    show("basic");
  }

  /* ---------- Topic 08: the Custom AI builder ---------- */
  const builder = $("[data-builder]");
  if (builder) {
    const cls = $('[data-b="class"]', builder);
    const subj = $('[data-b="subject"]', builder);
    const taskBtns = $$("[data-b-tasks] button", builder);
    const bOut = $("[data-b-out]", builder);
    const copy = $("[data-b-copy]", builder);
    // [a rule for the subject, [a first-test topic for Classes 6 to 8, for 9 and 10]]
    const SUBJECT = {
      "Science": ["Suggest experiments that use ordinary classroom materials.", ["heat transfer", "the laws of motion"]],
      "Mathematics": ["Show every step of working, and one common mistake to watch for.", ["equivalent fractions", "linear equations in two variables"]],
      "Social Science": ["Give dates and names only when you are sure, and say when you are not.", ["the Indian Constitution", "how elections work"]],
      "English": ["Use Indian English spelling, and simple words in the instructions.", ["reported speech", "reported speech"]],
      "Computational Thinking and AI": ["Prefer unplugged activities that need no computer.", ["patterns and algorithms", "how a model learns from data"]],
    };
    const TASK_RULES = {
      "question papers": "For question papers, mix recall, understanding, application and reasoning questions.",
      "parent messages": "For parent messages, keep a polite tone and short sentences.",
    };
    const build = () => {
      const c = cls.value, s = subj.value, age = +c + 5;
      const tasks = taskBtns.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.v);
      const rules = [`Use language a ${age}-year-old understands.`, "Do not invent facts. Mark anything I should check.", SUBJECT[s][0], "Never ask for students’ names, marks or personal details."];
      const output = ["Keep it short unless I ask for more.", "Give worksheets a clear structure and an answer key."];
      tasks.forEach((t) => { if (TASK_RULES[t]) output.push(TASK_RULES[t]); });
      const lines = [
        ["Role", `You are my teaching assistant for Class ${c} ${s}.`],
        ["Context", `My students are about ${age}, in a CBSE school in India.`],
        ["Tasks", `Help me with ${tasks.length ? joinAnd(tasks) : "whatever I ask"}.`],
        ["Rules", rules.join(" ")],
        ["Output", output.join(" ")],
        ["First test", `“Help me teach ${SUBJECT[s][1][+c > 8 ? 1 : 0]} tomorrow.”`],
      ];
      bOut.innerHTML = lines.map(([k, v]) => `<b>${k}</b>\n${esc(v)}`).join("\n\n");
    };
    cls.addEventListener("change", build);
    subj.addEventListener("change", build);
    taskBtns.forEach((b) => b.addEventListener("click", () => { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); build(); }));
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(bOut.textContent); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(bOut);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        try { document.execCommand("copy"); } catch (e2) { /* the text stays selected for a manual copy */ }
      }
      copy.textContent = "Copied"; copy.classList.add("is-done");
      setTimeout(() => { copy.textContent = "Copy"; copy.classList.remove("is-done"); }, 1800);
    });
    build();
  }

  /* ---------- Things arrive as they come into view ---------- */
  if (anim) {
    $$("[data-reveal-group], [data-sessions], .sc-themes").forEach((g) => { [...g.children].forEach((c, i) => c.style.setProperty("--i", i)); seen(g, (x) => x.classList.add("is-in"), 0.12); });
  }

  /* ---------- The session cards ---------- */
  const flips = $$(".sc-flip");
  flips.forEach((f) => f.addEventListener("click", () => f.setAttribute("aria-pressed", String(f.getAttribute("aria-pressed") !== "true"))));
  const sessions = $("[data-sessions]");
  if (sessions && anim) {
    // Once, as the cards arrive: the first one turns over to show there is a back
    seen(sessions, () => setTimeout(() => {
      flips[0].setAttribute("aria-pressed", "true");
      setTimeout(() => flips[0].setAttribute("aria-pressed", "false"), 1600);
    }, 900), 0.4);
  }
  // Phones: dots under the swipeable deck
  const dotBox = $("[data-session-dots]");
  if (sessions && dotBox) {
    dotBox.innerHTML = flips.map(() => "<i></i>").join("");
    const dots = [...dotBox.children];
    let queued = false;
    const mark = () => {
      queued = false;
      const w = sessions.firstElementChild.getBoundingClientRect().width + 12;
      const k = Math.min(dots.length - 1, Math.round(sessions.scrollLeft / w));
      dots.forEach((d, i) => d.classList.toggle("on", i === k));
    };
    sessions.addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(mark); } }, { passive: true });
    requestAnimationFrame(mark);
  }
  // The spine: tap a block to bring its card forward
  const spine = $$("[data-spine] button");
  spine.forEach((b, i) => b.addEventListener("click", () => {
    spine.forEach((x) => x.classList.toggle("is-lit", x === b));
    const card = flips[i];
    if (!card) return;
    if (sessions && sessions.scrollWidth > sessions.clientWidth + 4) sessions.scrollTo({ left: card.parentElement.offsetLeft - sessions.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
    else card.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    card.setAttribute("aria-pressed", "true");
  }));
})();
