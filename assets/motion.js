/* Enhancements only: all content is readable without animation or JavaScript. */
(function () {
  const progress = document.querySelector('.progress');
  let queued = false;
  const paint = () => {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0})`;
    queued = false;
  };
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }, { passive: true });
  window.addEventListener('resize', paint);
  paint();

  const hero = document.querySelector('.course-page .page-hero');
  const enquiry = hero?.querySelector('.btn-primary[data-wa]');
  if (hero && enquiry && 'IntersectionObserver' in window) {
    const bar = document.createElement('div');
    bar.className = 'course-action-bar';
    bar.hidden = true;
    const label = document.createElement('span');
    label.textContent = document.body.classList.contains('school-page') ? 'Class 8–12' : 'BBA & BBM';
    const detail = document.createElement('small');
    detail.textContent = 'Talk to us on WhatsApp';
    label.append(detail);
    const action = enquiry.cloneNode(true);
    action.textContent = 'Get dates & fees';
    bar.append(label, action);
    document.body.append(bar);
    new IntersectionObserver(([entry]) => {
      bar.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
    }, { threshold: 0 }).observe(hero);
  }
})();

/* Scroll stories, entrances and tactile interactions. No scroll interception. */
(function () {
  const preference = matchMedia('(prefers-reduced-motion: no-preference)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = value => 1 - Math.pow(1 - clamp(value), 3);
  const playing = new Set();
  const animate = (el, frames, options) => {
    if (!preference.matches || !el.animate) return;
    const animation = el.animate(frames, options);
    playing.add(animation);
    const clean = () => playing.delete(animation);
    animation.onfinish = clean;
    animation.oncancel = clean;
    return animation;
  };
  document.body.classList.toggle('motion-enabled', preference.matches);

  // A native sticky stage lets each tablet settle into the deck as you scroll.
  const stories = [...document.querySelectorAll('[data-story]')].map(section => ({
    section, track:section.querySelector('.story-track'), scene:section.querySelector('.journey-grid'),
    stage:section.querySelector('.journey-stage'), cards:[...section.querySelectorAll('.art')],
    chapters:[...section.querySelectorAll('.chapter')], when:section.querySelector('[data-story-when]'),
    count:section.querySelector('[data-story-count]'), prev:section.querySelector('[data-story-prev]'),
    next:section.querySelector('[data-story-next]'), enabled:false, index:-1, progress:0,
  }));
  let queued = false;
  function renderStories() {
    queued = false;
    stories.forEach(story => {
      if (!story.enabled) return;
      const rect = story.track.getBoundingClientRect();
      const n = story.cards.length;
      const progress = clamp((story.top - rect.top) / story.step, 0, n - .15);
      if (Math.abs(progress - story.progress) < .0001 && story.index !== -1) return;
      story.progress = progress;
      const index = Math.min(n - 1, Math.floor(progress + .55));
      const fan = ease((progress - (n - 1)) / .85);
      story.section.style.setProperty('--story-progress', (progress + .6) / (n + .45));
      story.cards.forEach((card, i) => {
        const incoming = ease(progress - i + 1);
        const depth = clamp(progress - i, 0, 3);
        const tilt = i % 2 ? 3 : -3;
        let x = depth * (i % 2 ? 3 : -3);
        let y = i > progress ? (1 - incoming) * (story.stageHeight + 120) : -depth * 15;
        let scale = i > progress ? .87 + incoming * .13 : 1 - depth * .045;
        let rotation = i > progress ? (1 - incoming) * (i % 2 ? 22 : -22) + tilt * incoming : tilt - depth;
        let opacity = i > progress ? (incoming > .001 ? 1 : 0) : clamp(4 - depth);
        if (progress - i > 3) opacity = 0;
        if (fan > 0) {
          const offset = i - (n - 1) / 2;
          x += (offset * story.spread - x) * fan;
          y += (Math.abs(offset) * 11 - 18 - y) * fan;
          scale += (.76 - scale) * fan;
          rotation += (offset * 8 - rotation) * fan;
          opacity += (1 - opacity) * fan;
        }
        card.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(i + 1);
        card.style.visibility = opacity > .001 ? 'visible' : 'hidden';
      });
      if (index !== story.index) {
        story.index = index;
        story.chapters.forEach((chapter, i) => {
          chapter.classList.toggle('is-current', i === index);
          chapter.setAttribute('aria-hidden', String(i !== index));
        });
        story.cards.forEach((card, i) => card.classList.toggle('is-active', i === index));
        story.when.textContent = story.chapters[index].querySelector('.when').textContent;
        story.count.textContent = String(index + 1).padStart(2, '0');
      }
      story.prev.disabled = progress < .05;
      story.next.disabled = progress >= n - .2;
      story.next.setAttribute('aria-label', index === n - 1 ? 'Fan out the completed journey' : 'Next journey stage');
    });
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(renderStories); }
  }
  function configureStories() {
    const enabled = preference.matches && innerHeight >= 600;
    stories.forEach(story => {
      story.enabled = enabled;
      story.section.classList.toggle('motion-story', enabled);
      story.index = -1;
      if (!enabled) {
        story.track.style.height = '';
        story.cards.forEach(card => { card.removeAttribute('style'); card.classList.remove('is-active'); });
        story.chapters.forEach(chapter => { chapter.removeAttribute('aria-hidden'); chapter.classList.remove('is-current'); });
        return;
      }
      story.top = (document.querySelector('.site-header')?.offsetHeight || 72) + 12;
      const small = innerWidth <= 740;
      const reserve = innerWidth <= 620 && document.body.classList.contains('course-page') ? 100 : 26;
      const height = Math.min(700, innerHeight - story.top - reserve);
      story.step = Math.min(440, Math.max(235, height * (small ? .58 : .65)));
      story.spread = small ? 17 : 33;
      story.section.style.setProperty('--story-top', `${story.top}px`);
      story.section.style.setProperty('--scene-height', `${height}px`);
      story.track.style.height = `${height + story.step * (story.cards.length - .15)}px`;
      story.stageHeight = story.stage.clientHeight;
    });
    schedule();
  }
  stories.forEach(story => {
    const move = direction => {
      if (!story.enabled) return;
      const next = direction > 0 ? Math.floor(story.progress + .55) + 1 : Math.ceil(story.progress - .55) - 1;
      const position = scrollY + story.track.getBoundingClientRect().top - story.top + clamp(next, 0, story.cards.length - .15) * story.step;
      window.scrollTo({ top:position, behavior:'smooth' });
    };
    story.prev.addEventListener('click', () => move(-1));
    story.next.addEventListener('click', () => move(1));
  });
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', configureStories);
  document.addEventListener('toggle', schedule, true);
  document.fonts?.ready.then(configureStories);
  configureStories();

  // Hero words rise individually. Real text remains in the document.
  document.querySelectorAll('h1').forEach(heading => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) fragment.append(document.createTextNode(word));
        else {
          const span = document.createElement('span');
          span.className = 'motion-word';
          span.textContent = word;
          fragment.append(span);
        }
      });
      node.replaceWith(fragment);
    });
    heading.querySelectorAll('.motion-word').forEach((word, i) => animate(word,
      [{ opacity:0, transform:'translateY(32px) rotate(4deg)', filter:'blur(5px)' }, { opacity:1, transform:'none', filter:'blur(0)' }],
      { duration:850, delay:i * 40, easing:'cubic-bezier(.16,1,.3,1)', fill:'backwards' }));
  });

  const entrances = document.querySelectorAll('.head > :not(h2), .opening-copy .lede, .opening-copy .actions, .outcome-card, .course-door, .possibility, .home-demo-grid .build, .wall .build, .stats .stat, .card, .skill-card, .plan-sidebar, .simple-steps li, .catalog-reassurance .wrap > div, .faq details, .brief, .case, .feature, .contact-grid > *, .session-card');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.children];
      animate(el, [{ opacity:0, transform:'translateY(30px) scale(.975)' }, { opacity:1, transform:'none' }],
        { duration:750, delay:Math.min(siblings.indexOf(el) % 4, 3) * 65, easing:'cubic-bezier(.16,1,.3,1)', fill:'backwards' });
      reveal.unobserve(el);
    }), { threshold:.08, rootMargin:'0px 0px -20px 0px' });
    entrances.forEach(el => reveal.observe(el));
    const ambient = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('motion-away', !entry.isIntersecting)));
    document.querySelectorAll('.possibilities, .spark, .plan-mark, .song-stamp, .topbar-eq, .player').forEach(el => ambient.observe(el));
  }

  // The cards react to the pointer with a little perspective and a moving light.
  document.querySelectorAll('.outcome-card, .course-door, .possibility, .card, .build, .skill-card, .plan-sidebar').forEach(card => {
    card.classList.add('motion-tilt');
    let frame = 0, x = .5, y = .5;
    card.addEventListener('pointermove', event => {
      if (!preference.matches || !pointer.matches) return;
      const rect = card.getBoundingClientRect();
      x = clamp((event.clientX - rect.left) / rect.width);
      y = clamp((event.clientY - rect.top) / rect.height);
      if (frame) return;
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 9}deg`);
        card.style.setProperty('--light-x', `${x * 100}%`);
        card.style.setProperty('--light-y', `${y * 100}%`);
        frame = 0;
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame); frame = 0;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
  document.querySelectorAll('.btn').forEach(button => button.addEventListener('pointerdown', event => {
    if (!preference.matches) return;
    const rect = button.getBoundingClientRect();
    const ring = document.createElement('span');
    ring.className = 'click-ring';
    ring.setAttribute('aria-hidden', 'true');
    ring.style.left = `${event.clientX - rect.left}px`;
    ring.style.top = `${event.clientY - rect.top}px`;
    button.append(ring);
    ring.addEventListener('animationend', () => ring.remove(), { once:true });
    setTimeout(() => ring.remove(), 800);
  }));

  // A tap or keyboard activation reveals the same side that desktop hover does.
  const flips = [...document.querySelectorAll('.session-flip')];
  const refreshFlips = [];
  flips.forEach(button => {
    const front = button.querySelector('.session-front');
    const back = button.querySelector('.session-back');
    const title = front.querySelector('strong').textContent;
    const result = back.querySelector('strong').textContent;
    let tapped = false, hovered = false;
    const update = () => {
      const flipped = tapped || (hovered && pointer.matches && preference.matches);
      button.setAttribute('aria-pressed', String(flipped));
      button.setAttribute('aria-label', `${title}. You make: ${result}.`);
      front.setAttribute('aria-hidden', String(preference.matches && flipped));
      back.setAttribute('aria-hidden', String(preference.matches && !flipped));
    };
    update();
    refreshFlips.push(update);
    button.addEventListener('click', () => { tapped = !tapped; update(); });
    button.addEventListener('pointerenter', () => { hovered = true; update(); });
    button.addEventListener('pointerleave', () => { hovered = false; update(); });
  });

  // The BBA CV: the four stock phrases are crossed out, then the real work is written in.
  // On a laptop the CV stays pinned and your scrolling drives it (and scrolling back undoes it).
  document.querySelectorAll('.cv-section').forEach(section => {
    const cv = section.querySelector('.cv');
    const scroller = section.querySelector('.cv-scroll');
    const rows = [...section.querySelectorAll('.cv-new li')];
    const olds = [...cv.querySelectorAll('.cv-old li')];
    const count = cv.querySelector('[data-cv-count]');
    const track = section.querySelector('.cv-steps');
    const steps = [...section.querySelectorAll('.cv-steps li')];
    let timers = [], selected = 0, mode = 'static';
    const highlight = stage => rows.forEach(row => row.classList.toggle('portfolio-highlight', Number(row.dataset.stage) === stage));
    const buttons = steps.map((step, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'portfolio-step'; button.setAttribute('aria-pressed','false');
      while (step.firstChild) button.append(step.firstChild);
      step.append(button);
      button.addEventListener('pointerenter', () => highlight(i + 1));
      button.addEventListener('pointerleave', () => highlight(selected));
      button.addEventListener('focus', () => highlight(i + 1));
      button.addEventListener('blur', () => highlight(selected));
      button.addEventListener('click', () => {
        selected = selected === i + 1 ? 0 : i + 1;
        buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j + 1 === selected)));
        highlight(selected);
      });
      return button;
    });

    // One function paints any moment of the story, from 0 (old CV) to 1 (finished)
    const paintCV = p => {
      olds.forEach((li, k) => {
        const local = clamp((p - .05 - k * .065) / .07);
        li.style.setProperty('--strike', local.toFixed(3));
        li.classList.toggle('is-struck', local >= 1);
      });
      const written = rows.filter((row, k) => p >= .34 + k * .054);
      rows.forEach(row => row.classList.toggle('is-written', written.includes(row)));
      count.textContent = String(written.length);
      const last = written.length ? Number(written[written.length - 1].dataset.stage) : 0;
      steps.forEach((step, j) => {
        step.classList.toggle('on', j + 1 === last && written.length < rows.length);
        step.classList.toggle('done', j + 1 < last || written.length === rows.length);
      });
      if (track) track.style.setProperty('--fill', (written.length / rows.length).toFixed(3));
      cv.classList.toggle('is-complete', p >= .93);
      section.classList.toggle('cv-started', p > .04);
    };

    const setMode = () => {
      timers.forEach(clearTimeout); timers = [];
      const canScroll = preference.matches && innerWidth > 960 && innerHeight >= 740;
      mode = !preference.matches ? 'static' : canScroll ? 'scroll' : 'timed';
      section.classList.toggle('cv-scrolly', mode === 'scroll');
      cv.classList.toggle('cv-armed', mode !== 'static');
      if (mode === 'static') { paintCV(1); return; }
      if (mode === 'scroll') onScroll(); else paintCV(0);
    };
    let queued = false;
    const onScroll = () => {
      queued = false;
      if (mode !== 'scroll') return;
      const r = scroller.getBoundingClientRect();
      const run = r.height - innerHeight;
      paintCV(run > 0 ? clamp(-r.top / run) : 1);
    };
    addEventListener('scroll', () => { if (!queued && mode === 'scroll') { queued = true; requestAnimationFrame(onScroll); } }, { passive:true });
    addEventListener('resize', () => { const before = mode; setMode(); if (before !== mode && mode === 'timed') played = false; });

    // On phones and short screens it plays by itself once, when the CV comes into view
    let played = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        if (mode !== 'timed' || played || !entries.some(entry => entry.isIntersecting)) return;
        played = true;
        let t = 500;
        for (let step = 1; step <= 60; step++) {
          timers.push(setTimeout(() => paintCV(step / 60), t));
          t += step < 20 ? 70 : 55;
        }
      }, { threshold:.35 }).observe(cv);
    }
    setMode();
    preference.addEventListener('change', setMode);
  });
  preference.addEventListener('change', () => {
    document.body.classList.toggle('motion-enabled', preference.matches);
    if (!preference.matches) playing.forEach(animation => animation.cancel());
    refreshFlips.forEach(update => update());
    configureStories();
  });
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('motion-asleep', document.hidden));
})();


