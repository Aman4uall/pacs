/* Classroom examples: small working activities a teacher can build with AI tools and no code.
   Used on schools.html (the best six, with a link) and examples.html (all of them).
   Plain JavaScript; nothing leaves the page. Every attribute here starts with data-ex-
   so it never collides with the page's own scripts. */
(function () {
  'use strict';
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const r1 = n => Math.round(n * 10) / 10;
  const r2 = n => Math.round(n * 100) / 100;
  const rs = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const svg = (label, inner) => `<svg viewBox="0 0 320 200" role="img" aria-label="${esc(label)}">${inner}</svg>`;
  const T = (x, y, t, a = '') => `<text x="${r1(x)}" y="${r1(y)}" ${a}>${t}</text>`;
  const mid = 'text-anchor="middle"';

  const SUBJECTS = {
    maths: { name: 'Maths', ac: '#2156a8' },
    science: { name: 'Science', ac: '#1f7a4d' },
    social: { name: 'Social Science', ac: '#b0561f' },
    english: { name: 'English', ac: '#6a3fb0' },
    computing: { name: 'Computers', ac: '#0f6f73' },
  };
  const BANDS = { '3-5': 'Class 3–5', '6-8': 'Class 6–8', '9-10': 'Class 9–10', '11-12': 'Class 11–12' };

  /* ---------- Small drawing helpers ---------- */
  function bulb(x, y, on, broken) {
    return (on ? `<circle class="ex-glow" cx="${x}" cy="${y}" r="26" fill="#ffe27a" opacity=".55"/>` : '') +
      `<circle cx="${x}" cy="${y}" r="14" fill="${on ? '#ffd84d' : broken ? '#d9d6cc' : '#efeee6'}" stroke="#8a8674" stroke-width="2"/>` +
      `<path d="M${x - 6} ${y + 3}l3-7 3 7 3-7 3 7" fill="none" stroke="${on ? '#b0701a' : '#9a978a'}" stroke-width="1.6"/>` +
      (broken ? `<path d="M${x - 11} ${y - 11}l22 22M${x + 11} ${y - 11}l-22 22" stroke="#bd2934" stroke-width="3" stroke-linecap="round"/>` : '');
  }
  function phasePath(cx, cy, R, th) {
    const c = Math.cos(th), rx = r1(R * Math.abs(c));
    return th <= Math.PI
      ? `M${cx} ${cy - R}A${R} ${R} 0 0 1 ${cx} ${cy + R}A${rx} ${R} 0 0 ${c > 0 ? 0 : 1} ${cx} ${cy - R}Z`
      : `M${cx} ${cy - R}A${R} ${R} 0 0 0 ${cx} ${cy + R}A${rx} ${R} 0 0 ${c > 0 ? 1 : 0} ${cx} ${cy - R}Z`;
  }
  let audio;
  function tone(freq) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.95);
    } catch (e) { /* No sound on this device: the picture still shows the note. */ }
  }

  /* ---------- The examples ----------
     init: the starting state. controls: sliders, choices and buttons. art(view, state): the
     picture, redrawn on every change (view holds the smoothed numbers). read(state): what it
     shows, in words. smooth: numbers that glide instead of jumping. tick: for things that
     play out over time (dice, the robot, a vibrating string). */
  const EX = [
    /* ---------- Maths ---------- */
    {
      id: 'pizza', subject: 'maths', band: '3-5', cls: 'Class 4',
      title: 'Share the pizza fairly', hook: 'Is 1/8 of a pizza more than 1/4?',
      ask: 'An activity for Class 4 fractions: a pizza shared between 2 to 8 friends, where students eat slices and see the fraction.',
      steps: ['Checked that every slice is exactly equal, because unequal parts are not fractions.', 'Asked for the pizza to show when a fraction simplifies, like 2/4 = 1/2.', 'Added the question on the card, so the class predicts before touching anything.'],
      use: 'Project it. Ask: would you rather have 1/4 or 1/8? Take a vote, then move the slider.',
      init: () => ({ n: 4, k: 1 }),
      controls: [{ type: 'range', key: 'n', label: 'Friends sharing', min: 2, max: 8, step: 1 }, { type: 'range', key: 'k', label: 'Slices you eat', min: 0, max: 8, step: 1 }],
      fix: s => { s.k = Math.min(s.k, s.n); },
      art: v => {
        const n = v.n, k = Math.min(v.k, n), cx = 112, cy = 100, R = 76;
        let out = `<circle cx="${cx}" cy="${cy}" r="${R + 7}" fill="#d99a45"/>`;
        for (let i = 0; i < n; i++) {
          const a0 = i / n * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / n * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2, eaten = i < k;
          out += `<path d="M${cx} ${cy}L${r1(cx + R * Math.cos(a0))} ${r1(cy + R * Math.sin(a0))}A${R} ${R} 0 0 1 ${r1(cx + R * Math.cos(a1))} ${r1(cy + R * Math.sin(a1))}Z" fill="${eaten ? '#f7f5ee' : '#f6cf6b'}" stroke="${eaten ? '#d4c9a8' : '#c98b2f'}" stroke-width="2"${eaten ? ' stroke-dasharray="4 4"' : ''}/>`;
          if (!eaten) out += `<circle cx="${r1(cx + R * .56 * Math.cos(am))}" cy="${r1(cy + R * .56 * Math.sin(am))}" r="${Math.max(4, 12 - n)}" fill="#c8453b"/>`;
        }
        out += T(250, 80, k, `${mid} font-size="40" font-weight="700" fill="#2156a8"`) + `<path d="M222 93H278" stroke="#252b25" stroke-width="3"/>` + T(250, 132, n, `${mid} font-size="40" font-weight="700"`) + T(250, 162, 'eaten', `${mid} font-size="12" fill="#62685f"`);
        return svg(`A pizza cut into ${n} equal slices, ${k} eaten`, out);
      },
      read: s => {
        const k = Math.min(s.k, s.n), g = gcd(k, s.n);
        return `Each slice is <b>1/${s.n}</b> of the pizza. You ate <b>${k}/${s.n}</b>.` + (k && g > 1 ? ` That is the same as <b>${k / g}/${s.n / g}</b>.` : '') + (s.n > 4 ? ` More friends, smaller slices: 1/${s.n} is less than 1/4.` : '');
      },
    },
    {
      id: 'abacus', subject: 'maths', band: '3-5', cls: 'Class 3',
      title: 'Build the number', hook: 'What is the 7 in 374 really worth?',
      ask: 'A place-value abacus for Class 3 with hundreds, tens and ones, and a button that gives students a number to build.',
      steps: ['Kept it to three rods, the level of the Class 3 book.', 'Made the sentence under it say the value of each digit, not just the number.'],
      use: 'Call out a number. Students come up in turns to build it, and the class checks the sentence.',
      init: () => ({ h: 3, t: 7, o: 4, target: 0, round: 0 }),
      controls: [
        { type: 'range', key: 'h', label: 'Hundreds', min: 0, max: 9, step: 1 },
        { type: 'range', key: 't', label: 'Tens', min: 0, max: 9, step: 1 },
        { type: 'range', key: 'o', label: 'Ones', min: 0, max: 9, step: 1 },
        { type: 'buttons', items: [{ label: 'Give me a number', run: s => { s.target = [258, 406, 790, 315, 999, 104][s.round++ % 6]; } }] },
      ],
      art: v => {
        let out = `<rect x="40" y="32" width="240" height="146" rx="10" fill="#f3e2c4" stroke="#9a6a3a" stroke-width="4"/>`;
        [['h', 85, '#d9534f', 'H'], ['t', 160, '#2156a8', 'T'], ['o', 235, '#3f8a4f', 'O']].forEach(([k, x, c, l]) => {
          out += `<path d="M${x} 40V168" stroke="#7a5230" stroke-width="4"/>`;
          for (let i = 0; i < v[k]; i++) out += `<ellipse cx="${x}" cy="${160 - i * 12}" rx="21" ry="6.5" fill="${c}" stroke="#00000030"/>`;
          out += T(x, 194, l, `${mid} font-size="13" font-weight="700" fill="#62685f"`);
        });
        out += T(160, 22, `${v.h * 100 + v.t * 10 + v.o}`, `${mid} font-size="18" font-weight="700"`);
        return svg('An abacus with hundreds, tens and ones rods', out);
      },
      read: s => {
        const n = s.h * 100 + s.t * 10 + s.o;
        const goal = s.target ? (n === s.target ? ` <b>You built ${s.target}.</b>` : ` Build <b>${s.target}</b>.`) : '';
        return `<b>${n}</b> = ${s.h} hundreds (${s.h * 100}) + ${s.t} tens (${s.t * 10}) + ${s.o} ones.${goal}`;
      },
    },
    {
      id: 'mirror', subject: 'maths', band: '3-5', cls: 'Class 5',
      title: 'Fold it in the mirror', hook: 'Do the two halves really match?',
      ask: 'A symmetry activity for Class 5: show half a shape, then reflect it in a mirror line to complete it.',
      steps: ['Picked shapes students know: a butterfly, a house, a heart, a tree.', 'Slowed the reflection down so students see it fold over.'],
      use: 'Show the half shape first. Students draw the other half in their notebooks, then reveal.',
      init: () => ({ shape: 'butterfly', fold: 0 }),
      smooth: ['fold'],
      controls: [
        { type: 'choice', key: 'shape', label: 'Shape', options: [['butterfly', 'Butterfly'], ['house', 'House'], ['heart', 'Heart'], ['tree', 'Tree']], then: s => { s.fold = 0; } },
        { type: 'buttons', items: [{ label: s => (s.fold ? 'Hide the reflection' : 'Reflect it'), run: s => { s.fold = s.fold ? 0 : 1; } }] },
      ],
      art: v => {
        const S = {
          butterfly: [`<path d="M160 96C136 30 70 26 62 70C56 100 100 108 160 102Z" fill="#e9884d"/><path d="M160 106C112 110 80 132 92 160C104 182 140 162 160 122Z" fill="#f1b15a"/><circle cx="100" cy="70" r="9" fill="#fff5dc"/><path d="M158 66Q148 40 132 32" fill="none" stroke="#3b3040" stroke-width="2.5"/>`, `<ellipse cx="160" cy="106" rx="5" ry="42" fill="#3b3040"/>`],
          house: [`<path d="M160 38L86 96H100V172H160Z" fill="#e8a25c"/><path d="M160 32L76 100" stroke="#8b4c2a" stroke-width="8" stroke-linecap="round"/><rect x="112" y="112" width="24" height="22" fill="#fff" stroke="#8b4c2a" stroke-width="2"/>`, `<rect x="146" y="134" width="28" height="38" fill="#8b4c2a"/>`],
          heart: [`<path d="M160 72C152 42 104 34 96 74C90 108 126 140 160 172Z" fill="#d9434f"/>`, ''],
          tree: [`<path d="M160 26L112 92H130L96 142H160Z" fill="#3f8a4f"/>`, `<rect x="152" y="142" width="16" height="32" fill="#7a5230"/>`],
        }[v.shape];
        return svg(`Half a ${v.shape} and its reflection`, `${S[0]}<g transform="translate(160 0) scale(${r2(-Math.max(v.fold, 0.001))} 1) translate(-160 0)" opacity="${r2(0.35 + 0.65 * v.fold)}">${S[0]}</g>${S[1]}<path d="M160 12V190" stroke="#bd2934" stroke-width="2" stroke-dasharray="6 5"/>` + T(166, 20, 'mirror line', 'font-size="11" fill="#bd2934"'));
      },
      read: s => (s.fold ? 'Two matching halves. The dashed line is a <b>line of symmetry</b>.' : `Half a ${s.shape}. What will the other half look like? Then press <b>Reflect it</b>.`),
    },
    {
      id: 'playground', subject: 'maths', band: '6-8', cls: 'Class 6',
      title: 'Same fence, bigger playground', hook: '120 m of fence. Which shape gives the most space?',
      ask: 'A Class 6 perimeter and area activity: a playground with a fixed 120 m fence, where students change the width and watch the area.',
      steps: ['Locked the fence length, so only the shape can change.', 'Made the area update live, so students spot the square themselves.'],
      use: 'Groups guess the best width first and write it down. Then find it together.',
      init: () => ({ w: 15 }), smooth: ['w'],
      controls: [{ type: 'range', key: 'w', label: 'Width of the field (m)', min: 5, max: 55, step: 5 }],
      art: v => {
        const w = v.w, l = 60 - w, sc = 2.5, W = l * sc, H = w * sc, x = 160 - W / 2, y = 102 - H / 2;
        return svg('A rectangular playground inside a fixed fence', `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(W)}" height="${r1(H)}" rx="3" fill="#a6d18f" stroke="#7a5230" stroke-width="3.5" stroke-dasharray="9 5"/>` +
          T(160, y - 8, `${Math.round(l)} m`, `${mid} font-size="13" font-weight="600"`) + T(x - 8, 106, `${Math.round(w)} m`, 'text-anchor="end" font-size="13" font-weight="600"') +
          T(160, 108, `${Math.round(w * l)} m²`, `${mid} font-size="${H > 30 ? 20 : 12}" font-weight="700" fill="#1e4e1c"`));
      },
      read: s => `The fence is always <b>120 m</b>. This field is ${60 - s.w} m by ${s.w} m: <b>${s.w * (60 - s.w)} m²</b>.` + (s.w === 30 ? ' A square gives the most space.' : ' Can you find a bigger one?'),
    },
    {
      id: 'recipe', subject: 'maths', band: '6-8', cls: 'Class 7',
      title: 'Cook for the whole class', hook: 'A recipe for 4. How much for 40?',
      ask: 'A ratio activity for Class 7: a lemon rice recipe for 4 people that scales up or down with a slider.',
      steps: ['Used a dish students eat at home.', 'Kept the rice to water ratio visible, so scaling is about keeping ratios the same.'],
      use: 'Start at 4. Ask for 12 before moving the slider. Then ask why the taste stays the same.',
      init: () => ({ p: 4 }), smooth: ['p'],
      controls: [{ type: 'range', key: 'p', label: 'People to feed', min: 2, max: 40, step: 2 }],
      art: v => {
        const f = v.p / 4, rows = [['Rice', 'cups', 2, '#e8d9a8'], ['Water', 'cups', 4, '#8cc4de'], ['Lemons', '', 2, '#f2d34f'], ['Peanuts', 'cups', 0.5, '#c98b5a']];
        let out = T(18, 26, `Lemon rice for ${Math.round(v.p)} people`, 'font-size="15" font-weight="700"');
        rows.forEach(([n, u, q, c], i) => {
          const y = 46 + i * 38, amt = q * f;
          out += T(18, y + 17, n, 'font-size="13"') + `<rect x="92" y="${y}" width="${r1(Math.max(3, amt * 5))}" height="24" rx="5" fill="${c}"/>` + T(100 + Math.max(3, amt * 5), y + 17, `${r2(amt)} ${u}`, 'font-size="13" font-weight="600"');
        });
        return svg('Recipe amounts scaled for the number of people', out);
      },
      read: s => `For ${s.p} people, multiply everything by <b>${r2(s.p / 4)}</b>. Rice to water stays <b>1 : 2</b>, so it tastes the same.`,
    },
    {
      id: 'lift', subject: 'maths', band: '6-8', cls: 'Class 6',
      title: 'Ride the lift', hook: 'From basement 2 to floor 5: how many floors?',
      ask: 'An integers activity for Class 6: a lift in a building with basements, where students pick two floors and see the subtraction.',
      steps: ['Used basements for negative numbers, because every student has seen one.', 'Showed the subtraction with brackets, the way the textbook writes it.'],
      use: 'Ask for the answer on fingers before the lift moves. Then try going down.',
      init: () => ({ from: -2, to: 5, car: 5 }), smooth: ['car'],
      controls: [{ type: 'range', key: 'from', label: 'Start floor', min: -3, max: 8, step: 1 }, { type: 'range', key: 'to', label: 'Go to floor', min: -3, max: 8, step: 1 }],
      fix: s => { s.car = s.to; },
      art: (v, s) => {
        const y = f => 180 - (f + 3) * 13.5;
        let out = `<rect x="112" y="${y(8) - 13.5}" width="96" height="${12 * 13.5}" fill="#eef0e6" stroke="#9aa295"/><rect x="100" y="${y(0)}" width="120" height="3" fill="#7a5230"/>`;
        for (let f = -3; f <= 8; f++) out += `<path d="M112 ${y(f)}H208" stroke="#d3d8cc"/>` + T(104, y(f) - 3, f, `text-anchor="end" font-size="11" fill="${f < 0 ? '#bd2934' : '#62685f'}"`);
        out += T(230, y(0) + 14, 'ground', 'font-size="10" fill="#7a5230"');
        out += `<rect x="140" y="${r1(y(v.car) - 12.5)}" width="40" height="11" rx="2" fill="#2156a8"/>`;
        const a = y(s.from) - 6, b = y(s.to) - 6;
        if (s.from !== s.to) out += `<path d="M250 ${a}V${b}" stroke="#bd2934" stroke-width="3"/><path d="M244 ${b + (b > a ? -8 : 8)}L250 ${b}L256 ${b + (b > a ? -8 : 8)}" fill="none" stroke="#bd2934" stroke-width="3"/>` + T(262, (a + b) / 2 + 5, `${s.to - s.from > 0 ? '+' : ''}${s.to - s.from}`, 'font-size="16" font-weight="700" fill="#bd2934"');
        out += `<circle cx="126" cy="${y(s.from) - 6}" r="4" fill="#bd2934"/>`;
        return svg('A lift moving between floors', out);
      },
      read: s => { const d = s.to - s.from; return `From <b>${s.from}</b> to <b>${s.to}</b>: ${s.to} − (${s.from}) = <b>${d}</b>. The lift goes ${d > 0 ? 'up' : d < 0 ? 'down' : 'nowhere'}${d ? ` ${Math.abs(d)} floor${Math.abs(d) === 1 ? '' : 's'}` : ''}.`; },
    },
    {
      id: 'fare', subject: 'maths', band: '9-10', cls: 'Class 9', featured: 2,
      title: 'Why is the auto fare a straight line?', hook: 'A starting charge, then a rate per km.',
      ask: 'A Class 9 linear equations activity: an auto-rickshaw fare graph where students change the trip, the starting charge and the rate per km.',
      steps: ['Used an auto fare, because students pay one every week.', 'Wrote the equation in the y = mx + c form next to the graph.', 'Checked the numbers stay realistic for a town trip.'],
      use: 'Ask two students to predict a 10 km fare with different rates. Then compare the two lines.',
      init: () => ({ km: 4, base: 30, rate: 15 }), smooth: ['km', 'base', 'rate'],
      controls: [
        { type: 'range', key: 'km', label: 'Trip length (km)', min: 0, max: 12, step: 0.5 },
        { type: 'range', key: 'base', label: 'Starting charge (₹)', min: 20, max: 50, step: 5 },
        { type: 'range', key: 'rate', label: 'Rate per km (₹)', min: 10, max: 25, step: 1 },
      ],
      art: v => {
        const X = k => 46 + k * 21, Y = r => 176 - r * 0.385;
        let out = '';
        for (let r = 100; r <= 400; r += 100) out += `<path d="M46 ${Y(r)}H300" stroke="#e1e3da"/>` + T(40, Y(r) + 4, r, 'text-anchor="end" font-size="10" fill="#62685f"');
        for (let k = 0; k <= 12; k += 2) out += T(X(k), 190, k, `${mid} font-size="10" fill="#62685f"`);
        out += `<path d="M46 20V176H300" fill="none" stroke="#252b25" stroke-width="1.5"/>` + T(306, 180, 'km', 'font-size="10" fill="#62685f"') + T(34, 16, '₹', 'font-size="12" fill="#62685f"');
        const fare = v.base + v.rate * v.km;
        out += `<path d="M${X(0)} ${r1(Y(v.base))}L${X(12)} ${r1(Y(v.base + v.rate * 12))}" stroke="#2156a8" stroke-width="3.5" stroke-linecap="round"/>`;
        out += `<path d="M${r1(X(v.km))} 176V${r1(Y(fare))}H46" fill="none" stroke="#bd2934" stroke-dasharray="4 4"/><circle cx="${r1(X(v.km))}" cy="${r1(Y(fare))}" r="6" fill="#bd2934"/>` + T(X(v.km) + 9, Y(fare) - 9, `₹${Math.round(fare)}`, 'font-size="14" font-weight="700" fill="#bd2934"');
        out += `<circle cx="46" cy="${r1(Y(v.base))}" r="4.5" fill="#2156a8"/>`;
        return svg('A straight-line graph of auto fare against distance', out);
      },
      read: s => `<b>y = ${s.rate}x + ${s.base}</b>. For ${s.km} km: <b>₹${s.base + s.rate * s.km}</b>. The starting charge is where the line begins. The rate per km is how steeply it climbs.`,
    },
    {
      id: 'ladder', subject: 'maths', band: '9-10', cls: 'Class 10',
      title: 'How high does the ladder reach?', hook: 'Move the foot of the ladder. Watch the top.',
      ask: 'A Pythagoras activity for Class 10: a ladder against a wall, where students change its length and how far the foot is from the wall.',
      steps: ['Checked the right angle is marked where the wall meets the ground.', 'Showed the working with squares, not just the answer.'],
      use: 'Give the class a 5 m ladder with its foot 3 m away. They work out the height before you check.',
      init: () => ({ len: 5, foot: 3 }), smooth: ['len', 'foot'],
      controls: [{ type: 'range', key: 'len', label: 'Ladder length (m)', min: 3, max: 10, step: 0.5 }, { type: 'range', key: 'foot', label: 'Foot from the wall (m)', min: 0.5, max: 9.5, step: 0.5 }],
      fix: s => { s.foot = Math.min(s.foot, s.len - 0.5); },
      art: v => {
        const sc = 15, foot = Math.min(v.foot, v.len - 0.2), h = Math.sqrt(v.len ** 2 - foot ** 2), bx = 250 - foot * sc, ty = 180 - h * sc;
        const dx = 250 - bx, dy = ty - 180, L = Math.hypot(dx, dy), px = -dy / L * 5, py = dx / L * 5;
        let rungs = '';
        for (let t = 0.1; t < 1; t += 0.5 / v.len) rungs += `<path d="M${r1(bx + dx * t + px)} ${r1(180 + dy * t + py)}L${r1(bx + dx * t - px)} ${r1(180 + dy * t - py)}" stroke="#8b5a2b" stroke-width="2"/>`;
        return svg('A ladder leaning against a wall', `<rect x="250" y="10" width="14" height="170" fill="#c9785a"/><path d="M20 180H300" stroke="#252b25" stroke-width="2"/><path d="M238 180V168H250" fill="none" stroke="#62685f"/>` +
          `<path d="M${r1(bx + px)} ${r1(180 + py)}L${r1(250 + px)} ${r1(ty + py)}M${r1(bx - px)} ${r1(180 - py)}L${r1(250 - px)} ${r1(ty - py)}" stroke="#8b5a2b" stroke-width="4" stroke-linecap="round"/>${rungs}` +
          T((bx + 250) / 2, 196, `${r1(foot)} m`, `${mid} font-size="13" font-weight="600"`) + T(270, (ty + 180) / 2, `${r2(h)} m`, 'font-size="13" font-weight="700" fill="#2156a8"') + T((bx + 250) / 2 - 22, (ty + 180) / 2 - 6, `${r1(v.len)} m`, 'text-anchor="end" font-size="13" font-weight="600" fill="#8b5a2b"'));
      },
      read: s => { const h2 = s.len ** 2 - s.foot ** 2; return `It reaches <b>${r2(Math.sqrt(h2))} m</b> up the wall. Height² = ${s.len}² − ${s.foot}² = ${r2(h2)}.`; },
    },
    {
      id: 'dice', subject: 'maths', band: '9-10', cls: 'Class 10',
      title: 'Roll a thousand dice', hook: 'Does a six really come up 1 time in 6?',
      ask: 'A Class 10 probability activity: roll a die 10, 100 or 1,000 times and watch the results settle towards 1 in 6.',
      steps: ['Added the 1 in 6 line so students compare the bars with theory.', 'Made the rolls animate, so the settling is visible.'],
      use: 'Roll 10 first and ask if the die is fair. Then roll 1,000 and ask again.',
      init: () => ({ c: [0, 0, 0, 0, 0, 0], pending: 0, batch: 0, acc: 0, last: 0 }),
      controls: [{ type: 'buttons', items: [
        { label: 'Roll 10', run: s => { s.pending += 10; s.batch = 10; } },
        { label: 'Roll 100', run: s => { s.pending += 100; s.batch = 100; } },
        { label: 'Roll 1,000', run: s => { s.pending += 1000; s.batch = 1000; } },
        { label: 'Start again', run: s => { s.c = [0, 0, 0, 0, 0, 0]; s.pending = 0; s.last = 0; } },
      ] }],
      tick: (s, dt) => {
        if (s.pending <= 0) return false;
        s.acc += dt; if (s.acc < 40) return true; s.acc = 0;
        const n = Math.min(s.pending, Math.max(1, Math.ceil(s.batch / 24)));
        for (let i = 0; i < n; i++) { const f = Math.floor(Math.random() * 6); s.c[f]++; s.last = f + 1; }
        s.pending -= n; return s.pending > 0;
      },
      thumb: () => EX_BY.dice.art({ c: [168, 159, 171, 162, 174, 166], last: 6 }),
      art: v => {
        const total = v.c.reduce((a, b) => a + b, 0);
        let out = T(40, 22, `${total.toLocaleString('en-IN')} rolls`, 'font-size="14" font-weight="700"');
        v.c.forEach((n, i) => { const h = total ? Math.min(140, n / total / 0.34 * 130) : 0; out += `<rect x="${44 + i * 40}" y="${r1(172 - h)}" width="30" height="${r1(h)}" rx="3" fill="${i === 5 ? '#bd2934' : '#2156a8'}"/>` + T(59 + i * 40, 188, i + 1, `${mid} font-size="12" font-weight="600"`); });
        const ey = 172 - (1 / 6) / 0.34 * 130;
        out += `<path d="M38 ${r1(ey)}H286" stroke="#252b25" stroke-dasharray="5 4"/>` + T(288, ey + 4, '1 in 6', 'font-size="10" fill="#252b25"');
        if (v.last) { const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v.last]; out += `<rect x="262" y="6" width="34" height="34" rx="7" fill="#fff" stroke="#252b25" stroke-width="2"/>` + P.map(([a, b]) => `<circle cx="${279 + a * 9}" cy="${23 + b * 9}" r="3.2" fill="#252b25"/>`).join(''); }
        return svg('Bar chart of dice results', out);
      },
      read: s => {
        const total = s.c.reduce((a, b) => a + b, 0);
        if (!total) return 'Each face should come up about <b>1 time in 6</b>. Roll and see.';
        return `${total.toLocaleString('en-IN')} rolls. Sixes: <b>${s.c[5]}</b>, that is <b>${r1(s.c[5] / total * 100)}%</b> (theory: 16.7%). ${total < 200 ? 'With few rolls, the bars jump around.' : 'With more rolls, the bars settle close to the line.'}`;
      },
    },
    {
      id: 'interest', subject: 'maths', band: '11-12', cls: 'Class 11',
      title: 'Simple or compound interest?', hook: '₹1 lakh for 20 years. How far apart do they end?',
      ask: 'A graph for Class 11 comparing simple and compound interest on ₹1 lakh, with sliders for the rate and the number of years.',
      steps: ['Checked the formulas against the textbook: P(1 + rt) and P(1 + r)ⁿ.', 'Wrote the amounts in lakhs and thousands, the Indian way.'],
      use: 'Ask when the two lines start to pull apart, and why.',
      init: () => ({ r: 8, y: 20 }), smooth: ['r', 'y'],
      controls: [{ type: 'range', key: 'r', label: 'Interest rate (% a year)', min: 2, max: 15, step: 1 }, { type: 'range', key: 'y', label: 'Years', min: 1, max: 30, step: 1 }],
      art: v => {
        const P = 100000, top = P * (1 + v.r / 100) ** v.y * 1.12, X = t => 48 + t / v.y * 222, Y = a => 176 - a / top * 150;
        let si = '', ci = '';
        for (let t = 0; t <= v.y + 0.001; t += v.y / 30) { si += `${t ? 'L' : 'M'}${r1(X(t))} ${r1(Y(P * (1 + v.r / 100 * t)))}`; ci += `${t ? 'L' : 'M'}${r1(X(t))} ${r1(Y(P * (1 + v.r / 100) ** t))}`; }
        const S = P * (1 + v.r / 100 * v.y), C = P * (1 + v.r / 100) ** v.y;
        return svg('Simple and compound interest growing over the years', `<path d="M48 20V176H290" fill="none" stroke="#252b25" stroke-width="1.5"/>` + T(48, 192, '0', `${mid} font-size="10" fill="#62685f"`) + T(270, 192, `${Math.round(v.y)} years`, `${mid} font-size="10" fill="#62685f"`) +
          `<path d="${ci}" fill="none" stroke="#bd2934" stroke-width="3.5"/><path d="${si}" fill="none" stroke="#2156a8" stroke-width="3.5"/>` +
          T(62, Y(C) + 4, `Compound ${rs(C)}`, 'font-size="12" font-weight="700" fill="#bd2934"') + T(150, Y(S) + 18, `Simple ${rs(S)}`, 'font-size="12" font-weight="700" fill="#2156a8"'));
      },
      read: s => { const P = 100000, S = P * (1 + s.r / 100 * s.y), C = P * (1 + s.r / 100) ** s.y; return `After ${s.y} year${s.y > 1 ? 's' : ''} at ${s.r}%: simple <b>${rs(S)}</b>, compound <b>${rs(C)}</b>. Compound interest earns interest on its interest, so the gap keeps widening.`; },
    },
    {
      id: 'median', subject: 'maths', band: '11-12', cls: 'Class 11',
      title: 'One huge salary', hook: 'Which average tells the truth about a typical worker?',
      ask: 'A statistics activity for Class 11: nine salaries in a small office, where one salary can be raised to see what happens to the mean and the median.',
      steps: ['Kept eight ordinary salaries fixed, so only one value changes.', 'Marked the mean and median on the same line so they can be compared at a glance.'],
      use: 'Ask which number the owner would quote in a job advert, and which a worker would quote.',
      init: () => ({ top: 40 }), smooth: ['top'],
      controls: [{ type: 'range', key: 'top', label: "The boss's salary (₹ thousand a month)", min: 30, max: 500, step: 10 }],
      art: v => {
        const base = [18, 20, 21, 23, 25, 26, 28, 30], all = [...base, v.top], max = Math.max(60, v.top * 1.08), X = n => 30 + n / max * 270;
        const mean = all.reduce((a, b) => a + b, 0) / 9;
        let out = `<path d="M30 110H300" stroke="#252b25" stroke-width="1.5"/>`;
        for (let t = 0; t <= max; t += max > 200 ? 100 : 20) out += `<path d="M${r1(X(t))} 106V114" stroke="#252b25"/>` + T(X(t), 128, t, `${mid} font-size="10" fill="#62685f"`);
        base.forEach((n, i) => { out += `<circle cx="${r1(X(n))}" cy="${i % 2 ? 98 : 92}" r="6" fill="#2156a8" opacity=".85"/>`; });
        out += `<circle cx="${r1(X(v.top))}" cy="95" r="8" fill="#bd2934"/>`;
        out += `<path d="M${r1(X(25))} 72V88" stroke="#1f7a4d" stroke-width="3"/>` + T(X(25), 64, 'Median 25', `${mid} font-size="12" font-weight="700" fill="#1f7a4d"`);
        out += `<path d="M${r1(X(mean))} 142L${r1(X(mean) - 7)} 154H${r1(X(mean) + 7)}Z" fill="#bd2934"/>` + T(X(mean), 172, `Mean ${r1(mean)}`, `${mid} font-size="12" font-weight="700" fill="#bd2934"`);
        return svg('Nine salaries on a number line with the mean and median marked', out + T(30, 22, '₹ thousand a month', 'font-size="11" fill="#62685f"'));
      },
      read: s => { const mean = ([18, 20, 21, 23, 25, 26, 28, 30].reduce((a, b) => a + b, 0) + s.top) / 9; return `Median <b>₹25k</b>. Mean <b>₹${r1(mean)}k</b>. One large salary drags the mean up, but the middle value hardly moves.`; },
    },

    /* ---------- Science ---------- */
    {
      id: 'shadow', subject: 'science', band: '3-5', cls: 'Class 5',
      title: 'Why is my shadow longest in the evening?', hook: 'Move the Sun across the sky.',
      ask: 'A Class 5 activity on light and shadows: a stick in the ground, and a slider that moves the Sun from morning to evening.',
      steps: ['Checked that the shadow always points away from the Sun.', 'Showed East and West, so the class can link it to sunrise and sunset.'],
      use: 'Take the class outside at 9 and at 12 and mark a real stick’s shadow. Then compare with this.',
      init: () => ({ t: 8 }), smooth: ['t'],
      controls: [{ type: 'range', key: 't', label: 'Time of day', min: 7, max: 17, step: 0.5, fmt: v => clock(v) }],
      art: v => {
        const th = Math.PI * (v.t - 6) / 12, e = Math.sin(th) * 80 * Math.PI / 180, L = Math.min(150, 60 / Math.tan(Math.max(e, 0.05)));
        const sx = 160 + 138 * Math.cos(th), sy = 170 - 125 * Math.sin(th), hi = Math.sin(th);
        const sky = `rgb(${Math.round(246 - 55 * hi)},${Math.round(200 + 24 * hi)},${Math.round(160 + 85 * hi)})`, dir = Math.cos(th) > 0 ? -1 : 1;
        return svg('A stick and its shadow as the Sun moves', `<rect width="320" height="170" fill="${sky}"/><circle cx="${r1(sx)}" cy="${r1(sy)}" r="15" fill="#ffd34d"/><rect y="170" width="320" height="30" fill="#d8c79a"/>` +
          `<path d="M157 170H163L${r1(160 + dir * L + 2)} 171L${r1(160 + dir * L - 2)} 169Z" fill="#3a3a3a" opacity=".55"/><rect x="157" y="110" width="6" height="60" rx="2" fill="#7a5230"/>` +
          T(300, 192, 'East', 'text-anchor="end" font-size="11" fill="#5d4a2a"') + T(20, 192, 'West', 'font-size="11" fill="#5d4a2a"'));
      },
      read: s => { const th = Math.PI * (s.t - 6) / 12, e = Math.sin(th) * 80 * Math.PI / 180; return `At ${clock(s.t)}, the shadow is <b>${r1(1 / Math.tan(e))} times</b> the stick’s height. Low Sun, long shadow. It always points away from the Sun.`; },
    },
    {
      id: 'circuit', subject: 'science', band: '6-8', cls: 'Class 6', featured: 3,
      title: 'One bulb breaks. What goes dark?', hook: 'Series or parallel: which keeps the lights on?',
      ask: 'A Class 6 electricity activity: three bulbs wired in one loop or in branches, with a button that breaks one bulb.',
      steps: ['Showed the current moving along the wire, so a broken loop is visible.', 'Matched the symbols to the ones in the textbook.'],
      use: 'Before breaking a bulb, ask: how many will stay on? Hands up for 0, 1, 2 or 3.',
      init: () => ({ mode: 'series', broken: false }),
      controls: [
        { type: 'choice', key: 'mode', label: 'Wiring', options: [['series', 'One loop'], ['parallel', 'Branches']] },
        { type: 'buttons', items: [{ label: s => (s.broken ? 'Fix the bulb' : 'Break a bulb'), run: s => { s.broken = !s.broken; } }] },
      ],
      art: v => {
        const bat = `<path d="M44 96H76M52 104H68" stroke="#252b25" stroke-width="3"/>` + T(84, 94, '+', 'font-size="12"') + T(84, 114, '−', 'font-size="12"');
        let out;
        if (v.mode === 'series') {
          const path = 'M60 96V50H270V160H60V104';
          out = `<path d="${path}" fill="none" stroke="#6b705f" stroke-width="3"/>` + (!v.broken ? `<path class="ex-flow" d="${path}" fill="none" stroke="#f0a823" stroke-width="3"/>` : '') + bat + [120, 175, 230].map((x, i) => bulb(x, 50, !v.broken, v.broken && i === 0)).join('');
        } else {
          const rails = 'M60 96V40H270M60 104V165H270', br = [130, 200, 270];
          out = `<path d="${rails}" fill="none" stroke="#6b705f" stroke-width="3"/>` + br.map(x => `<path d="M${x} 40V165" stroke="#6b705f" stroke-width="3"/>`).join('') +
            `<path class="ex-flow" d="${rails}" fill="none" stroke="#f0a823" stroke-width="3"/>` + br.map((x, i) => (v.broken && i === 0 ? '' : `<path class="ex-flow" d="M${x} 40V165" stroke="#f0a823" stroke-width="3"/>`)).join('') +
            bat + br.map((x, i) => bulb(x, 102, !(v.broken && i === 0), v.broken && i === 0)).join('');
        }
        return svg('A battery and three bulbs', out);
      },
      read: s => ({ 'series,false': 'One loop: the current passes through every bulb.', 'series,true': '<b>All three go dark.</b> One break opens the only loop.', 'parallel,false': 'Each bulb has its own branch back to the battery.', 'parallel,true': '<b>Two stay lit.</b> The other branches still make a full loop. That is how the lights at home are wired.' })[`${s.mode},${s.broken}`],
    },
    {
      id: 'moon', subject: 'science', band: '6-8', cls: 'Class 8',
      title: 'Why does the Moon change shape?', hook: 'The Moon never changes. What changes?',
      ask: 'A Class 8 activity on the phases of the Moon: a top view of the Sun, Earth and Moon beside what we see from Earth, with a slider for the days.',
      steps: ['Put the view from above next to the view from Earth, because the link is the hard part.', 'Named each phase using the words in the textbook.'],
      use: 'Ask students to sketch tonight’s Moon for a week, then match their drawings to the slider.',
      init: () => ({ d: 4 }), smooth: ['d'],
      controls: [{ type: 'range', key: 'd', label: 'Days after new moon', min: 0, max: 28, step: 1 }],
      art: v => {
        const th = v.d / 29.53 * 2 * Math.PI, mx = 110 - 58 * Math.cos(th), my = 100 + 58 * Math.sin(th);
        let out = `<rect width="320" height="200" fill="#1d2233"/>` + [50, 100, 150].map(y => `<path d="M8 ${y}H34M28 ${y - 5}L34 ${y}L28 ${y + 5}" fill="none" stroke="#ffd34d" stroke-width="2"/>`).join('') + T(8, 190, 'Sunlight', 'font-size="11" fill="#ffd34d"');
        out += `<circle cx="110" cy="100" r="58" fill="none" stroke="#6a7190" stroke-dasharray="3 5"/><circle cx="110" cy="100" r="15" fill="#4f8fd1"/><path d="M103 94q6-6 11 1t-6 9" fill="#6fb36f"/>`;
        out += `<circle cx="${r1(mx)}" cy="${r1(my)}" r="9" fill="#3a4056"/><path d="M${r1(mx)} ${r1(my - 9)}A9 9 0 0 0 ${r1(mx)} ${r1(my + 9)}Z" fill="#f4efd8"/>`;
        out += `<rect x="196" y="24" width="116" height="152" rx="10" fill="#0f1320"/><circle cx="254" cy="96" r="42" fill="#343a50"/><path d="${phasePath(254, 96, 42, th % (2 * Math.PI))}" fill="#f4efd8"/>` + T(254, 164, 'From Earth', `${mid} font-size="11" fill="#c8cbe0"`);
        return svg('The Moon going round the Earth, and the phase we see', out);
      },
      read: s => { const d = Math.round(s.d), n = d <= 1 ? 'New moon' : d <= 6 ? 'Waxing crescent' : d <= 8 ? 'First quarter' : d <= 13 ? 'Waxing gibbous' : d <= 16 ? 'Full moon' : d <= 21 ? 'Waning gibbous' : d <= 23 ? 'Last quarter' : d <= 27 ? 'Waning crescent' : 'New moon'; return `Day ${d}: <b>${n}</b>. The Sun always lights half the Moon. As it goes round us, we see more or less of that lit half.`; },
    },
    {
      id: 'pitch', subject: 'science', band: '6-8', cls: 'Class 8',
      title: 'Shorter string, higher note', hook: 'Change the string. Hear the difference.',
      ask: 'A Class 8 sound activity: a string whose length students change, with a button that plays the note it makes.',
      steps: ['Checked the pitch doubles when the length halves.', 'Showed the frequency in hertz, the unit in the chapter.'],
      use: 'Bring a rubber band or a veena string. Press it at half its length and compare with the slider.',
      init: () => ({ len: 60, play: 0 }),
      controls: [
        { type: 'range', key: 'len', label: 'String length (cm)', min: 20, max: 100, step: 5 },
        { type: 'buttons', items: [{ label: 'Play the note', run: s => { tone(262 * 60 / s.len); s.play = 900; } }] },
      ],
      tick: (s, dt) => { if (s.play <= 0) return false; s.play = Math.max(0, s.play - dt); return true; },
      art: v => {
        const end = 40 + v.len * 2.6, midx = (40 + end) / 2, a = v.play > 0 ? 12 * v.play / 900 * Math.sin(performance.now() / (v.len * 0.35)) : 0, f = Math.round(262 * 60 / v.len);
        return svg('A vibrating string', `<rect x="20" y="70" width="290" height="60" rx="12" fill="#caa06a"/><path d="M36 86L44 100L36 114M${r1(end + 4)} 86L${r1(end - 4)} 100L${r1(end + 4)} 114" fill="none" stroke="#5a3a1a" stroke-width="3"/>` +
          `<path d="M40 100Q${r1(midx)} ${r1(100 + a * 2)} ${r1(end)} 100" fill="none" stroke="#3a3a3a" stroke-width="2.5"/>` + (a ? `<path d="M40 100Q${r1(midx)} ${r1(100 - a * 2)} ${r1(end)} 100" fill="none" stroke="#3a3a3a" stroke-width="1.2" opacity=".35"/>` : '') +
          T(160, 40, `${f} Hz`, `${mid} font-size="26" font-weight="700" fill="#1f7a4d"`) + T(160, 160, `${v.len} cm`, `${mid} font-size="13" fill="#62685f"`));
      },
      read: s => `<b>${Math.round(262 * 60 / s.len)} Hz</b>. A shorter string vibrates faster and sounds higher. Halve the length and the pitch doubles.`,
    },
    {
      id: 'foodchain', subject: 'science', band: '9-10', cls: 'Class 10',
      title: 'Take one animal away', hook: 'Remove the frogs. What happens to the grass?',
      ask: 'A Class 10 activity on food chains: grass, grasshoppers, frogs and snakes, where students remove one level and watch the others change.',
      steps: ['Kept the chain to four levels, like the one in the chapter.', 'Marked the numbers as illustrative, so no one quotes them as data.'],
      use: 'Groups predict each change on paper first, then check. Ask what happens after a few years.',
      init: () => ({ rm: 'none', g: 100, h: 60, f: 30, sn: 12 }), smooth: ['g', 'h', 'f', 'sn'],
      controls: [{ type: 'choice', key: 'rm', label: 'Remove', options: [['none', 'Nothing'], ['h', 'Grasshoppers'], ['f', 'Frogs'], ['sn', 'Snakes']] }],
      fix: s => { Object.assign(s, { none: { g: 100, h: 60, f: 30, sn: 12 }, h: { g: 130, h: 0, f: 6, sn: 4 }, f: { g: 35, h: 110, f: 0, sn: 3 }, sn: { g: 90, h: 40, f: 55, sn: 0 } }[s.rm]); },
      art: (v, s) => {
        let out = '';
        [['sn', 'Snakes', '#6b4f2f'], ['f', 'Frogs', '#3f8a4f'], ['h', 'Grasshoppers', '#9bbf3a'], ['g', 'Grass', '#5fb35f']].forEach(([k, n, c], i) => {
          const y = 24 + i * 44, gone = s.rm === k;
          out += T(16, y + 16, n, `font-size="13" font-weight="600" fill="${gone ? '#a3a79c' : '#252b25'}"`) + (gone ? `<path d="M16 ${y + 12}H${16 + n.length * 7}" stroke="#bd2934" stroke-width="2"/>` : '');
          out += `<rect x="112" y="${y + 2}" width="${r1(Math.max(0, v[k] * 1.3))}" height="20" rx="5" fill="${c}"/>` + T(118 + v[k] * 1.3, y + 17, gone ? 'removed' : Math.round(v[k]), 'font-size="12" font-weight="600"');
          if (i < 3) out += T(22, y + 37, '↑ eaten by', 'font-size="10" fill="#62685f"');
        });
        return svg('A food chain with population bars', out);
      },
      read: s => ({ none: 'A balanced chain. Each level is food for the one above.', h: '<b>The grass takes over, the frogs starve,</b> and the snakes go hungry too.', f: '<b>Grasshoppers multiply</b> and strip the grass. The snakes lose their food.', sn: '<b>Frogs multiply</b> and eat more grasshoppers, so the grass recovers a little.' })[s.rm],
    },

    /* ---------- Social Science ---------- */
    {
      id: 'monsoon', subject: 'social', band: '9-10', cls: 'Class 9', featured: 5,
      title: 'Why does Mangalore get so much rain?', hook: 'Follow the monsoon winds over the Western Ghats.',
      ask: 'A Class 9 geography activity: a side view of the coast, the Western Ghats and the plateau, with the summer and winter winds.',
      steps: ['Used our own coast, so students can place their town on it.', 'Labelled the rain shadow, the term in the chapter.'],
      use: 'Ask why Bengaluru gets less rain than Mangalore, then show the rain shadow.',
      init: () => ({ season: 'sw' }),
      controls: [{ type: 'choice', key: 'season', label: 'Season', options: [['sw', 'June to September'], ['ne', 'October to December']] }],
      art: v => {
        const sw = v.season === 'sw';
        let out = `<rect width="320" height="200" fill="${sw ? '#c9d6de' : '#dfe9f0'}"/><path d="M0 160H95V200H0Z" fill="#4d8fb8"/><path d="M92 160H122L176 66L232 132H320V200H92Z" fill="#6f9d5a"/><path d="M176 66L232 132H320V140H226Z" fill="#b99a64" opacity="${sw ? 1 : .6}"/>`;
        out += `<circle cx="106" cy="157" r="3.5" fill="#bd2934"/>` + T(106, 150, 'Mangalore', `${mid} font-size="10" font-weight="700" fill="#7a1c22"`) + T(40, 186, 'Arabian Sea', `${mid} font-size="10" fill="#e8f2f8"`) + T(176, 58, 'Western Ghats', `${mid} font-size="10" font-weight="600"`) + T(282, 124, sw ? 'rain shadow' : 'plateau', `${mid} font-size="10" fill="#5d4a2a"`);
        if (sw) {
          out += `<g class="ex-drift">${[[20, 70], [70, 55], [115, 72]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="26" ry="12" fill="#8f9aa6"/><ellipse cx="14" cy="-8" rx="16" ry="10" fill="#8f9aa6"/></g>`).join('')}</g>`;
          out += `<g class="ex-rain">${Array.from({ length: 16 }, (_, i) => `<path style="animation-delay:${(i % 5) * 0.14}s" d="M${96 + i * 5} ${86 + (i % 3) * 8}l-3 12" stroke="#4d7fa8" stroke-width="2" stroke-linecap="round"/>`).join('')}</g>`;
          out += `<path d="M10 118H60M52 112L60 118L52 124" fill="none" stroke="#252b25" stroke-width="2.5"/>` + T(10, 110, 'moist sea wind', 'font-size="10" font-weight="600"');
        } else {
          out += `<path d="M310 104H258M266 98L258 104L266 110" fill="none" stroke="#252b25" stroke-width="2.5"/>` + T(310, 96, 'dry land wind', 'text-anchor="end" font-size="10" font-weight="600"') + `<g class="ex-drift"><ellipse cx="250" cy="40" rx="22" ry="8" fill="#fff" opacity=".9"/></g>`;
        }
        return svg('Monsoon winds meeting the Western Ghats', out);
      },
      read: s => (s.season === 'sw' ? 'Moist winds from the sea rise over the Ghats, cool and drop their rain on the coast. <b>Mangalore gets heavy rain.</b> The far side stays dry: the <b>rain shadow</b>.' : 'In winter, dry winds blow from the land towards the sea. <b>The coast gets little rain.</b>'),
    },
    {
      id: 'election', subject: 'social', band: '9-10', cls: 'Class 9',
      title: 'Most votes, but not most voters', hook: 'Can a party win with less than half the votes?',
      ask: 'A Class 9 civics activity on first past the post: three parties, sliders for their votes, and the winner shown with a 50% line.',
      steps: ['Used made-up parties, so the lesson stays about the system.', 'Drew the majority line, so students see when a winner is below it.'],
      use: 'Ask whether the winner should rule if 60% voted against them. Then discuss other systems.',
      init: () => ({ a: 40, b: 35, c: 25 }), smooth: ['a', 'b', 'c'],
      controls: [{ type: 'range', key: 'a', label: 'Votes for Party A', min: 5, max: 80, step: 1 }, { type: 'range', key: 'b', label: 'Votes for Party B', min: 5, max: 80, step: 1 }, { type: 'range', key: 'c', label: 'Votes for Party C', min: 5, max: 80, step: 1 }],
      art: v => {
        const tot = v.a + v.b + v.c, sh = [v.a, v.b, v.c].map(x => x / tot * 100), win = sh.indexOf(Math.max(...sh)), Y = p => 176 - p * 1.6;
        let out = `<path d="M30 176H300" stroke="#252b25" stroke-width="1.5"/><path d="M30 ${Y(50)}H300" stroke="#bd2934" stroke-dasharray="6 4"/>` + T(300, Y(50) - 5, 'half the votes', 'text-anchor="end" font-size="10" fill="#bd2934"');
        ['#e0843a', '#3f8a4f', '#2f6db0'].forEach((c, i) => { const x = 60 + i * 80; out += `<rect x="${x}" y="${r1(Y(sh[i]))}" width="50" height="${r1(sh[i] * 1.6)}" rx="4" fill="${c}"/>` + T(x + 25, 192, `Party ${'ABC'[i]}`, `${mid} font-size="11" font-weight="600"`) + T(x + 25, Y(sh[i]) - 6, `${Math.round(sh[i])}%`, `${mid} font-size="12" font-weight="700"`) + (i === win ? T(x + 25, Y(sh[i]) - 22, 'WINS', `${mid} font-size="10" font-weight="800" fill="${c}"`) : ''); });
        return svg('Vote shares of three parties', out);
      },
      read: s => { const tot = s.a + s.b + s.c, sh = [s.a, s.b, s.c].map(x => Math.round(x / tot * 100)), w = sh.indexOf(Math.max(...sh)); return `<b>Party ${'ABC'[w]} wins</b> with ${sh[w]}% of the votes.` + (sh[w] < 50 ? ` Yet ${100 - sh[w]}% voted for someone else. Most votes wins, not most voters.` : ' That is a clear majority.'); },
    },
    {
      id: 'budget', subject: 'social', band: '6-8', cls: 'Class 7',
      title: 'Run a family budget', hook: '₹30,000 a month. Can the family save?',
      ask: 'A Class 7 economics activity: a family’s monthly income of ₹30,000, with sliders for rent, food, school and travel, and the savings shown live.',
      steps: ['Kept the amounts close to a real family budget in our town.', 'Turned the savings red when spending goes over income.'],
      use: 'Groups plan the month, then an emergency costs ₹5,000. Which slider do they move?',
      init: () => ({ rent: 9000, food: 9000, school: 5000, travel: 3000 }), smooth: ['rent', 'food', 'school', 'travel'],
      controls: [
        { type: 'range', key: 'rent', label: 'Rent (₹)', min: 4000, max: 15000, step: 500 },
        { type: 'range', key: 'food', label: 'Food (₹)', min: 4000, max: 15000, step: 500 },
        { type: 'range', key: 'school', label: 'School (₹)', min: 0, max: 10000, step: 500 },
        { type: 'range', key: 'travel', label: 'Travel (₹)', min: 0, max: 8000, step: 500 },
      ],
      art: v => {
        const parts = [['Rent', v.rent, '#b0561f'], ['Food', v.food, '#e0a13a'], ['School', v.school, '#2f6db0'], ['Travel', v.travel, '#7a6aa8']], spent = v.rent + v.food + v.school + v.travel, save = 30000 - spent;
        let x = 20, out = T(20, 30, 'Income ₹30,000', 'font-size="14" font-weight="700"') + `<rect x="20" y="46" width="280" height="40" rx="6" fill="#e6e2d6"/>`;
        parts.forEach(([n, a, c]) => { const w = Math.min(a / 30000 * 280, Math.max(0, 300 - x)); out += `<rect x="${r1(x)}" y="46" width="${r1(w)}" height="40" fill="${c}"/>`; x += a / 30000 * 280; });
        if (save > 0) out += `<rect x="${r1(x)}" y="46" width="${r1(save / 30000 * 280)}" height="40" fill="#3f8a4f"/>`;
        parts.forEach(([n, a, c], i) => { const lx = 20 + (i % 2) * 140, ly = 112 + Math.floor(i / 2) * 24; out += `<rect x="${lx}" y="${ly - 10}" width="12" height="12" rx="2" fill="${c}"/>` + T(lx + 18, ly, `${n} ${rs(a)}`, 'font-size="12"'); });
        out += T(20, 180, save >= 0 ? `Savings ${rs(save)}` : `Short by ${rs(-save)}`, `font-size="16" font-weight="700" fill="${save >= 0 ? '#1f6b35' : '#bd2934'}"`);
        return svg('A family budget bar', out);
      },
      read: s => { const save = 30000 - s.rent - s.food - s.school - s.travel; return save >= 0 ? `The family saves <b>${rs(save)}</b> a month, ${Math.round(save / 300)}% of its income.` : `They spend <b>${rs(-save)}</b> more than they earn. Something has to change.`; },
    },
    {
      id: 'scale', subject: 'social', band: '6-8', cls: 'Class 6',
      title: 'How far is it really?', hook: '6 cm on the map. How many km on the road?',
      ask: 'A Class 6 map skills activity: two towns on a map with a ruler, where students change the map distance and the scale.',
      steps: ['Added a real ruler under the map, so students practise measuring.', 'Used scales that appear in the atlas.'],
      use: 'Hand out a district map. Students measure two towns and use the same working.',
      init: () => ({ cm: 6, k: 5 }), smooth: ['cm'],
      controls: [{ type: 'range', key: 'cm', label: 'Distance on the map (cm)', min: 1, max: 12, step: 0.5 }, { type: 'choice', key: 'k', label: 'Map scale', options: [[1, '1 cm = 1 km'], [5, '1 cm = 5 km'], [25, '1 cm = 25 km']] }],
      art: (v, s) => {
        const bx = 30 + v.cm * 21;
        let out = `<rect width="320" height="120" fill="#eef0e2"/><path d="M0 30Q80 60 150 40T320 70" fill="none" stroke="#8cc4de" stroke-width="7"/><path d="M40 100q30-20 60 0t60-4" fill="none" stroke="#c9d6b6" stroke-width="10"/>`;
        out += `<path d="M30 80L${r1(bx)} 80" stroke="#bd2934" stroke-width="3" stroke-dasharray="7 5"/><circle cx="30" cy="80" r="7" fill="#252b25"/><circle cx="${r1(bx)}" cy="80" r="7" fill="#252b25"/>` + T(30, 66, 'Town A', `${mid} font-size="11" font-weight="600"`) + T(bx, 66, 'Town B', `${mid} font-size="11" font-weight="600"`);
        out += `<rect x="24" y="138" width="266" height="30" rx="3" fill="#f7e7a6" stroke="#b39a45"/>`;
        for (let c = 0; c <= 12; c++) out += `<path d="M${30 + c * 21} 138V${c % 2 ? 146 : 152}" stroke="#6b5a1f"/>` + (c % 2 ? '' : T(30 + c * 21, 164, c, `${mid} font-size="10"`));
        out += `<path d="M30 132H${r1(bx)}" stroke="#bd2934" stroke-width="3"/>` + T(160, 192, `${r1(v.cm)} cm × ${s.k} km = ${r1(v.cm * s.k)} km`, `${mid} font-size="14" font-weight="700" fill="#b0561f"`);
        return svg('Two towns on a map with a ruler', out);
      },
      read: s => `${s.cm} cm on the map × ${s.k} km = <b>${r1(s.cm * s.k)} km</b> on the ground.`,
    },

    {
      id: 'dandi', subject: 'social', band: '6-8', cls: 'Class 8', featured: 1,
      title: 'Walk the Dandi March', hook: '24 days, 385 km, one fistful of salt. Where were they on day 10?',
      ask: 'A Class 8 history activity: the Dandi March on a map, with a slider for the day that moves the marchers and tells what happened, like a diary.',
      steps: ['Checked every date and distance against the textbook chapter.', 'Wrote each stage as a short diary entry, so it reads like a story.', 'Made the crowd grow along the road, because that is the point of the march.'],
      use: 'Skip a stage and ask students to write that day’s diary entry. Then show the real one.',
      init: () => ({ day: 1 }), smooth: ['day'],
      controls: [{ type: 'range', key: 'day', label: 'Day of the march', min: 1, max: 26, step: 1, fmt: v => dandiDate(v) }],
      art: v => {
        const P = [[262, 30], [248, 60], [224, 86], [198, 106], [162, 126], [126, 146], [96, 164], [80, 178]], n = P.length - 1;
        const at = t => { const x = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f]; };
        const t = clamp((v.day - 1) / 24, 0, 1), [gx, gy] = at(t), people = Math.min(46, 4 + Math.round(v.day * 1.7));
        let walked = `M${P[0][0]} ${P[0][1]}`;
        for (let k = 1; k <= 40; k++) { const [x, y] = at(t * k / 40); walked += `L${r1(x)} ${r1(y)}`; }
        let crowd = '';
        for (let k = 1; k < people; k++) { const [x, y] = at(t - k * 0.009); crowd += `<circle cx="${r1(x + ((k * 7) % 9) - 4)}" cy="${r1(y + ((k * 5) % 9) - 4)}" r="2.6" fill="${['#7a5230', '#b0561f', '#5d4a3a', '#8b6a4a'][k % 4]}"/>`; }
        return svg('The route of the Dandi March from Sabarmati to Dandi', `<rect width="320" height="200" fill="#f1e4c6"/><path d="M0 0H64Q52 60 84 118Q58 150 70 200H0Z" fill="#9cc7d6"/>` + T(10, 150, 'Arabian', 'font-size="10" fill="#3f6f86"') + T(10, 162, 'Sea', 'font-size="10" fill="#3f6f86"') +
          `<path d="M${P.map(p => p.join(' ')).join('L')}" fill="none" stroke="#b9a78a" stroke-width="3" stroke-dasharray="3 5"/><path d="${walked}" fill="none" stroke="#bd2934" stroke-width="3.5" stroke-linecap="round"/>` +
          `<circle cx="262" cy="30" r="5" fill="#252b25"/>` + T(254, 22, 'Sabarmati Ashram', 'text-anchor="end" font-size="11" font-weight="600"') + `<circle cx="80" cy="178" r="5" fill="#252b25"/>` + T(90, 192, 'Dandi', 'font-size="11" font-weight="700"') +
          crowd + `<circle cx="${r1(gx)}" cy="${r1(gy)}" r="5" fill="#fff" stroke="#252b25" stroke-width="2"/>` +
          (v.day >= 25.5 ? `<g class="ex-pop"><path d="M72 172l4-6 4 6 4-6 4 6" fill="#fff" stroke="#9aa" /></g>` + T(96, 172, 'SALT', 'font-size="12" font-weight="800" fill="#bd2934"') : '') +
          T(300, 150, dandiDate(Math.round(v.day)), 'text-anchor="end" font-size="16" font-weight="700"') + T(300, 168, `${Math.round(385 * t)} km walked`, 'text-anchor="end" font-size="12" fill="#62685f"') + T(300, 184, `${people > 45 ? 'Thousands' : people * 2 + ' and growing'}`, 'text-anchor="end" font-size="11" fill="#b0561f"'));
      },
      read: s => {
        const d = s.day, e = d <= 3 ? 'Gandhi and 78 followers leave Sabarmati Ashram at dawn. They will walk about 16 km a day.' : d <= 9 ? 'Villages along the road welcome the marchers. At every stop, Gandhi speaks about the unfair tax on salt.' : d <= 17 ? 'Newspapers across India and abroad report the march. More people join every day.' : d <= 24 ? 'The crowd has grown into thousands. The police watch, but do not stop the march.' : d === 25 ? 'They reach Dandi on the coast, after 24 days and about 385 km.' : 'Gandhi picks up a lump of salt from the shore. The salt law is broken, and people across India follow.';
        return `<b>${dandiDate(d)}.</b> ${e}`;
      },
    },
    {
      id: 'estates', subject: 'social', band: '9-10', cls: 'Class 9',
      title: 'Who paid the taxes in 1789?', hook: '98% of France had one vote out of three. Would you have waited?',
      ask: 'A Class 9 history activity on the French Revolution: the three estates, shown as shares of the people, the taxes paid and the votes in the Estates General.',
      steps: ['Used the figures from the chapter and dropped the ones historians argue about.', 'Kept the vote view for last, because that is where the anger comes from.'],
      use: 'Show the people view, then taxes, then votes. Ask the Third Estate half of the class what they would do.',
      init: () => ({ view: 'people', p1: 0.5, p2: 1.5, p3: 98 }), smooth: ['p1', 'p2', 'p3'],
      controls: [{ type: 'choice', key: 'view', label: 'Show', options: [['people', 'Share of people'], ['tax', 'Who paid taxes'], ['vote', 'Votes in 1789']] }],
      fix: s => { Object.assign(s, { people: { p1: 0.5, p2: 1.5, p3: 98 }, tax: { p1: 0, p2: 0, p3: 100 }, vote: { p1: 33.3, p2: 33.3, p3: 33.3 } }[s.view]); },
      art: v => {
        const cols = [['Clergy', 'p1', '#7a6aa8', `<path d="M-9-14L0-30L9-14Z" fill="#f3e6a8" stroke="#b39a45"/>`], ['Nobles', 'p2', '#2f6db0', `<path d="M-16-12Q0-24 16-12Z" fill="#252b25"/><path d="M8-22l8-10" stroke="#e0843a" stroke-width="3"/>`], ['Everyone else', 'p3', '#bd2934', `<path d="M-11-12Q-8-30 10-22L11-12Z" fill="#bd2934"/>`]];
        let out = '';
        cols.forEach(([n, k, c, hat], i) => {
          const x = 60 + i * 100, h = v[k] * 1.05;
          out += `<g transform="translate(${x} 44)"><circle r="11" fill="#f1c9a5"/>${hat}<path d="M-14 12H14L18 34H-18Z" fill="${c}"/></g>` + T(x, 96, n, `${mid} font-size="11" font-weight="700"`);
          out += `<rect x="${x - 26}" y="${r1(186 - h)}" width="52" height="${r1(Math.max(h, 1.5))}" rx="4" fill="${c}" opacity=".85"/>` + T(x, 180 - Math.min(h, 70), `${r1(v[k])}%`, `${mid} font-size="14" font-weight="700" fill="${h > 70 ? '#fff' : c}"`);
        });
        return svg('The three estates of France compared', out);
      },
      read: s => ({ people: 'The Third Estate was about <b>98% of France</b>: peasants, workers, merchants and lawyers.', tax: 'Only the Third Estate paid taxes to the state. <b>Clergy and nobles paid none.</b>', vote: 'Yet each estate had <b>one vote</b> in the Estates General. 98% of the people could be outvoted two to one. In June 1789, the Third Estate walked out.' })[s.view],
    },
    {
      id: 'harappa', subject: 'social', band: '6-8', cls: 'Class 6',
      title: 'Plan a Harappan city', hook: 'What did they build 4,500 years ago that many towns still lack?',
      ask: 'A Class 6 history activity: build a Harappan city piece by piece (streets, drains, citadel, the Great Bath, storehouses) and learn why each one matters.',
      steps: ['Checked each feature against the chapter on the earliest cities.', 'Wrote "perhaps granaries", because historians still debate it.'],
      use: 'Before adding the drains, ask how our town handles rainwater. Then add them.',
      init: () => ({ grid: false, drains: false, citadel: false, bath: false, store: false, last: '' }),
      controls: [{ type: 'buttons', items: [['grid', 'Streets in a grid'], ['drains', 'Covered drains'], ['citadel', 'A citadel'], ['bath', 'The Great Bath'], ['store', 'Storehouses']].map(([k, n]) => ({ label: n, pressed: s => s[k], run: s => { s[k] = !s[k]; s.last = s[k] ? k : ''; } })) }],
      art: (v, s) => {
        let out = `<rect width="320" height="200" fill="#ead6ad"/>`;
        if (s.citadel) out += `<path d="M8 40L112 30V178L8 186Z" fill="#cfa86e" stroke="#a9834b" stroke-width="2" class="ex-pop"/>` + T(60, 24, 'Citadel', `${mid} font-size="11" font-weight="700"`);
        if (s.bath) out += `<g class="ex-pop"><rect x="28" y="56" width="62" height="40" rx="2" fill="#b07a4a"/><rect x="36" y="63" width="46" height="26" fill="#5fa3c7"/><path d="M36 66h46M36 72h46" stroke="#8cc4de"/></g>` + T(59, 110, 'Great Bath', `${mid} font-size="10" font-weight="600"`);
        if (s.store) out += `<g class="ex-pop">${[0, 1, 2].map(i => `<rect x="${24 + i * 24}" y="126" width="20" height="36" fill="#a8743f"/><path d="M${27 + i * 24} 132v24M${34 + i * 24} 132v24M${41 + i * 24} 132v24" stroke="#7a5230"/>`).join('')}</g>` + T(59, 176, 'Storehouses', `${mid} font-size="10" font-weight="600"`);
        const houses = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) houses.push(s.grid ? [128 + c * 46, 22 + r * 56, 0] : [128 + c * 46 + ((r * 3 + c) % 3) * 9 - 9, 22 + r * 56 + ((c * 5 + r) % 4) * 7 - 8, ((r + c) % 3 - 1) * 12]);
        if (s.grid) out += `<path d="M120 76H312M120 132H312M166 12V190M212 12V190M258 12V190" stroke="#f3e6c9" stroke-width="10"/>`;
        if (s.drains) out += `<path class="ex-pop" d="${s.grid ? 'M120 80H312M120 136H312M170 12V190M216 12V190M262 12V190' : 'M120 82Q200 70 312 90M120 140Q210 126 312 146'}" stroke="#4d8fb8" stroke-width="3" stroke-dasharray="${s.grid ? '10 3' : '0'}"/>`;
        houses.forEach(([x, y, a]) => { out += `<g transform="translate(${x + 18} ${y + 22}) rotate(${a})"><rect x="-18" y="-20" width="36" height="40" fill="#b8653f" stroke="#8b4c2a"/><rect x="-8" y="-8" width="16" height="14" fill="#e3c08f"/></g>`; });
        return svg('A Harappan city being planned', out + T(216, 196, 'Lower town', `${mid} font-size="10" font-weight="600" fill="#5d4a2a"`));
      },
      read: s => {
        const n = ['grid', 'drains', 'citadel', 'bath', 'store'].filter(k => s[k]).length;
        const why = { grid: 'Streets met at right angles. Someone planned this city before it was built.', drains: 'Drains ran along the streets, covered with bricks, and houses connected to them.', citadel: 'The western part was built higher, on a raised platform.', bath: 'A large brick tank, made watertight with a layer of natural tar.', store: 'Big storehouses, perhaps for grain. Historians still debate what they held.' }[s.last];
        return `<b>${n} of 5</b> features found at Mohenjodaro. ${why || 'Add a feature to see why it mattered.'}`;
      },
    },
    {
      id: 'street', subject: 'social', band: '3-5', cls: 'Class 4',
      title: 'One street, 100 years', hook: 'What did your street look like when your great-grandparents were young?',
      ask: 'A Class 4 then-and-now activity: one town street from 1925 to 2025, with a slider for the year.',
      steps: ['Picked things students can spot on their own street today.', 'Kept the houses in the same place, so only time changes.'],
      use: 'Students ask grandparents what their street had in 1975, then check the picture.',
      init: () => ({ y: 1925 }),
      controls: [{ type: 'range', key: 'y', label: 'Year', min: 1925, max: 2025, step: 25 }],
      art: v => {
        const e = (v.y - 1925) / 25, sky = ['#f3e2c0', '#e6e9d8', '#d7e6ee', '#cfe3f2', '#c6e2f6'][e];
        let out = `<rect width="320" height="200" fill="${sky}"/><rect y="150" width="320" height="50" fill="${e ? '#8c8c8c' : '#c9ad7a'}"/>` + (e ? `<path d="M0 175H320" stroke="#f1f1f1" stroke-width="3" stroke-dasharray="16 12"/>` : '');
        const tall = [0, 0, 18, 40, 60][e];
        out += `<rect x="20" y="${100 - tall}" width="80" height="${50 + tall}" fill="${e > 2 ? '#e6d3b3' : '#e9c48f'}"/><path d="M14 ${100 - tall}L60 ${72 - tall}L106 ${100 - tall}Z" fill="${e > 1 ? '#9aa295' : '#b5532f'}"/><rect x="50" y="122" width="18" height="28" fill="#6b4a2f"/>`;
        out += `<rect x="200" y="${96 - tall}" width="96" height="${54 + tall}" fill="${e > 2 ? '#d9d4ea' : '#f0d9a8'}"/>` + (e < 2 ? `<path d="M194 96L248 70L302 96Z" fill="#b5532f"/>` : '') + `<rect x="236" y="120" width="22" height="30" fill="#6b4a2f"/>`;
        if (e >= 2) out += `<rect x="212" y="${104 - tall}" width="14" height="12" fill="#fff"/><rect x="270" y="${104 - tall}" width="14" height="12" fill="#fff"/>`;
        if (e === 3) out += `<ellipse cx="282" cy="${88 - tall}" rx="10" ry="6" fill="#ddd" stroke="#999"/>`;
        if (e === 4) out += `<path d="M204 ${92 - tall}l18-10h26l-18 10z" fill="#2f6db0"/><path d="M160 26V150M150 36h20M152 50h16" stroke="#6b705f" stroke-width="3"/>`;
        out += e === 0 ? `<path d="M140 150V104" stroke="#5a3a1a" stroke-width="3"/><rect x="134" y="96" width="12" height="10" fill="#ffd34d" opacity=".8"/>` : `<path d="M140 150V70H156" stroke="#555" stroke-width="3" fill="none"/><path d="M0 64Q70 74 140 70T320 66" stroke="#444" fill="none"/><circle cx="156" cy="74" r="4" fill="${e === 4 ? '#e8f7ff' : '#ffd34d'}"/>`;
        const V = [
          `<g class="ex-drive-slow"><rect x="-44" y="146" width="36" height="16" rx="2" fill="#a0703f"/><circle cx="-36" cy="166" r="8" fill="none" stroke="#5a3a1a" stroke-width="3"/><ellipse cx="0" cy="150" rx="16" ry="9" fill="#e8e2d6"/><path d="M8 140l6-6" stroke="#bbb" stroke-width="3"/></g>`,
          `<g class="ex-drive"><circle cx="-20" cy="168" r="8" fill="none" stroke="#252b25" stroke-width="2.5"/><circle cx="4" cy="168" r="8" fill="none" stroke="#252b25" stroke-width="2.5"/><path d="M-20 168L-8 156L4 168M-8 156L-2 150" stroke="#2f6db0" stroke-width="3" fill="none"/></g>`,
          `<g class="ex-drive"><rect x="-24" y="154" width="30" height="12" rx="6" fill="#3f8a4f"/><circle cx="-18" cy="168" r="6" fill="#252b25"/><circle cx="2" cy="168" r="6" fill="#252b25"/><circle cx="-4" cy="142" r="6" fill="#f1c9a5"/></g>`,
          `<g class="ex-drive"><path d="M-30 168V148Q-30 138 -16 138H6L14 168Z" fill="#ffd34d" stroke="#252b25"/><rect x="-26" y="144" width="18" height="12" fill="#1f2622"/><circle cx="-22" cy="170" r="6" fill="#252b25"/><circle cx="8" cy="170" r="6" fill="#252b25"/></g>`,
          `<g class="ex-drive"><rect x="-24" y="154" width="30" height="12" rx="6" fill="#0f6f73"/><circle cx="-18" cy="168" r="6" fill="#252b25"/><circle cx="2" cy="168" r="6" fill="#252b25"/><path d="M-12 150l4-6h4l-4 6h4l-8 10 2-7z" fill="#ffd34d"/></g>`,
        ][e];
        return svg(`A town street in ${v.y}`, out + V + T(160, 22, v.y, `${mid} font-size="20" font-weight="800" fill="#252b25"`));
      },
      read: s => ({ 1925: '<b>1925:</b> bullock carts, tiled roofs and oil lamps. Most people walked.', 1950: '<b>1950:</b> bicycles, and electric poles reach the street.', 1975: '<b>1975:</b> scooters, taller buildings and a radio in most homes.', 2000: '<b>2000:</b> auto-rickshaws, cable TV dishes and more floors.', 2025: '<b>2025:</b> electric scooters, solar panels, a mobile tower and a phone in every pocket.' })[s.y],
    },
    {
      id: 'onion', subject: 'social', band: '11-12', cls: 'Class 12',
      title: 'Why do onion prices jump?', hook: 'The harvest falls a little. Why does the price shoot up?',
      ask: 'A Class 12 economics activity: supply and demand for onions, with sliders for the size of the harvest and for demand, and the market price shown where the lines cross.',
      steps: ['Made demand steep, because people buy onions whatever the price.', 'Kept the numbers illustrative and said so.'],
      use: 'Show a normal year. Then halve the harvest and ask the class to guess the new price before moving the slider.',
      init: () => ({ h: 100, d: 100 }), smooth: ['h', 'd'],
      controls: [{ type: 'range', key: 'h', label: 'Harvest (% of a normal year)', min: 40, max: 140, step: 10 }, { type: 'range', key: 'd', label: 'Demand (% of normal)', min: 70, max: 140, step: 10 }],
      art: v => {
        const A = 110 * v.d / 100, k = 0.4 * 100 / v.h, Q = (A - 5) / (1.4 + k), P = A - 1.4 * Q, X = q => 46 + q * 2.5, Y = p => 176 - p * 1.4;
        const qd = Math.min(100, A / 1.4), qs = Math.min(100, (110 - 5) / k);
        return svg('Supply and demand for onions', `<path d="M46 16V176H300" fill="none" stroke="#252b25" stroke-width="1.5"/>` + T(40, 16, '₹/kg', 'text-anchor="end" font-size="10" fill="#62685f"') + T(300, 192, 'Onions sold', 'text-anchor="end" font-size="10" fill="#62685f"') +
          `<path d="M${X(0)} ${r1(Y(A))}L${r1(X(qd))} ${r1(Y(A - 1.4 * qd))}" stroke="#2f6db0" stroke-width="3.5"/><path d="M${X(0)} ${r1(Y(5))}L${r1(X(qs))} ${r1(Y(5 + k * qs))}" stroke="#3f8a4f" stroke-width="3.5"/>` +
          T(X(qd) - 4, Y(A - 1.4 * qd) - 8, 'Demand', 'text-anchor="end" font-size="11" font-weight="700" fill="#2f6db0"') + T(X(qs) - 4, Y(5 + k * qs) + 16, 'Supply', 'text-anchor="end" font-size="11" font-weight="700" fill="#3f8a4f"') +
          `<path d="M${r1(X(Q))} 176V${r1(Y(P))}H46" fill="none" stroke="#bd2934" stroke-dasharray="4 4"/><circle cx="${r1(X(Q))}" cy="${r1(Y(P))}" r="6" fill="#bd2934"/>` + T(X(Q) + 10, Y(P) - 8, `₹${Math.round(P)}`, 'font-size="15" font-weight="800" fill="#bd2934"'));
      },
      read: s => { const A = 110 * s.d / 100, k = 40 / s.h, Q = (A - 5) / (1.4 + k), P = Math.round(A - 1.4 * Q); return `Price about <b>₹${P} a kg</b> (illustrative).` + (s.h < 100 ? ' A smaller harvest, and people still need onions, so the price jumps.' : s.h > 100 ? ' A big harvest brings the price down: good for buyers, hard on farmers.' : '') + (s.d > 100 ? ' Festival demand pushes it higher still.' : ''); },
    },
    /* ---------- English ---------- */
    {
      id: 'sentence', subject: 'english', band: '3-5', cls: 'Class 3',
      title: 'Build a sentence', hook: 'Who did what, where and when?',
      ask: 'A Class 3 grammar activity: students pick who, what they did, where and when, and the sentence builds itself with the verb in the right tense.',
      steps: ['Coloured each part of the sentence, so students see its job.', 'Made the verb change with the time word, the point of the lesson.'],
      use: 'Students make the silliest correct sentence they can, then read it aloud.',
      init: () => ({ who: 0, did: 0, where: 0, when: 0 }),
      controls: [
        { type: 'choice', key: 'when', label: 'When', options: [[0, 'Yesterday'], [1, 'Every day'], [2, 'Tomorrow']] },
        { type: 'choice', key: 'who', label: 'Who', options: [[0, 'The farmer'], [1, 'My sister'], [2, 'A tiger']] },
        { type: 'choice', key: 'did', label: 'Doing word', options: [[0, 'walk'], [1, 'sing'], [2, 'sleep']] },
        { type: 'choice', key: 'where', label: 'Where', options: [[0, 'in the garden'], [1, 'near the river'], [2, 'at school']] },
      ],
      thumb: () => svg('Sentence blocks', `<rect x="20" y="70" width="80" height="44" rx="10" fill="#e6dcf6"/><rect x="108" y="70" width="84" height="44" rx="10" fill="#6a3fb0"/><rect x="200" y="70" width="100" height="44" rx="10" fill="#d8ecd9"/>` + T(60, 98, 'Who', `${mid} font-size="14" font-weight="700" fill="#4b2a85"`) + T(150, 98, 'Did', `${mid} font-size="14" font-weight="700" fill="#fff"`) + T(250, 98, 'Where', `${mid} font-size="14" font-weight="700" fill="#1f5a33"`)),
      art: v => {
        const when = ['Yesterday', 'Every day', 'Tomorrow'][v.when], who = ['the farmer', 'my sister', 'a tiger'][v.who], verb = [['walked', 'walks', 'will walk'], ['sang', 'sings', 'will sing'], ['slept', 'sleeps', 'will sleep']][v.did][v.when], where = ['in the garden', 'near the river', 'at school'][v.where];
        return `<div class="ex-sentence"><span class="ex-w ex-w0"><small>When</small>${when},</span> <span class="ex-w ex-w1"><small>Who</small>${who}</span> <span class="ex-w ex-w2"><small>Doing word</small>${verb}</span> <span class="ex-w ex-w3"><small>Where</small>${where}.</span></div>`;
      },
      read: s => { const f = [['walked', 'walks', 'will walk'], ['sang', 'sings', 'will sing'], ['slept', 'sleeps', 'will sleep']][s.did]; return `The <b>doing word</b> changes with time: ${f[0]}, ${f[1]}, ${f[2]}.`; },
    },
    {
      id: 'comma', subject: 'english', band: '6-8', cls: 'Class 6',
      title: 'One comma, a different meaning', hook: '“Let’s eat Grandma!” Who is dinner?',
      ask: 'A Class 6 punctuation activity: sentences that change meaning when a comma is added, with a picture of each meaning.',
      steps: ['Chose examples that make the class laugh, so the rule sticks.', 'Put the comma in red, so it is the first thing students see.'],
      use: 'Write the sentence on the board without the comma. Ask what it means. Then add the comma.',
      init: () => ({ pair: 'grandma', comma: false }),
      controls: [
        { type: 'choice', key: 'pair', label: 'Sentence', options: [['grandma', 'Dinner time'], ['slow', 'Road sign']], then: s => { s.comma = false; } },
        { type: 'buttons', items: [{ label: s => (s.comma ? 'Remove the comma' : 'Add a comma'), run: s => { s.comma = !s.comma; } }] },
      ],
      thumb: () => svg('A big red comma', `<text x="160" y="118" text-anchor="middle" font-size="30" font-weight="700">Let’s eat<tspan fill="#bd2934" font-size="44">,</tspan> Grandma!</text>`),
      art: v => {
        const s = v.pair === 'grandma'
          ? [`Let’s eat${v.comma ? '<span class="ex-mark">,</span>' : ''} Grandma!`, v.comma
            ? `<circle cx="160" cy="62" r="22" fill="#f1c9a5"/><path d="M138 52q22-26 44 0" fill="#e8e6e0"/><path d="M151 70q9 7 18 0" fill="none" stroke="#5a3a1a" stroke-width="2.5"/><circle cx="152" cy="60" r="2.5"/><circle cx="168" cy="60" r="2.5"/><rect x="118" y="100" width="84" height="8" rx="4" fill="#8b5a2b"/><ellipse cx="160" cy="98" rx="30" ry="7" fill="#fff" stroke="#c9c3b3"/><path d="M146 94q14-12 28 0" fill="#e0a13a"/>`
            : `<path d="M112 84H208L198 128H122Z" fill="#6b705f"/><path d="M104 84H216" stroke="#3a3d33" stroke-width="6" stroke-linecap="round"/><circle cx="160" cy="68" r="20" fill="#f1c9a5"/><path d="M140 60q20-24 40 0" fill="#e8e6e0"/><circle cx="153" cy="66" r="3"/><circle cx="167" cy="66" r="3"/><ellipse cx="160" cy="77" rx="4" ry="5" fill="#5a3a1a"/><path d="M130 40q4-12 0-20M190 40q-4-12 0-20" fill="none" stroke="#a3a79c" stroke-width="2.5"/>`]
          : [`Slow${v.comma ? '<span class="ex-mark">,</span>' : ''} children crossing`, v.comma
            ? `<path d="M160 22L214 110H106Z" fill="#ffd34d" stroke="#bd2934" stroke-width="6" stroke-linejoin="round"/><circle cx="150" cy="70" r="6"/><path d="M150 76v16l-6 10M150 92l6 10M150 82l-8 6" stroke="#252b25" stroke-width="3" fill="none"/><circle cx="170" cy="74" r="5"/><path d="M170 80v12l-5 8M170 92l5 8" stroke="#252b25" stroke-width="3" fill="none"/>`
            : `<circle cx="160" cy="58" r="14" fill="#f1c9a5"/><path d="M160 72v28l-10 18M160 100l10 18M160 80l-14 10M160 80l14 6" stroke="#2f6db0" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M196 50q12 0 12 12" fill="none" stroke="#a3a79c" stroke-width="3"/>` + T(214, 48, 'z z z', 'font-size="13" fill="#62685f"')];
        return `<div class="ex-comma"><p>${s[0]}</p>${svg('A picture of what the sentence means', s[1]).replace('viewBox="0 0 320 200"', 'viewBox="0 0 320 140"')}</div>`;
      },
      read: s => ({ 'grandma,true': 'With the comma, you are talking <b>to</b> Grandma. Dinner is ready.', 'grandma,false': 'Without it, Grandma <b>is</b> dinner. One comma changes the meaning.', 'slow,true': 'With the comma, the sign tells drivers to <b>slow down</b>: children are crossing.', 'slow,false': 'Without it, the sign talks about <b>slow children</b>. Same words, different meaning.' })[`${s.pair},${s.comma}`],
    },
    {
      id: 'letter', subject: 'english', band: '9-10', cls: 'Class 9',
      title: 'Same request, three tones', hook: 'Rude, plain or formal: which one gets the leave?',
      ask: 'A Class 9 writing activity: one leave letter to the Principal, written in a rude, a plain and a formal tone.',
      steps: ['Checked the formal version follows the letter format in the syllabus.', 'Kept the reason the same, so only the tone changes.'],
      use: 'Show the rude one first. Students list what is missing, then compare with the formal one.',
      init: () => ({ tone: 'rude' }),
      controls: [{ type: 'choice', key: 'tone', label: 'Tone', options: [['rude', 'Rude'], ['plain', 'Plain'], ['formal', 'Formal']] }],
      thumb: () => svg('A letter', `<rect x="96" y="22" width="128" height="160" rx="6" fill="#fff" stroke="#c9c3b3" stroke-width="2"/>` + [44, 60, 84, 98, 112, 126, 150].map((y, i) => `<path d="M112 ${y}H${i % 3 === 2 ? 170 : 206}" stroke="${i === 2 ? '#6a3fb0' : '#d6d0c2'}" stroke-width="5" stroke-linecap="round"/>`).join('')),
      art: v => ({
        rude: '<div class="ex-letter"><p>I want leave on Friday. There is a wedding. I am not coming.</p></div>',
        plain: '<div class="ex-letter"><p>I need leave on Friday for my cousin’s wedding. Please allow it.</p><p>Riya</p></div>',
        formal: '<div class="ex-letter"><p class="ex-small">The Principal<br>Our School, Mangalore</p><p><b>Subject: Leave on Friday, 14 November</b></p><p>Respected Madam,</p><p>I request leave on Friday, 14 November, as I have to attend my cousin’s wedding. I will collect the notes and complete the work I miss.</p><p>Yours obediently,<br>Riya Shetty, Class 9B</p></div>',
      })[v.tone],
      read: s => ({ rude: 'A demand, with no greeting and nothing for the reader. <b>How would the Principal feel?</b>', plain: 'Clear and polite, but no subject line, no greeting and no proper close.', formal: '<b>Formal letter:</b> address, subject, greeting, the reason, a promise and a proper close.' })[s.tone],
    },

    {
      id: 'tenses', subject: 'english', band: '6-8', cls: 'Class 7', featured: 4,
      title: 'Tell the story in another time', hook: 'Same story, three times. What changes?',
      ask: 'A Class 7 grammar activity: a short story about a kite, retold in the past, present and future, with every verb that changes highlighted.',
      steps: ['Wrote a story with a small moment of danger, so students want to read it.', 'Highlighted only the verbs, so the pattern jumps out.'],
      use: 'Read the past version aloud. Ask students to retell it as if it is happening now, then check.',
      init: () => ({ t: 0 }),
      controls: [{ type: 'choice', key: 't', label: 'Tell it in the', options: [[0, 'Past'], [1, 'Present'], [2, 'Future']] }],
      thumb: () => svg('A kite stuck in a tree', `<rect width="320" height="200" fill="#dcecf3"/><rect x="150" y="100" width="18" height="100" fill="#7a5230"/><circle cx="160" cy="84" r="54" fill="#5fa35a"/><path d="M196 44l18-16 14 20-18 14z" fill="#bd2934"/><path d="M210 62q-10 30 4 60" fill="none" stroke="#252b25"/>`),
      art: v => {
        const V = [['climbed', 'climbs', 'will climb'], ['was', 'is', 'will be'], ['reached', 'reaches', 'will reach'], ['cracked', 'cracks', 'will crack'], ['held', 'holds', 'will hold'], ['saved', 'saves', 'will save']].map(f => `<span class="ex-v">${f[v.t]}</span>`);
        return `<div class="ex-story" data-k="${v.t}">${svg('A girl climbing a mango tree for her kite', `<rect width="320" height="200" fill="#dcecf3"/><rect x="150" y="96" width="20" height="104" fill="#7a5230"/><circle cx="160" cy="80" r="58" fill="#5fa35a"/><path d="M200 38l18-16 14 20-18 14z" fill="#bd2934"/><path d="M214 56q-10 30 4 56" fill="none" stroke="#252b25"/><circle cx="150" cy="120" r="8" fill="#f1c9a5"/><path d="M150 128v18M150 134l12-8M150 134l-10 6" stroke="#6a3fb0" stroke-width="4" stroke-linecap="round"/>`).replace('viewBox="0 0 320 200"', 'viewBox="0 30 320 120"')}<p>Asha ${V[0]} the mango tree. Her kite ${V[1]} stuck on a high branch. She ${V[2]} out slowly. The branch ${V[3]}, but she ${V[4]} on and ${V[5]} the kite.</p></div>`;
      },
      read: s => `Only the <b>six verbs</b> changed. The story moved to the <b>${['past', 'present', 'future'][s.t]}</b>.` + (s.t === 2 ? ' In the future, every verb needs <b>will</b>.' : ''),
    },
    {
      id: 'mood', subject: 'english', band: '3-5', cls: 'Class 5',
      title: 'Change the words, change the mood', hook: 'Can five words turn a happy house into a haunted one?',
      ask: 'A Class 5 activity on describing words: one short story, where students switch the describing words and the picture changes with them.',
      steps: ['Kept the nouns the same, so only the describing words change the feeling.', 'Made the picture follow the words, so younger students see the effect.'],
      use: 'Students write the same three sentences with their own describing words, then read them in a spooky voice.',
      init: () => ({ m: 'spooky' }),
      controls: [{ type: 'choice', key: 'm', label: 'Mood', options: [['spooky', 'Spooky'], ['cheerful', 'Cheerful']] }],
      thumb: () => moodArt(true),
      art: v => {
        const k = v.m === 'spooky', W = k ? ['dark', 'creaking', 'empty', 'cold', 'broken'] : ['bright', 'smiling', 'busy', 'warm', 'open'], w = x => `<span class="ex-adj">${x}</span>`;
        return `<div class="ex-story">${moodArt(k)}<p>It was a ${w(W[0])} evening. The ${w(W[1])} old house stood at the end of the ${w(W[2])} lane. A ${w(W[3])} wind blew through its ${w(W[4])} windows.</p></div>`;
      },
      read: s => (s.m === 'spooky' ? 'Five describing words, and the house turned <b>scary</b>. The nouns never changed.' : 'The same story feels <b>welcoming</b> now. Describing words set the mood.'),
    },
    {
      id: 'passive', subject: 'english', band: '6-8', cls: 'Class 8',
      title: 'Who stole the mango?', hook: 'One sentence can hide the thief. Which one?',
      ask: 'A Class 8 grammar activity on the passive voice: the same sentence in the active, the passive, and the passive without the doer, with a picture that hides the thief.',
      steps: ['Used a mystery, so students care who did it.', 'Added the version without "by", because that is the passive they meet in news.'],
      use: 'After the hidden version, ask where they have heard sentences like "Mistakes were made."',
      init: () => ({ v: 'active' }),
      controls: [{ type: 'choice', key: 'v', label: 'Say it in the', options: [['active', 'Active'], ['passive', 'Passive'], ['hidden', 'Passive, no doer']] }],
      thumb: () => mangoArt('active'),
      art: v => `<div class="ex-story">${mangoArt(v.v)}<p class="ex-big-line">${{ active: '<span class="ex-doer">A monkey</span> stole the mango.', passive: 'The mango was stolen by <span class="ex-doer">a monkey</span>.', hidden: 'The mango was stolen.' }[v.v]}</p></div>`,
      read: s => ({ active: 'Active: the doer comes first. <b>A monkey</b> did it.', passive: 'Passive: the mango comes first. The doer moves to the end, after <b>by</b>.', hidden: 'The passive can <b>hide the doer</b> completely. That is why excuses love it: "The window was broken."' })[s.v],
    },
    {
      id: 'reported', subject: 'english', band: '9-10', cls: 'Class 10',
      title: 'What did she say?', hook: 'Turn a comic into a report. Four things change.',
      ask: 'A Class 10 grammar activity: a two-panel comic in direct speech, which turns into reported speech with every change highlighted.',
      steps: ['Kept it to one exchange, so each change is easy to spot.', 'Highlighted the pronoun, tense, time word and modal separately.'],
      use: 'Show the comic. Students write the report first, then compare with the highlighted version.',
      init: () => ({ v: 'direct' }),
      controls: [{ type: 'choice', key: 'v', label: 'Show', options: [['direct', 'The comic'], ['reported', 'Reported speech']] }],
      thumb: () => svg('Two speech bubbles', `<rect width="320" height="200" fill="#f4f0fa"/><path d="M30 30h140v60H70l-20 18V90H30z" fill="#fff" stroke="#6a3fb0" stroke-width="3"/><path d="M150 110h140v60H250l-20 18v-18h-80z" fill="#fff" stroke="#6a3fb0" stroke-width="3"/>`),
      art: v => (v.v === 'direct'
        ? `<div class="ex-comic"><div><b>Ravi</b><p>“I am going to the match tomorrow.”</p></div><div><b>Mother</b><p>“You must finish your homework first.”</p></div></div>`
        : `<div class="ex-report"><p>Ravi said that <mark>he</mark> <mark>was</mark> going to the match <mark>the next day</mark>.</p><p>His mother told him that he <mark>had to</mark> finish <mark>his</mark> homework first.</p></div>`),
      read: s => (s.v === 'direct' ? 'Direct speech: the exact words, inside quotation marks.' : 'Four things change: <b>I → he</b>, <b>am → was</b>, <b>tomorrow → the next day</b>, <b>must → had to</b>.'),
    },
    {
      id: 'appeal', subject: 'english', band: '11-12', cls: 'Class 11',
      title: 'Win the argument three ways', hook: 'Facts, feelings or trust: which one moves the principal?',
      ask: 'A Class 11 writing activity on persuasion: one proposal, to plant 100 trees on campus, argued with facts, with feelings and with trust.',
      steps: ['Kept the proposal the same, so only the kind of appeal changes.', 'Checked the facts version uses numbers students could look up.'],
      use: 'Groups argue for a school change using all three appeals, then the class votes.',
      init: () => ({ a: 'facts' }),
      controls: [{ type: 'choice', key: 'a', label: 'Appeal to', options: [['facts', 'Facts'], ['feelings', 'Feelings'], ['trust', 'Trust']] }],
      thumb: () => svg('A speaker at a podium', `<rect width="320" height="200" fill="#f4f0fa"/><circle cx="160" cy="60" r="18" fill="#f1c9a5"/><path d="M130 180V120q0-24 30-24t30 24v60z" fill="#6a3fb0"/><path d="M120 130h80l-10 60h-60z" fill="#8b5a2b"/>`),
      art: v => `<div class="ex-speech"><small>Proposal: plant 100 trees on our campus</small><p>${{ facts: 'A grown tree can cool the air around it by a few degrees. <mark>Our classrooms reach 34°C in April.</mark> 100 trees would shade the east wall by the time today’s Class 6 finish school.', feelings: 'Think of the Class 1 children waiting for the bus <mark>in the April sun</mark>. Imagine them under a tree they helped to plant, with their names on it.', trust: 'Our eco club has kept <mark>every sapling alive</mark> for three years. The gardener has offered to help. We have done this before, and we will do it well.' }[v.a]}</p></div>`,
      read: s => ({ facts: '<b>Logos:</b> numbers and reasons. Strong with people who need proof.', feelings: '<b>Pathos:</b> a picture the listener can feel. Strong with people who care.', trust: '<b>Ethos:</b> why you can be trusted to do it. Strong with people who decide.' })[s.a],
    },
    /* ---------- Computers ---------- */
    {
      id: 'robot', subject: 'computing', band: '3-5', cls: 'Class 4',
      title: 'Guide the robot to the book', hook: 'Write the steps. Then press Run.',
      ask: 'A Class 4 activity on algorithms: a robot on a grid with walls, where students add steps like Forward and Turn, then run their program.',
      steps: ['Kept only three moves, so students focus on order and not on buttons.', 'Made the robot stop at the step that goes wrong, so debugging is easy.'],
      use: 'Pairs write the steps on paper first. One reads them out while the other enters them.',
      init: () => ({ prog: [], x: 0, y: 4, rot: 0, dir: 0, run: 0, acc: 0, status: 'edit', bad: -1 }), smooth: ['x', 'y', 'rot'],
      controls: [{ type: 'buttons', items: [
        { label: 'Forward', run: s => robotAdd(s, 'F') },
        { label: 'Turn left', run: s => robotAdd(s, 'L') },
        { label: 'Turn right', run: s => robotAdd(s, 'R') },
        { label: 'Run', primary: true, run: s => { if (!s.prog.length) return; robotReset(s); s.status = 'run'; s.acc = 300; } },
        { label: 'Clear', run: s => { s.prog = []; robotReset(s); s.status = 'edit'; } },
      ] }],
      tick: (s, dt) => {
        if (s.status !== 'run') return false;
        s.acc += dt; if (s.acc < 450) return true; s.acc = 0;
        const op = s.prog[s.run];
        if (!op) { s.status = s.x === 4 && s.y === 0 ? 'win' : 'short'; return false; }
        if (op === 'F') {
          const nx = s.x + [0, 1, 0, -1][s.dir], ny = s.y + [-1, 0, 1, 0][s.dir];
          if (nx < 0 || nx > 4 || ny < 0 || ny > 4 || WALLS.some(([a, b]) => a === nx && b === ny)) { s.status = 'crash'; s.bad = s.run; return false; }
          s.x = nx; s.y = ny;
        } else { s.dir = (s.dir + (op === 'R' ? 1 : 3)) % 4; s.rot += op === 'R' ? 90 : -90; }
        s.run++;
        if (s.x === 4 && s.y === 0) { s.status = 'win'; return false; }
        return true;
      },
      thumb: () => robotGrid({ x: 0, y: 4, rot: 0 }),
      art: (v, s) => robotGrid(v) + `<ol class="ex-prog">${s.prog.map((p, i) => `<li class="${i === s.bad ? 'bad' : s.status === 'run' && i === s.run - 1 ? 'on' : ''}">${{ F: 'Forward', L: 'Left', R: 'Right' }[p]}</li>`).join('') || '<li class="ex-prog-empty">No steps yet</li>'}</ol>`,
      read: s => ({ edit: s.prog.length ? `${s.prog.length} step${s.prog.length > 1 ? 's' : ''} written. Press <b>Run</b>.` : 'Add steps to guide the robot to the book, then press <b>Run</b>.', run: 'Running your program.', win: `<b>Got the book</b> in ${s.prog.length} steps. Can you do it in fewer?`, crash: `<b>Bump!</b> Step ${s.bad + 1} hits a wall. Clear and try a different route.`, short: 'The robot stopped before the book. Add more steps and run again.' })[s.status],
    },
    {
      id: 'sticks', subject: 'computing', band: '6-8', cls: 'Class 6',
      title: 'Spot the pattern', hook: 'How many matchsticks for 50 squares?',
      ask: 'A Class 6 pattern activity: squares made of matchsticks in a row, where students add squares and find the rule.',
      steps: ['Grew the pattern one square at a time, so students see the +3.', 'Left the rule for 50 squares as a question to ask the class.'],
      use: 'Stop at 4 squares. Ask for 10, then 50, then any number. That last answer is the rule.',
      init: () => ({ n: 3 }),
      controls: [{ type: 'range', key: 'n', label: 'Squares in a row', min: 1, max: 8, step: 1 }],
      art: v => {
        const n = v.n, sz = 30, x0 = 160 - n * sz / 2, y0 = 70;
        const stick = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#d9a35a" stroke-width="5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="3.6" fill="#bd2934"/>`;
        let out = '';
        for (let i = 0; i < n; i++) { const x = x0 + i * sz; out += stick(x + 3, y0, x + sz - 3, y0) + stick(x + 3, y0 + sz, x + sz - 3, y0 + sz); }
        for (let i = 0; i <= n; i++) { const x = x0 + i * sz; out += stick(x, y0 + sz - 3, x, y0 + 3); }
        return svg(`${n} squares made of matchsticks`, out + T(160, 150, `${3 * n + 1} sticks`, `${mid} font-size="24" font-weight="700" fill="#0f6f73"`) + T(160, 172, `${n} square${n > 1 ? 's' : ''}`, `${mid} font-size="12" fill="#62685f"`));
      },
      read: s => `${s.n} square${s.n > 1 ? 's' : ''}: <b>${3 * s.n + 1} sticks</b>. Each new square needs 3 more. The rule: <b>3 × squares + 1</b>.`,
    },
    {
      id: 'binary', subject: 'computing', band: '9-10', cls: 'Class 9',
      title: 'Write your initial in binary', hook: 'Eight switches can spell any letter. Can you spell yours?',
      ask: 'A Class 9 activity on binary numbers: eight switches with their place values, showing the number and the letter it stands for.',
      steps: ['Showed the place value under each switch, so students add instead of memorising.', 'Linked the number to a letter, because spelling a name is more fun than a sum.'],
      use: 'Each student makes their initial, then a partner reads it back from the switches alone.',
      init: () => ({ b: [0, 1, 0, 0, 0, 0, 0, 1] }),
      controls: [
        { type: 'buttons', items: [128, 64, 32, 16, 8, 4, 2, 1].map((n, i) => ({ label: String(n), pressed: s => !!s.b[i], run: s => { s.b[i] = s.b[i] ? 0 : 1; } })) },
        { type: 'buttons', items: [{ label: 'Clear', run: s => { s.b = [0, 0, 0, 0, 0, 0, 0, 0]; } }, { label: 'Make "P"', run: s => { s.b = [0, 1, 0, 1, 0, 0, 0, 0]; } }] },
      ],
      art: v => {
        const n = v.b.reduce((a, x, i) => a + x * 2 ** (7 - i), 0), ch = (n >= 65 && n <= 90) || (n >= 97 && n <= 122) ? String.fromCharCode(n) : '';
        let out = '';
        v.b.forEach((x, i) => { const cx = 34 + i * 36; out += (x ? `<circle cx="${cx}" cy="58" r="20" fill="#ffe27a" opacity=".5" class="ex-glow"/>` : '') + `<circle cx="${cx}" cy="58" r="13" fill="${x ? '#ffd34d' : '#e3e6e3'}" stroke="#6b705f" stroke-width="2"/>` + T(cx, 98, x, `${mid} font-size="18" font-weight="800" fill="${x ? '#0f6f73' : '#9aa295'}"`) + T(cx, 116, 2 ** (7 - i), `${mid} font-size="10" fill="#62685f"`); });
        out += T(90, 170, `= ${n}`, `${mid} font-size="30" font-weight="800"`) + T(230, 176, ch || '?', `${mid} font-size="46" font-weight="800" fill="${ch ? '#0f6f73' : '#c9c5b8'}"`);
        return svg('Eight binary switches and the letter they make', out);
      },
      read: s => { const n = s.b.reduce((a, x, i) => a + x * 2 ** (7 - i), 0), ch = (n >= 65 && n <= 90) || (n >= 97 && n <= 122) ? String.fromCharCode(n) : ''; return `<b>${s.b.join('')}</b> = ${n}. ` + (ch ? `In ASCII, ${n} is the letter <b>${ch}</b>.` : 'Capitals are 65 to 90. Small letters are 97 to 122.'); },
    },
    {
      id: 'password', subject: 'computing', band: '9-10', cls: 'Class 10', featured: 6,
      title: 'How long to crack your password?', hook: 'Is "mango123" safe? Try it.',
      ask: 'A Class 10 cyber safety activity: choose a password’s length and what kinds of characters it uses, and see how long a fast computer would take to guess it.',
      steps: ['Stated the guessing speed, so the answer is honest about its assumption.', 'Used a log scale for the meter, because the times grow so fast.'],
      use: 'Students guess which matters more, length or symbols. Then test both.',
      init: () => ({ len: 8, up: false, dig: true, sym: false }),
      controls: [
        { type: 'range', key: 'len', label: 'Length', min: 4, max: 16, step: 1 },
        { type: 'buttons', items: [['up', 'A to Z'], ['dig', '0 to 9'], ['sym', 'Symbols !@#']].map(([k, n]) => ({ label: n, pressed: s => s[k], run: s => { s[k] = !s[k]; } })) },
      ],
      art: v => {
        const pool = 26 + (v.up ? 26 : 0) + (v.dig ? 10 : 0) + (v.sym ? 32 : 0), lg = v.len * Math.log10(pool) - Math.log10(2e10), f = clamp((lg + 4) / 26, 0, 1);
        return svg('A password strength meter', `<rect x="120" y="22" width="80" height="62" rx="10" fill="none" stroke="#6b705f" stroke-width="10"/><rect x="104" y="60" width="112" height="84" rx="12" fill="#0f6f73"/><circle cx="160" cy="96" r="10" fill="#fff"/><path d="M160 100v20" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` +
          `<rect x="30" y="156" width="260" height="14" rx="7" fill="#e3e6e3"/><rect x="30" y="156" width="${r1(260 * Math.max(0.03, f))}" height="14" rx="7" fill="hsl(${Math.round(120 * f)} 60% 45%)"/>` + T(160, 192, crack(lg), `${mid} font-size="15" font-weight="800" fill="hsl(${Math.round(120 * f)} 55% 32%)"`));
      },
      read: s => { const pool = 26 + (s.up ? 26 : 0) + (s.dig ? 10 : 0) + (s.sym ? 32 : 0), lg = s.len * Math.log10(pool) - Math.log10(2e10); return `${pool} possible characters, ${s.len} long. If a computer tries 10 billion guesses a second: <b>${crack(lg)}</b>. Each extra character multiplies the time by ${pool}.`; },
    },
    {
      id: 'bubble', subject: 'computing', band: '11-12', cls: 'Class 11',
      title: 'Watch bubble sort think', hook: 'How many comparisons does it take to sort 8 bars?',
      ask: 'A Class 11 computer science activity: bubble sort on eight bars, one comparison at a time or all the way, counting comparisons and swaps.',
      steps: ['Coloured the pair being compared, and the sorted end in green.', 'Showed the count, so students can link it to n²/2.'],
      use: 'Students predict the number of comparisons for 8 bars before running it. Then ask about 1,000 bars.',
      init: () => ({ a: [5, 2, 8, 1, 7, 3, 6, 4], i: 0, j: 0, hi: -1, cmp: 0, sw: 0, done: false, auto: false, acc: 0, round: 0 }),
      controls: [{ type: 'buttons', items: [
        { label: 'Next step', run: s => { s.auto = false; bubbleStep(s); } },
        { label: 'Run to the end', primary: true, run: s => { if (!s.done) { s.auto = true; s.acc = 200; } } },
        { label: 'Shuffle', run: s => { const orders = [[5, 2, 8, 1, 7, 3, 6, 4], [8, 7, 6, 5, 4, 3, 2, 1], [3, 1, 2, 5, 4, 8, 6, 7], [2, 6, 1, 8, 3, 7, 4, 5]]; Object.assign(s, { a: [...orders[++s.round % 4]], i: 0, j: 0, hi: -1, cmp: 0, sw: 0, done: false, auto: false }); } },
      ] }],
      tick: (s, dt) => { if (!s.auto || s.done) return false; s.acc += dt; if (s.acc < 220) return true; s.acc = 0; bubbleStep(s); if (s.done) { s.auto = false; return false; } return true; },
      art: v => {
        const n = v.a.length;
        let out = T(20, 22, `Comparisons ${v.cmp} · Swaps ${v.sw}`, 'font-size="13" font-weight="700"');
        v.a.forEach((x, k) => { const sorted = v.done || k >= n - v.i, on = k === v.hi || k === v.hi + 1; out += `<rect x="${24 + k * 36}" y="${176 - x * 17}" width="28" height="${x * 17}" rx="4" fill="${on ? '#bd2934' : sorted ? '#3f8a4f' : '#0f6f73'}"/>` + T(38 + k * 36, 192, x, `${mid} font-size="11" font-weight="600"`); });
        return svg('Bars being sorted by bubble sort', out);
      },
      read: s => (s.done ? `<b>Sorted</b> after ${s.cmp} comparisons and ${s.sw} swaps. Bubble sort needs about n²/2 comparisons: fine for 8 bars, far too slow for a million.` : s.hi < 0 ? 'Press <b>Next step</b> to compare the first two bars, or run it to the end.' : `Pass ${s.i + 1}. The biggest unsorted bar bubbles to the right end each pass.`),
    },
  ];

  const EX_BY = Object.fromEntries(EX.map(e => [e.id, e]));

  /* ---------- Robot helpers ---------- */
  const WALLS = [[1, 1], [2, 3], [3, 1], [3, 2]];
  function robotReset(s) { Object.assign(s, { x: 0, y: 4, dir: 0, run: 0, bad: -1 }); s.rot = 0; }
  function robotAdd(s, op) { if (s.status !== 'edit') { robotReset(s); s.status = 'edit'; } if (s.prog.length < 16) s.prog.push(op); }
  function robotGrid(v) {
    let out = '';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) out += `<rect x="${75 + i * 34}" y="${15 + j * 34}" width="32" height="32" rx="4" fill="${WALLS.some(([a, b]) => a === i && b === j) ? '#3f4a4a' : '#e3ece9'}"/>`;
    out += `<g transform="translate(${75 + 4 * 34 + 6} ${15 + 7})"><rect width="20" height="18" rx="2" fill="#2f6db0"/><path d="M4 5H16M4 9H16M4 13H12" stroke="#fff" stroke-width="1.5"/></g>`;
    out += `<g transform="translate(${r1(75 + v.x * 34 + 16)} ${r1(15 + v.y * 34 + 16)}) rotate(${r1(v.rot)})"><circle r="12" fill="#0f6f73"/><path d="M0-15L6-5H-6Z" fill="#bd2934"/><circle cx="-4" cy="1" r="2.2" fill="#fff"/><circle cx="4" cy="1" r="2.2" fill="#fff"/></g>`;
    return svg('A robot on a grid, with walls and a book', out);
  }
  function dandiDate(d) { const day = 11 + Math.round(d); return day <= 31 ? `${day} March 1930` : `${day - 31} April 1930`; }
  function crack(lg) {
    const s = 10 ** lg, n = (x, w) => `About ${Math.round(x).toLocaleString('en-IN')} ${w}${Math.round(x) === 1 ? '' : 's'}`;
    if (lg < 0) return 'Cracked instantly';
    if (s < 60) return n(s, 'second');
    if (s < 3600) return n(s / 60, 'minute');
    if (s < 86400) return n(s / 3600, 'hour');
    if (s < 3.15e7) return n(s / 86400, 'day');
    const y = s / 3.15e7;
    if (y < 1e3) return n(y, 'year');
    if (y < 1e6) return `About ${Math.round(y / 1e3).toLocaleString('en-IN')} thousand years`;
    if (y < 1.4e10) return `About ${Math.round(y / 1e6).toLocaleString('en-IN')} million years`;
    return 'Longer than the age of the universe';
  }
  function bubbleStep(s) {
    if (s.done) return;
    const n = s.a.length;
    if (s.j >= n - 1 - s.i) { s.i++; s.j = 0; if (s.i >= n - 1) { s.done = true; s.hi = -1; return; } }
    s.hi = s.j; s.cmp++;
    if (s.a[s.j] > s.a[s.j + 1]) { [s.a[s.j], s.a[s.j + 1]] = [s.a[s.j + 1], s.a[s.j]]; s.sw++; }
    s.j++;
  }
  function moodArt(k) {
    return svg(k ? 'A spooky old house at night' : 'A cheerful house in the evening sun', `<rect width="320" height="200" fill="${k ? '#2b2540' : '#ffdcaa'}"/>` +
      (k ? `<circle cx="262" cy="42" r="20" fill="#f4efd8"/><circle cx="271" cy="37" r="17" fill="#2b2540"/><path d="M40 170V110M40 130l-18-18M40 120l16-20M40 142l14-8" stroke="#141220" stroke-width="5" stroke-linecap="round"/>` : `<circle cx="262" cy="48" r="22" fill="#ffb347"/><circle cx="36" cy="162" r="6" fill="#e0527a"/><circle cx="54" cy="166" r="6" fill="#ffd34d"/><circle cx="72" cy="162" r="6" fill="#e0527a"/>`) +
      `<path d="M0 170H320V200H0Z" fill="${k ? '#1d1a2b' : '#8fc27a'}"/><rect x="110" y="96" width="100" height="76" fill="${k ? '#4a4458' : '#f6e7c8'}"/><path d="M100 98L160 56L220 98Z" fill="${k ? '#3a3448' : '#c8553d'}"/>` +
      [126, 172].map(x => (k ? `<rect x="${x}" y="110" width="22" height="20" fill="#11101a"/><path d="M${x} 110l9 8 4-6 9 10" stroke="#8a84a0" fill="none"/>` : `<rect x="${x}" y="110" width="22" height="20" fill="#ffe27a"/><path d="M${x + 11} 110v20M${x} 120h22" stroke="#c8553d"/>`)).join('') +
      `<rect x="150" y="138" width="20" height="34" fill="${k ? '#231f30' : '#8b5a2b'}"/>`);
  }
  function mangoArt(v) {
    const hidden = v === 'hidden';
    return svg(hidden ? 'A mango tree and a mystery thief' : 'A monkey holding a stolen mango', `<rect width="320" height="200" fill="#e8f3df"/><rect x="60" y="80" width="18" height="120" fill="#7a5230"/><circle cx="70" cy="66" r="50" fill="#5fa35a"/><path d="M104 44v10" stroke="#3f6b2f" stroke-width="3"/>` +
      (hidden ? `<g transform="translate(210 132)"><circle r="28" fill="#3b3b3b"/><circle cy="-38" r="19" fill="#3b3b3b"/>${T(0, -30, '?', `${mid} font-size="22" font-weight="800" fill="#fff"`)}</g>`
        : `<g transform="translate(210 132)"><ellipse rx="26" ry="30" fill="#8b5a2b"/><circle cy="-38" r="20" fill="#8b5a2b"/><ellipse cy="-34" rx="13" ry="11" fill="#e9c9a0"/><circle cx="-5" cy="-38" r="2.5"/><circle cx="5" cy="-38" r="2.5"/><path d="M-5-28q5 4 10 0" stroke="#5a3a1a" fill="none" stroke-width="2"/><ellipse cx="30" cy="-6" rx="11" ry="14" fill="#f2b632"/><path d="M-22 20q-24 10-16 34" stroke="#8b5a2b" stroke-width="6" fill="none"/></g>`));
  }
  function clock(t) { const h = Math.floor(t), m = t % 1 ? '30' : '00', hh = h > 12 ? h - 12 : h; return h === 12 && m === '00' ? '12 noon' : `${hh}:${m} ${h >= 12 ? 'pm' : 'am'}`; }

  /* ---------- The working activity ---------- */
  const labelOf = (l, s) => (typeof l === 'function' ? l(s) : l);
  function controlHTML(c, i, s) {
    if (c.type === 'range') return `<label class="ex-range"><span>${c.label}<output data-ex-out="${i}"></output></span><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" data-ex-c="${i}"></label>`;
    if (c.type === 'choice') return `<div class="ex-choice"><span class="ex-clabel">${c.label}</span><div role="group" aria-label="${esc(c.label)}">${c.options.map((o, k) => `<button type="button" data-ex-c="${i}" data-ex-k="${k}" aria-pressed="false">${o[1]}</button>`).join('')}</div></div>`;
    return `<div class="ex-buttons">${c.items.map((b, j) => `<button type="button" class="ex-btn${b.primary ? ' is-primary' : ''}" data-ex-c="${i}" data-ex-b="${j}"${b.pressed ? ` aria-pressed="${!!b.pressed(s)}"` : ''}>${labelOf(b.label, s)}</button>`).join('')}</div>`;
  }
  function mount(ex, host) {
    const s = ex.init(), view = { ...s }, smooth = calm.matches ? [] : ex.smooth || [];
    let raf = 0, last = 0;
    host.style.setProperty('--ac', SUBJECTS[ex.subject].ac);
    host.innerHTML = `<div class="ex-art" data-ex-art></div><div class="ex-controls">${ex.controls.map((c, i) => controlHTML(c, i, s)).join('')}</div><p class="ex-read" data-ex-read aria-live="polite"></p>`;
    const art = $('[data-ex-art]', host), read = $('[data-ex-read]', host);
    const copy = () => { for (const k in s) if (!smooth.includes(k)) view[k] = s[k]; };
    const draw = () => {
      art.innerHTML = ex.art(view, s);
      read.innerHTML = ex.read(s);
      ex.controls.forEach((c, i) => {
        if (c.type === 'range') { const inp = $(`input[data-ex-c="${i}"]`, host); if (+inp.value !== s[c.key]) inp.value = s[c.key]; $(`[data-ex-out="${i}"]`, host).textContent = c.fmt ? c.fmt(s[c.key]) : s[c.key]; }
        else if (c.type === 'choice') $$(`[data-ex-c="${i}"]`, host).forEach(b => b.setAttribute('aria-pressed', String(c.options[+b.dataset.exK][0] === s[c.key])));
        else $$(`[data-ex-c="${i}"]`, host).forEach(b => { const it = c.items[+b.dataset.exB], t = labelOf(it.label, s); if (b.textContent !== t) b.textContent = t; if (it.pressed) b.setAttribute('aria-pressed', String(!!it.pressed(s))); });
      });
    };
    const frame = t => {
      if (!host.isConnected) { raf = 0; return; }
      const dt = last ? Math.min(64, t - last) : 16; last = t;
      let busy = !!(ex.tick && ex.tick(s, dt));
      for (const k of smooth) { const d = s[k] - view[k]; if (Math.abs(d) > 0.004 * (Math.abs(s[k]) + 1)) { view[k] += d * Math.min(1, dt / 110); busy = true; } else view[k] = s[k]; }
      copy(); draw();
      raf = busy && host.isConnected ? requestAnimationFrame(frame) : 0;
      if (!raf) last = 0;
    };
    const after = () => {
      if (ex.fix) ex.fix(s);
      if (calm.matches && ex.tick) { let n = 0; while (ex.tick(s, 1000) && n++ < 3000); }
      copy(); draw();
      if (!calm.matches && !raf) raf = requestAnimationFrame(frame);
    };
    host.addEventListener('input', e => { const i = e.target.dataset.exC; if (i == null) return; s[ex.controls[+i].key] = +e.target.value; after(); });
    host.addEventListener('click', e => {
      const b = e.target.closest('button[data-ex-c]'); if (!b) return;
      const c = ex.controls[+b.dataset.exC];
      if (c.type === 'choice') { s[c.key] = c.options[+b.dataset.exK][0]; if (c.then) c.then(s); }
      else c.items[+b.dataset.exB].run(s);
      after();
    });
    if (ex.fix) ex.fix(s);
    copy(); draw();
  }

  /* ---------- Cards, filters and the viewer ---------- */
  const byId = id => EX.find(e => e.id === id);
  const thumb = e => (e.thumb ? e.thumb() : e.art(e.init(), e.init()));
  function card(e, i) {
    const S = SUBJECTS[e.subject];
    return `<button type="button" class="ex-card" data-ex-open="${e.id}" style="--i:${i};--ac:${S.ac}"><span class="ex-thumb" aria-hidden="true">${thumb(e)}</span><span class="ex-card-text"><small>${S.name} · ${e.cls}</small><strong>${e.title}</strong><span>${e.hook}</span></span><span class="ex-go" aria-hidden="true">Try it ↗</span></button>`;
  }
  let dialog, list = [], current = 0;
  function viewer() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'ex-dialog';
    dialog.setAttribute('aria-labelledby', 'ex-title');
    dialog.innerHTML = `<div class="ex-sheet"><div class="ex-top"><div><small data-ex-meta></small><h2 id="ex-title" data-ex-title></h2><p data-ex-hook></p></div><button type="button" class="ex-close" data-ex-close aria-label="Close">✕</button></div>
      <div class="ex-tabs" role="tablist" aria-label="Example views"><button type="button" role="tab" data-ex-tab="try" aria-selected="true">Try it</button><button type="button" role="tab" data-ex-tab="make" aria-selected="false">How a teacher makes it</button></div>
      <div class="ex-panel" data-ex-panel="try"><div class="ex-widget" data-ex-widget></div></div>
      <div class="ex-panel ex-make" data-ex-panel="make" hidden></div>
      <div class="ex-foot"><button type="button" data-ex-step="-1">← Previous</button><span data-ex-pos></span><button type="button" data-ex-step="1">Next →</button></div></div>`;
    document.body.append(dialog);
    dialog.addEventListener('click', e => {
      if (e.target === dialog || e.target.closest('[data-ex-close]')) dialog.close();
      const tab = e.target.closest('[data-ex-tab]'); if (tab) showTab(tab.dataset.exTab);
      const st = e.target.closest('[data-ex-step]'); if (st) open(list[(current + +st.dataset.exStep + list.length) % list.length].id, list);
    });
    dialog.addEventListener('close', () => { if (dialog.open) return; document.documentElement.classList.remove('ex-open'); const w = $('[data-ex-widget]', dialog); w.replaceWith(w.cloneNode(false)); });
    return dialog;
  }
  function showTab(t) { $$('[data-ex-tab]', dialog).forEach(b => b.setAttribute('aria-selected', String(b.dataset.exTab === t))); $$('[data-ex-panel]', dialog).forEach(p => { p.hidden = p.dataset.exPanel !== t; }); }
  function open(id, from) {
    const e = byId(id); if (!e) return;
    const d = viewer(), S = SUBJECTS[e.subject];
    list = from && from.length ? from : EX; current = Math.max(0, list.indexOf(e));
    d.style.setProperty('--ac', S.ac);
    $('[data-ex-meta]', d).textContent = `${S.name} · ${e.cls}`;
    $('[data-ex-title]', d).textContent = e.title;
    $('[data-ex-hook]', d).textContent = e.hook;
    $('[data-ex-pos]', d).textContent = `${current + 1} / ${list.length}`;
    $('[data-ex-panel="make"]', d).innerHTML = `<p class="ex-k">What the teacher asked for</p><blockquote>“${esc(e.ask)}”</blockquote><p class="ex-k">What the teacher checked and changed</p><ol>${e.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p class="ex-k">In class</p><p>${esc(e.use)}</p><p class="ex-note">Built in the training with AI tools. No code.</p>`;
    const old = $('[data-ex-widget]', d), fresh = old.cloneNode(false);
    old.replaceWith(fresh);
    mount(e, fresh);
    showTab('try');
    if (!d.open) { d.showModal(); document.documentElement.classList.add('ex-open'); }
    $('.ex-sheet', d).scrollTop = 0;
  }
  function library(root) {
    const limit = +root.dataset.limit || 0, allHref = root.dataset.allHref || '';
    const phone = matchMedia('(max-width: 620px)'), few = () => (phone.matches && root.dataset.limitPhone ? +root.dataset.limitPhone : limit);
    const q = new URLSearchParams(location.search);
    let subj = SUBJECTS[q.get('subject')] ? q.get('subject') : 'all', band = BANDS[q.get('class')] ? q.get('class') : 'all', shown = [];
    const chips = (name, all, map) => `<div class="ex-chips" role="group" aria-label="${name}">${[['all', all], ...Object.entries(map).map(([k, v]) => [k, v.name || v])].map(([k, l]) => `<button type="button" data-ex-${name.toLowerCase()}="${k}" aria-pressed="false">${l}</button>`).join('')}</div>`;
    root.innerHTML = `<div class="ex-filters">${chips('Subject', 'All subjects', SUBJECTS)}${chips('Class', 'All classes', BANDS)}</div><p class="ex-count" data-ex-count aria-live="polite"></p><div class="ex-grid" data-ex-grid></div>` +
      (limit && allHref ? `<a class="ex-all" data-ex-all href="${allHref}">See all ${EX.length} examples <span aria-hidden="true">→</span></a>` : '');
    const grid = $('[data-ex-grid]', root);
    const render = () => {
      $$('[data-ex-subject]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.exSubject === subj)));
      $$('[data-ex-class]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.exClass === band)));
      const match = EX.filter(e => (subj === 'all' || e.subject === subj) && (band === 'all' || e.band === band));
      const lim = few();
      shown = lim ? [...match].sort((a, b) => (a.featured || 99) - (b.featured || 99)).slice(0, lim) : match;
      grid.innerHTML = shown.map(card).join('') || '<p class="ex-empty">Nothing for this pair yet. Try another class.</p>';
      $('[data-ex-count]', root).textContent = lim && match.length > shown.length ? `Showing ${shown.length} of ${match.length}` : `${match.length} example${match.length === 1 ? '' : 's'}`;
      const all = $('[data-ex-all]', root);
      if (all) { const p = new URLSearchParams(); if (subj !== 'all') p.set('subject', subj); if (band !== 'all') p.set('class', band); all.href = allHref + (p.toString() ? `?${p}` : ''); }
      if (!limit && history.replaceState) { const p = new URLSearchParams(); if (subj !== 'all') p.set('subject', subj); if (band !== 'all') p.set('class', band); history.replaceState(null, '', location.pathname + (p.toString() ? `?${p}` : '') + location.hash); }
    };
    root.addEventListener('click', e => {
      const sb = e.target.closest('[data-ex-subject]'), cb = e.target.closest('[data-ex-class]'), op = e.target.closest('[data-ex-open]');
      if (sb) { subj = sb.dataset.exSubject; render(); }
      if (cb) { band = cb.dataset.exClass; render(); }
      if (op) open(op.dataset.exOpen, shown);
    });
    render();
    if (root.dataset.limitPhone && phone.addEventListener) phone.addEventListener('change', render);
    const id = location.hash.replace('#ex-', '');
    if (!limit && byId(id)) open(id, shown);
  }

  /* ---------- Numbers that count up, and blocks that rise in, as they come into view ---------- */
  function counters() {
    const els = $$('[data-count-to]');
    if (!els.length) return;
    const run = el => {
      const to = +el.dataset.countTo, from = +(el.dataset.countFrom || 0), t0 = performance.now();
      if (calm.matches) { el.textContent = to; return; }
      const step = t => { const p = Math.min(1, (t - t0) / 900), e = 1 - (1 - p) ** 3; el.textContent = Math.round(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }), { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  }
  function reveals() {
    const els = $$('[data-rise]');
    if (!els.length || calm.matches || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('ex-rise-on');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); e.target.classList.add('is-in'); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => { [...el.children].forEach((c, i) => c.style.setProperty('--i', i)); io.observe(el); });
  }

  $$('[data-ex-library]').forEach(library);
  counters(); reveals();
})();
