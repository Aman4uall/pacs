/* Find practical skills, collect a plan, then explicitly hand it to WhatsApp. */
(function () {
  const search = document.getElementById('skill-search');
  if (!search) return;
  const cards = [...document.querySelectorAll('.skill-card')];
  const boxes = cards.map(card => card.querySelector('input'));
  const groups = [...document.querySelectorAll('.skill-group')];
  const filters = [...document.querySelectorAll('[data-goal]')];
  const clear = document.getElementById('clear-search');
  const dialog = document.getElementById('plan-dialog');
  const note = document.getElementById('plan-note');
  const status = document.getElementById('plan-status');
  const storageKey = 'pacs-ai-skill-plan-v2';
  const goals = filters.map(button => button.dataset.goal);
  const requestedGoal = new URLSearchParams(location.search).get('goal');
  // Every skill shows by default, in one scrolling list. A link like ?goal=work jumps to that group.
  let goal = 'all';
  let opener;
  let lastPayload = '';
  let lastReference = '';

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) boxes.forEach(box => { box.checked = saved.includes(box.dataset.skillId); });
  } catch (_) { /* Selection still works if storage is unavailable. */ }
  const picked = () => boxes.filter(box => box.checked);

  function updatePicks() {
    const selected = picked();
    document.querySelectorAll('[data-pick-count]').forEach(el => { el.textContent = String(selected.length); });
    document.querySelectorAll('[data-empty-picks]').forEach(el => { el.hidden = selected.length > 0; });
    document.querySelectorAll('[data-pick-guidance]').forEach(el => {
      el.textContent = selected.length > 4 ? "A good wish list. We'll help you choose what fits into a month." : selected.length ? 'You can change these before you send.' : 'Three or four skills are a good starting point.';
    });
    document.querySelectorAll('[data-selected-list]').forEach(list => {
      list.replaceChildren();
      selected.forEach(box => {
        const item = document.createElement('li');
        const text = document.createElement('span');
        text.textContent = box.value;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Remove ${box.value}`);
        remove.addEventListener('click', () => {
          const index = [...list.children].indexOf(item);
          box.checked = false;
          updatePicks();
          const next = list.children[Math.min(index, list.children.length - 1)]?.querySelector('button');
          (next || (dialog.open ? note : document.querySelector('.plan-sidebar [data-review]'))).focus();
        });
        item.append(text, remove);
        list.append(item);
      });
    });
    status.textContent = '';
    try { sessionStorage.setItem(storageKey, JSON.stringify(selected.map(box => box.dataset.skillId))); } catch (_) { /* Optional persistence. */ }
  }

  function filter() {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.goal === (query ? 'all' : goal))));
    groups.forEach(group => {
      let count = 0;
      group.querySelectorAll('.skill-card').forEach(card => {
        const haystack = `${card.querySelector('strong').textContent} ${card.querySelector('.skill-description').textContent} ${card.dataset.tags}`.toLowerCase();
        const matches = query ? query.split(/\s+/).every(word => haystack.includes(word)) : goal === 'all' || group.dataset.category === goal;
        card.hidden = !matches;
        if (matches) count++;
      });
      group.hidden = count === 0;
      shown += count;
    });
    clear.hidden = !query;
    document.getElementById('catalog-empty').hidden = shown !== 0;
    document.getElementById('filter-status').textContent = `${shown} ${shown === 1 ? 'skill' : 'skills'} shown${query ? ` for “${search.value.trim()}”` : ''}.`;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    goal = button.dataset.goal;
    search.value = '';
    filter();
  }));
  search.addEventListener('input', filter);
  search.addEventListener('search', filter);
  clear.addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
  boxes.forEach(box => box.addEventListener('change', updatePicks));
  document.querySelectorAll('[data-review]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    status.textContent = '';
    dialog.showModal();
    if (!picked().length) note.focus();
  }));
  document.querySelector('[data-close-plan]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());

  function save(payload) {
    if (!SITE.learnPicks) return;
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon?.(SITE.learnPicks, new Blob([body], { type:'text/plain;charset=UTF-8' }))) return;
    } catch (_) { /* Try the fetch fallback below. */ }
    fetch(SITE.learnPicks, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'text/plain;charset=UTF-8' }, body, keepalive:true }).catch(() => {});
  }
  document.getElementById('send-plan').addEventListener('click', () => {
    const skills = picked().map(box => box.value);
    const extra = note.value.trim();
    if (!skills.length && !extra) {
      status.classList.add('is-error');
      status.textContent = 'Choose a skill, or tell us what you have in mind.';
      note.focus();
      return;
    }
    const fingerprint = JSON.stringify([skills, extra]);
    // The same list number goes into the WhatsApp message and the sheet, so the two can be matched.
    const reference = fingerprint === lastPayload ? lastReference : `L-${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2,5).padEnd(3,'0')}`.toUpperCase();
    const message = ["Hi PACS AI! I'd like to explore a one-month AI learning plan.", skills.length ? '\nMy picks:\n' + skills.map(skill => '• ' + skill).join('\n') : '', extra ? '\nMy idea: ' + extra : '', '\nPlease share the scope, dates and fees.', '\nMy list number: ' + reference].filter(Boolean).join('\n');
    const url = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
    if (fingerprint !== lastPayload) save({ kind:'learn', ref:reference, who:'AI for everyone page', count:skills.length, picks:skills.join(' | '), other:extra, message });
    lastPayload = fingerprint;
    lastReference = reference;
    status.classList.remove('is-error');
    status.replaceChildren(document.createTextNode('Your WhatsApp draft is ready. Press Send in WhatsApp to reach us. '));
    const retry = document.createElement('a');
    retry.href = url;
    retry.target = '_blank';
    retry.rel = 'noopener';
    retry.textContent = 'Open the draft again';
    status.append(retry);
  });
  updatePicks();
  filter();
  const jumpTo = requestedGoal && document.querySelector(`.skill-group[data-category="${requestedGoal}"]`);
  if (jumpTo) requestAnimationFrame(() => { jumpTo.scrollIntoView({ block: 'start' }); window.settleOn?.(jumpTo); });
})();

// The filter bar stays in view; tell the sidebar how tall it is so they never overlap
const stickyBar = document.querySelector('.catalog-sticky');
if (stickyBar) {
  const setH = () => document.documentElement.style.setProperty('--filter-h', `${stickyBar.offsetHeight}px`);
  // ResizeObserver reports the height once the page has laid out, so nothing is measured before the first paint
  if ('ResizeObserver' in window) new ResizeObserver(setH).observe(stickyBar); else { requestAnimationFrame(setH); addEventListener('resize', setH); }
}