/* Page transitions can be skipped (a hidden tab, a fast second click). That's fine, so don't report it as an error. */
['pageswap', 'pagereveal'].forEach(type => addEventListener(type, e => {
  const vt = e.viewTransition;
  if (vt) [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {}));
}));

/* Level 3: headline wipes, live scenes, counters, fly-to-list and a little magnetism.
   Everything here is an enhancement: with reduced motion none of it runs. */
(function () {
  const calm = !matchMedia('(prefers-reduced-motion: no-preference)').matches;
  if (calm || !('IntersectionObserver' in window)) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const once = (els, fn, options) => {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      fn(entry.target);
    }), options || { threshold: .2, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  };

  /* Headlines wipe up from behind a mask, one line per <br> */
  const heads = [...document.querySelectorAll('.head h2, .challenge-invite h2, .closing-section h2')];
  heads.forEach(h => {
    const lines = [[]];
    [...h.childNodes].forEach(node => {
      if (node.nodeName === 'BR') lines.push([]);
      else lines[lines.length - 1].push(node);
    });
    h.replaceChildren(...lines.filter(line => line.some(n => n.textContent.trim())).map((line, i) => {
      const mask = document.createElement('span');
      const inner = document.createElement('span');
      mask.className = 'line-mask';
      inner.className = 'line-inner';
      inner.style.setProperty('--line', i);
      inner.append(...line);
      mask.append(inner);
      return mask;
    }));
    h.classList.add('mask-armed');
    h.closest('.head')?.classList.add('eyebrow-armed');
  });
  once(heads, h => { h.classList.add('is-revealed'); h.closest('.head')?.classList.add('is-revealed'); }, { threshold: .3 });

  /* Home: the three "What if you could…" cards each play a tiny scene */
  const board = document.querySelector('.possibilities');
  if (board) {
    const work = board.querySelector('.possibility-work .possibility-icon');
    const create = board.querySelector('.possibility-create .possibility-icon');
    const build = board.querySelector('.possibility-build .possibility-icon');
    if (work) work.insertAdjacentHTML('beforeend', '<svg class="scene-line" viewBox="0 0 40 30" preserveAspectRatio="none" aria-hidden="true"><polyline pathLength="1" points="1,25 12,17 22,20 38,5"/><circle cx="38" cy="5" r="2.6"/></svg>');
    if (create) create.insertAdjacentHTML('afterbegin', '<span class="scene-film" aria-hidden="true">' + '<i></i>'.repeat(12) + '</span>');
    if (build) build.insertAdjacentHTML('beforeend', '<span class="scene-code" aria-hidden="true"><i></i><i></i><i></i></span><span class="scene-phone" aria-hidden="true"></span>');
    board.classList.add('scene-on');
  }

  /* Home: each "I wish I could…" symbol is drawn in as its card arrives */
  const outcomes = [...document.querySelectorAll('.outcome-card')];
  outcomes.forEach(card => {
    const symbol = card.querySelector('.outcome-symbol');
    if (!symbol) return;
    symbol.insertAdjacentHTML('beforeend', '<svg class="symbol-ring" viewBox="0 0 50 50" aria-hidden="true"><rect pathLength="1" x="1" y="1" width="48" height="48" rx="15"/></svg>');
    card.classList.add('symbol-armed');
  });
  once(outcomes, card => {
    const delay = (outcomes.indexOf(card) % 3) * 110;
    setTimeout(() => card.classList.add('is-drawn'), delay);
  }, { threshold: .35 });

  /* Stats count up to their real value; the words after the number stay put */
  const stats = [...document.querySelectorAll('.stats .stat strong')].filter(el => /^\d+\s/.test(el.textContent) && parseInt(el.textContent, 10) > 1);
  once(stats, el => {
    const final = el.textContent;
    const target = parseInt(final, 10);
    const rest = final.slice(String(target).length);
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / 1300);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + rest;
      if (t < 1) requestAnimationFrame(tick); else el.textContent = final;
    };
    requestAnimationFrame(tick);
  }, { threshold: .6 });

  /* Opening a course panel plays its rows in, one by one, and draws a red line across each.
     Opening an FAQ slides the answer in. */
  document.querySelectorAll('details').forEach(d => {
    const rows = [...d.querySelectorAll(':scope > ol > li, :scope > ul > li')];
    const answer = d.querySelector(':scope > p');
    d.addEventListener('toggle', () => {
      rows.forEach(li => li.classList.remove('is-in'));
      if (!d.open) return;
      rows.forEach((li, i) => {
        li.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
          { duration: 520, delay: i * 70, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        setTimeout(() => li.classList.add('is-in'), 150 + i * 70);
      });
      if (answer) answer.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  });

  /* Song: sound rings pulse out from behind the player */
  const wrap = document.querySelector('.player-wrap');
  if (wrap) {
    wrap.insertAdjacentHTML('afterbegin', '<span class="player-halo" aria-hidden="true"><i></i><i></i><i></i></span>');
    const halo = wrap.querySelector('.player-halo');
    new IntersectionObserver(([e]) => halo.classList.toggle('motion-away', !e.isIntersecting)).observe(wrap);
  }

  /* Learn: the skill you tick flies into your list, and the count gives a little bounce */
  const onScreen = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
  document.querySelectorAll('.skill-card input[type="checkbox"]').forEach(box => box.addEventListener('change', () => {
    if (!box.checked) return;
    const card = box.closest('.skill-card');
    const title = card.querySelector('strong');
    const from = (title || card).getBoundingClientRect();
    const target = [...document.querySelectorAll('[data-pick-count]')].find(el => onScreen(el.closest('.mobile-plan-bar, .plan-sidebar') || el));
    if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(12);
    if (!target) return;
    const home = target.closest('button, strong') || target;
    const to = home.getBoundingClientRect();
    const chip = document.createElement('span');
    chip.className = 'fly-chip';
    chip.setAttribute('aria-hidden', 'true');
    chip.textContent = title ? title.textContent : box.value;
    document.body.append(chip);
    const w = chip.offsetWidth, h = chip.offsetHeight;
    const sx = from.left + from.width / 2 - w / 2, sy = from.top + from.height / 2 - h / 2;
    const tx = to.left + to.width / 2 - w / 2, ty = to.top + to.height / 2 - h / 2;
    const arc = Math.min(sy, ty) - 90;
    const flight = chip.animate([
      { transform: 'translate(' + sx + 'px,' + sy + 'px) scale(.9)', opacity: 0 },
      { transform: 'translate(' + sx + 'px,' + (sy - 14) + 'px) scale(1.05)', opacity: 1, offset: .15 },
      { transform: 'translate(' + (sx + tx) / 2 + 'px,' + arc + 'px) scale(.85) rotate(-6deg)', opacity: 1, offset: .55 },
      { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.3)', opacity: .2 },
    ], { duration: 760, easing: 'cubic-bezier(.45,0,.2,1)' });
    const land = () => {
      chip.remove();
      home.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    };
    flight.onfinish = land;
    flight.oncancel = () => chip.remove();
  }));

  /* Home: the four audience cards flip up into place under the hero */
  document.querySelectorAll('.audience-routes a').forEach((a, i) => a.animate(
    [{ opacity: 0, transform: 'perspective(700px) rotateX(-75deg)', transformOrigin: '50% 0' }, { opacity: 1, transform: 'perspective(700px) rotateX(0)', transformOrigin: '50% 0' }],
    { duration: 950, delay: 450 + i * 110, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'backwards' }));

  /* Home: "Leave with … you made" rotates through real things people make */
  document.querySelectorAll('[data-rotate]').forEach(el => {
    const words = el.dataset.rotate.split('|');
    let i = 0;
    el.classList.add('rotator-on');
    setInterval(() => {
      if (document.hidden) return;
      el.classList.add('is-leaving');
      setTimeout(() => {
        el.textContent = words[i++ % words.length];
        el.classList.remove('is-leaving');
        el.classList.add('is-arriving');
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-arriving')));
      }, 320);
    }, 2400);
  });

  /* The two rows of skills keep scrolling, but rest when you can't see them */
  const band = document.querySelector('.skill-band');
  if (band) new IntersectionObserver(([e]) => band.classList.toggle('motion-away', !e.isIntersecting)).observe(band);

  /* Home: the "What if you could…" board tips back gently as you scroll past it */
  const tilt = document.querySelector('.possibilities');
  if (tilt && innerWidth > 880) {
    let queued = false;
    const lean = () => {
      queued = false;
      const r = tilt.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height * .9)));
      tilt.style.transform = p ? `perspective(1200px) rotateX(${(p * 14).toFixed(2)}deg) scale(${(1 - p * .06).toFixed(3)})` : '';
      tilt.style.opacity = p ? String(1 - p * .35) : '';
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(lean); } }, { passive: true });
  }

  /* Big statements turn red, word by word, as you scroll through them */
  const statements = [...document.querySelectorAll('.statement')];
  statements.forEach(st => {
    const words = st.textContent.trim().split(/\s+/);
    st.replaceChildren(...words.flatMap((w, i) => {
      const span = document.createElement('span');
      span.className = 'lit-word';
      span.textContent = w;
      return i ? [document.createTextNode(' '), span] : [span];
    }));
    st.classList.add('lit-armed');
  });
  if (statements.length) {
    let queued = false;
    const light = () => {
      queued = false;
      statements.forEach(st => {
        const r = st.getBoundingClientRect();
        const start = innerHeight * .92, end = innerHeight * .4;
        const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
        const words = st.querySelectorAll('.lit-word');
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      });
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(light); } }, { passive: true });
    light();
  }

  /* Class 8–12: the eight session cards flip from white to black in a wave (one by one on phones) */
  const sessionGrid = document.querySelector('.session-grid');
  if (sessionGrid) {
    const flips = [...sessionGrid.querySelectorAll('.session-flip')];
    const flip = b => { if (b.getAttribute('aria-pressed') !== 'true') b.click(); };
    if (innerWidth <= 740) once(flips, b => setTimeout(() => flip(b), 250), { threshold: .7 });
    else once([sessionGrid], () => flips.forEach((b, i) => setTimeout(() => flip(b), 300 + i * 170)), { threshold: .3 });
  }

  if (!fine) return; // Everything below follows a mouse pointer

  /* Buttons lean towards the pointer, then settle back */
  document.querySelectorAll('.btn:not(.btn-sm)').forEach(btn => {
    let x = 0, y = 0, tx = 0, ty = 0, frame = 0;
    const step = () => {
      x += (tx - x) * .2; y += (ty - y) * .2;
      const moving = Math.abs(tx - x) + Math.abs(ty - y) > .05;
      btn.style.translate = moving || tx || ty ? x.toFixed(2) + 'px ' + y.toFixed(2) + 'px' : '';
      frame = moving ? requestAnimationFrame(step) : 0;
    };
    const go = () => { if (!frame) frame = requestAnimationFrame(step); };
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      tx = Math.max(-10, Math.min(10, (e.clientX - r.left - r.width / 2) * .15));
      ty = Math.max(-6, Math.min(6, (e.clientY - r.top - r.height / 2) * .3));
      go();
    });
    btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; go(); });
  });

  /* A soft red spotlight follows the pointer over dark sections */
  document.querySelectorAll('.section.dark, .challenge-invite').forEach(section => {
    section.classList.add('motion-spot');
    let frame = 0, px = 0, py = 0;
    section.addEventListener('pointermove', e => {
      const r = section.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        section.style.setProperty('--spot-x', px + 'px');
        section.style.setProperty('--spot-y', py + 'px');
        frame = 0;
      });
    });
  });

  /* Home: the two course cards drift at different speeds as you scroll past */
  const doors = [...document.querySelectorAll('.course-door')];
  if (doors.length && innerWidth > 740) {
    let queued = false;
    const drift = () => {
      queued = false;
      doors.forEach((door, i) => {
        const r = door.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const offset = (r.top + r.height / 2 - innerHeight / 2) * (i % 2 ? .1 : .04);
        door.style.translate = '0 ' + offset.toFixed(1) + 'px';
      });
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }
})();


