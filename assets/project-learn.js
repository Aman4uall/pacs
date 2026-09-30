(function () {
  'use strict';
  const {projects,routes,get,state,message,selection,escape:e} = PacsProjects;
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-project]')];
  const notes = new Map(), submissions = new Map(), refreshEnquiries = [];
  const storageKey = 'pacs.ai.project-basket.v1';
  let stored = [];
  try { stored = selection(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch (_) { /* A basket still works when storage is unavailable. */ }
  const basket = new Set(stored), basketDialog = document.getElementById('project-basket');
  let current = state(location.search), panel;
  document.documentElement.classList.add('projects-ready');
  document.getElementById('basket-bar').hidden = false;
  const media = matchMedia('(max-width:620px)'), tablet = matchMedia('(max-width:880px)');
  function updateURL() {
    const url = new URL(location.href);
    ['goal','project'].forEach(key => current[key] ? url.searchParams.set(key,current[key]) : url.searchParams.delete(key));
    url.hash = current.project ? 'project' : 'projects';
    history.pushState({},'',url);
  }
  function placePanel() {
    if (!panel || !current.project) return;
    const visible = cards.filter(card => !card.hidden), index = visible.findIndex(card=>card.dataset.project === current.project);
    const columns = media.matches ? 1 : tablet.matches ? 2 : 3;
    const last = Math.min(Math.floor(index/columns)*columns+columns-1,visible.length-1);
    if (visible[last]) visible[last].after(panel);
  }
  function addButton(id) { return `<button class="px-add" type="button" data-add-project="${id}" aria-pressed="${basket.has(id)}" aria-label="${basket.has(id) ? 'Remove' : 'Add'} ${e(get(id).title)} ${basket.has(id) ? 'from' : 'to'} basket">${basket.has(id) ? 'Added ✓' : '+ Add to basket'}</button>`; }
  function syncBasket() {
    try { localStorage.setItem(storageKey,JSON.stringify([...basket])); } catch (_) { /* Selection remains available for this visit. */ }
    document.querySelectorAll('[data-add-project]').forEach(b=>{
      const chosen = basket.has(b.dataset.addProject);
      b.setAttribute('aria-pressed',String(chosen)); b.textContent = chosen ? 'Added ✓' : '+ Add to basket';
      b.setAttribute('aria-label',`${chosen ? 'Remove' : 'Add'} ${get(b.dataset.addProject).title} ${chosen ? 'from' : 'to'} basket`);
    });
    document.querySelectorAll('[data-basket-count]').forEach(el=>el.textContent=String(basket.size));
    document.getElementById('basket-caption').textContent = basket.size ? `${basket.size} in your basket` : 'Your learning basket';
    document.getElementById('basket-review').textContent = basket.size ? `Review (${basket.size}) →` : 'Choose projects';
    document.getElementById('basket-list').innerHTML = [...basket].map(id=>`<li><span>${e(get(id).title)}</span><button type="button" data-remove-project="${id}" aria-label="Remove ${e(get(id).title)} from basket">Remove</button></li>`).join('');
    document.getElementById('basket-empty').hidden = !!basket.size;
    document.getElementById('basket-form').hidden = !basket.size;
    refreshEnquiries.forEach(update=>update());
  }
  function openBasket() {
    syncBasket(); basketDialog.showModal(); document.getElementById('basket-title').focus();
  }
  function showAll() {
    current = {goal:'',project:''}; updateURL(); render();
    document.getElementById('projects').scrollIntoView({block:'start',behavior:'instant'});
    document.getElementById('projects-title').focus({preventScroll:true});
  }
  function render({focus = false} = {}) {
    panel?.remove(); panel = null;
    document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route === current.goal)));
    const visible = projects.filter(p=>!current.goal || p.routes.includes(current.goal));
    document.getElementById('project-count').textContent = current.goal ? `Showing ${visible.length} of ${projects.length} · ${routes[current.goal]}` : `${projects.length} projects · Pick your favourites`;
    document.getElementById('show-all').textContent = `Browse all ${projects.length}`;
    const remaining = projects.filter(p=>!visible.includes(p));
    document.getElementById('more-projects').hidden = !remaining.length;
    document.getElementById('more-project-links').innerHTML = remaining.map(p=>`<a href="learn.html?project=${p.id}#project" data-browse-project="${p.id}">${e(p.title)} ↗</a>`).join('');
    cards.forEach(card=>{
      card.hidden = !visible.some(p=>p.id === card.dataset.project);
      card.classList.toggle('is-selected',card.dataset.project === current.project);
      card.querySelector('[data-open-project]').setAttribute('aria-expanded',String(card.dataset.project === current.project));
    });
    syncBasket();
    const p = get(current.project); if (!p) return;
    panel = document.createElement('section'); panel.id = 'project'; panel.className = 'px-detail'; panel.setAttribute('aria-labelledby','project-title');
    panel.innerHTML = `<div class="px-detail-heading"><div><span class="px-eyebrow">PROJECT ${projects.indexOf(p)+1} OF ${projects.length}</span><h2 id="project-title" tabindex="-1">${e(p.title)}</h2></div><button class="px-close" type="button" aria-label="Close project details">×</button></div><div class="px-detail-grid"><div><div data-project-preview="${p.id}"></div><p class="px-example-label">${e(p.sample)}</p><a class="px-text-button" href="demos.html#example-${p.id}">See this in Examples ↗</a></div><div class="px-detail-copy"><h3>${p.id === 'stocks' ? 'What you will build' : 'What you will make'}</h3><p>${e(p.deliverable)}</p><h3>What you will learn</h3><ol>${p.steps.map(s=>`<li>${e(s)}</li>`).join('')}</ol><div class="px-detail-meta"><div><h3>Who it suits</h3><p>${e(p.audience)}</p></div><div><h3>Before you start</h3><p>${e(p.needs)}</p></div></div>${current.goal === 'earn' && p.id !== 'stocks' ? '<div class="px-earn-note"><strong>Want to offer this as a service?</strong><p>Discuss portfolio samples, pricing a brief, finding prospects, managing revisions and handing work over.</p></div>' : ''}<div class="px-fees"><h3>Make this part of your learning plan.</h3><p>Add this project and keep exploring. Ask for dates, fees and a plan for your picks when you’re ready.</p><div class="px-detail-actions">${addButton(p.id)}<button type="button" class="px-button px-button-secondary" data-show-enquiry>Get dates &amp; fees ↗</button></div></div></div></div><div class="px-detail-more"><span>There are ${projects.length-1} other projects to explore.</span><button type="button" class="px-text-button" data-show-all>See all ${projects.length} projects ↓</button></div>`;
    placePanel(); PacsPreviews.mount(panel);
    panel.querySelector('.px-close').addEventListener('click',close);
    panel.querySelector('[data-show-enquiry]').addEventListener('click',()=>{basket.add(p.id);openBasket();});
    if (focus) { panel.querySelector('h2').focus({preventScroll:true}); panel.scrollIntoView({block:'start',behavior:'instant'}); }
  }
  function close() {
    const id = current.project;
    current.project = ''; updateURL(); render();
    cards.find(c=>c.dataset.project === id)?.querySelector('a')?.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-open-project]').forEach(link=>{ link.href = `learn.html?project=${link.dataset.openProject}#project`; link.addEventListener('click',ev=>{
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault(); current.project = link.dataset.openProject; updateURL(); render({focus:true});
  }); });
  document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
    current = {goal:button.dataset.route,project:''}; updateURL(); render();
  }));
  document.getElementById('show-all').addEventListener('click',showAll);
  document.getElementById('basket-review').addEventListener('click',()=>basket.size ? openBasket() : showAll());
  document.querySelector('[data-close-basket]').addEventListener('click',()=>basketDialog.close());
  document.addEventListener('click',ev=>{
    const add = ev.target.closest('[data-add-project]'), remove = ev.target.closest('[data-remove-project]');
    if (add) {
      const id = add.dataset.addProject; basket.has(id) ? basket.delete(id) : basket.add(id); syncBasket();
      document.getElementById('basket-feedback').textContent = `${get(id).title} ${basket.has(id) ? 'added to' : 'removed from'} your basket. ${basket.size} selected.`;
    }
    if (remove) { basket.delete(remove.dataset.removeProject); syncBasket(); (basketDialog.querySelector('[data-remove-project]') || document.getElementById('basket-title')).focus(); }
    if (ev.target.closest('[data-show-all]')) { ev.preventDefault(); if(basketDialog.open)basketDialog.close(); showAll(); }
    const browse = ev.target.closest('[data-browse-project]');
    if (browse && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); current={goal:'',project:browse.dataset.browseProject};updateURL();render({focus:true}); }
  });
  addEventListener('popstate',()=>{current=state(location.search);render();if(current.project)panel?.scrollIntoView({block:'start',behavior:'instant'});});
  media.addEventListener('change',placePanel); tablet.addEventListener('change',placePanel);
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape' && panel && panel.contains(document.activeElement))close();});
  function bindEnquiry(form) {
    const project = form.dataset.enquiryProject, note = form.querySelector('textarea'), send = form.querySelector('[data-send-enquiry]');
    const reference = () => 'P-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
    let draft, ref, lastFingerprint;
    function update() {
      const chosen = form.hasAttribute('data-enquiry-basket') ? [...basket] : [];
      const goal = chosen.length ? '' : current.goal;
      const text = note.value.trim().slice(0,300), fingerprint = JSON.stringify([chosen,project,goal,text]);
      if (lastFingerprint && fingerprint !== lastFingerprint) form.querySelector('[data-enquiry-status]').textContent = '';
      lastFingerprint = fingerprint;
      if (!submissions.has(fingerprint)) submissions.set(fingerprint,{ref:reference(),saved:false});
      const record = submissions.get(fingerprint); ref = record.ref;
      draft = message({project,projectIds:chosen,goal,note:text,ref});
      send.href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(draft)}`;
      form.querySelector('[data-draft]').textContent = draft;
      return {record,text,chosen};
    }
    note.addEventListener('input',()=>{notes.set(project,note.value);update();}); refreshEnquiries.push(update); update();
    form.addEventListener('submit',ev=>ev.preventDefault());
    send.addEventListener('click',ev=>{
      const {record,text,chosen} = update(), p = get(project);
      if (form.hasAttribute('data-enquiry-basket') && !chosen.length) { ev.preventDefault(); return; }
      if (!record.saved && SITE.learnPicks) {
        const payload = {kind:'learn',ref,who:`AI for everyone${chosen.length ? ' · Basket' : current.goal ? ' · '+routes[current.goal] : ''}`,count:chosen.length || (p?1:0),picks:chosen.length ? chosen.map(id=>get(id).title).join(' | ') : p?.title || 'Help me choose a project',other:text,message:draft};
        const body = JSON.stringify(payload);
        try { record.saved = navigator.sendBeacon(SITE.learnPicks,new Blob([body],{type:'text/plain;charset=UTF-8'})); }
        catch (_) { /* WhatsApp still works if background saving is unavailable. */ }
        if (!record.saved) {
          record.saved = true;
          fetch(SITE.learnPicks,{method:'POST',body,mode:'no-cors',keepalive:true,headers:{'Content-Type':'text/plain;charset=UTF-8'}}).catch(()=>{record.saved=false;});
        }
      }
      const status = form.querySelector('[data-enquiry-status]');
      status.textContent = 'Your WhatsApp draft is ready. Press Send there to contact us. If it did not open, use the button again or ';
      const contact = document.createElement('a'); contact.href = 'contact.html'; contact.textContent = 'contact us here'; status.append(contact,'.');
    });
  }
  const personal = document.getElementById('idea-form');
  bindEnquiry(document.getElementById('basket-form'));
  bindEnquiry(personal);
  personal.addEventListener('submit',ev=>{
    ev.preventDefault(); personal.querySelector('[data-idea-continue]').hidden = false;
    personal.querySelector('[data-idea-start]').hidden = true;
    personal.querySelector('[data-send-enquiry]').focus();
  });
  document.querySelectorAll('[data-hero-preview]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-hero-preview]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.getElementById('hero-media').innerHTML = PacsPreviews.art(button.dataset.heroPreview);
    document.getElementById('hero-caption').textContent = get(button.dataset.heroPreview).sample;
  }));
  render();
  if (current.project) requestAnimationFrame(()=>panel?.scrollIntoView({block:'start',behavior:'instant'}));

  // Phones: the goal filters stick just under the site header (see learn.css), so measure the header once it is drawn.
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader && 'ResizeObserver' in window) new ResizeObserver(() => {
    document.documentElement.style.setProperty('--px-sticky-top', `${Math.round((parseFloat(getComputedStyle(siteHeader).top) || 0) + siteHeader.offsetHeight)}px`);
  }).observe(siteHeader, {box:'border-box'});
})();
