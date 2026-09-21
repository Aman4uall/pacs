/* =========================================================================
   PACS AI – motion
   Entrances, scroll stories, smooth scrolling and hover details.
   Needs GSAP + ScrollTrigger (and optionally Lenis). If they are missing, or
   the visitor prefers reduced motion, the page simply stays still.
   ========================================================================= */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const finish = () => { window.__motionReady = true; };

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove("motion");
    finish();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  // If the safety timeout already showed everything, skip entrance effects
  const entrances = root.classList.contains("motion");
  const mm = gsap.matchMedia();

  /* ---------- Smooth scrolling ---------- */
  if (window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.09 });
    window.__lenis = lenis; // site.js pauses it while the phone menu is open
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -90, duration: 1.4 });
      history.pushState(null, "", url.hash);
    });
  }

  /* ---------- Helpers ---------- */
  function splitWords(el, masked) {
    const words = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const outer = document.createElement("span");
            if (masked) {
              outer.className = "w";
              const inner = document.createElement("span");
              inner.className = "wi";
              inner.textContent = part;
              outer.appendChild(inner);
              words.push(inner);
            } else {
              outer.textContent = part;
              words.push(outer);
            }
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    return words;
  }
  const inView = (el) => el.getBoundingClientRect().top < window.innerHeight;
  const once = (trigger, start = "top 86%") => ({ trigger, start, once: true });

  /* ---------- Opening: headline, then the rest of the hero ---------- */
  if (entrances) {
    const intro = gsap.timeline({ delay: 0.15, defaults: { ease: "expo.out" } });
    const h1 = document.querySelector("h1");
    if (h1) {
      const words = splitWords(h1, true);
      gsap.set(h1, { opacity: 1 });
      intro.from(words, { yPercent: 120, rotate: 4, duration: 1.4, stagger: 0.07 }, 0);
    }
    const bits = document.querySelectorAll(".hero-copy :is(.eyebrow, .lede, .actions)");
    intro.fromTo(bits, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.12 }, 0.45);
    const builder = document.querySelector(".builder");
    if (builder) intro.fromTo(builder, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.6 }, 0.3);
  }

  /* ---------- Headings rise word by word ---------- */
  if (entrances) {
    document.querySelectorAll(".head h2").forEach((h) => {
      const words = splitWords(h, true);
      gsap.set(h, { opacity: 1 });
      gsap.from(words, { yPercent: 120, rotate: 3, duration: 1.2, ease: "expo.out", stagger: 0.05, scrollTrigger: once(h, "top 88%") });
    });
  }

  /* ---------- Single elements glide up ---------- */
  if (entrances) {
    document.querySelectorAll(":is(.eyebrow, .lede, .cta .actions, .story-line, .demoday-lede, .demoday-row)").forEach((el) => {
      if (el.closest(".hero-copy")) return;
      gsap.fromTo(el, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.2, ease: "expo.out", delay: inView(el) ? 0.6 : 0, scrollTrigger: once(el, "top 92%"),
      });
    });
  }

  /* ---------- Groups arrive one after another ---------- */
  const groupItems = ":is(.stats > *, .cols-2 > *, .cols-3 > *, .steps > li, .timeline > li, .faq details, .contact-grid > *, .world-grid > *, .wall > *, .doors > *, .how > li, .howto > li)";
  if (entrances) {
    const phone = window.matchMedia("(max-width: 700px)").matches;
    document.querySelectorAll(".stats, .cols-2, .cols-3, .steps, .timeline, .faq, .contact-grid, .world-grid, .wall, .doors, .how, .howto").forEach((group) => {
      const items = [...group.children].filter((el) => el.matches(groupItems));
      if (!items.length) return;
      // On phones the two doors swing in from opposite sides
      const from = phone && group.classList.contains("doors")
        ? { x: (i) => (i % 2 ? 110 : -110), rotation: (i) => (i % 2 ? 5 : -5), opacity: 0 }
        : { y: 60, opacity: 0 };
      gsap.fromTo(items, from, {
        x: 0, y: 0, rotation: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.09, delay: inView(group) ? 0.7 : 0,
        scrollTrigger: { ...once(group), onEnter: () => items.forEach((el, i) => setTimeout(() => el.classList.add("is-in"), 150 + i * 90)) },
      });
    });

    // Client briefs are dealt onto the table
    document.querySelectorAll(".briefs").forEach((group) => {
      const items = [...group.children];
      gsap.fromTo(items, { y: -90, rotation: (i) => (i % 2 ? 14 : -14), opacity: 0 }, {
        y: 0, rotation: (i) => (i % 2 ? 1 : -1.2), opacity: 1, duration: 1, ease: "back.out(1.4)", stagger: 0.12, scrollTrigger: once(group, "top 80%"),
      });
    });
  }

  /* ---------- Numbers count up ---------- */
  function countUp(el, to, suffix) {
    const v = { n: 0 };
    el.textContent = "0" + suffix;
    gsap.to(v, {
      n: to, duration: 1.8, ease: "power3.out", delay: inView(el) ? 0.6 : 0, scrollTrigger: once(el, "top 95%"),
      onUpdate: () => { el.textContent = Math.round(v.n).toLocaleString("en-IN") + suffix; },
    });
  }
  document.querySelectorAll(".stat strong").forEach((el) => {
    const m = el.textContent.match(/^(\d+)(.*)$/);
    if (m && +m[1] >= 2) countUp(el, +m[1], m[2]);
  });
  document.querySelectorAll("[data-count-to]").forEach((el) => countUp(el, +el.dataset.countTo, el.dataset.suffix || ""));

  /* ---------- Big statements light up word by word as you scroll ---------- */
  document.querySelectorAll(".statement").forEach((el) => {
    const words = splitWords(el, false);
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: 0.6 },
    });
  });

  /* ---------- Scrolling band: speeds up and leans with your scroll ---------- */
  document.querySelectorAll(".marquee-track").forEach((track) => {
    track.innerHTML += track.innerHTML;
    const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 30, repeat: -1 });
    loop.totalTime(loop.duration() * 200);
    const skew = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3" });
    let direction = 1;
    ScrollTrigger.create({
      trigger: track.parentElement, start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        direction = self.direction;
        gsap.to(loop, { timeScale: direction * (1 + Math.min(Math.abs(v) / 220, 6)), duration: 0.25, overwrite: true });
        skew(gsap.utils.clamp(-10, 10, v / -250));
      },
    });
    ScrollTrigger.addEventListener("scrollEnd", () => {
      gsap.to(loop, { timeScale: direction, duration: 1.2, overwrite: true });
      skew(0);
    });
  });

  /* ---------- Journey: Day 1 to Demo Day, as one strip ---------- */
  document.querySelectorAll("[data-path]").forEach((path) => {
    const steps = [...path.children];
    const rail = path.parentElement.querySelector(".path-rail span");

    // Laptops: the rail draws itself and each step lands as the line reaches it
    mm.add("(min-width: 701px)", () => {
      if (!entrances) {
        steps.forEach((s) => s.classList.add("is-active"));
        return;
      }
      const tl = gsap.timeline({ scrollTrigger: once(path, "top 80%") });
      if (rail) tl.fromTo(rail, { scaleX: 0 }, { scaleX: 1, duration: 2.1, ease: "power2.inOut" }, 0);
      steps.forEach((step, i) => {
        tl.fromTo(step, { y: 50, opacity: 0 }, {
          y: 0, opacity: 1, duration: 1, ease: "expo.out", onStart: () => step.classList.add("is-active"),
        }, 0.15 + i * 0.32);
      });
    });

    // Phones: the cards slide in from the right, then nudge left to show they swipe
    mm.add("(max-width: 700px)", () => {
      if (!entrances) return;
      gsap.timeline({ scrollTrigger: once(path, "top 85%") })
        .fromTo(steps, { x: 90, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.07 })
        .to(steps, { x: -38, duration: 0.45, ease: "power2.inOut" }, "-=0.2")
        .to(steps, { x: 0, duration: 0.7, ease: "back.out(2.2)" });
    });
  });

  /* ---------- Phones: extra life for touch screens ---------- */
  mm.add("(max-width: 700px)", () => {
    // Big story lines light up word by word as you read down
    document.querySelectorAll(".story-line, .demoday-lede").forEach((el) => {
      el._words = el._words || splitWords(el, false);
      gsap.fromTo(el._words, { opacity: 0.16 }, {
        opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 88%", end: "bottom 55%", scrub: 0.5 },
      });
    });

    // A statistic counts up again each time you swipe to it
    const recount = (e) => {
      const num = e.target.querySelector("[data-count-to]");
      if (!num) return;
      const to = +num.dataset.countTo;
      const suffix = num.dataset.suffix || "";
      const v = { n: 0 };
      gsap.to(v, { n: to, duration: 1, ease: "power3.out", overwrite: true, onUpdate: () => { num.textContent = Math.round(v.n) + suffix; } });
    };
    document.addEventListener("swipe:active", recount);
    return () => document.removeEventListener("swipe:active", recount);
  });

  // The hero phone tips back as you scroll past it
  mm.add("(max-width: 920px)", () => {
    const device = document.querySelector(".builder .phone");
    if (!device) return;
    gsap.to(device, {
      rotateX: 18, scale: 0.9, y: -20, transformPerspective: 900, transformOrigin: "50% 100%", ease: "none",
      scrollTrigger: { trigger: device, start: "top 20%", end: "bottom top", scrub: true },
    });
  });

  /* ---------- Home: a BBA CV rewrites itself ---------- */
  document.querySelectorAll("[data-mini-cv]").forEach((cv) => {
    if (!entrances) return;
    const items = cv.querySelectorAll(".cv-new li");
    const final = cv.querySelector(".cv-final");
    cv.classList.add("is-fresh");
    gsap.set(items, { autoAlpha: 0, x: 30 });
    gsap.set(final, { autoAlpha: 0, y: 12 });
    gsap.timeline({ scrollTrigger: once(cv, "top 75%") })
      .call(() => cv.classList.remove("is-fresh"), null, 0.4)
      .to(items, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out", stagger: 0.35 }, 1.1)
      .to(final, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, "+=0.25");
  });

  /* ---------- Class 8–10: cards flip from session to build ---------- */
  document.querySelectorAll(".flips").forEach((grid) => {
    const cards = [...grid.querySelectorAll(".flip")];
    cards.forEach((c) => c.classList.add("is-front"));
    ScrollTrigger.create({
      ...once(grid, "top 65%"),
      onEnter: () => cards.forEach((c, i) => setTimeout(() => c.classList.remove("is-front"), 300 + i * 170)),
    });
    if (finePointer) {
      cards.forEach((c) => {
        c.addEventListener("pointerenter", () => c.classList.add("is-front"));
        c.addEventListener("pointerleave", () => c.classList.remove("is-front"));
      });
    } else {
      // On touch screens, tap a card to flip it over
      cards.forEach((c) => c.addEventListener("click", () => c.classList.toggle("is-front")));
    }
  });

  /* ---------- Class 8–10: the climb to Demo Day ---------- */
  document.querySelectorAll(".climb").forEach((list) => {
    const bars = list.querySelectorAll(".climb-bar");
    const labels = list.querySelectorAll(".climb-label");
    mm.add("(min-width: 901px)", () => {
      gsap.from(bars, { scaleY: 0, duration: 1.3, ease: "expo.out", stagger: 0.12, scrollTrigger: once(list, "top 75%") });
      gsap.from(labels, { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.25, scrollTrigger: once(list, "top 75%") });
    });
    mm.add("(max-width: 900px)", () => {
      gsap.from(bars, { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: once(list, "top 80%") });
    });
  });

  /* ---------- BBA: the CV rewrites itself ---------- */
  const cvSection = document.querySelector(".cv-section");
  if (cvSection) {
    const cv = cvSection.querySelector(".cv");
    const items = [...cv.querySelectorAll(".cv-new li")];
    const steps = [...cvSection.querySelectorAll(".cv-steps li")];
    const count = cv.querySelector("[data-cv-count]");
    const final = cv.querySelector(".cv-final");
    const max = items.length + 1;
    const shown = items.map(() => false);
    let finalShown = false;

    function render(p) {
      cv.classList.toggle("is-fresh", p < 0.4);
      let visible = 0;
      items.forEach((li, k) => {
        const on = p > k + 0.6;
        if (on) visible++;
        if (on !== shown[k]) {
          shown[k] = on;
          gsap.to(li, { autoAlpha: on ? 1 : 0, x: on ? 0 : 30, duration: 0.45, ease: "power3.out", overwrite: true });
        }
      });
      count.textContent = visible;
      const stage = visible ? +items[visible - 1].dataset.stage : 0;
      steps.forEach((s, k) => s.classList.toggle("on", k + 1 === stage));
      const f = p >= max - 0.2;
      if (f !== finalShown) { finalShown = f; gsap.to(final, { autoAlpha: f ? 1 : 0, y: f ? 0 : 12, duration: 0.5, overwrite: true }); }
    }
    gsap.set(items, { autoAlpha: 0, x: 30 });
    gsap.set(final, { autoAlpha: 0, y: 12 });
    const state = { p: 0 };
    render(0);

    mm.add("(min-width: 961px)", () => {
      cvSection.classList.add("is-pinned");
      const tween = gsap.to(state, {
        p: max, ease: "none", onUpdate: () => render(state.p),
        scrollTrigger: { trigger: cvSection.querySelector(".cv-grid"), start: "center center", end: () => `+=${window.innerHeight * 2.2}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
      });
      return () => { cvSection.classList.remove("is-pinned"); tween.kill(); };
    });
    mm.add("(max-width: 960px)", () => {
      gsap.to(state, { p: max, duration: 4, ease: "none", onUpdate: () => render(state.p), scrollTrigger: once(cv, "top 70%") });
    });
  }

  /* ---------- Demo Day: the title rises, a spotlight follows the pointer ---------- */
  const demoday = document.querySelector("[data-demoday]");
  if (demoday) {
    const title = demoday.querySelector(".demoday-title");
    gsap.from(title.querySelectorAll("span"), { yPercent: 100, opacity: 0, duration: 1.5, ease: "expo.out", stagger: 0.18, scrollTrigger: once(demoday, "top 70%") });
    gsap.fromTo(title, { xPercent: 4 }, { xPercent: -4, ease: "none", scrollTrigger: { trigger: demoday, start: "top bottom", end: "bottom top", scrub: true } });
    const spot = demoday.querySelector(".spot");
    if (!finePointer) {
      // On touch screens the spotlight sweeps across the stage as you scroll
      demoday.classList.add("is-tracking");
      gsap.fromTo(spot, { "--sx": "12%", "--sy": "15%" }, {
        "--sx": "88%", "--sy": "75%", ease: "none",
        scrollTrigger: { trigger: demoday, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    }
    if (finePointer) {
      demoday.addEventListener("pointerenter", () => demoday.classList.add("is-tracking"));
      demoday.addEventListener("pointerleave", () => demoday.classList.remove("is-tracking"));
      demoday.addEventListener("pointermove", (e) => {
        const r = demoday.getBoundingClientRect();
        spot.style.setProperty("--sx", `${((e.clientX - r.left) / r.width) * 100}%`);
        spot.style.setProperty("--sy", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    }
  }

  /* ---------- Header: reading progress, and hide while scrolling down ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const bar = document.createElement("div");
    bar.className = "progress";
    header.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    const menu = document.getElementById("nav-links");
    ScrollTrigger.create({
      start: 160, end: "max",
      onUpdate: (self) => header.classList.toggle("is-hidden", self.direction === 1 && !(menu && menu.classList.contains("open"))),
      onLeaveBack: () => header.classList.remove("is-hidden"),
    });
  }

  /* ---------- Hover details (mouse and trackpad only) ---------- */
  if (finePointer) {
    const spotlight = (el, e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      return r;
    };
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = spotlight(card, e);
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        gsap.to(card, { rotateY: (x - 0.5) * 6, rotateX: (0.5 - y) * 6, transformPerspective: 1000, duration: 0.6, ease: "power3.out" });
      });
      card.addEventListener("pointerleave", () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1, 0.5)" }));
    });
    document.querySelectorAll(".build").forEach((b) => b.addEventListener("pointermove", (e) => spotlight(b, e)));
    document.querySelectorAll(".btn:not(.btn-sm)").forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  finish();
})();