/* BBA, round four: the Bootcamp board, the 12-week Studio, the client case files and the
   white "Three hours" finale. Clicks and taps always work; the movement is skipped for reduced motion. */
(function () {
  const moving = () => matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const onScroll = fn => {
    let queued = false;
    const run = () => { queued = false; fn(); };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run);
    run();
  };

  /* Bootcamp: a red line runs along each weekend and switches the sessions on as you scroll */
  document.querySelectorAll('[data-bootcamp]').forEach(board => {
    const cards = [...board.querySelectorAll('.bc-card')];
    const rows = [...board.querySelectorAll('.bc-grid')];
    const count = board.querySelector('[data-bc-count]');
    if (!moving()) return;
    board.classList.add('bc-armed');
    onScroll(() => {
      const r = board.getBoundingClientRect();
      const p = clamp((innerHeight * .82 - r.top) / (r.height * .8));
      const n = Math.round(p * cards.length);
      cards.forEach((c, i) => c.classList.toggle('is-lit', i < n));
      rows.forEach((row, i) => row.style.setProperty('--run', clamp((n - i * 4) / 4).toFixed(3)));
      if (count) count.textContent = String(n);
      board.classList.toggle('is-full', n === cards.length);
    });
  });

  /* Studio: twelve weeks, three phases. It plays through once, then you can pick a phase */
  document.querySelectorAll('[data-studio]').forEach(plan => {
    const weeks = [...plan.querySelectorAll('.studio-weeks i')];
    const phases = [...plan.querySelectorAll('.studio-phase')];
    const picks = phases.map(ph => ph.querySelector('.studio-pick'));
    const head = plan.querySelector('[data-studio-head]');
    const label = plan.querySelector('[data-studio-week]');
    const ranges = [[1, 4], [5, 8], [9, 12]];
    let timer = null;
    const setWeek = (w, phase) => {
      weeks.forEach((cell, i) => {
        cell.classList.toggle('is-done', i < w);
        cell.classList.toggle('is-phase', i + 1 >= ranges[phase][0] && i + 1 <= ranges[phase][1]);
      });
      phases.forEach((ph, i) => ph.classList.toggle('is-active', i === phase));
      picks.forEach((b, i) => b.setAttribute('aria-pressed', String(i === phase)));
      head.style.setProperty('--at', ((w - .5) / 12).toFixed(4));
      label.textContent = `Week ${w}`;
    };
    const choose = k => {
      clearInterval(timer);
      plan.classList.add('is-chosen');
      setWeek(ranges[k][1], k);
      if (moving()) phases[k].querySelectorAll('.studio-chips li').forEach((li, i) => li.animate(
        [{ opacity: 0, transform: 'translateY(10px) scale(.9)' }, { opacity: 1, transform: 'none' }],
        { duration: 420, delay: i * 60, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' }));
    };
    picks.forEach((b, k) => {
      b.addEventListener('click', () => choose(k));
      b.closest('.studio-phase').addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && plan.classList.contains('is-chosen')) choose(k); });
    });
    weeks.forEach((cell, i) => {
      cell.addEventListener('click', () => choose(ranges.findIndex(r => i + 1 >= r[0] && i + 1 <= r[1])));
    });
    plan.classList.add('studio-armed');
    if (!moving() || !('IntersectionObserver' in window)) { choose(0); return; }
    setWeek(1, 0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let w = 1;
      timer = setInterval(() => {
        w += 1;
        if (w > 12) { clearInterval(timer); plan.classList.add('is-chosen'); return; }
        setWeek(w, ranges.findIndex(r => w >= r[0] && w <= r[1]));
      }, 320);
    }, { threshold: .45 });
    io.observe(plan);
  });

  /* Client briefs: each case file flips over to show what the team hands over */
  const cases = [...document.querySelectorAll('.case')];
  cases.forEach(card => {
    const front = card.querySelector('.case-front');
    const back = card.querySelector('.case-back');
    const set = flipped => {
      card.classList.toggle('is-flipped', flipped);
      front.setAttribute('aria-hidden', String(flipped));
      back.setAttribute('aria-hidden', String(!flipped));
      front.inert = flipped;
      back.inert = !flipped;
    };
    set(false);
    card.querySelectorAll('.case-flip').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      const now = !card.classList.contains('is-flipped');
      set(now);
      (now ? back : front).querySelector('.case-flip').focus({ preventScroll: true });
    }));
    front.addEventListener('click', () => { set(true); back.querySelector('.case-flip').focus({ preventScroll: true }); });
  });
  if (cases.length && moving() && 'IntersectionObserver' in window) {
    // The first card lifts a corner once, so people know the cards turn over
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(() => cases[0].classList.add('is-peek'), 700);
      setTimeout(() => cases[0].classList.remove('is-peek'), 1700);
    }, { threshold: .6 });
    io.observe(cases[0]);
  }

  /* "Three hours.": the words ink in, a red marker sweeps under the promise,
     the three pieces of work land on the table and the red ribbon slides with you */
  document.querySelectorAll('[data-three]').forEach(sec => {
    const words = [...sec.querySelectorAll('.three-w')];
    const docs = [...sec.querySelectorAll('.three-doc')];
    const trackEl = sec.querySelector('[data-three-track]');
    if (!moving()) { sec.classList.add('is-still'); return; }
    sec.classList.add('three-armed');
    onScroll(() => {
      const r = sec.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight * .85));
      const lit = Math.round(clamp(p / .55) * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      sec.style.setProperty('--mark', clamp((p - .38) / .32).toFixed(3));
      docs.forEach((d, i) => d.style.setProperty('--land', clamp((p - .22 - i * .14) / .34).toFixed(3)));
      if (trackEl) trackEl.style.transform = `translateX(${(-(innerHeight - r.top) * .45).toFixed(1)}px)`;
    });
  });
})();
