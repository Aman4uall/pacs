/* =========================================================================
   PACS AI – the Song Challenge's playable "now playing" card
   Every beat is made on the visitor's device with the Web Audio API: drums,
   bass, chords and a tune, in six styles. Nothing is downloaded and nothing
   plays until someone taps play. The same engine lets Step 1's
   "Hear this style" button play the style and mood a student has picked.
   ========================================================================= */
(function () {
  const player = document.querySelector("[data-player]");
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!player) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = player) => root.querySelector(sel);

  /* ---------- The five song ideas on the card ---------- */
  const SONGS = [
    { title: "One More Page", by: "Class 9", style: "bollywood", mood: "hype", hook: "One more page, then I'm done" },
    { title: "Monsoon Mode", by: "Class 11", style: "lofi", mood: "chill", hook: "Rain on the roof, chai in my hand" },
    { title: "Same Bench", by: "Class 10", style: "acoustic", mood: "emotional", hook: "Same bench since Class 1" },
    { title: "Last Ball Six", by: "Class 8", style: "rap", mood: "hype", hook: "Six on the last ball" },
    { title: "Build Tomorrow", by: "Class 12", style: "edm", mood: "hype", hook: "Watch me build tomorrow" },
  ];
  const STYLE_NAMES = { bollywood: "Bollywood pop", rap: "Hip-hop", lofi: "Lo-fi", rock: "Rock", acoustic: "Acoustic", edm: "EDM" };

  /* ---------- Six styles: tempo, chords, a 16-step drum grid, bass and tune ---------- */
  // Chords are MIDI notes, one chord per bar. Drum rows: x = hit, o = soft hit.
  const STYLES = {
    bollywood: { bpm: 104, chords: [[62, 65, 69], [58, 62, 65], [65, 69, 72], [60, 64, 67]], keys: "stab", stab: "x..x..x.x..x..x.", lead: "square",
      drums: { dhol: "x..x..x.x.......", tak: "..x..x.x..x.x.xx", clap: "....x.......x...", hat: "x.x.x.x.x.x.x.x." }, bass: "x..x..x.x.......", bassWave: "triangle",
      tune: [7, null, 9, 7, 5, null, 4, 2, 4, null, 5, 4, 2, null, 0, null] },
    rap: { bpm: 88, chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], keys: "stab", stab: "x.........x.....", lead: "triangle", swing: .12,
      drums: { kick: "x......x.x......", snare: "....x.......x...", hat: "x.xxx.x.x.xxx.x." }, bass: "x......x.x......", bassWave: "sine", bassLong: true,
      tune: [12, null, null, 10, null, null, 7, null, 12, null, 10, null, 7, null, null, null] },
    lofi: { bpm: 74, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], keys: "pad", lead: "triangle", swing: .18, crackle: true, dark: true,
      drums: { kick: "x.......x.x.....", snare: "....x.......x...", hat: "x.o.x.o.x.o.x.o." }, bass: "x.......x.......", bassWave: "sine",
      tune: [4, null, null, 2, null, 0, null, null, 7, null, null, 4, null, 2, null, null] },
    rock: { bpm: 122, chords: [[52, 59, 64], [48, 55, 60], [55, 62, 67], [50, 57, 62]], keys: "power", stab: "x.x.x.x.x.x.x.x.", lead: "sawtooth",
      drums: { kick: "x.....x.x.......", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", crash: "x..............." }, bass: "x.x.x.x.x.x.x.x.", bassWave: "sawtooth",
      tune: [7, null, 7, 9, 7, null, 4, null, 7, null, 7, 9, 12, null, 9, null] },
    acoustic: { bpm: 96, chords: [[55, 59, 62, 67], [52, 55, 59, 64], [48, 52, 55, 60], [50, 54, 57, 62]], keys: "strum", lead: "triangle",
      drums: { clap: "....x.......x...", shaker: "xoxoxoxoxoxoxoxo", kick: "x.......x......." }, bass: "x.......x...x...", bassWave: "triangle",
      tune: [4, null, 5, 4, 2, null, null, null, 4, null, 5, 7, 4, null, null, null] },
    edm: { bpm: 124, chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], keys: "pump", lead: "sawtooth", pump: true,
      drums: { kick: "x...x...x...x...", clap: "....x.......x...", hat: "..x...x...x...x." }, bass: "..x...x...x...x.", bassWave: "sawtooth",
      tune: [12, 12, null, 9, null, 12, null, 14, 12, null, 9, null, 7, null, 9, null] },
  };
  const MOODS = {
    hype: { tempo: 1.06, bright: 1.25 },
    chill: { tempo: .9, bright: .6 },
    funny: { tempo: 1.04, bright: 1.1, octave: 12, short: true },
    emotional: { tempo: .88, bright: .8, lush: true },
  };
  const BARS = 8;
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- The engine ---------- */
  let ctx, out, analyser, noise, timer = 0, raf = 0;
  const now = { style: null, mood: null, step: 0, next: 0, start: 0, stepDur: .15, onBeat: null, onEnd: null, playing: false };

  function boot() {
    if (ctx) return ctx.resume();
    ctx = new AC();
    // iPhones: play even when the ring/silent switch is on
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* older phones */ }
    const master = ctx.createGain(); master.gain.value = .5;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    analyser = ctx.createAnalyser(); analyser.fftSize = 64; analyser.smoothingTimeConstant = .72;
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    out = master;
    const len = ctx.sampleRate;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx.resume();
  }
  function gainEnv(t, peak, attack, decay, dest = out) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
    g.connect(dest);
    return g;
  }
  function osc(type, freq, t, dur, peak, cutoff, attack = .008) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff;
    o.connect(f); f.connect(gainEnv(t, peak, attack, dur));
    o.start(t); o.stop(t + attack + dur + .05);
    return o;
  }
  function burst(t, peak, decay, type, freq) {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    s.connect(f); f.connect(gainEnv(t, peak, .002, decay));
    s.start(t, Math.random() * .5); s.stop(t + decay + .05);
  }
  function drop(t, from, to, peak, decay, type = "sine") {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + decay * .6);
    o.connect(gainEnv(t, peak, .003, decay)); o.start(t); o.stop(t + decay + .05);
  }
  const DRUM = {
    kick: (t, v) => drop(t, 150, 45, .9 * v, .32),
    dhol: (t, v) => drop(t, 110, 62, .8 * v, .34),
    tak: (t, v) => { drop(t, 520, 380, .32 * v, .07, "triangle"); burst(t, .12 * v, .05, "highpass", 2500); },
    snare: (t, v) => { burst(t, .45 * v, .17, "highpass", 1400); drop(t, 220, 160, .25 * v, .08, "triangle"); },
    clap: (t, v) => { [0, .012, .024].forEach((o) => burst(t + o, .32 * v, .1, "bandpass", 1600)); },
    hat: (t, v) => burst(t, .13 * v, .035, "highpass", 7500),
    shaker: (t, v) => burst(t, .09 * v, .05, "highpass", 5500),
    crash: (t, v) => burst(t, .22 * v, 1.1, "highpass", 5000),
  };

  function playStep(step, t) {
    const S = STYLES[now.style], M = MOODS[now.mood] || MOODS.hype;
    const bar = Math.floor(step / 16), s = step % 16, dur = now.stepDur;
    const chord = S.chords[bar % S.chords.length];
    const bright = (S.dark ? 1400 : 3200) * M.bright;
    // Drums
    for (const [name, row] of Object.entries(S.drums)) {
      const c = row[s];
      if (c === "x" || c === "o") DRUM[name](t, c === "x" ? 1 : .45);
    }
    // Bass
    if (S.bass[s] === "x") osc(S.bassWave, midi(chord[0] - 24), t, S.bassLong ? dur * 6 : dur * 1.8, .42, S.bassWave === "sine" ? 800 : 600);
    // Chords
    if (S.keys === "pad" && s === 0) chord.forEach((n) => osc("triangle", midi(n), t, dur * 15, M.lush ? .085 : .07, bright * .7, .12));
    if ((S.keys === "stab" || S.keys === "power") && S.stab[s] === "x") chord.forEach((n) => osc(S.keys === "power" ? "sawtooth" : "square", midi(n), t, dur * .9, .05, bright));
    if (S.keys === "strum" && s % 2 === 0) osc("triangle", midi(chord[(s / 2) % chord.length] + 12), t, dur * 3, .12, bright);
    if (S.keys === "pump" && s % 4 === 2) chord.forEach((n) => osc("sawtooth", midi(n), t, dur * 1.6, .06, bright));
    // Tune: bars 2 to 4 and 6 to 8 of each loop, so the song breathes
    const deg = S.tune[s];
    if (bar % 4 !== 0 && deg !== null && deg !== undefined) {
      osc(S.lead, midi(chord[0] + 12 + deg + (M.octave || 0)), t, dur * (M.short ? .8 : 1.7), .09, bright * 1.2);
    }
    if (S.crackle && Math.random() < .35) burst(t + Math.random() * dur, .03, .02, "highpass", 3000);
    if (s % 4 === 0 && now.onBeat) {
      const beat = step / 4, delay = Math.max(0, (t - ctx.currentTime) * 1000);
      setTimeout(() => now.playing && now.onBeat && now.onBeat(beat), delay);
    }
  }

  function schedule() {
    const total = BARS * 16;
    while (now.next < ctx.currentTime + .12) {
      if (now.step >= total) { const end = now.onEnd; stop(); if (end) end(); return; }
      const swing = (STYLES[now.style].swing || 0) * now.stepDur * (now.step % 2);
      playStep(now.step, now.next + swing);
      now.next += now.stepDur;
      now.step++;
    }
  }

  function play(style, mood, opts = {}) {
    stop(true);
    return boot().then(() => {
      now.style = STYLES[style] ? style : "bollywood";
      now.mood = MOODS[mood] ? mood : "hype";
      now.stepDur = 60 / (STYLES[now.style].bpm * MOODS[now.mood].tempo) / 4;
      now.step = opts.fromStep || 0;
      now.next = ctx.currentTime + .06;
      now.start = now.next - now.step * now.stepDur;
      now.onBeat = opts.onBeat || null;
      now.onEnd = opts.onEnd || null;
      now.playing = true;
      timer = setInterval(schedule, 25);
      schedule();
    });
  }
  function stop(quiet) {
    clearInterval(timer);
    now.playing = false;
    if (!quiet) { now.onBeat = null; }
  }
  const length = () => BARS * 16 * now.stepDur;
  const position = () => (now.playing && ctx ? Math.min(length(), ctx.currentTime - now.start) : 0);

  /* ---------- The card ---------- */
  const title = $("[data-player-title]"), by = $("[data-player-by]"), lyric = $("[data-player-lyric]");
  const state = $("[data-player-state]"), styleTag = $("[data-player-style]");
  const playBtn = $("[data-play]"), seek = $("[data-seek]"), fill = $("[data-progress]");
  const tNow = $("[data-time-now]"), tAll = $("[data-time-total]");
  const bars = [...player.querySelectorAll(".wave i")];
  let current = 0, touched = false, paused = { step: 0 };
  const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const lengthOf = (song) => BARS * 16 * (60 / (STYLES[song.style].bpm * MOODS[song.mood].tempo) / 4);

  function setLyric(text) {
    lyric.replaceChildren(...text.split(" ").flatMap((w, i) => {
      const s = document.createElement("span");
      s.style.setProperty("--w", i);
      s.textContent = w;
      return i ? [" ", s] : [s];
    }));
  }
  function show(i, animate) {
    current = (i + SONGS.length) % SONGS.length;
    const song = SONGS[current];
    const apply = () => {
      title.textContent = song.title;
      by.textContent = `Your name · ${song.by}`;
      styleTag.textContent = STYLE_NAMES[song.style];
      setLyric(song.hook);
      tAll.textContent = clock(lengthOf(song));
      tNow.textContent = "0:00";
      setProgress(0);
      title.classList.remove("is-out");
    };
    if (animate) { title.classList.add("is-out"); setTimeout(apply, 250); } else apply();
  }
  function setProgress(p) {
    fill.style.transform = `scaleX(${p})`;
    seek.style.setProperty("--p", p);
    seek.setAttribute("aria-valuenow", String(Math.round(p * 100)));
  }
  function karaoke(beat) {
    // One word per beat for two bars, then the line stays lit for two bars
    const words = [...lyric.querySelectorAll("span")];
    const b = beat % 16;
    words.forEach((w, i) => w.classList.toggle("is-sung", b >= i && b < 14));
  }
  function setPlaying(on) {
    player.classList.toggle("is-playing", on);
    playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
    state.textContent = on ? "Now playing" : touched ? "Paused" : "Tap play";
    if (on) loop(); else cancelAnimationFrame(raf);
  }
  function start(fromStep = 0) {
    touched = true;
    const song = SONGS[current];
    stopMachine();
    return play(song.style, song.mood, { fromStep, onBeat: karaoke, onEnd: () => { show(current + 1, true); setTimeout(() => start(0), 300); } })
      .then(() => setPlaying(true));
  }
  function pause() {
    paused.step = now.step;
    stop();
    setPlaying(false);
    lyric.querySelectorAll(".is-sung").forEach((w) => w.classList.remove("is-sung"));
  }
  function loop() {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const frame = () => {
      if (!now.playing || !player.classList.contains("is-playing")) return;
      const pos = position(), len = length();
      setProgress(pos / len);
      tNow.textContent = clock(pos);
      if (!reduce) {
        analyser.getByteFrequencyData(data);
        // Bass in the middle, higher sounds towards the edges, with the highs lifted so both sides move
        const mid = (bars.length - 1) / 2;
        bars.forEach((b, i) => {
          const d = Math.abs(i - mid) / mid;
          const bin = 1 + Math.round(d * 16) + (i % 2);
          const v = Math.pow(data[bin] / 255, .8) * (1 + d * .7);
          b.style.setProperty("--a", Math.min(1, .12 + v * .9).toFixed(3));
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  if (!AC) { player.classList.add("no-audio"); return; }

  playBtn.addEventListener("click", () => {
    if (player.classList.contains("is-playing")) pause(); else start(paused.step || 0);
  });
  $("[data-next]").addEventListener("click", () => { touched = true; paused.step = 0; const was = player.classList.contains("is-playing"); if (was) pause(); show(current + 1, true); if (was) setTimeout(() => start(0), 260); });
  $("[data-prev]").addEventListener("click", () => { touched = true; paused.step = 0; const was = player.classList.contains("is-playing"); if (was) pause(); show(current - 1, true); if (was) setTimeout(() => start(0), 260); });

  // Seek: tap or drag along the bar, or use the arrow keys
  const stepAt = (clientX) => { const r = seek.getBoundingClientRect(); return Math.round(Math.min(.98, Math.max(0, (clientX - r.left) / r.width)) * BARS * 16); };
  let dragging = false;
  seek.addEventListener("pointerdown", (e) => { dragging = true; seek.setPointerCapture(e.pointerId); const st = stepAt(e.clientX); setProgress(st / (BARS * 16)); paused.step = st; });
  seek.addEventListener("pointermove", (e) => { if (!dragging) return; const st = stepAt(e.clientX); setProgress(st / (BARS * 16)); paused.step = st; tNow.textContent = clock(st / (BARS * 16) * lengthOf(SONGS[current])); });
  seek.addEventListener("pointerup", () => { if (!dragging) return; dragging = false; start(paused.step); });
  seek.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const st = Math.min(BARS * 16 - 4, Math.max(0, (now.playing ? now.step : paused.step) + (e.key === "ArrowRight" ? 16 : -16)));
    paused.step = st; start(st);
  });

  // Until someone presses anything, the card shows off the five ideas
  show(0);
  if (!reduce) {
    const idle = setInterval(() => { if (touched) return clearInterval(idle); show(current + 1, true); }, 3400);
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden && player.classList.contains("is-playing")) pause(); });

  /* ---------- Step 1: hear the style and mood you picked ---------- */
  const hear = document.querySelector("[data-hear]");
  function stopMachine() {
    if (!hear || hear.getAttribute("aria-pressed") !== "true") return;
    hear.setAttribute("aria-pressed", "false");
    hear.querySelector("span").textContent = "Hear this style";
  }
  if (hear) {
    const picked = (group) => document.querySelector(`[data-pick="${group}"] [aria-pressed="true"]`)?.dataset.v;
    const go = () => {
      if (player.classList.contains("is-playing")) pause();
      touched = true;
      hear.setAttribute("aria-pressed", "true");
      hear.querySelector("span").textContent = "Stop";
      play(picked("style"), picked("mood"), { onEnd: go });
    };
    hear.addEventListener("click", () => {
      if (hear.getAttribute("aria-pressed") === "true") { stop(); stopMachine(); } else go();
    });
    // Change the style or mood while it plays (by hand or with Surprise me), and the music follows
    let wait = 0;
    const picks = document.querySelectorAll('[data-pick="style"], [data-pick="mood"]');
    const watch = new MutationObserver(() => {
      if (hear.getAttribute("aria-pressed") !== "true") return;
      clearTimeout(wait);
      wait = setTimeout(go, 180);
    });
    picks.forEach((row) => watch.observe(row, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] }));
  }
})();
