/* =========================================================================
   PACS AI – demos for the AI for everyone skills (Try the demos page)
   Every skill on learn.html links to a demo. These are the ones built for
   skills that had none. Plain JavaScript; the voiceover uses the browser's
   own speech. People, shops, products and numbers are made up.
   ========================================================================= */
(function () {
  // Restart a CSS animation without forcing the page to re-measure itself (the old
  // remove-class, read offsetWidth, add-class trick costs a full layout, which hurts on slow phones)
  const replayAnim = (el, cls) => { if (el.classList.contains(cls) && el.getAnimations) el.getAnimations({ subtree: true }).forEach((a) => { a.cancel(); a.play(); }); else el.classList.add(cls); };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 40) : ms));
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => [...root.querySelectorAll(sel)];
  const buzz = (p = 6) => { try { if (!reduce && matchMedia("(pointer: coarse)").matches && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not allowed */ } };
  const rupees = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const dots = '<span class="ask-dots" aria-label="Working"><i></i><i></i><i></i></span>';
  // Chip groups: one chosen at a time (radio) or any number (toggle)
  function radio(group, fn) {
    $$(group, "button").forEach((b, _, all) => b.addEventListener("click", () => {
      buzz(); all.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); fn(b.dataset.v, b);
    }));
  }
  function toggles(group, fn) {
    $$(group, "button").forEach((b) => b.addEventListener("click", () => {
      buzz(); b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); fn();
    }));
  }
  const on = (group) => $$(group, 'button[aria-pressed="true"]').map((b) => b.dataset.v);
  async function typeInto(el, html, id, getRun) {
    if (reduce) { el.innerHTML = html; return; }
    const tmp = document.createElement("div"); tmp.innerHTML = html;
    const text = tmp.textContent;
    el.classList.add("is-typing");
    for (let i = 2; i <= text.length; i += 3) { if (id !== getRun()) return; el.textContent = text.slice(0, i); await wait(8); }
    el.innerHTML = html; el.classList.remove("is-typing");
  }

  /* ---------------- Find the right AI tool ---------------- */
  const TOOLS = [
    { name: "ChatGPT", free: true, phone: true, fit: { essay: 92, pdf: 80, kannada: 72, excel: 70, logo: 74, website: 60 }, note: "Great first drafts and brainstorming. Check facts it gives you." },
    { name: "Gemini", free: true, phone: true, fit: { essay: 88, pdf: 84, kannada: 86, excel: 74, website: 58 }, note: "Strong with Indian languages and works inside Google Docs and Sheets." },
    { name: "Claude", free: true, phone: true, fit: { essay: 90, pdf: 88, excel: 68, website: 66 }, note: "Careful writing and long documents. Good at following your style." },
    { name: "NotebookLM", free: true, phone: true, fit: { pdf: 95, essay: 60 }, note: "Upload your PDFs and notes, then ask questions. Answers point to the page." },
    { name: "Canva", free: true, phone: true, fit: { logo: 90, reel: 72, website: 62 }, note: "Templates plus AI for posts, logos and simple videos." },
    { name: "CapCut", free: true, phone: true, fit: { reel: 94 }, note: "Auto-captions, trending templates and quick edits for reels." },
    { name: "Suno", free: true, phone: true, fit: { song: 95 }, note: "Turns your lyrics into a full song. The free plan is enough to start." },
    { name: "Udio", free: true, phone: false, fit: { song: 86 }, note: "Another song maker. Good for trying different styles." },
    { name: "Google Translate", free: true, phone: true, fit: { kannada: 80 }, note: "Fast for Kannada and Hindi, including photos of signs and letters." },
    { name: "Copilot in Excel", free: false, phone: false, fit: { excel: 92 }, note: "Ask questions of your spreadsheet in plain English. Needs a Microsoft 365 plan." },
    { name: "Wix", free: true, phone: true, fit: { website: 84 }, note: "Describe your business and it drafts a whole site you can edit." },
    { name: "Lovable", free: true, phone: false, fit: { website: 88 }, note: "Build a website or app just by chatting. Free plan has limits." },
    { name: "Looka", free: false, phone: true, fit: { logo: 84 }, note: "Generates logo and brand kits. Downloads need a paid plan." },
  ];
  document.querySelectorAll("[data-tools]").forEach((root) => {
    const out = $(root, "[data-tf-out]");
    let task = "essay";
    function render() {
      const free = $(root, '[data-tf-free]').getAttribute("aria-pressed") === "true";
      const phone = $(root, '[data-tf-phone]').getAttribute("aria-pressed") === "true";
      const list = TOOLS.filter((t) => t.fit[task] && (!free || t.free) && (!phone || t.phone)).sort((a, b) => b.fit[task] - a.fit[task]).slice(0, 3);
      out.innerHTML = list.length ? list.map((t, i) => `<li class="tf-tool" style="--fit:${t.fit[task]}%"><span class="tf-rank">${i + 1}</span><div><b>${t.name}</b><p>${t.note}</p><span class="tf-tags"><em class="${t.free ? "ok" : ""}">${t.free ? "Free plan" : "Paid"}</em>${t.phone ? "<em>Works on a phone</em>" : ""}</span></div><span class="tf-fit"><b>${t.fit[task]}%</b><small>fit</small></span></li>`).join("")
        : '<li class="tf-none">No tool matches both filters. Try turning one off.</li>';
      $$(out, "li").forEach((li, i) => li.animate && !reduce && li.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 350, delay: i * 70, fill: "backwards" }));
    }
    radio($(root, "[data-tf-task]"), (v) => { task = v; render(); });
    $$(root, "[data-tf-free], [data-tf-phone]").forEach((b) => b.addEventListener("click", () => { buzz(); b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); render(); }));
    render();
  });

  /* ---------------- Know when to trust AI: spot the made-up line ---------------- */
  const TRUST = [
    { q: "Tell me about ISRO.", lines: ["ISRO was set up in 1969.", "Chandrayaan-3 landed near the Moon's south pole in 2023.", "ISRO's headquarters are in Bengaluru.", "India's first satellite, Aryabhata, was launched from Sriharikota in 1975."], wrong: 3,
      why: "Aryabhata did go up in 1975, but on a Soviet rocket from the USSR, not from Sriharikota. The rest is true. AI mixes a real fact with a wrong detail, and says both with the same confidence." },
    { q: "Should I take antibiotics for a cold?", lines: ["Colds are usually caused by viruses.", "Antibiotics don't work against viruses.", "Taking antibiotics you don't need helps bacteria become resistant.", "Antibiotics shorten a cold by about three days."], wrong: 3,
      why: "Antibiotics don't shorten a cold at all. The made-up line even has a neat number, which makes it sound more believable. With health, always check with a doctor or an official health website." },
    { q: "Tell me about Mahatma Gandhi.", lines: ["He was born in Porbandar in 1869.", "He led the Salt March in 1930.", "He studied law in London.", "He wrote the words “Be the change you wish to see in the world.”"], wrong: 3,
      why: "There's no record of Gandhi writing those exact words. It's a popular paraphrase. AI repeats famous misquotes because they appear so often online. Check quotes before you use them." },
  ];
  document.querySelectorAll("[data-trust]").forEach((root) => {
    const q = $(root, "[data-tr-q]"), lines = $(root, "[data-tr-lines]"), result = $(root, "[data-tr-result]"), scoreEl = $(root, "[data-tr-score]"), next = $(root, "[data-tr-next]");
    let at = 0, score = 0, answered = false;
    function show() {
      const r = TRUST[at]; answered = false;
      q.textContent = r.q;
      result.hidden = true; next.hidden = true;
      lines.innerHTML = r.lines.map((l, i) => `<button type="button" class="tr-line" data-i="${i}">${l}</button>`).join("");
      $$(lines, "button").forEach((b) => b.addEventListener("click", () => pick(+b.dataset.i)));
      scoreEl.textContent = `Round ${at + 1} of ${TRUST.length} · Score ${score}`;
    }
    function pick(i) {
      if (answered) return; answered = true; buzz(10);
      const r = TRUST[at], right = i === r.wrong;
      if (right) score++;
      $$(lines, "button").forEach((b, j) => { b.classList.toggle("is-wrong", j === r.wrong); b.classList.toggle("is-picked", j === i && !right); b.disabled = true; });
      result.hidden = false;
      result.innerHTML = `<b>${right ? "You caught it." : "That one's actually true."}</b> ${r.why}`;
      result.dataset.good = String(right);
      scoreEl.textContent = `Round ${at + 1} of ${TRUST.length} · Score ${score}`;
      next.hidden = false;
      next.innerHTML = at === TRUST.length - 1 ? 'See your result <span aria-hidden="true">→</span>' : 'Next answer <span aria-hidden="true">→</span>';
    }
    next.addEventListener("click", () => {
      buzz();
      if (at === TRUST.length - 1) {
        lines.innerHTML = ""; q.textContent = `You caught ${score} of ${TRUST.length}.`;
        result.dataset.good = String(score >= 2);
        result.innerHTML = "<b>Three things to always double-check:</b> exact dates and numbers, quotes, and anything about health or money. AI can be wrong while sounding completely sure.";
        next.innerHTML = 'Play again <span aria-hidden="true">↻</span>'; at = -1; score = 0; return;
      }
      at++; show();
    });
    show();
  });

  /* ---------------- Say it more clearly ---------------- */
  const CLEAR = {
    notice: ["Pursuant to the directive issued by the management, all personnel are hereby requested to ensure the timely submission of their attendance records, failing which the disbursement of the monthly remuneration may be subject to an unavoidable delay.",
      "Management has asked all staff to submit attendance records on time. If records are late, salaries may be paid late.",
      "Please send your attendance on time. If you're late, your salary could be late too.",
      "Attendance late means salary late. Please submit on time."],
    bank: ["We wish to inform you that, consequent to the non-maintenance of the stipulated minimum average balance in your savings account during the preceding quarter, applicable charges have been levied in accordance with the prevailing schedule of charges.",
      "Your savings account balance was below the required minimum last quarter, so the bank has charged a fee under its current rules.",
      "Your balance went below the minimum, so the bank took a fee.",
      "Low balance last quarter. A fee was charged."],
    science: ["Photosynthesis constitutes the biochemical process through which chlorophyll-containing organisms transduce electromagnetic radiation into chemical potential energy, subsequently utilised in the synthesis of carbohydrates from atmospheric carbon dioxide and water.",
      "Photosynthesis is how plants use light energy to turn carbon dioxide and water into sugar.",
      "Plants use sunlight to make their own food from air and water.",
      "Sunlight, air and water become plant food."],
  };
  const LEVELS = ["Original", "Clear", "Simple", "One line"];
  document.querySelectorAll("[data-clear]").forEach((root) => {
    const text = $(root, "[data-cl-text]"), range = $(root, "[data-cl-level]"), label = $(root, "[data-cl-label]");
    const m = { words: $(root, "[data-cl-words]"), sent: $(root, "[data-cl-sent]"), long: $(root, "[data-cl-long]"), grade: $(root, "[data-cl-grade]") };
    let sample = "notice";
    function render() {
      const t = CLEAR[sample][+range.value];
      label.textContent = LEVELS[+range.value];
      text.textContent = t;
      replayAnim(text, "is-new");
      // Real measurements of the text on screen
      const words = t.split(/\s+/).filter(Boolean);
      const sentences = t.split(/[.!?]+/).filter((x) => x.trim()).length || 1;
      const avg = words.length / sentences;
      const longShare = words.filter((w) => w.replace(/[^a-z]/gi, "").length >= 9).length / words.length;
      m.words.textContent = words.length;
      m.sent.textContent = avg.toFixed(0);
      m.long.textContent = Math.round(longShare * 100) + "%";
      const hard = avg > 25 || longShare > .25 ? 2 : avg > 14 || longShare > .12 ? 1 : 0;
      m.grade.textContent = ["Easy: anyone can read it", "Medium: Class 10 level", "Hard: degree level"][hard];
      m.grade.dataset.level = String(hard);
    }
    radio($(root, "[data-cl-sample]"), (v) => { sample = v; render(); });
    range.addEventListener("input", () => { render(); buzz(4); });
    render();
  });

  /* ---------------- Explain it at my level ---------------- */
  const EXPLAIN = {
    inflation: { ask: "If prices rise 10% this year, how much does ₹110 buy compared with ₹100 last year?", levels: [
      "Inflation is when the same ₹100 buys fewer things than before. If a chocolate cost ₹10 last year and ₹12 now, that's inflation.",
      "Inflation is the rate at which prices rise across the economy, so each rupee buys a little less. The RBI tries to keep it around 4% a year by changing interest rates.",
      "Inflation comes from demand outgrowing supply, rising costs, or more money chasing the same goods. Central banks raise interest rates to cool borrowing and spending, which slows price rises but can also slow growth.",
      "Measured through the CPI, inflation reflects demand-pull and cost-push pressures as well as expectations. Under inflation targeting, the RBI's repo rate works through credit, exchange-rate and expectation channels, with lags of several quarters."] },
    blackhole: { ask: "Why can't we see a black hole directly?", levels: [
      "A black hole is a place where gravity is so strong that nothing, not even light, can get out. It's like a drain so strong that even the shine on the water gets pulled in.",
      "When a huge star collapses, its matter is squeezed into a tiny space. Gravity there is so strong that escaping would need a speed faster than light, so no light leaves the region inside the event horizon.",
      "A black hole is a region where spacetime curves so strongly that every path inside the event horizon leads inward. Its size grows with its mass: about 3 km of radius for every Sun's worth of mass.",
      "In general relativity, the Schwarzschild solution puts the event horizon at r = 2GM/c². Hawking radiation implies black holes slowly lose mass, with a temperature inversely proportional to that mass."] },
    upi: { ask: "What does your UPI PIN prove when you pay?", levels: [
      "UPI lets you send money from your phone to anyone's phone in seconds. It's like passing a note to your bank saying “move ₹50 to my friend”, and the bank does it instantly.",
      "UPI links your bank account to an ID like name@bank. When you pay, your app asks your bank to send money to the other person's bank, and you approve it with your UPI PIN.",
      "UPI is run by the NPCI. A payment request travels from your app through the NPCI's switch to your bank and the receiver's bank, and the money is credited in real time, day or night.",
      "UPI adds an addressing layer (VPAs) on top of real-time payment rails. The NPCI's switch handles authorisation and routing, with two-factor security from device binding plus the UPI PIN, while banks settle with each other in cycles through the day."] },
  };
  const WHO = ["Age 10", "Class 12", "College", "Expert"];
  document.querySelectorAll("[data-explain]").forEach((root) => {
    const out = $(root, "[data-ex-text]"), range = $(root, "[data-ex-level]"), label = $(root, "[data-ex-label]"), check = $(root, "[data-ex-check]");
    let topic = "inflation";
    function render() {
      const lvl = +range.value;
      label.textContent = WHO[lvl];
      out.textContent = EXPLAIN[topic].levels[lvl];
      replayAnim(out, "is-new");
      check.textContent = EXPLAIN[topic].ask;
      root.style.setProperty("--lvl", lvl);
    }
    radio($(root, "[data-ex-topic]"), (v) => { topic = v; render(); });
    range.addEventListener("input", () => { render(); buzz(4); });
    render();
  });

  /* ---------------- Summarise a messy meeting ---------------- */
  const MEETING = [
    ["Priya", "Okay, the Diwali sale. Are we doing it from the 20th or the 25th?"],
    ["Arun", "20th is better, people get salary by then… actually no, salary mostly comes on the 1st."],
    ["Priya", "Hmm. Let's say the 25th then. Final."],
    ["Neha", "I can do the Instagram posts, but I need the product photos by Friday."],
    ["Arun", "I'll shoot them Thursday. Oh, and the printer said banners take 5 days."],
    ["Priya", "Then banners must be ordered by Monday. Arun?"],
    ["Arun", "Yeah yeah, I'll order Monday."],
    ["Neha", "What discount are we giving? 10 or 15?"],
    ["Priya", "Let me check the margins and tell you tomorrow."],
  ];
  const SUMMARY = {
    actions: `<p class="mt-k">Decided</p><p>The Diwali sale starts on the <b>25th</b>.</p><p class="mt-k">Who does what</p><table class="mt-table"><tr><th>Who</th><th>What</th><th>By</th></tr><tr><td>Arun</td><td>Shoot the product photos</td><td>Thursday</td></tr><tr><td>Neha</td><td>Instagram posts, once photos arrive</td><td>From Friday</td></tr><tr><td>Arun</td><td>Order banners (they take 5 days)</td><td>Monday</td></tr><tr><td>Priya</td><td>Decide the discount: 10% or 15%</td><td>Tomorrow</td></tr></table><p class="mt-k">Still open</p><p>The discount, waiting on margins.</p>`,
    whatsapp: `<p class="mt-wa">Quick update, team:<br>Sale starts on the 25th.<br>Arun: photos on Thursday, banners ordered by Monday.<br>Neha: Instagram posts from Friday.<br>Priya: discount (10% or 15%) confirmed by tomorrow.</p>`,
    email: `<p class="mt-mail"><b>Subject: Diwali sale plan</b><br><br>Hi Sir,<br><br>We've fixed the Diwali sale for the 25th. Product photos will be shot on Thursday and banners ordered on Monday, since they take 5 days to print. Instagram posts start on Friday. I'll confirm the discount, 10% or 15%, by tomorrow once I've checked our margins.<br><br>Regards,<br>Priya</p>`,
  };
  document.querySelectorAll("[data-meeting]").forEach((root) => {
    const log = $(root, "[data-mt-log]"), out = $(root, "[data-mt-out]"), go = $(root, "[data-mt-go]");
    log.innerHTML = MEETING.map(([who, t]) => `<p><b>${who}</b>${t}</p>`).join("");
    let fmt = "actions", run = 0, done = false;
    async function summarise() {
      const id = ++run; done = true;
      out.innerHTML = `<p class="mt-working">${dots} Reading 9 messages…</p>`;
      await wait(900);
      if (id !== run) return;
      out.innerHTML = `<p class="mt-stat">9 messages in. 1 decision, 4 jobs and 1 open question out.</p>${SUMMARY[fmt]}`;
      replayAnim(out, "is-new");
    }
    go.addEventListener("click", () => { buzz(); summarise(); });
    radio($(root, "[data-mt-fmt]"), (v) => { fmt = v; if (done) summarise(); });
  });

  /* ---------------- Describe a picture into existence ---------------- */
  const SCENES = {
    sunrise: { sky: ["#FF9E7A", "#FFE1B0"], orb: "#FF6B3D", far: "#E7A07B", near: "#B5654C", ground: "#6B3A2C", sea: "#F2B38F" },
    night: { sky: ["#0A1230", "#2A3566"], orb: "#F4EFD6", far: "#26315F", near: "#1A2248", ground: "#0F1430", sea: "#1F2B5A" },
  };
  function sceneSVG(o) {
    const neon = o.style === "neon", paper = o.style === "paper", water = o.style === "water";
    let c = SCENES[o.time];
    if (neon) c = { sky: ["#0D0221", "#2B0B5A"], orb: "#FF3CAC", far: "#1B0B3A", near: "#140827", ground: "#0A0418", sea: "#16063A" };
    const stroke = neon ? ' stroke="#00F5D4" stroke-width="1.6"' : "";
    const f = neon ? ' filter="url(#glow)"' : paper ? ' filter="url(#cut)"' : water ? ' filter="url(#wash)"' : "";
    const night = o.time === "night" || neon;
    let subject = "";
    if (o.subject === "lighthouse") {
      subject = `<path d="M232 176 244 92h16l12 84Z" fill="${neon ? "#1B0B3A" : "#F4F1EA"}"${stroke}/><path d="M238 150h32M241 128h26M244 108h20" stroke="${neon ? "#FF3CAC" : "#D1343F"}" stroke-width="6"/><rect x="243" y="80" width="18" height="13" fill="${night ? "#FFE58A" : "#2B2B2B"}"/><path d="M240 80h24l-12-12Z" fill="${neon ? "#FF3CAC" : "#D1343F"}"/>${night ? '<path d="M261 86 330 62v44Z" fill="#FFE58A" opacity=".35"/>' : ""}<path d="M214 180c10-8 22-10 40-8s30 4 44 10Z" fill="${c.ground}"${stroke}/>`;
    } else if (o.subject === "beach") {
      const palm = (x, s) => `<path d="M${x} 180c2-26 6-48 16-70" stroke="${neon ? "#00F5D4" : "#5A3A22"}" stroke-width="${5 * s}" fill="none"/><path d="M${x + 16} 110c-18-8-34-4-44 6 14-2 28 0 44-6Zm0 0c16-12 34-12 46-2-16 0-30 0-46 2Zm0 0c-6-16-2-30 8-38-2 14-4 26-8 38Zm0 0c14 2 26 12 30 24-12-8-22-14-30-24Z" fill="${neon ? "#FF3CAC" : night ? "#1E3B2A" : "#2F7A45"}"/>`;
      subject = `<rect x="0" y="150" width="320" height="30" fill="${c.sea}"/>${palm(60, 1)}${palm(98, .8)}<path d="M0 182c60-10 140-12 320 0v38H0Z" fill="${neon ? "#1B0B3A" : night ? "#3A3550" : "#E8C38F"}"${stroke}/>`;
    } else {
      const heights = [70, 104, 84, 120, 76, 96, 62];
      subject = heights.map((h, i) => {
        const x = 40 + i * 36, y = 190 - h;
        const wins = Array.from({ length: Math.floor(h / 18) }, (_, k) => `<rect x="${x + 7}" y="${y + 8 + k * 16}" width="6" height="7" fill="${night ? (k + i) % 3 ? "#FFE58A" : "#394067" : "#9FB3C8"}"/><rect x="${x + 19}" y="${y + 8 + k * 16}" width="6" height="7" fill="${night ? (k + i) % 2 ? "#FFE58A" : "#394067" : "#9FB3C8"}"/>`).join("");
        return `<rect x="${x}" y="${y}" width="32" height="${h}" fill="${neon ? "#140827" : night ? "#1B2146" : "#5B6B82"}"${stroke}/>${wins}`;
      }).join("");
    }
    const birds = o.birds ? `<g fill="none" stroke="${night ? "#E8E6F0" : "#2B2B2B"}" stroke-width="2" stroke-linecap="round"><path d="M70 60q6-6 12 0q6-6 12 0"/><path d="M104 44q5-5 10 0q5-5 10 0"/><path d="M130 66q4-4 8 0q4-4 8 0"/></g>` : "";
    const rain = o.rain ? `<g stroke="${neon ? "#00F5D4" : "#CFE3F7"}" stroke-width="1.4" opacity=".7">${Array.from({ length: 46 }, (_, i) => { const x = (i * 53) % 330, y = (i * 37) % 200; return `<path d="M${x} ${y}l-6 14"/>`; }).join("")}</g>` : "";
    return `<svg viewBox="0 0 320 220" class="im-svg" role="img" aria-label="${esc(o.prompt)}"><defs>
      <linearGradient id="imsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky[0]}"/><stop offset="1" stop-color="${c.sky[1]}"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="cut"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity=".35"/></filter>
      <filter id="wash"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="7"/><feGaussianBlur stdDeviation=".6"/></filter>
    </defs>
    <rect width="320" height="220" fill="url(#imsky)"/>
    ${night && !neon ? Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 71) % 320}" cy="${(i * 29) % 110}" r="${i % 3 ? .8 : 1.3}" fill="#fff" opacity=".8"/>`).join("") : ""}
    <circle cx="${night ? 250 : 80}" cy="${night ? 48 : 120}" r="${night ? 18 : 30}" fill="${c.orb}"${neon ? ' filter="url(#glow)"' : ""}/>
    <g${f}><path d="M0 140c40-26 80-36 130-20s90 10 190-12v112H0Z" fill="${c.far}"${stroke}/><path d="M0 168c50-18 110-24 170-8s100 8 150-2v62H0Z" fill="${c.near}"${stroke}/>${subject}</g>
    ${birds}${rain}${water ? '<rect width="320" height="220" fill="#fff" opacity=".08"/>' : ""}</svg>`;
  }
  document.querySelectorAll("[data-image]").forEach((root) => {
    const canvas = $(root, "[data-im-canvas]"), prompt = $(root, "[data-im-prompt]");
    const o = { subject: "lighthouse", style: "water", time: "sunrise", birds: false, rain: false };
    const NAMES = { lighthouse: "A lighthouse on the rocks", beach: "A beach with coconut palms", city: "A city skyline", water: "watercolour", neon: "neon", paper: "paper-cut", sunrise: "at sunrise", night: "at night" };
    let run = 0;
    async function render() {
      const id = ++run;
      o.prompt = `${NAMES[o.subject]} ${NAMES[o.time]}, ${NAMES[o.style]} style${o.birds ? ", birds flying" : ""}${o.rain ? ", in the rain" : ""}`;
      prompt.textContent = o.prompt;
      canvas.classList.add("is-generating");
      await wait(450);
      if (id !== run) return;
      canvas.innerHTML = sceneSVG(o);
      canvas.classList.remove("is-generating");
    }
    ["subject", "style", "time"].forEach((k) => radio($(root, `[data-im-${k}]`), (v) => { o[k] = v; render(); }));
    toggles($(root, "[data-im-edit]"), () => { const e = on($(root, "[data-im-edit]")); o.birds = e.includes("birds"); o.rain = e.includes("rain"); render(); });
    render();
  });

  /* ---------------- AI voiceover studio (the browser's own speech) ---------------- */
  const SCRIPTS = {
    reel: "Three things nobody tells you about your first job. One: your manager wants updates, not surprises. Two: write everything down. Three: lunch with your team matters more than you think.",
    ad: "Fresh at seven thirty, gone by nine. Warm buns, strong chai and breakfast combos, every weekday. Pre-order on WhatsApp and skip the queue.",
    story: "Once upon a time, a little robot woke up in an empty city. Its screen blinked: home not found. So it started walking, and it never walked alone again.",
  };
  document.querySelectorAll("[data-voice]").forEach((root) => {
    const text = $(root, "[data-vo-text]"), select = $(root, "[data-vo-voice]"), rate = $(root, "[data-vo-rate]"), rateOut = $(root, "[data-vo-rate-out]"), play = $(root, "[data-vo-play]"), cap = $(root, "[data-vo-caption]"), note = $(root, "[data-vo-note]");
    const synth = window.speechSynthesis;
    text.value = SCRIPTS.reel;
    if (!synth || !window.SpeechSynthesisUtterance) { root.classList.add("no-voice"); note.textContent = "This browser can't speak text aloud. Try Chrome, Edge or Safari."; play.disabled = true; return; }
    let voices = [];
    function loadVoices() {
      voices = synth.getVoices().filter((v) => /^(en|hi|kn)/i.test(v.lang));
      const rank = (v) => (/-IN$/i.test(v.lang) ? 0 : 1) + (/^en/i.test(v.lang) ? 0 : .5);
      voices.sort((a, b) => rank(a) - rank(b));
      select.innerHTML = voices.map((v, i) => `<option value="${i}">${esc(v.name.replace(/Microsoft |Google /, ""))} · ${v.lang}</option>`).join("") || "<option>Default voice</option>";
    }
    loadVoices();
    synth.addEventListener ? synth.addEventListener("voiceschanged", loadVoices) : (synth.onvoiceschanged = loadVoices);
    const words = () => text.value.split(/(\s+)/);
    function paint(idx = -1) {
      let pos = 0;
      cap.innerHTML = words().map((w) => { const start = pos; pos += w.length; if (!w.trim()) return w; return `<span${idx >= start && idx < pos ? ' class="on"' : ""}>${esc(w)}</span>`; }).join("");
      const onEl = $(cap, ".on"); if (onEl) onEl.scrollIntoView({ block: "nearest" });
    }
    function stop() { synth.cancel(); root.classList.remove("is-speaking"); play.innerHTML = "Play voiceover"; paint(); }
    play.addEventListener("click", () => {
      buzz();
      if (root.classList.contains("is-speaking")) return stop();
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.value.slice(0, 600));
      const v = voices[+select.value]; if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = +rate.value; u.pitch = 1;
      u.onboundary = (e) => { if (e.name === "word" || e.charIndex != null) paint(e.charIndex); };
      u.onend = () => stop();
      u.onerror = () => { stop(); note.textContent = "Couldn't play that voice. Try another one."; };
      root.classList.add("is-speaking"); play.innerHTML = '<span class="cap-dot"></span> Stop';
      synth.speak(u);
    });
    rate.addEventListener("input", () => { rateOut.textContent = `${(+rate.value).toFixed(1)}×`; });
    text.addEventListener("input", () => { if (!root.classList.contains("is-speaking")) paint(); });
    radio($(root, "[data-vo-script]"), (k) => { stop(); text.value = SCRIPTS[k]; paint(); });
    paint();
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  });

  /* ---------------- A month of content ---------------- */
  const CONTENT = {
    bakery: [["Reel", "Behind the scenes: 5 am bake"], ["Carousel", "3 cakes for small parties"], ["Story", "Poll: chocolate or butterscotch?"], ["Offer", "Weekday breakfast combo"], ["Reel", "Watch a cake come together"], ["Carousel", "How to store bread so it stays fresh"], ["Story", "Guess today's special"], ["Offer", "Free cupcake over ₹1,000"], ["Reel", "Meet our head baker"], ["Carousel", "Eggless range explained"], ["Story", "Customer photos this week"], ["Offer", "Pre-order for the weekend"], ["Reel", "Festival sweets in 30 seconds"], ["Carousel", "Our 5 bestsellers"], ["Story", "Q&A: ask the baker"], ["Offer", "Last-hour discount"]],
    gym: [["Reel", "3-minute morning stretch"], ["Carousel", "5 myths about weight loss"], ["Story", "Poll: morning or evening workouts?"], ["Offer", "Free trial week"], ["Reel", "Member transformation story"], ["Carousel", "What to eat after a workout"], ["Story", "Form check: squats"], ["Offer", "Bring a friend free"], ["Reel", "Meet the trainers"], ["Carousel", "A beginner's first month"], ["Story", "This week's class timetable"], ["Offer", "Student discount"], ["Reel", "10-minute home workout"], ["Carousel", "How much protein do you need?"], ["Story", "Q&A with a trainer"], ["Offer", "Renew early, save more"]],
    tuition: [["Reel", "One maths trick in 20 seconds"], ["Carousel", "How to plan the last month before exams"], ["Story", "Poll: hardest chapter?"], ["Offer", "Free demo class"], ["Reel", "A topper's study desk"], ["Carousel", "5 common mistakes in board exams"], ["Story", "Quiz: 3 quick questions"], ["Offer", "Early-bird batch"], ["Reel", "Meet the teachers"], ["Carousel", "Formula sheet: Class 10 algebra"], ["Story", "Results wall"], ["Offer", "Refer a friend"], ["Reel", "Explaining a tricky concept"], ["Carousel", "How to beat exam stress"], ["Story", "Parent Q&A"], ["Offer", "Crash course seats open"]],
  };
  const DAYS = { 2: [1, 5], 3: [0, 2, 5], 5: [0, 1, 3, 4, 6] };
  const WHEN = { Reel: "7 to 9 pm", Carousel: "12 to 2 pm", Story: "8 to 10 am", Offer: "6 to 8 pm" };
  document.querySelectorAll("[data-calendar]").forEach((root) => {
    const grid = $(root, "[data-cc-grid]"), detail = $(root, "[data-cc-detail]"), stats = $(root, "[data-cc-stats]");
    let biz = "bakery", per = 3;
    function render() {
      const ideas = CONTENT[biz]; let n = 0;
      const cells = [];
      for (let w = 0; w < 4; w++) for (let d = 0; d < 7; d++) {
        if (DAYS[per].includes(d)) { const [type, title] = ideas[n % ideas.length]; cells.push({ w, d, type, title: n >= ideas.length ? title + " (part 2)" : title }); n++; } else cells.push(null);
      }
      grid.innerHTML = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span class="cc-day">${d}</span>`).join("")
        + cells.map((c, i) => c ? `<button type="button" class="cc-post" data-type="${c.type}" data-i="${i}" style="--d:${i}"><small>${c.type}</small>${esc(c.title)}</button>` : '<span class="cc-empty"></span>').join("");
      const counts = cells.filter(Boolean).reduce((m, c) => ((m[c.type] = (m[c.type] || 0) + 1), m), {});
      stats.textContent = `${cells.filter(Boolean).length} posts: ${Object.entries(counts).map(([t, k]) => `${k} ${k > 1 ? { Reel: "reels", Carousel: "carousels", Story: "stories", Offer: "offers" }[t] : t.toLowerCase()}`).join(", ")}.`;
      $$(grid, ".cc-post").forEach((b) => b.addEventListener("click", () => {
        buzz();
        $$(grid, ".cc-post").forEach((x) => x.classList.toggle("is-on", x === b));
        const c = cells[+b.dataset.i];
        detail.innerHTML = `<b>Week ${c.w + 1}, ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][c.d]} · ${c.type}</b><p>${esc(c.title)}.</p><p class="cc-meta">Post around ${WHEN[c.type]}. End with one clear ask: ${c.type === "Offer" ? "“Order on WhatsApp.”" : c.type === "Story" ? "a poll or a question." : "“Save this for later.”"}</p>`;
      }));
      detail.innerHTML = "<p>Tap any post to see when to share it and how to end it.</p>";
    }
    radio($(root, "[data-cc-biz]"), (v) => { biz = v; render(); });
    radio($(root, "[data-cc-per]"), (v) => { per = +v; render(); });
    render();
  });

  /* ---------------- Write a better product listing ---------------- */
  const LISTINGS = {
    cashew: { price: "₹549", before: { title: "Cashew nuts 500g", bullets: ["Good quality"], desc: "Buy now." },
      after: { title: "Premium Whole Cashews W320, 500 g, Fresh Vacuum Pack, Ideal for Sweets and Gifting", bullets: ["Whole W320 grade: large, even-sized cashews", "Vacuum-sealed to stay crunchy for months", "Great for sweets, gifting and everyday snacking", "500 g resealable zip pouch", "Store in a cool, dry place after opening"], desc: "Wondering if they'll arrive broken? Every pouch is packed whole and cushioned for delivery." }, pass: [0, 6] },
    soap: { price: "₹180", before: { title: "Handmade soap", bullets: ["Natural"], desc: "Nice soap." },
      after: { title: "Handmade Neem and Tulsi Soap, 100 g, Cold-Processed, No Parabens, for Oily Skin", bullets: ["Neem and tulsi to help control oil", "Cold-processed in small batches", "No parabens or synthetic colour", "100 g bar that lasts about a month", "Keep it dry between uses so it lasts longer"], desc: "Sensitive skin? Try it on your wrist first. Most customers with oily skin use it twice a day." }, pass: [1, 6] },
    kurta: { price: "₹899", before: { title: "Cotton kurta", bullets: ["Nice design"], desc: "Available." },
      after: { title: "Women's Pure Cotton Straight Kurta, Indigo Block Print, Sizes S to 3XL, Breathable for Summer", bullets: ["100% cotton that breathes in the heat", "Hand block-printed indigo pattern", "Straight fit, sizes S to 3XL", "Side pockets and three-quarter sleeves", "Cold wash separately; colours stay bright"], desc: "Not sure of your size? Check the size chart. Free exchange within 7 days." }, pass: [1, 6] },
  };
  const LIST_CHECKS = ["Main keyword in the title", "Size or weight in the title", "At least 5 bullet points", "Benefits, not just features", "Care or usage instructions", "Answers a buyer's doubt"];
  document.querySelectorAll("[data-listing]").forEach((root) => {
    const card = $(root, "[data-ls-card]"), checks = $(root, "[data-ls-checks]"), meter = $(root, "[data-ls-score]");
    let product = "cashew", version = "before";
    function render() {
      const p = LISTINGS[product], v = p[version];
      const pass = version === "before" ? p.pass[0] : p.pass[1];
      const score = version === "before" ? 2 + pass : 9;
      card.innerHTML = `<span class="ls-img" aria-hidden="true">${p.after.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}</span><div class="ls-body"><b class="ls-title">${esc(v.title)}</b><span class="ls-stars" aria-label="Rated 4.3 out of 5">★★★★☆ <small>4.3</small></span><span class="ls-price">${p.price}</span><ul>${v.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul><p>${esc(v.desc)}</p></div>`;
      replayAnim(card, "is-new");
      checks.innerHTML = LIST_CHECKS.map((c, i) => `<li class="${version === "after" || i < pass ? "ok" : ""}">${c}</li>`).join("");
      meter.innerHTML = `<b>${score}</b><small>/10</small>`;
      meter.dataset.good = String(score >= 7);
    }
    radio($(root, "[data-ls-product]"), (v) => { product = v; render(); });
    radio($(root, "[data-ls-version]"), (v) => { version = v; render(); });
    render();
  });

  /* ---------------- AI replies to your customers ---------------- */
  document.querySelectorAll("[data-support]").forEach((root) => {
    const chat = $(root, "[data-sp-chat]"), stats = $(root, "[data-sp-stats]");
    let auto = 0, total = 0, busy = false;
    const fact = (k) => $(root, `[data-sp-fact="${k}"]`).getAttribute("aria-pressed") === "true";
    const say = (who, html, tag) => {
      const p = document.createElement("p");
      p.className = `hg-msg ${who}`;
      p.innerHTML = html + (tag ? `<small class="sp-tag${tag.warn ? " warn" : ""}">${tag.text}</small>` : "");
      chat.appendChild(p); chat.scrollTop = chat.scrollHeight;
    };
    const REPLIES = {
      sunday: () => fact("sunday") ? ["Yes, we're open on Sunday, 8 am to 9 pm. See you!", { text: "Answered from: opening hours" }] : ["We're closed on Sundays, but open Monday to Saturday, 8 am to 9 pm. You can pre-order for Monday!", { text: "Answered from: opening hours" }],
      eggless: () => fact("eggless") ? ["Yes! All our cakes can be made eggless. Please order a day ahead.", { text: "Answered from: menu" }] : ["Sorry, we don't make eggless cakes right now. Our eggless cookies are popular though!", { text: "Answered from: menu" }],
      delivery: () => fact("delivery") ? ["Yes, we deliver within 5 km. It's free on orders above ₹300.", { text: "Answered from: delivery" }] : ["We don't deliver yet, but you can pick up in 10 minutes if you order on WhatsApp.", { text: "Answered from: delivery" }],
      late: () => ["I'm really sorry about that. I've passed this to Priya, the owner, as urgent. She'll call you within 15 minutes.", { text: "Sent to a human: complaint", warn: true }],
    };
    const ASK = { sunday: "Are you open on Sunday?", eggless: "Do you have eggless cakes?", delivery: "Do you deliver near me?", late: "My order is 40 minutes late!!" };
    $$(root, "[data-sp-ask]").forEach((b) => b.addEventListener("click", async () => {
      if (busy) return; busy = true; buzz();
      const k = b.dataset.spAsk;
      say("me", ASK[k]);
      const typing = document.createElement("p"); typing.className = "hg-msg them"; typing.innerHTML = dots; chat.appendChild(typing); chat.scrollTop = chat.scrollHeight;
      await wait(700); typing.remove();
      const [text, tag] = REPLIES[k]();
      say("them", text, tag);
      total++; if (!tag.warn) auto++;
      stats.textContent = `Answered by AI: ${auto} of ${total}. Complaints always go to a human.`;
      busy = false;
    }));
    $$(root, "[data-sp-fact]").forEach((b) => b.addEventListener("click", () => { buzz(); b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); }));
    say("them", "Hi! I'm the Sample Bakery assistant. Ask me anything.");
  });

  /* ---------------- A study plan you can follow ---------------- */
  const SUBJECT_COLOUR = { Maths: "#F51E2B", Physics: "#2D6CDF", Chemistry: "#1B7A45", Biology: "#E9A400", English: "#7A4DD8" };
  document.querySelectorAll("[data-studyplan]").forEach((root) => {
    const grid = $(root, "[data-sp-grid]"), sum = $(root, "[data-sp-sum]"), range = $(root, "[data-sp-hours]"), hOut = $(root, "[data-sp-hours-out]");
    let days = 14;
    function render() {
      const subs = on($(root, "[data-sp-subjects]"));
      const hours = +range.value;
      hOut.textContent = `${hours} hours`;
      if (!subs.length) { grid.innerHTML = '<p class="sp-none">Pick at least one subject.</p>'; sum.textContent = ""; return; }
      const perSub = Object.fromEntries(subs.map((s) => [s, 0]));
      let k = 0, revisions = 0;
      const cells = [];
      for (let d = 1; d <= days; d++) {
        if (d === days) { cells.push(`<div class="sp-cell is-exam"><small>Day ${d}</small><b>Mock test, then rest</b></div>`); continue; }
        const light = d % 7 === 0;
        const h = light ? Math.max(1, Math.round(hours / 2)) : hours;
        const blocks = [];
        if (d > 2 && d % 3 === 0) { blocks.push(["Revise", subs[(k + subs.length - 2) % subs.length], 1]); revisions++; }
        const left = h - (blocks.length ? 1 : 0), n = left >= 3 && subs.length > 1 ? 2 : 1;
        for (let j = 0; j < n; j++) { const s = subs[k % subs.length]; k++; const hh = j === n - 1 ? left - Math.floor(left / n) * (n - 1) : Math.floor(left / n); perSub[s] += hh; blocks.push(["Study", s, hh]); }
        cells.push(`<div class="sp-cell${light ? " is-light" : ""}"><small>Day ${d}${light ? " · light day" : ""}</small>${blocks.map(([t, s, hh]) => `<span style="--c:${SUBJECT_COLOUR[s]}"><i></i>${t === "Revise" ? "Revise " : ""}${s}<em>${hh}h</em></span>`).join("")}</div>`);
      }
      grid.innerHTML = cells.join("");
      sum.innerHTML = `${Object.entries(perSub).map(([s, h]) => `<b style="color:${SUBJECT_COLOUR[s]}">${s} ${h}h</b>`).join(" · ")}. ${revisions} revision sessions, a light day every week, and a mock test on day ${days}.`;
    }
    radio($(root, "[data-sp-days]"), (v) => { days = +v; render(); });
    toggles($(root, "[data-sp-subjects]"), render);
    range.addEventListener("input", render);
    render();
  });

  /* ---------------- Answers with sources you can check ---------------- */
  const SOURCES = {
    water: { answer: "Needs vary with body size, activity and weather. Many health bodies suggest adults get about 2 to 3 litres of fluid a day, including the water in food<sup>1</sup><sup>2</sup>. For most healthy people, drinking when thirsty is enough<sup>3</sup>. You must drink exactly 8 glasses, or you'll get dehydrated<sup>4</sup>.",
      list: [["Government", "A national health website", 5, "yes", "Suggests roughly 2 to 3 litres of fluid a day for adults, depending on activity and climate."],
        ["Research", "A peer-reviewed review of studies", 5, "yes", "Finds total fluid needs vary widely and food provides a good share of water."],
        ["News", "A health section of a newspaper", 3, "partly", "Quotes a doctor saying thirst works for most people, but not for older adults or athletes."],
        ["Forum", "An online forum post", 1, "no", "Says “8 glasses or you'll get dehydrated”, with no evidence. The AI repeated it as fact."]] },
    screens: { answer: "Using screens in the hour before bed is linked to taking longer to fall asleep<sup>1</sup>, partly because of bright light and stimulating content<sup>2</sup>. The effect is smaller than many headlines claim<sup>3</sup>. Blue-light glasses completely fix the problem<sup>4</sup>.",
      list: [["Research", "A large sleep study", 5, "yes", "Found people who used phones in bed took longer, on average, to fall asleep."],
        ["Government", "A national sleep health guide", 4, "yes", "Advises a screen-free wind-down before bed because light and alerts keep the brain awake."],
        ["Research", "A review of many studies", 5, "partly", "Agrees there's a link, but says the average effect is a few minutes, not hours."],
        ["Advert", "A shopping page selling glasses", 1, "no", "Claims blue-light glasses “fix” sleep. It's an advert, and the research doesn't back it."]] },
  };
  const VERDICT = { yes: ["Supports it", "ok"], partly: ["Partly supports it", "mid"], no: ["Doesn't back this up", "bad"] };
  document.querySelectorAll("[data-sources]").forEach((root) => {
    const ans = $(root, "[data-so-answer]"), list = $(root, "[data-so-list]"), status = $(root, "[data-so-status]");
    let q = "water", checked = new Set();
    function render() {
      const d = SOURCES[q]; checked = new Set();
      ans.innerHTML = d.answer.replace(/<sup>(\d)<\/sup>/g, '<button type="button" class="so-cite" data-n="$1">$1</button>');
      list.innerHTML = d.list.map(([type, name, trust], i) => `<li class="so-src" data-n="${i + 1}"><button type="button" class="so-open"><span class="so-num">${i + 1}</span><span class="so-name"><small>${type}</small>${name}</span><span class="so-trust" aria-label="Trust ${trust} of 5">${"●".repeat(trust)}${"○".repeat(5 - trust)}</span></button><div class="so-says" hidden></div></li>`).join("");
      $$(root, ".so-cite").forEach((b) => b.addEventListener("click", () => open(+b.dataset.n)));
      $$(list, ".so-open").forEach((b, i) => b.addEventListener("click", () => open(i + 1)));
      status.textContent = "Tap a number to check what each source really says.";
    }
    function open(n) {
      buzz();
      const [, , , v, says] = SOURCES[q].list[n - 1];
      const li = $(list, `[data-n="${n}"]`), box = $(li, ".so-says");
      box.hidden = false; box.innerHTML = `<b class="${VERDICT[v][1]}">${VERDICT[v][0]}</b> ${says}`;
      li.classList.add("is-open", "v-" + v);
      $$(ans, `.so-cite[data-n="${n}"]`).forEach((c) => c.classList.add("v-" + v));
      li.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
      checked.add(n);
      status.textContent = checked.size === 4 ? "Checked all four. Notice the weakest source was behind the most confident sentence." : `Checked ${checked.size} of 4 sources.`;
    }
    radio($(root, "[data-so-q]"), (v) => { q = v; render(); });
    render();
  });

  /* ---------------- Question paper generator ---------------- */
  const BANK = {
    science: ["Which gas do plants give out during photosynthesis?", "Define refraction of light.", "Why do we see lightning before we hear thunder?", "Describe the structure of the human heart with a labelled diagram."],
    maths: ["What is the value of 3² + 4²?", "Find the HCF of 36 and 48.", "Solve 2x + 5 = 17 and check your answer.", "A shop gives 20% off on ₹1,500 and then 5% more. Find the final price and the total discount."],
    social: ["Who was the first Prime Minister of India?", "What is a monsoon?", "Give three causes of the Revolt of 1857.", "Explain why the Indian Constitution is important, with two examples."],
  };
  const SECTIONS = [["A", "Multiple choice", 1, .2], ["B", "Very short answer", 2, .2], ["C", "Short answer", 3, .3], ["D", "Long answer", 5, .3]];
  document.querySelectorAll("[data-paper]").forEach((root) => {
    const out = $(root, "[data-pp-out]");
    const st = { cls: "8", subject: "science", marks: 40 };
    function render() {
      const T = st.marks;
      const rows = SECTIONS.map(([id, name, each, share]) => ({ id, name, each, n: Math.max(1, Math.round(T * share / each)) }));
      let total = rows.reduce((a, r) => a + r.n * r.each, 0);
      // Adjust the multiple-choice count so the paper adds up exactly
      rows[0].n += T - total; total = T;
      const time = T <= 20 ? "45 minutes" : T <= 40 ? "1 hour 30 minutes" : "3 hours";
      const subjectName = { science: "Science", maths: "Mathematics", social: "Social Science" }[st.subject];
      out.innerHTML = `<div class="pp-head"><b>Class ${st.cls} · ${subjectName}</b><span>Total: ${T} marks · Time: ${time}</span></div>
        <table class="pp-table"><tr><th>Section</th><th>Type</th><th>Questions</th><th>Marks</th></tr>${rows.map((r) => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.n} × ${r.each}</td><td>${r.n * r.each}</td></tr>`).join("")}</table>
        <div class="pp-mix" aria-label="Difficulty: 40% easy, 40% medium, 20% hard"><i style="width:40%">Easy 40%</i><i style="width:40%">Medium 40%</i><i style="width:20%">Hard 20%</i></div>
        <ol class="pp-qs">${BANK[st.subject].map((q, i) => `<li><small>Section ${SECTIONS[i][0]} · ${SECTIONS[i][2]} mark${SECTIONS[i][2] > 1 ? "s" : ""}</small>${esc(q)}</li>`).join("")}</ol>
        <p class="pp-key">Sample questions shown. The full paper comes with an answer key and a marking scheme.</p>`;
      replayAnim(out, "is-new");
    }
    radio($(root, "[data-pp-class]"), (v) => { st.cls = v; render(); });
    radio($(root, "[data-pp-subject]"), (v) => { st.subject = v; render(); });
    radio($(root, "[data-pp-marks]"), (v) => { st.marks = +v; render(); });
    render();
  });

  /* ---------------- Your first website ---------------- */
  const SITES = {
    cafe: { hero: "Coffee worth waking up for.", sub: "Filter coffee, fresh bakes and a quiet corner, 7 am to 10 pm.", cta: "See the menu", features: ["Freshly ground, every cup", "Bakes from our own oven", "Free Wi-Fi and quiet corners"], quote: "Best filter coffee in town. I'm here every morning.", who: "Ananya, a regular" },
    tutor: { hero: "Maths that finally makes sense.", sub: "Class 8 to 12, small batches and a weekly report for parents.", cta: "Book a free class", features: ["Batches of 8 or fewer", "A weekly report to parents", "Doubts cleared on WhatsApp"], quote: "My daughter finally enjoys maths. She asks for extra problems now.", who: "A parent" },
    photo: { hero: "Moments, beautifully kept.", sub: "Weddings, portraits and products, shot with care.", cta: "See my work", features: ["Previews within a week", "Albums you'll keep forever", "Drone shots on request"], quote: "The photos made our whole family emotional, in the best way.", who: "Rahul and Meera" },
  };
  const LOOKS = { minimal: { bg: "#FFFFFF", ink: "#111111", accent: "#111111", soft: "#F3F4F5", font: "Inter, sans-serif" }, bold: { bg: "#0E0E0E", ink: "#FFFFFF", accent: "#F51E2B", soft: "#1C1C1C", font: "Inter, sans-serif" }, warm: { bg: "#FBF4EA", ink: "#3B2A20", accent: "#B5653A", soft: "#F2E3D0", font: "'Playfair Display', Georgia, serif" } };
  document.querySelectorAll("[data-website]").forEach((root) => {
    const frame = $(root, "[data-ws-frame]"), page = $(root, "[data-ws-page]"), url = $(root, "[data-ws-url]"), log = $(root, "[data-ws-log]"), name = $(root, "[data-ws-name]"), go = $(root, "[data-ws-go]");
    const st = { type: "cafe", look: "warm" };
    let run = 0;
    async function build(animate = true) {
      const id = ++run;
      const s = SITES[st.type], L = LOOKS[st.look], n = esc((name.value.trim() || "Coastal Café").slice(0, 24));
      url.textContent = `${(name.value.trim() || "coastalcafe").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "") || "mysite"}.in`;
      page.style.cssText = `--bg:${L.bg};--ink:${L.ink};--acc:${L.accent};--soft:${L.soft};--font:${L.font}`;
      const parts = [
        `<nav class="ws-nav"><b>${n}</b><span>About</span><span>Services</span><span class="ws-btn-sm">Contact</span></nav>`,
        `<header class="ws-hero"><h4>${s.hero}</h4><p>${s.sub}</p><span class="ws-btn">${s.cta}</span></header>`,
        `<section class="ws-feats">${s.features.map((f, i) => `<div><i>${i + 1}</i>${f}</div>`).join("")}</section>`,
        `<blockquote class="ws-quote">“${s.quote}”<small>${s.who}</small></blockquote>`,
        `<footer class="ws-foot">${n} · Message us on WhatsApp</footer>`,
      ];
      const steps = ["Writing the headline", "Choosing colours and fonts", "Laying out the sections", "Adding a review", "Making it work on phones"];
      page.innerHTML = "";
      log.innerHTML = "";
      for (let i = 0; i < parts.length; i++) {
        if (id !== run) return;
        if (animate) { const li = document.createElement("li"); li.textContent = steps[i]; log.appendChild(li); await wait(380); }
        page.insertAdjacentHTML("beforeend", parts[i]);
        const el = page.lastElementChild; if (animate && !reduce) el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 350 });
      }
      if (animate && id === run) { const li = document.createElement("li"); li.className = "is-live"; li.textContent = "Live. Share the link!"; log.appendChild(li); }
    }
    radio($(root, "[data-ws-type]"), (v) => { st.type = v; build(); });
    radio($(root, "[data-ws-look]"), (v) => { st.look = v; build(false); });
    radio($(root, "[data-ws-device]"), (v) => { frame.dataset.device = v; });
    go.addEventListener("click", () => { buzz(); build(); });
    let t = 0; name.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => build(false), 250); });
    build(false);
  });

  /* ---------------- Automate a boring task ---------------- */
  const FLOWS = {
    orders: { trigger: "A customer fills in your order form", steps: ["Add the order to your Google Sheet", "Send the customer a WhatsApp confirmation", "Alert you if the order is over ₹2,000"], done: "Done in 4 seconds, while you're busy baking.", mins: 6, per: 20 },
    invoices: { trigger: "The 1st of every month", steps: ["Make an invoice for each client from your sheet", "Save each one as a PDF", "Email it with a polite note"], done: "Every invoice sent before breakfast.", mins: 15, per: 3 },
    birthdays: { trigger: "It's a customer's birthday today", steps: ["Find their name and favourite item", "Write a short personal message with AI", "Send it with a 10% coupon"], done: "Every customer feels remembered.", mins: 3, per: 10 },
  };
  document.querySelectorAll("[data-automate]").forEach((root) => {
    const flow = $(root, "[data-au-flow]"), logEl = $(root, "[data-au-log]"), range = $(root, "[data-au-times]"), timesOut = $(root, "[data-au-times-out]"), saved = $(root, "[data-au-saved]");
    let key = "orders", run = 0;
    function render() {
      const f = FLOWS[key];
      flow.innerHTML = `<li class="au-node is-trigger"><small>When</small>${f.trigger}</li>` + f.steps.map((s, i) => `<li class="au-node"><small>Then ${i + 1}</small>${s}</li>`).join("");
      logEl.textContent = "";
      range.value = f.per; calc();
    }
    function calc() {
      const f = FLOWS[key], times = +range.value;
      timesOut.textContent = `${times} times a week`;
      const hours = times * 4.3 * f.mins / 60;
      saved.innerHTML = `<b>${hours >= 10 ? Math.round(hours) : hours.toFixed(1)} hours</b> saved every month`;
    }
    $(root, "[data-au-run]").addEventListener("click", async () => {
      const id = ++run; buzz();
      const nodes = $$(flow, ".au-node");
      nodes.forEach((n) => n.classList.remove("is-done", "is-on"));
      logEl.textContent = "Running…";
      for (const n of nodes) { if (id !== run) return; n.classList.add("is-on"); await wait(520); n.classList.remove("is-on"); n.classList.add("is-done"); }
      if (id === run) logEl.textContent = FLOWS[key].done;
    });
    range.addEventListener("input", calc);
    radio($(root, "[data-au-task]"), (v) => { key = v; run++; render(); });
    render();
  });

  /* ---------------- Build your own AI assistant ---------------- */
  const FACTS = { hours: "We're open 8 am to 10 pm, every day", menu: "A veg thali is ₹120 and filter coffee is ₹30", delivery: "We deliver within 5 km, free on orders above ₹300" };
  const KNOW = { hours: "Opening hours", menu: "Menu and prices", delivery: "Delivery area" };
  const QUESTIONS = { hours: "When are you open?", menu: "How much is a veg thali?", delivery: "Do you deliver to my area?", wifi: "What's the Wi-Fi password?" };
  const VOICE = {
    friendly: (f) => `Hi there! ${f}. Anything else I can help with?`,
    formal: (f) => `Good day. ${f}. Thank you for your question.`,
    funny: (f) => `Great question, my favourite kind! ${f}. Now I'm hungry too.`,
  };
  document.querySelectorAll("[data-assistant]").forEach((root) => {
    const chat = $(root, "[data-as-chat]"), nameIn = $(root, "[data-as-name]"), title = $(root, "[data-as-title]");
    let style = "friendly", busy = false;
    const knows = () => on($(root, "[data-as-know]"));
    const setTitle = () => { title.textContent = (nameIn.value.trim() || "Asha").slice(0, 18); };
    const say = (who, html, tag) => { const p = document.createElement("p"); p.className = `hg-msg ${who}`; p.innerHTML = html + (tag ? `<small class="sp-tag${tag.warn ? " warn" : ""}">${tag.text}</small>` : ""); chat.appendChild(p); chat.scrollTop = chat.scrollHeight; };
    $$(root, "[data-as-q]").forEach((b) => b.addEventListener("click", async () => {
      if (busy) return; busy = true; buzz();
      const k = b.dataset.asQ;
      say("me", QUESTIONS[k]);
      await wait(500);
      if (k === "wifi") say("them", "I don't know that, and that's on purpose: I only answer from what you've taught me.", { text: "Not in its knowledge", warn: true });
      else if (knows().includes(k)) say("them", VOICE[style](FACTS[k]), { text: `From: ${KNOW[k]}` });
      else say("them", `I don't know that yet. Switch on “${KNOW[k]}” to teach me.`, { text: "Missing knowledge", warn: true });
      busy = false;
    }));
    toggles($(root, "[data-as-know]"), () => {});
    radio($(root, "[data-as-style]"), (v) => { style = v; });
    nameIn.addEventListener("input", setTitle);
    setTitle();
    say("them", "Hello! Teach me on the left, then ask me something.");
  });

  /* ---------------- Where did my money go? ---------------- */
  const SPEND = [
    ["Supermarket", 2340, "Groceries"], ["Food delivery", 480, "Eating out"], ["Petrol", 1500, "Travel"], ["Food delivery", 390, "Eating out"],
    ["Streaming app", 499, "Subscriptions"], ["Electricity bill", 1860, "Bills"], ["Café", 260, "Eating out"], ["Mobile recharge", 299, "Bills"],
    ["Food delivery", 540, "Eating out"], ["Online shopping", 1899, "Shopping"], ["Music app", 119, "Subscriptions"], ["Auto rides", 640, "Travel"],
    ["Second streaming app", 299, "Subscriptions"], ["Food delivery", 610, "Eating out"], ["Pharmacy", 430, "Health"], ["Gym (went twice)", 1200, "Subscriptions"],
  ];
  const CAT_COLOUR = { Groceries: "#1B7A45", "Eating out": "#F51E2B", Travel: "#2D6CDF", Subscriptions: "#7A4DD8", Bills: "#5C5F63", Shopping: "#E9A400", Health: "#0E7C86" };
  document.querySelectorAll("[data-budget]").forEach((root) => {
    const list = $(root, "[data-bd-list]"), bars = $(root, "[data-bd-bars]"), tips = $(root, "[data-bd-tips]"), go = $(root, "[data-bd-go]"), range = $(root, "[data-bd-cut]"), cutOut = $(root, "[data-bd-cut-out]"), save = $(root, "[data-bd-save]");
    const total = SPEND.reduce((a, t) => a + t[1], 0);
    list.innerHTML = SPEND.map(([m, amt]) => `<li><span>${m}</span><em></em><b>${rupees(amt)}</b></li>`).join("");
    const food = SPEND.filter((t) => t[0] === "Food delivery"), foodSum = food.reduce((a, t) => a + t[1], 0);
    const subs = SPEND.filter((t) => t[2] === "Subscriptions"), subSum = subs.reduce((a, t) => a + t[1], 0);
    function calc() { const pct = +range.value; cutOut.textContent = `${pct}%`; const m = foodSum * pct / 100 + 1200 + 299; save.innerHTML = `Cut deliveries by ${pct}%, drop the gym you don't use and one streaming app: save about <b>${rupees(m)}</b> a month, <b>${rupees(m * 12)}</b> a year.`; }
    go.addEventListener("click", async () => {
      buzz(); go.disabled = true;
      const rows = $$(list, "li");
      for (let i = 0; i < rows.length; i++) { const c = SPEND[i][2]; const em = $(rows[i], "em"); em.textContent = c; em.style.setProperty("--c", CAT_COLOUR[c]); rows[i].classList.add("is-sorted"); await wait(90); }
      const byCat = {}; SPEND.forEach(([, a, c]) => { byCat[c] = (byCat[c] || 0) + a; });
      const max = Math.max(...Object.values(byCat));
      bars.innerHTML = `<p class="bd-total">Spent this month: <b>${rupees(total)}</b></p>` + Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, a]) => `<div class="bd-bar"><span>${c}</span><i style="--w:${a / max * 100}%;--c:${CAT_COLOUR[c]}"></i><b>${rupees(a)}</b></div>`).join("");
      tips.hidden = false;
      tips.innerHTML = `<p class="mt-k">Where your money leaks</p><ul><li><b>${food.length} food deliveries</b> cost ${rupees(foodSum)}, more than your electricity bill.</li><li><b>${subs.length} subscriptions</b> cost ${rupees(subSum)} a month. You used the gym twice.</li><li>Two streaming apps is one too many: drop one and keep ${rupees(299)}.</li></ul>`;
      root.classList.add("is-sorted"); calc(); go.innerHTML = "Sorted";
    });
    range.addEventListener("input", calc);
  });
})();
