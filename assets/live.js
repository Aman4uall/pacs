/* =========================================================================
   PACS AI – live demos on the Try the demos page
   Camera demos run Google's MediaPipe models on the visitor's own device:
   nothing is recorded or uploaded. The model files download quietly in the
   background once a camera demo is close on screen (not on data saver or 2G),
   and start working when someone taps "Start camera".
   ========================================================================= */
(function () {
  // Restart a CSS animation without forcing the page to re-measure itself (the old
  // remove-class, read offsetWidth, add-class trick costs a full layout, which hurts on slow phones)
  const replayAnim = (el, cls) => { if (el.classList.contains(cls) && el.getAnimations) el.getAnimations({ subtree: true }).forEach((a) => { a.cancel(); a.play(); }); else el.classList.add(cls); };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 60) : ms));
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => [...root.querySelectorAll(sel)];
  const buzz = (p = 8) => { try { if (!reduce && matchMedia("(pointer: coarse)").matches && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not allowed */ } };
  const rupees = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------------- The camera engine, shared by every camera demo ---------------- */
  const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1";
  const MODELS = {
    gesture: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
    pose: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  };
  let visionP = null;
  const tasks = {};
  const vision = () => (visionP ||= import(`${MP}/vision_bundle.mjs`).then(async (m) => ({ m, fs: await m.FilesetResolver.forVisionTasks(`${MP}/wasm`) })));
  async function build(Cls, fs, opts) {
    try { return await Cls.createFromOptions(fs, { ...opts, baseOptions: { ...opts.baseOptions, delegate: "GPU" } }); }
    catch (e) { return Cls.createFromOptions(fs, { ...opts, baseOptions: { ...opts.baseOptions, delegate: "CPU" } }); }
  }
  function task(kind) {
    return (tasks[kind] ||= vision().then(({ m, fs }) => kind === "pose"
      ? build(m.PoseLandmarker, fs, { baseOptions: { modelAssetPath: MODELS.pose }, runningMode: "VIDEO", numPoses: 1 })
      : build(m.GestureRecognizer, fs, { baseOptions: { modelAssetPath: MODELS.gesture }, runningMode: "VIDEO", numHands: 1 })));
  }

  // On a slow connection "Start camera" would mean a long wait for the AI files, so when a
  // camera demo scrolls close, download them quietly in the background (never on data
  // saver or 2G). The browser and the service worker keep them, so the tap is quick.
  const fetched = new Set();
  function prefetch(kind) {
    const net = navigator.connection || {};
    if (net.saveData || /2g/.test(net.effectiveType || "")) return;
    [`${MP}/vision_bundle.mjs`, `${MP}/wasm/vision_wasm_internal.js`, `${MP}/wasm/vision_wasm_internal.wasm`, MODELS[kind]].forEach((url) => {
      if (fetched.has(url)) return;
      fetched.add(url);
      fetch(url, { mode: "cors", priority: "low" }).then((r) => r.arrayBuffer()).catch(() => fetched.delete(url));
    });
  }
  const near = "IntersectionObserver" in window && new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    near.unobserve(e.target);
    const go = () => prefetch(e.target.dataset.camKind);
    "requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 3000 }) : setTimeout(go, 1200);
  }), { rootMargin: "1200px 0px" });

  let activeCam = null; // only one camera demo runs at a time
  const HAND = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
  const BODY = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];

  function draw(canvas, pts, lines, color = "#F51E2B") {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!pts) return;
    ctx.lineWidth = Math.max(3, w / 160);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    lines.forEach(([a, b]) => {
      if (!pts[a] || !pts[b]) return;
      ctx.beginPath(); ctx.moveTo(pts[a].x * w, pts[a].y * h); ctx.lineTo(pts[b].x * w, pts[b].y * h); ctx.stroke();
    });
    ctx.fillStyle = color;
    const used = new Set(lines.flat());
    pts.forEach((p, i) => {
      if (!used.has(i) && lines !== HAND) return;
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, Math.max(4, w / 110), 0, Math.PI * 2); ctx.fill();
    });
  }

  // Wires a .cam box: start/stop buttons, status line, the frame loop, and clean-up
  function camera(root, kind, onResult, onState) {
    const box = $(root, ".cam");
    box.dataset.camKind = kind;
    if (near) near.observe(box);
    const video = $(box, "video");
    const canvas = $(box, "canvas");
    const status = $(box, "[data-cam-status]");
    let stream = null, running = false, raf = 0, last = -1;
    const say = (t) => { if (status) status.textContent = t; };
    const setState = (s) => { box.dataset.state = s; if (onState) onState(s); };
    setState("idle");

    async function start() {
      if (activeCam && activeCam !== ctl) activeCam.stop();
      activeCam = ctl;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setState("error"); say("This browser can't open the camera here. Try Chrome or Safari on a phone or laptop."); return;
      }
      setState("loading"); say("Loading the AI model. About 8 MB, once…");
      try {
        const [det, s] = await Promise.all([
          task(kind),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }),
        ]);
        if (activeCam !== ctl) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        video.srcObject = s; video.muted = true; video.playsInline = true;
        await video.play();
        running = true; setState("live"); say("");
        const loop = () => {
          if (!running) return;
          if (video.readyState >= 2 && video.currentTime !== last) {
            last = video.currentTime;
            if (canvas.width !== video.videoWidth) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
            const ts = performance.now();
            try { onResult(kind === "pose" ? det.detectForVideo(video, ts) : det.recognizeForVideo(video, ts), canvas); }
            catch (e) { /* a dropped frame is fine */ }
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        stop();
        setState("error");
        say(e && (e.name === "NotAllowedError" || e.name === "SecurityError")
          ? "Camera blocked. Allow the camera in your browser's settings, or use the buttons below."
          : e && e.name === "NotFoundError" ? "No camera found on this device. Use the buttons below." : "The AI model couldn't load. Check your internet and try again.");
      }
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null; video.srcObject = null;
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      if (box.dataset.state === "live" || box.dataset.state === "loading") setState("idle");
      if (activeCam === ctl) activeCam = null;
    }
    const ctl = { start, stop, get live() { return running; } };
    $$(box, "[data-cam-start]").forEach((b) => b.addEventListener("click", () => { buzz(); start(); }));
    $$(box, "[data-cam-stop]").forEach((b) => b.addEventListener("click", () => { buzz(); stop(); }));
    // Save battery: switch off when scrolled away or when the tab is hidden
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { if (!e.isIntersecting && running) stop(); }, { threshold: 0 }).observe(box);
    document.addEventListener("visibilitychange", () => { if (document.hidden && running) stop(); });
    return ctl;
  }

  const gestureOf = (res) => {
    const g = res && res.gestures && res.gestures[0] && res.gestures[0][0];
    return g ? { name: g.categoryName, score: g.score } : null;
  };

  /* ---------------- 1. Beat the AI at Rock, Paper, Scissors ---------------- */
  const MOVES = { rock: "✊", paper: "✋", scissors: "✌️" };
  const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
  const COUNTER = { rock: "paper", paper: "scissors", scissors: "rock" };
  const FROM_GESTURE = { Closed_Fist: "rock", Open_Palm: "paper", Victory: "scissors" };
  document.querySelectorAll("[data-rps]").forEach((root) => {
    const el = {
      you: $(root, "[data-rps-you]"), ai: $(root, "[data-rps-ai]"), youScore: $(root, "[data-rps-you-score]"), aiScore: $(root, "[data-rps-ai-score]"),
      verdict: $(root, "[data-rps-verdict]"), brain: $(root, "[data-rps-brain]"), seen: $(root, "[data-rps-seen]"), count: $(root, "[data-rps-count]"), play: $(root, "[data-rps-play]"),
    };
    const history = [];
    let you = 0, ai = 0, busy = false;
    let recent = []; // [time, move] seen by the camera

    // The AI: remembers what you played after each pair (and each single) of your moves
    function predict() {
      const tally = (len) => {
        if (history.length < len) return null;
        const key = history.slice(-len).join();
        const c = { rock: 0, paper: 0, scissors: 0 };
        let n = 0;
        for (let i = len; i < history.length; i++) if (history.slice(i - len, i).join() === key) { c[history[i]]++; n++; }
        return n ? { c, n } : null;
      };
      const t = tally(2) || tally(1);
      if (!t) return { move: pick(Object.keys(MOVES)), sure: 0 };
      const move = Object.keys(t.c).sort((a, b) => t.c[b] - t.c[a])[0];
      return { move, sure: t.c[move] / t.n };
    }
    function insight() {
      if (history.length < 5) return `Watching your moves… ${5 - history.length} more round${history.length === 4 ? "" : "s"} and it starts reading you.`;
      const after = {};
      for (let i = 1; i < history.length; i++) { (after[history[i - 1]] ||= []).push(history[i]); }
      let best = null;
      Object.entries(after).forEach(([k, arr]) => {
        const counts = arr.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
        const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        const share = n / arr.length;
        if (arr.length >= 2 && (!best || share > best.share)) best = { k, top, share };
      });
      return best ? `Pattern found: after ${MOVES[best.k]} you play ${MOVES[best.top]} ${Math.round(best.share * 100)}% of the time.` : "No clear pattern yet. You're hard to read!";
    }
    function play(move, guess) {
      const aiMove = COUNTER[guess.move];
      history.push(move);
      el.you.textContent = MOVES[move];
      el.ai.textContent = MOVES[aiMove];
      let text, cls;
      if (move === aiMove) { text = "Draw"; cls = "draw"; }
      else if (BEATS[move] === aiMove) { you++; text = "You win!"; cls = "win"; }
      else { ai++; text = "AI wins"; cls = "lose"; }
      el.verdict.textContent = text;
      el.verdict.dataset.result = cls;
      el.youScore.textContent = you; el.aiScore.textContent = ai;
      el.brain.textContent = history.length > 1 && guess.sure ? `The AI guessed you'd play ${MOVES[guess.move]} (${Math.round(guess.sure * 100)}% sure). ${insight()}` : insight();
      replayAnim(root, "rps-flash");
      buzz(cls === "win" ? 20 : [10, 40, 10]);
    }
    // Camera: count "Rock, paper, scissors, shoot!", then read your hand
    const cam = camera(root, "gesture", (res, canvas) => {
      const g = gestureOf(res);
      draw(canvas, res.landmarks && res.landmarks[0], HAND);
      const move = g && g.score > 0.5 ? FROM_GESTURE[g.name] : null;
      el.seen.textContent = move ? `I see ${MOVES[move]}` : g ? "Show ✊ ✋ or ✌️" : "Show me your hand";
      if (move) recent.push([performance.now(), move]);
      recent = recent.filter(([t]) => performance.now() - t < 700);
    }, (s) => { el.play.disabled = s !== "live"; });
    el.play.disabled = true;
    el.play.addEventListener("click", async () => {
      if (busy || !cam.live) return;
      busy = true; buzz();
      const guess = predict(); // the AI commits before it sees your hand
      el.verdict.textContent = "The AI has locked in its move."; el.verdict.dataset.result = "";
      for (const word of ["Rock…", "Paper…", "Scissors…", "Shoot!"]) { el.count.textContent = word; replayAnim(el.count, "pop"); await wait(650); }
      recent = [];
      await wait(450);
      el.count.textContent = "";
      const votes = recent.reduce((m, [, mv]) => ((m[mv] = (m[mv] || 0) + 1), m), {});
      const move = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0];
      if (move) play(move, guess);
      else { el.verdict.textContent = "Missed that. Hold your hand up clearly and try again."; el.verdict.dataset.result = ""; }
      busy = false;
    });
    // No camera: tap instead. The AI still learns your pattern.
    $$(root, "[data-rps-tap]").forEach((b) => b.addEventListener("click", () => { if (!busy) play(b.dataset.rpsTap, predict()); }));
    $(root, "[data-rps-reset]").addEventListener("click", () => {
      history.length = 0; you = ai = 0;
      el.youScore.textContent = el.aiScore.textContent = "0"; el.you.textContent = el.ai.textContent = "?";
      el.verdict.textContent = "New game. The AI has forgotten you."; el.verdict.dataset.result = ""; el.brain.textContent = insight();
    });
  });

  /* ---------------- 2. Train your own AI in 30 seconds ---------------- */
  document.querySelectorAll("[data-trainer]").forEach((root) => {
    const classes = $$(root, "[data-class]").map((card, i) => ({
      card, i, color: card.dataset.color, samples: [], input: $(card, "[data-label]"),
      count: $(card, "[data-count]"), bar: $(root, `[data-conf="${i}"]`), rec: $(card, "[data-rec]"),
    }));
    const nameOf = (c) => (c.input.value.trim() || `Sign ${c.i + 1}`).replace(/[&<>"]/g, "");
    const big = $(root, "[data-train-out]");
    const hint = $(root, "[data-train-hint]");
    const MAX = 60, K = 5;
    let recording = null, lastClass = -1, audio = null;

    // Turn 21 hand points into a shape: wrist at the centre, hand size = 1
    const features = (pts) => {
      const w = pts[0], s = Math.hypot(pts[9].x - w.x, pts[9].y - w.y) || 1;
      return pts.flatMap((p) => [(p.x - w.x) / s, (p.y - w.y) / s, (p.z - w.z) / s]);
    };
    const dist = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += (a[i] - b[i]) ** 2; return d; };
    function classify(f) {
      const all = [];
      classes.forEach((c) => c.samples.forEach((s) => all.push([dist(f, s), c.i])));
      all.sort((a, b) => a[0] - b[0]);
      const near = all.slice(0, K), votes = classes.map(() => 0);
      near.forEach(([, i]) => votes[i]++);
      return votes.map((v) => v / near.length);
    }
    function tone(i) {
      try {
        audio ||= new (window.AudioContext || window.webkitAudioContext)();
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = [392, 523.25, 659.25][i]; o.type = "triangle";
        g.gain.setValueAtTime(0.0001, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.35);
        o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.4);
      } catch (e) { /* sound is optional */ }
    }
    const ready = () => classes.filter((c) => c.samples.length >= 8).length >= 2;
    function update() {
      classes.forEach((c) => { c.count.textContent = `${c.samples.length} examples`; c.card.classList.toggle("has-data", c.samples.length >= 8); });
      const total = classes.reduce((a, c) => a + c.samples.length, 0);
      hint.textContent = ready() ? `Trained on ${total} examples. Now show any sign and watch it guess.` : "Hold a sign up, then press and hold Record. Do at least two signs.";
    }
    camera(root, "gesture", (res, canvas) => {
      const pts = res.landmarks && res.landmarks[0];
      draw(canvas, pts, HAND, "#FFD166");
      if (!pts) { big.classList.add("is-dim"); lastClass = -1; return; }
      const f = features(pts);
      if (recording && recording.samples.length < MAX) { recording.samples.push(f); update(); }
      if (!ready()) return;
      const conf = classify(f);
      conf.forEach((v, i) => { if (classes[i].bar) classes[i].bar.style.width = `${Math.round(v * 100)}%`; });
      const best = conf.indexOf(Math.max(...conf));
      if (conf[best] >= 0.6 && classes[best].samples.length) {
        const c = classes[best];
        big.innerHTML = `<i style="background:${c.color}"></i><span><small>AI sees</small><b>${nameOf(c)}</b></span><em>${Math.round(conf[best] * 100)}%</em>`;
        big.classList.remove("is-dim");
        if (best !== lastClass) { tone(best); replayAnim(big, "pop"); lastClass = best; }
      } else { big.innerHTML = '<i></i><span><small>AI sees</small><b>Not sure yet</b></span>'; big.classList.remove("is-dim"); lastClass = -1; }
    });
    classes.forEach((c) => {
      const on = (e) => { e.preventDefault(); recording = c; c.card.classList.add("is-recording"); buzz(); };
      const off = () => { if (recording === c) recording = null; c.card.classList.remove("is-recording"); };
      c.rec.addEventListener("pointerdown", on);
      ["pointerup", "pointerleave", "pointercancel"].forEach((t) => c.rec.addEventListener(t, off));
      c.rec.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") on(e); });
      c.rec.addEventListener("keyup", off);
    });
    $(root, "[data-train-reset]").addEventListener("click", () => { classes.forEach((c) => { c.samples.length = 0; if (c.bar) c.bar.style.width = "0%"; }); big.classList.add("is-dim"); update(); });
    update();
  });

  /* ---------------- 3. Cricket shot coach ---------------- */
  const SHOTS = {
    drive: { name: "Cover drive", checks: [
      { key: "frontKnee", label: "Front knee bend", lo: 110, hi: 155, unit: "°", good: "Nice deep bend on the front knee.", fix: "Bend your front knee more and lean into the shot." },
      { key: "frontElbow", label: "Front elbow", lo: 85, hi: 145, unit: "°", good: "Front elbow is high and in control.", fix: "Lift your front elbow so it points towards cover." },
      { key: "head", label: "Head over front foot", lo: 0, hi: 12, unit: "%", good: "Head is right over the front foot. Textbook.", fix: "Get your head over your front foot. Lean forward." },
    ] },
    pull: { name: "Pull shot", checks: [
      { key: "backKnee", label: "Back leg", lo: 145, hi: 180, unit: "°", good: "Standing tall on the back leg.", fix: "Stand taller on your back leg to get on top of the bounce." },
      { key: "arms", label: "Arms extended", lo: 125, hi: 180, unit: "°", good: "Arms are extended through the shot.", fix: "Extend your arms. Swing through, don't jab." },
      { key: "level", label: "Shoulders level", lo: 0, hi: 14, unit: "°", good: "Shoulders are level. Great balance.", fix: "Keep your shoulders level so the ball stays down." },
    ] },
    defence: { name: "Forward defence", checks: [
      { key: "head", label: "Head over front foot", lo: 0, hi: 12, unit: "%", good: "Head is over the ball. Solid.", fix: "Lean your head over your front foot." },
      { key: "frontKnee", label: "Front knee", lo: 125, hi: 165, unit: "°", good: "A gentle bend on the front knee.", fix: "Bend the front knee a little. Not too stiff." },
      { key: "frontElbow", label: "Soft hands", lo: 70, hi: 125, unit: "°", good: "Elbow tucked, soft hands.", fix: "Keep the front elbow tucked in, with soft hands." },
    ] },
  };
  // A sample batter playing a cover drive, for people without a camera
  const SAMPLE_POSE = (() => {
    const p = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }));
    const set = (i, x, y) => { p[i] = { x, y, z: 0, visibility: 0.99 }; };
    set(0, 0.47, 0.2); set(11, 0.53, 0.31); set(12, 0.4, 0.32); set(13, 0.6, 0.4); set(15, 0.52, 0.47); set(14, 0.43, 0.43); set(16, 0.5, 0.48);
    set(23, 0.53, 0.55); set(24, 0.43, 0.56); set(25, 0.44, 0.7); set(26, 0.36, 0.74); set(27, 0.47, 0.87); set(28, 0.27, 0.9);
    return p;
  })();
  document.querySelectorAll("[data-cricket]").forEach((root) => {
    const list = $(root, "[data-cr-checks]");
    const scoreEl = $(root, "[data-cr-score]");
    const tipEl = $(root, "[data-cr-tip]");
    const count = $(root, "[data-cr-count]");
    const freeze = $(root, "[data-cr-freeze]");
    let shot = "drive", lefty = false, latest = null, frozen = false, lastUi = 0;

    function measure(pts, w, h) {
      const P = (i) => ({ x: pts[i].x * w, y: pts[i].y * h });
      const ang = (a, b, c) => {
        const A = P(a), B = P(b), C = P(c);
        const v1 = Math.atan2(A.y - B.y, A.x - B.x), v2 = Math.atan2(C.y - B.y, C.x - B.x);
        let d = Math.abs(v1 - v2) * 180 / Math.PI; return d > 180 ? 360 - d : d;
      };
      // A right-handed batter leads with the left side of the body
      const F = lefty ? { sh: 12, el: 14, wr: 16, hip: 24, knee: 26, ank: 28 } : { sh: 11, el: 13, wr: 15, hip: 23, knee: 25, ank: 27 };
      const B = lefty ? { hip: 23, knee: 25, ank: 27 } : { hip: 24, knee: 26, ank: 28 };
      const height = Math.abs(P(0).y - Math.max(P(27).y, P(28).y)) || 1;
      const s1 = P(11), s2 = P(12);
      const tilt = Math.abs(Math.atan2(s1.y - s2.y, s1.x - s2.x) * 180 / Math.PI);
      return {
        frontKnee: ang(F.hip, F.knee, F.ank),
        backKnee: ang(B.hip, B.knee, B.ank),
        frontElbow: ang(F.sh, F.el, F.wr),
        arms: Math.max(ang(11, 13, 15), ang(12, 14, 16)),
        head: Math.abs(P(0).x - P(F.ank).x) / height * 100,
        level: Math.min(tilt, 180 - tilt), // the shoulder line's angle from flat
      };
    }
    function render(m, final) {
      const checks = SHOTS[shot].checks;
      let points = 0;
      list.innerHTML = checks.map((c) => {
        const v = m ? m[c.key] : null;
        const ok = v != null && v >= c.lo && v <= c.hi;
        const miss = v == null ? 1 : ok ? 0 : Math.min(1, (v < c.lo ? c.lo - v : v - c.hi) / (c.hi - c.lo || 1));
        points += v == null ? 0 : ok ? 1 : 1 - miss;
        return `<li class="${v == null ? "" : ok ? "ok" : "fix"}"><span>${c.label}</span><b>${v == null ? "–" : Math.round(v) + c.unit}</b><small>${v == null ? `Aim for ${c.lo} to ${c.hi}${c.unit}` : ok ? c.good : c.fix}</small></li>`;
      }).join("");
      if (final && m) {
        const allGood = checks.every((c) => m[c.key] >= c.lo && m[c.key] <= c.hi);
        const score = allGood ? 10 : Math.min(9, Math.round(points / checks.length * 10));
        scoreEl.innerHTML = `<b>${score}</b><small>/10</small>`;
        scoreEl.dataset.good = score >= 7 ? "yes" : "no";
        const fixes = checks.filter((c) => !(m[c.key] >= c.lo && m[c.key] <= c.hi));
        tipEl.textContent = fixes.length ? `Coach says: ${fixes[0].fix}` : `Coach says: that's a proper ${SHOTS[shot].name.toLowerCase()}. Frame it!`;
      }
    }
    const visible = (pts) => [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].every((i) => pts[i] && (pts[i].visibility == null || pts[i].visibility > 0.45));
    const cam = camera(root, "pose", (res, canvas) => {
      if (frozen) return;
      const pts = res.landmarks && res.landmarks[0];
      draw(canvas, pts, BODY, "#F51E2B");
      if (!pts || !visible(pts)) { latest = null; if (performance.now() - lastUi > 400) { tipEl.textContent = "Step back until your whole body, head to feet, is in the picture."; lastUi = performance.now(); } return; }
      latest = measure(pts, canvas.width, canvas.height);
      if (performance.now() - lastUi > 200) { render(latest, false); lastUi = performance.now(); tipEl.textContent = "Looking good. Take your stance and press Freeze my shot."; }
    }, (s) => { freeze.disabled = s !== "live"; if (s === "live") frozen = false; });
    freeze.disabled = true;
    freeze.addEventListener("click", async () => {
      if (!cam.live) return;
      buzz();
      frozen = false;
      for (const n of ["3", "2", "1"]) { count.textContent = n; replayAnim(count, "pop"); await wait(800); }
      count.textContent = "Snap!";
      frozen = true;
      render(latest, true);
      if (!latest) tipEl.textContent = "I couldn't see your whole body. Step back and try again.";
      buzz(20);
      await wait(700); count.textContent = "";
      setTimeout(() => { frozen = false; }, 2600);
    });
    $(root, "[data-cr-sample]").addEventListener("click", () => {
      buzz();
      if (cam.live) cam.stop();
      const canvas = $(root, ".cam canvas");
      canvas.width = 640; canvas.height = 480;
      $(root, ".cam").dataset.state = "sample";
      draw(canvas, SAMPLE_POSE, BODY, "#F51E2B");
      render(measure(SAMPLE_POSE, 640, 480), true);
    });
    $$(root, "[data-cr-shot] button").forEach((b, _, all) => b.addEventListener("click", () => {
      all.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      shot = b.dataset.v; scoreEl.innerHTML = "<b>–</b><small>/10</small>"; scoreEl.dataset.good = "";
      render(latest, false);
    }));
    $(root, "[data-cr-hand]").addEventListener("click", (e) => {
      lefty = !lefty; e.currentTarget.setAttribute("aria-pressed", String(lefty));
      e.currentTarget.textContent = lefty ? "Left-handed batter" : "Right-handed batter";
    });
    render(null, false);
  });

  /* ---------------- 4. Wave to change slides ---------------- */
  document.querySelectorAll("[data-wave]").forEach((root) => {
    const slides = $$(root, ".wave-slide");
    const counter = $(root, "[data-wave-n]");
    const seen = $(root, "[data-wave-seen]");
    const laser = $(root, ".wave-laser");
    const stage = $(root, ".wave-deck");
    const react = $(root, ".wave-react");
    let at = 0, trail = [], cooldown = 0, palmSince = 0, thumbAt = 0;
    function go(n, how) {
      const next = Math.max(0, Math.min(slides.length - 1, n));
      if (next === at) { replayAnim(stage, "bump"); return; }
      slides[at].classList.remove("is-on");
      slides[at].classList.add(next > at ? "out-left" : "out-right");
      const prev = slides[at];
      setTimeout(() => prev.classList.remove("out-left", "out-right"), 500);
      at = next;
      slides[at].classList.add("is-on");
      counter.textContent = `${at + 1} / ${slides.length}`;
      if (how) { seen.textContent = how; }
      buzz(10);
    }
    function pop(emoji) {
      const s = document.createElement("span");
      s.textContent = emoji;
      s.style.left = `${20 + Math.random() * 60}%`;
      react.appendChild(s);
      setTimeout(() => s.remove(), 1600);
    }
    camera(root, "gesture", (res, canvas) => {
      const pts = res.landmarks && res.landmarks[0];
      draw(canvas, pts, HAND, "#9BE7D8");
      const now = performance.now();
      const g = gestureOf(res);
      if (!pts) { laser.hidden = true; trail = []; palmSince = 0; return; }
      // Pointing up turns your finger into a laser pointer on the slide
      if (g && g.name === "Pointing_Up" && g.score > 0.55) {
        laser.hidden = false;
        laser.style.left = `${(1 - pts[8].x) * 100}%`;
        laser.style.top = `${Math.min(96, Math.max(4, (pts[8].y - 0.15) / 0.6 * 100))}%`;
        seen.textContent = "Laser pointer";
      } else laser.hidden = true;
      // An open palm held still for a second blanks the screen (and back)
      if (g && g.name === "Open_Palm" && g.score > 0.6) {
        palmSince ||= now;
        if (now - palmSince > 1100) { stage.classList.toggle("is-blank"); palmSince = now + 1500; seen.textContent = stage.classList.contains("is-blank") ? "Screen paused" : "Back on"; buzz(15); }
      } else palmSince = 0;
      if (g && g.name === "Thumb_Up" && g.score > 0.6 && now - thumbAt > 900) { thumbAt = now; pop("👍"); seen.textContent = "Nice!"; }
      // A quick swipe across the camera moves the slides. The camera image is mirrored,
      // so moving your hand to your left makes the raw x grow.
      trail.push([now, pts[0].x]);
      trail = trail.filter(([t]) => now - t < 450);
      if (now > cooldown && trail.length > 3) {
        const dx = trail[trail.length - 1][1] - trail[0][1];
        if (dx > 0.22) { go(at + 1, "Swipe: next slide"); cooldown = now + 900; trail = []; }
        else if (dx < -0.22) { go(at - 1, "Swipe: previous slide"); cooldown = now + 900; trail = []; }
      }
    });
    $(root, "[data-wave-prev]").addEventListener("click", () => go(at - 1));
    $(root, "[data-wave-next]").addEventListener("click", () => go(at + 1));
    slides[0].classList.add("is-on");
  });

  /* ---------------- 5. Live subtitles and a speaking coach ---------------- */
  const FILLERS = {
    "en-IN": ["um", "umm", "uh", "uhh", "basically", "actually", "like", "you know", "literally", "so yeah"],
    "hi-IN": ["मतलब", "वो", "अच्छा", "यानी", "बेसिकली", "एक्चुअली"],
    "kn-IN": ["ಅಂದ್ರೆ", "ಅದು", "ಹಾಗೆ", "ಬೇಸಿಕಲಿ"],
  };
  document.querySelectorAll("[data-captions]").forEach((root) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = $(root, "[data-cap-mic]");
    const textBox = $(root, "[data-cap-text]");
    const el = { words: $(root, "[data-cap-words]"), wpm: $(root, "[data-cap-wpm]"), fillers: $(root, "[data-cap-fillers]"), pace: $(root, "[data-cap-pace]"), list: $(root, "[data-cap-list]"), note: $(root, "[data-cap-note]") };
    let lang = "en-IN", rec = null, want = false, final = "", startAt = 0, spoken = 0;
    if (!SR) {
      root.classList.add("no-speech");
      el.note.textContent = "This browser can't turn speech into text. Try Chrome or Edge on a laptop or Android phone, or Safari on an iPhone.";
      mic.disabled = true;
      return;
    }
    const esc = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    function stats(all) {
      const words = all.trim() ? all.trim().split(/\s+/).length : 0;
      const mins = startAt ? (spoken + (want ? performance.now() - startAt : 0)) / 60000 : 0;
      const wpm = mins > 0.08 ? Math.round(words / mins) : 0;
      const low = " " + all.toLowerCase().replace(/[.,!?]/g, " ") + " ";
      const found = {};
      FILLERS[lang].forEach((f) => { const n = low.split(" " + f + " ").length - 1; if (n) found[f] = n; });
      const fillers = Object.values(found).reduce((a, b) => a + b, 0);
      el.words.textContent = words;
      el.wpm.textContent = wpm || "–";
      el.fillers.textContent = fillers;
      el.pace.textContent = !wpm ? "Start talking" : wpm < 100 ? "A bit slow" : wpm <= 160 ? "Great pace" : "Slow down a little";
      el.pace.dataset.tone = !wpm ? "" : wpm < 100 || wpm > 160 ? "warn" : "good";
      el.list.innerHTML = Object.entries(found).map(([f, n]) => `<span>“${esc(f)}” × ${n}</span>`).join("");
      let marked = esc(all);
      FILLERS[lang].forEach((f) => { marked = marked.replace(new RegExp(`(^|\\s)(${f})(?=[\\s.,!?]|$)`, "gi"), "$1<mark>$2</mark>"); });
      return marked;
    }
    function begin() {
      rec = new SR();
      rec.lang = lang; rec.continuous = true; rec.interimResults = true;
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += (final ? " " : "") + t.trim(); else interim += t;
        }
        textBox.innerHTML = `${stats(final + " " + interim)}<span class="cap-cursor"></span>`;
        textBox.scrollTop = textBox.scrollHeight;
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") { want = false; el.note.textContent = "Microphone blocked. Allow the microphone in your browser's settings and try again."; }
        else if (e.error === "network") { el.note.textContent = "Speech recognition needs the internet. Check your connection."; }
      };
      // Browsers stop listening after a pause, so start again until you press Stop
      rec.onend = () => { if (want) { try { rec.start(); } catch (err) { /* already starting */ } } else setMic(false); };
      rec.start();
    }
    function setMic(on) {
      mic.setAttribute("aria-pressed", String(on));
      mic.innerHTML = on ? '<span class="cap-dot"></span> Stop listening' : "Start talking";
      root.classList.toggle("is-listening", on);
    }
    mic.addEventListener("click", () => {
      buzz();
      if (want) { want = false; spoken += performance.now() - startAt; if (rec) rec.stop(); setMic(false); return; }
      want = true; startAt = performance.now();
      el.note.textContent = "Your browser's speech service turns your voice into text. PACS AI doesn't record or keep anything.";
      setMic(true); begin();
    });
    $$(root, "[data-cap-lang] button").forEach((b, _, all) => b.addEventListener("click", () => {
      all.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      lang = b.dataset.v;
      if (want && rec) { rec.onend = null; rec.stop(); begin(); rec.onend = () => { if (want) { try { rec.start(); } catch (err) { /* already starting */ } } else setMic(false); }; }
    }));
    $(root, "[data-cap-clear]").addEventListener("click", () => { final = ""; spoken = 0; startAt = performance.now(); textBox.innerHTML = '<span class="cap-empty">Your words appear here as you speak.</span>'; stats(""); });
  });

  /* ---------------- 6. Pitch to the AI Sharks (made-up investors) ---------------- */
  const SHARKS = [
    { key: "numbers", name: "Meera", role: "The Numbers Shark", face: "M" },
    { key: "brand", name: "Arjun", role: "The Brand Shark", face: "A" },
    { key: "ops", name: "Kavya", role: "The Operations Shark", face: "K" },
  ];
  const PITCHES = {
    coffee: { name: "FilterBox", line: "Fresh filter-coffee decoction, delivered to your door every morning", qs: [
      ["What does one delivery cost you, and what do you charge?", ["₹22 to make and deliver. We charge ₹45, and 300 homes already pay every month.", true], ["We haven't worked out the costs yet, but people love it.", false]],
      ["Why won't a big coffee brand just copy you?", ["Our decoction is brewed at 5 am in each area. A big brand can't do fresh, local and daily.", true], ["We'll just have better marketing than them.", false]],
      ["What happens the day your delivery rider doesn't turn up?", ["Every route has a backup rider, and customers get a WhatsApp alert with the new time.", true], ["It hasn't happened yet.", false]],
    ] },
    rent: { name: "RentRack", line: "Party wear on rent for college students", qs: [
      ["How many times is one outfit rented before it wears out?", ["About 14 times. It costs us ₹2,000 and earns ₹450 each rental.", true], ["Quite a lot, I think.", false]],
      ["Why would a student rent when they can buy something cheap?", ["Nobody wants to repeat an outfit in photos. Renting gives them a new look for every function.", true], ["Because renting is cheaper.", false]],
      ["How do you clean and check every return?", ["Steam cleaning within 24 hours, a 10-point check, and a photo record of every piece.", true], ["Customers usually return it clean.", false]],
    ] },
    videos: { name: "ChalkTalk", line: "Maths videos for Kannada-medium students", qs: [
      ["If the videos are free, how do you make money?", ["Free videos bring students in. ₹199 a month unlocks tests and doubt-solving, and 8% already pay.", true], ["We'll add ads later.", false]],
      ["Why Kannada-medium students?", ["Lakhs of students learn in Kannada, and almost nobody makes good maths videos for them.", true], ["Because it's what I know.", false]],
      ["How will you make 500 videos without burning out?", ["Teachers write the scripts, AI helps with editing, and we record 20 videos every Saturday.", true], ["I'll just work harder.", false]],
    ] },
  };
  const ASKS = { 5: "₹25 lakh for 5%", 10: "₹25 lakh for 10%", 20: "₹25 lakh for 20%" };
  const crore = (lakh) => lakh >= 100 ? `₹${(lakh / 100).toFixed(lakh % 100 ? 2 : 0).replace(/\.?0+$/, "")} crore` : `₹${Math.round(lakh)} lakh`;
  document.querySelectorAll("[data-sharks]").forEach((root) => {
    const stage = $(root, "[data-sh-stage]");
    const panel = $(root, "[data-sh-panel]");
    let idea = "coffee", ask = 10, q = 0, mood = {};
    const meters = () => SHARKS.map((s) => `<div class="sh-card" data-k="${s.key}"><span class="sh-face" aria-hidden="true">${s.face}</span><b>${s.name}</b><small>${s.role}</small><span class="sh-meter"><i style="width:${mood[s.key]}%"></i></span></div>`).join("");
    function setup() {
      q = 0; mood = { numbers: 50, brand: 50, ops: 50 };
      stage.innerHTML = meters();
      const p = PITCHES[idea];
      panel.innerHTML = `<p class="sh-say">You walk in with <b>${p.name}</b>: ${p.line}. Your ask: <b>${ASKS[ask]}</b>. That values your company at <b>${crore(25 / (ask / 100))}</b>.</p><button type="button" class="pm-tool pm-publish" data-sh-go>Walk into the tank <span aria-hidden="true">→</span></button>`;
      $(panel, "[data-sh-go]").addEventListener("click", () => { buzz(); if (ask === 5) mood.numbers -= 20; if (ask === 20) mood.numbers += 10; askNext(); });
    }
    function paint() { SHARKS.forEach((s) => { const i = $(stage, `[data-k="${s.key}"] .sh-meter i`); i.style.width = `${Math.max(0, Math.min(100, mood[s.key]))}%`; }); }
    function askNext() {
      paint();
      if (q >= 3) return verdict();
      const s = SHARKS[q], [question, ...answers] = PITCHES[idea].qs[q];
      $$(stage, ".sh-card").forEach((c) => c.classList.toggle("is-talking", c.dataset.k === s.key));
      const order = Math.random() < 0.5 ? answers : [answers[1], answers[0]];
      panel.innerHTML = `<p class="sh-q"><span>${s.name} asks</span>${question}</p><div class="sh-answers">${order.map((a, i) => `<button type="button" class="iv-answer" data-a="${i}"><small>Your answer</small><span>${a[0]}</span></button>`).join("")}</div>`;
      $$(panel, "[data-a]").forEach((b) => b.addEventListener("click", () => {
        buzz(8);
        const strong = order[+b.dataset.a][1];
        mood[s.key] += strong ? 32 : -28;
        SHARKS.forEach((o) => { if (o.key !== s.key) mood[o.key] += strong ? 6 : -6; });
        panel.innerHTML = `<p class="sh-react">${s.name}: ${strong ? pick(["I like that. You know your numbers.", "Now that's an answer.", "Okay, you've done your homework."]) : pick(["Hmm. That worries me.", "That's not good enough.", "I've heard that before."])}</p>`;
        paint();
        q += 1;
        setTimeout(askNext, reduce ? 200 : 1300);
      }));
    }
    function verdict() {
      $$(stage, ".sh-card").forEach((c) => c.classList.remove("is-talking"));
      const offers = SHARKS.map((s) => {
        const m = mood[s.key];
        if (m < 50) return { s, out: true };
        const base = m >= 80 ? ask : Math.round(ask * (m >= 65 ? 1.5 : 2));
        // Each Shark deals differently: exact terms, more equity with marketing help, or more money for more equity
        const style = { numbers: { amt: 25, eq: base, perk: "Straight money, no extras" }, brand: { amt: 25, eq: base + 2, perk: "Plus his marketing team" }, ops: { amt: 30, eq: base + 3, perk: "Plus her supply-chain help" } }[s.key];
        return { s, equity: style.eq, amt: style.amt, perk: style.perk, value: style.amt / (style.eq / 100) };
      });
      const any = offers.some((o) => !o.out);
      panel.innerHTML = `<p class="sh-q"><span>The verdict</span>${any ? "You have offers. Pick one, or walk away." : "All three Sharks are out. Fix the weak answers and pitch again."}</p><div class="sh-offers">${offers.map((o) => o.out
        ? `<div class="sh-offer is-out"><b>${o.s.name}</b><span>I'm out.</span></div>`
        : `<button type="button" class="sh-offer" data-deal="${o.s.key}"><b>${o.s.name}</b><span>₹${o.amt} lakh for ${o.equity}%</span><small>${o.perk} · values you at ${crore(o.value)}</small></button>`).join("")}</div><button type="button" class="pm-tool" data-sh-again>Pitch again <span aria-hidden="true">↻</span></button>`;
      $$(panel, "[data-deal]").forEach((b) => b.addEventListener("click", () => {
        buzz([10, 50, 30]);
        const o = offers.find((x) => x.s.key === b.dataset.deal);
        panel.innerHTML = `<div class="sh-deal"><b>Deal done with ${o.s.name}!</b><p>You gave up ${o.equity}% for ₹${o.amt} lakh. Your company is now valued at ${crore(o.value)}.${o.equity > ask ? ` You asked for ${ask}%, so answering better would have kept ${o.equity - ask}% more of your company.` : " Exactly what you asked for. Brilliant pitch."}</p><button type="button" class="pm-tool" data-sh-again>Pitch another idea <span aria-hidden="true">↻</span></button></div>`;
        $(panel, "[data-sh-again]").addEventListener("click", setup);
      }));
      $(panel, "[data-sh-again]").addEventListener("click", setup);
    }
    $$(root, "[data-sh-idea] button").forEach((b, _, all) => b.addEventListener("click", () => { all.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); idea = b.dataset.v; setup(); }));
    $$(root, "[data-sh-ask] button").forEach((b, _, all) => b.addEventListener("click", () => { all.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); ask = +b.dataset.v; setup(); }));
    setup();
  });

  /* ---------------- 7. Build a fantasy XI like a data analyst (made-up players) ---------------- */
  const PLAYERS = [
    ["Aarav Rao", "WK", 8.5, 38], ["Kiran Pai", "WK", 7, 34],
    ["Dev Hegde", "BAT", 10.5, 52], ["Rohan Nair", "BAT", 9.5, 45], ["Sameer Khan", "BAT", 8, 41], ["Vikram Shenoy", "BAT", 7.5, 39], ["Arjun Kamath", "BAT", 6.5, 30],
    ["Nikhil Bhat", "AR", 10, 58], ["Omkar Patil", "AR", 8.5, 47], ["Yash Kini", "AR", 7, 40], ["Rahul D'Souza", "AR", 6, 33],
    ["Imran Sheikh", "BOWL", 9, 48], ["Pranav Acharya", "BOWL", 8, 42], ["Karthik Iyer", "BOWL", 7.5, 41], ["Suraj Poojary", "BOWL", 6.5, 36], ["Ajay Menon", "BOWL", 5.5, 29],
  ].map(([name, role, cr, pts], i) => ({ i, name, role, cr, pts }));
  const RULES = { size: 11, budget: 88, min: { WK: 1, BAT: 3, AR: 1, BOWL: 3 } };
  const teamScore = (team) => team.reduce((a, p) => a + p.pts, 0) + Math.max(0, ...team.map((p) => p.pts)); // captain scores double
  const teamCost = (team) => team.reduce((a, p) => a + p.cr, 0);
  const valid = (team) => team.length === RULES.size && teamCost(team) <= RULES.budget && Object.entries(RULES.min).every(([r, n]) => team.filter((p) => p.role === r).length >= n);
  function bestTeam() {
    // 16 players, choose 11: check every one of the 4,368 possible teams
    let best = null, checked = 0;
    const pickSet = (start, chosen) => {
      if (chosen.length === RULES.size) { checked++; if (valid(chosen)) { const s = teamScore(chosen); if (!best || s > best.s) best = { s, team: chosen.slice() }; } return; }
      for (let i = start; i <= PLAYERS.length - (RULES.size - chosen.length); i++) { chosen.push(PLAYERS[i]); pickSet(i + 1, chosen); chosen.pop(); }
    };
    pickSet(0, []);
    return { ...best, checked };
  }
  document.querySelectorAll("[data-fantasy]").forEach((root) => {
    const grid = $(root, "[data-fx-grid]");
    const bar = { n: $(root, "[data-fx-n]"), cr: $(root, "[data-fx-cr]"), pts: $(root, "[data-fx-pts]") };
    const out = $(root, "[data-fx-out]");
    const mine = new Set();
    grid.innerHTML = PLAYERS.map((p) => `<button type="button" class="fx-p" data-i="${p.i}" aria-pressed="false"><span class="fx-role">${p.role}</span><b>${p.name}</b><span class="fx-meta"><span>${p.cr} cr</span><span>${p.pts} pts</span></span></button>`).join("");
    const team = () => [...mine].map((i) => PLAYERS[i]);
    function update() {
      const t = team(), cost = teamCost(t);
      bar.n.textContent = `${t.length}/11`;
      bar.cr.textContent = `${cost} / ${RULES.budget}`;
      bar.cr.parentElement.classList.toggle("over", cost > RULES.budget);
      bar.pts.textContent = t.length ? teamScore(t) : 0;
      $$(grid, ".fx-p").forEach((b) => { const on = mine.has(+b.dataset.i); b.setAttribute("aria-pressed", String(on)); b.classList.remove("is-ai"); });
    }
    $$(grid, ".fx-p").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      if (mine.has(i)) mine.delete(i); else if (mine.size < 11) mine.add(i); else { out.innerHTML = "<p>You already have 11 players. Tap one to drop it first.</p>"; return; }
      buzz(5); update();
    }));
    $(root, "[data-fx-ai]").addEventListener("click", async () => {
      buzz();
      out.innerHTML = '<p><span class="ask-dots" aria-label="Checking every possible team"><i></i><i></i><i></i></span> Checking every possible team…</p>';
      await wait(500);
      const t0 = performance.now(), best = bestTeam(), ms = Math.max(1, Math.round(performance.now() - t0));
      $$(grid, ".fx-p").forEach((b) => b.classList.toggle("is-ai", best.team.some((p) => p.i === +b.dataset.i)));
      const value = PLAYERS.map((p) => ({ ...p, v: p.pts / p.cr })).sort((a, b) => b.v - a.v);
      const bargain = value.find((p) => best.team.includes(PLAYERS[p.i]));
      const trap = PLAYERS.filter((p) => !best.team.includes(p)).sort((a, b) => b.cr - a.cr)[0];
      const t = team(), yours = valid(t) ? teamScore(t) : null;
      const captain = best.team.reduce((a, p) => (p.pts > a.pts ? p : a));
      out.innerHTML = `<p class="fx-head">The AI checked <b>${best.checked.toLocaleString("en-IN")}</b> possible teams in ${ms} ms.</p>
        <div class="fx-vs"><span><small>AI team</small><b>${best.s} pts</b></span><span><small>Your team</small><b>${yours == null ? "Not complete" : yours + " pts"}</b></span></div>
        <ul class="fx-notes"><li>Captain: <b>${captain.name}</b>. Captains score double.</li><li>Best value: <b>${bargain.name}</b>, ${bargain.v.toFixed(1)} points for every credit.</li><li>Left out: <b>${trap.name}</b>. ${trap.pts} points for ${trap.cr} credits is poor value.</li></ul>
        ${yours != null && yours >= best.s ? "<p class=\"fx-win\">You matched the AI. Serious analyst skills.</p>" : yours != null ? `<p>You're ${best.s - yours} points behind. The outlined cards are the AI's picks.</p>` : "<p>The outlined cards are the AI's picks. Now build yours and try to beat it.</p>"}`;
    });
    $(root, "[data-fx-clear]").addEventListener("click", () => { mine.clear(); out.innerHTML = ""; update(); });
    update();
  });

  /* ---------------- 8. Haggle with an AI shopkeeper ---------------- */
  const WARES = {
    jacket: { name: "Leather jacket", ask: 4000, floor: 2600 },
    phone: { name: "Second-hand phone", ask: 12000, floor: 9000 },
    lamp: { name: "Brass lamp", ask: 2500, floor: 1500 },
  };
  document.querySelectorAll("[data-haggle]").forEach((root) => {
    const chat = $(root, "[data-hg-chat]");
    const range = $(root, "[data-hg-range]");
    const offerOut = $(root, "[data-hg-offer]");
    const priceTag = $(root, "[data-hg-price]");
    const moodEl = $(root, "[data-hg-mood]");
    const actions = $(root, "[data-hg-actions]");
    let item, price, patience, used, done, moves;
    const say = (who, text) => {
      const p = document.createElement("p");
      p.className = `hg-msg ${who}`;
      p.innerHTML = text;
      chat.appendChild(p);
      chat.scrollTop = chat.scrollHeight;
    };
    const setMood = () => { const p = Math.max(0, patience); moodEl.textContent = done ? "Done" : "●".repeat(p) + "○".repeat(3 - p); moodEl.parentElement.dataset.low = String(!done && p <= 1); };
    function start(key) {
      item = WARES[key]; price = item.ask; patience = 3; used = new Set(); done = false; moves = [];
      chat.innerHTML = "";
      range.min = Math.round(item.ask * 0.3 / 50) * 50; range.max = item.ask; range.step = 50; range.value = Math.round(item.ask * 0.55 / 50) * 50;
      offerOut.textContent = rupees(+range.value);
      priceTag.textContent = rupees(price);
      actions.hidden = false;
      say("them", `Namaskara! Best ${item.name.toLowerCase()} in the market. Only <b>${rupees(price)}</b>. Very good quality.`);
      setMood();
    }
    function end(deal) {
      done = true; actions.hidden = true; setMood();
      if (!deal) { say("coach", `<b>No deal.</b> He walked away. Tip: never go below his patience. Push hard, but leave him a way to save face.`); return; }
      const score = Math.max(0, Math.min(10, Math.round((item.ask - deal) / (item.ask - item.floor) * 10)));
      const tips = [];
      if (moves[0] && moves[0] <= item.ask * 0.6) tips.push("A low first offer anchored him down. Smart.");
      else tips.push("Next time, open lower. Your first number sets the whole negotiation.");
      if (used.has("flaw")) tips.push("Pointing out a flaw gave him a reason to drop the price.");
      if (used.has("walk")) tips.push("Walking away showed you were serious.");
      if (!used.size) tips.push("Try a tactic: point out a flaw, offer cash, or walk away.");
      say("coach", `<b>Deal at ${rupees(deal)}.</b> His lowest was ${rupees(item.floor)}. Negotiation score: <b>${score}/10</b>.<br>${tips.join(" ")}`);
    }
    function offer(amount) {
      if (done) return;
      moves.push(amount);
      say("me", `I'll give you ${rupees(amount)}.`);
      setTimeout(() => {
        if (amount >= price || (amount >= item.floor && price - amount <= item.ask * 0.03)) { say("them", `Okay, okay. ${rupees(amount)}. Done!`); return end(amount); }
        if (amount < item.floor * 0.8) {
          patience -= 1; setMood();
          if (patience <= 0) { say("them", "Arre, you're wasting my time. Go, go. Not selling."); return end(null); }
          say("them", pick([`${rupees(amount)}?! Are you joking? Even the cost price is more!`, "Arre, don't insult me. Be serious.", `For ${rupees(amount)} I can't even buy it myself!`]));
          return;
        }
        price = Math.max(item.floor, Math.round((price - (price - amount) * 0.38) / 50) * 50);
        priceTag.textContent = rupees(price);
        say("them", price === item.floor ? `Final price, ${rupees(price)}. Not one rupee less.` : pick([`Okay, for you, ${rupees(price)}.`, `Last price, ${rupees(price)}. I'm giving you a discount.`, `${rupees(price)}. That's my best, really.`]));
      }, reduce ? 50 : 650);
    }
    const TACTICS = {
      flaw: () => { price = Math.max(item.floor, Math.round(price * 0.93 / 50) * 50); say("me", "There's a scratch here, and the stitching is loose."); setTimeout(() => say("them", `Hmm… small thing only. Okay, ${rupees(price)}.`), 500); },
      cash: () => { price = Math.max(item.floor, Math.round(price * 0.96 / 50) * 50); say("me", "I'll pay cash right now."); setTimeout(() => say("them", `Cash? Okay, ${rupees(price)}.`), 500); },
      walk: () => {
        say("me", "Leave it. I'll check the next shop.");
        setTimeout(() => {
          if (price > item.floor * 1.05) { price = Math.max(item.floor, Math.round((price + item.floor) / 2 / 50) * 50); say("them", `Arre, wait wait! Come back. ${rupees(price)}, final.`); }
          else { say("them", "Okay, go. This is already the lowest price."); patience -= 1; setMood(); if (patience <= 0) end(null); }
        }, 700);
      },
    };
    range.addEventListener("input", () => { offerOut.textContent = rupees(+range.value); });
    $(root, "[data-hg-send]").addEventListener("click", () => { buzz(); offer(+range.value); });
    $$(root, "[data-hg-tactic]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.hgTactic;
      if (done) return;
      if (used.has(t) && t !== "walk") { say("them", "You said that already!"); return; }
      buzz(); used.add(t); TACTICS[t](); setTimeout(() => { priceTag.textContent = rupees(price); }, 750);
    }));
    $(root, "[data-hg-accept]").addEventListener("click", () => { if (!done) { say("me", `Okay, ${rupees(price)}. Deal.`); end(price); } });
    $$(root, "[data-hg-item] button").forEach((b, _, all) => b.addEventListener("click", () => { all.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); start(b.dataset.v); }));
    start("jacket");
  });

  /* ---------------- 9. Your brand in 10 seconds ---------------- */
  const TAGLINES = {
    cafe: ["Brewed for slow mornings.", "Good coffee. Better company.", "Where {n} feels like home.", "Sip. Sit. Stay a while."],
    clothing: ["Made to be noticed.", "Wear your story.", "Everyday, elevated.", "Dressed for what's next."],
    tech: ["Smarter, by design.", "Built for what's next.", "Tech that just works.", "Less effort. More done."],
    bakery: ["Baked at dawn. Gone by noon.", "Fresh, every single morning.", "Life's sweeter at {n}.", "Warm from the oven, just for you."],
    fitness: ["Stronger every day.", "Sweat now. Shine later.", "Your best rep starts here.", "Show up. Level up."],
  };
    const POSTS = { cafe: ["New brew drop", "Monday mood", "Our corner", "Latte art", "Weekend special"], clothing: ["New arrivals", "Style tip", "Behind the seams", "Outfit of the day", "Sale preview"], tech: ["Launch day", "How it works", "Behind the build", "Tip Tuesday", "Customer story"], bakery: ["Fresh today", "From our oven", "Meet the baker", "Cake of the week", "Pre-order now"], fitness: ["Workout of the day", "Member win", "Form check", "New class", "Rest day tip"] };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const hsl = (h, s, l) => `hsl(${Math.round(h)} ${s}% ${l}%)`;
  document.querySelectorAll("[data-brand]").forEach((root) => {
    const input = $(root, "[data-br-name]");
    const out = $(root, "[data-br-out]");
    let cat = "cafe", spin = 0;
    function render() {
      const name = (input.value.trim() || "Monsoon Café").slice(0, 22);
      const safe = name.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const h = hash(name.toLowerCase() + cat + spin);
      const hue = h % 360, shape = (h >>> 9) % 4, serif = (h >>> 12) % 2 === 1;
      const main = hsl(hue, 62, 42), soft = hsl(hue, 70, 93), pop = hsl((hue + 150 + ((h >>> 5) % 60)) % 360, 78, 58), ink = hsl(hue, 30, 14);
      const words = name.split(/\s+/).filter(Boolean);
      const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase().replace(/[&<>"]/g, "");
      const lines = TAGLINES[cat];
      const tagline = lines[(h >>> 3) % lines.length].replace("{n}", safe);
      const shapes = [
        `<circle cx="50" cy="50" r="46" fill="${main}"/>`,
        `<rect x="6" y="6" width="88" height="88" rx="24" fill="${main}"/>`,
        `<path d="M50 4 90 27v46L50 96 10 73V27Z" fill="${main}"/>`,
        `<path d="M8 96V50a42 42 0 0 1 84 0v46Z" fill="${main}"/>`,
      ];
      const font = serif ? "'Playfair Display', Georgia, serif" : "Inter, system-ui, sans-serif";
      const logo = `<svg viewBox="0 0 100 100" class="br-logo" role="img" aria-label="${safe} logo">${shapes[shape]}<circle cx="78" cy="22" r="9" fill="${pop}"/><text x="50" y="${shape === 3 ? 72 : 63}" text-anchor="middle" font-family="${font}" font-style="${serif ? "italic" : "normal"}" font-weight="800" font-size="36" fill="#fff">${initials}</text></svg>`;
      const tiles = POSTS[cat].map((t, i) => `<span class="br-tile" style="background:${[main, soft, ink, pop, soft][i]};color:${[ "#fff", ink, "#fff", ink, main][i]}">${t}</span>`).join("");
      out.innerHTML = `
        <div class="br-hero" style="background:${soft}">${logo}<div><strong style="font-family:${font};${serif ? "font-style:italic;font-weight:400;" : ""}color:${ink}">${safe}</strong><span style="color:${main}">${tagline}</span></div></div>
        <div class="br-palette">${[main, soft, pop, ink].map((c, i) => `<span style="background:${c}"><small style="color:${i === 1 ? ink : "#fff"}">${["Main", "Soft", "Pop", "Ink"][i]}</small></span>`).join("")}</div>
        <div class="br-grid" aria-label="Sample Instagram grid">${logo.replace('class="br-logo"', 'class="br-tile br-tile-logo"')}${tiles}</div>
        <div class="br-card" style="background:${ink};color:#fff"><b style="font-family:${font}">${safe}</b><small style="color:${pop}">${tagline}</small><span>hello@${name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "") || "brand"}.in</span></div>`;
      replayAnim(out, "is-new");
    }
    let t = 0;
    input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(render, 180); });
    $(root, "[data-br-shuffle]").addEventListener("click", () => { buzz(); spin += 1; render(); });
    $$(root, "[data-br-cat] button").forEach((b, _, all) => b.addEventListener("click", () => { buzz(5); all.forEach((x) => x.setAttribute("aria-pressed", String(x === b))); cat = b.dataset.v; spin = 0; render(); }));
    render();
  });

  /* ---------------- Links straight to one demo (demos.html#try-budget) ----------------
     Cards above the linked demo finish drawing after the browser's first jump and push it
     down, so settle on it again once the page has loaded, unless the visitor has scrolled. */
  const linked = location.hash.startsWith("#try-") && document.getElementById(location.hash.slice(1));
  if (linked) {
    let moved = false;
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach((t) => addEventListener(t, () => { moved = true; }, { once: true, passive: true }));
    const settle = () => { if (!moved) linked.scrollIntoView({ block: "start", behavior: "instant" }); };
    const settleAll = () => { settle(); if (document.fonts) document.fonts.ready.then(() => requestAnimationFrame(settle)); setTimeout(settle, 700); setTimeout(settle, 1600); };
    document.readyState === "complete" ? settleAll() : addEventListener("load", settleAll, { once: true });
  }
})();
