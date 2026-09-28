(function () {
  'use strict';
  const {escape:e, report, flight} = PacsProjects;
  const money = n => '₹' + n.toLocaleString('en-IN');
  const button = (action, text) => `<button type="button" class="px-small-button" data-example-action="${action}">${text}</button>`;
  const ad = () => `<div class="px-ad-art"><img src="assets/monsoon-campaign.png" alt="Sample Monsoon Brew cold-brew bottle against a sunlit orange backdrop" width="1536" height="1024"><div class="px-ad-copy"><small>MONSOON BREW</small><strong>A little<br>slow.<br>A lot bold.</strong><span>Cold brew. Warm afternoons.</span></div><span class="px-art-stamp">SAMPLE CAMPAIGN</span></div>`;
  const website = () => `<div class="px-web-art"><div class="px-browser-bar"><i></i><i></i><i></i><span>thelittlecafe.example</span></div><div class="px-cafe"><span class="px-cafe-logo">the little café<span>COFFEE &amp; CONVERSATION</span></span><strong>Good days<br>start slow.</strong><div class="px-cup" aria-hidden="true">☕</div><span class="px-cafe-link">Your neighbourhood coffee stop ↗</span></div></div>`;
  const reports = () => `<div class="px-report-art"><div class="px-report-title"><span>WEEKLY SALES</span><span class="px-report-dot">● Updated</span></div><strong data-report-total>₹66,000</strong><span class="px-report-sub">Four stores. One clear picture.</span><div class="px-bars" aria-hidden="true">${[50,75,63,88].map((n,i)=>`<span><i style="height:${n}%" data-bar="${i}"></i><small>${['North','East','West','South'][i]}</small></span>`).join('')}</div><div class="px-report-footer">Data → Report → Review</div></div>`;
  const presenter = () => `<div class="px-presenter-art"><div class="px-presenter-orbit" aria-hidden="true"><span>AI</span><i></i><i></i></div><small>FROM SCRIPT TO SCREEN</small><strong>Your ideas.<br>Presented.</strong><span class="px-caption" data-presenter-caption>“Let me show you how it works.”</span></div>`;
  const assistant = () => `<div class="px-assistant-art"><div class="px-chat-head"><span>m.</span><div>Monsoon assistant<small>Sample product catalogue</small></div></div><div class="px-bubble px-user-bubble">Which coffee is less sweet?</div><div class="px-bubble">Our Original Cold Brew has no added sugar.<br><b>250 ml · ₹180</b></div><div class="px-chat-choice">View product ↗</div></div>`;
  const lesson = () => `<div class="px-lesson-art"><span>THE GRAVITY LAB</span><strong>Same launch.<br>Different planet.</strong><svg viewBox="0 0 360 140" aria-hidden="true"><path d="M30 115 Q100 -65 170 115" fill="none" stroke="#9bc6a6" stroke-width="2" stroke-dasharray="5 6"/><path d="M160 115 Q235 15 310 115" fill="none" stroke="#63856d" stroke-width="2" stroke-dasharray="5 6"/><line x1="20" y1="117" x2="340" y2="117" stroke="#9bb29d"/><circle cx="100" cy="29" r="13" fill="#d4f08a"/><circle cx="235" cy="66" r="10" fill="#f6f2dd"/></svg><div class="px-planet-labels"><span>Moon ↗</span><span>Earth ↓</span></div></div>`;
  const stocks = () => `<div class="px-stocks-art"><span>OPPORTUNITY. PRICE. RISK.</span><strong>Make your<br>next move<br>an informed one.</strong><svg viewBox="0 0 360 105" aria-hidden="true"><path d="M0 87L28 72L51 79L78 48L106 61L129 35L155 54L180 29L206 41L232 14L258 29L285 11L308 27L335 7L360 16" fill="none" stroke="#cbdf89" stroke-width="3"/><path d="M0 88L360 88" stroke="#678774" stroke-dasharray="4 6"/></svg><div><span>Understand the business</span><span>Read the numbers ↗</span></div></div>`;
  function art(id) { return ({'product-ads':ad,'stocks':stocks,'ai-presenter':presenter,'client-websites':website,'sales-assistants':assistant,'reports-on-autopilot':reports,'interactive-lessons':lesson}[id] || ad)(); }
  function preview(id) {
    let controls = '';
    if (id === 'stocks') controls = `<div class="px-sample-controls"><span>Three companies. What would you look at first?</span><table class="px-source-table"><caption>Fictional figures for practice</caption><thead><tr><th>Company</th><th>Growth</th><th>P/E</th><th>Debt / equity</th></tr></thead><tbody><tr><th>Practice A</th><td>18%</td><td>24×</td><td>0.4×</td></tr><tr><th>Practice B</th><td>26%</td><td>48×</td><td>1.6×</td></tr><tr><th>Practice C</th><td>9%</td><td>16×</td><td>0.2×</td></tr></tbody></table><div class="px-control-row">${button('stock-growth','Growth')}${button('stock-price','Valuation')}${button('stock-risk','Risk')}</div><p data-example-status role="status">Choose a lens to explore the trade-offs. Growth is year-on-year revenue growth; P/E is price divided by earnings per share.</p></div>`;
    if (id === 'product-ads') controls = `<div class="px-sample-controls"><span>Choose a campaign frame</span><div class="px-control-row">${button('ad-0','01 · Hook')}${button('ad-1','02 · Product')}${button('ad-2','03 · Invitation')}</div><p data-example-status role="status">A storyboard preview using generated campaign artwork.</p></div>`;
    if (id === 'ai-presenter') controls = `<div class="px-sample-controls"><span>A 3-part product explainer</span><div class="px-control-row">${button('script-0','Hook')}${button('script-1','Explain')}${button('script-2','Close')}</div><p data-example-status role="status">Script and caption storyboard. A finished avatar video is part of the learning project.</p></div>`;
    if (id === 'client-websites') controls = `<div class="px-sample-controls"><span>Explore the sample site</span><div class="px-control-row">${button('cafe-menu','See the menu')}${button('cafe-enquiry','Try an enquiry')}</div><div data-example-status role="status">Fictional café. This preview sends no orders or bookings.</div></div>`;
    if (id === 'sales-assistants') controls = `<div class="px-sample-controls"><span>Ask the sample catalogue</span><div class="px-control-row">${button('chat-price','What does it cost?')}${button('chat-stock','Is it in stock?')}${button('chat-human','Ask a person')}</div><p data-example-status role="status">Choose a question. Responses are scripted for this example.</p></div>`;
    if (id === 'reports-on-autopilot') controls = `<div class="px-sample-controls"><span>Load a sample data file</span><div class="px-control-row">${button('week1','Week 1.csv')}${button('week2','Week 2.csv')}</div><p data-example-status role="status">Week 1: ₹66,000 total. South leads at ₹21,000. Review before sharing.</p><details><summary>See the source data</summary><table class="px-source-table"><caption>Sample store sales in rupees</caption><thead><tr><th>Store</th><th>Week 1</th><th>Week 2</th></tr></thead><tbody><tr><th>North</th><td>12,000</td><td>15,000</td></tr><tr><th>East</th><td>18,000</td><td>19,000</td></tr><tr><th>West</th><td>15,000</td><td>17,000</td></tr><tr><th>South</th><td>21,000</td><td>24,000</td></tr></tbody></table></details></div>`;
    if (id === 'interactive-lessons') controls = `<div class="px-sample-controls"><label>Gravity: <output data-gravity-output>9.8 m/s²</output><input type="range" min="1.6" max="20" step="0.1" value="9.8" data-gravity aria-label="Gravity in metres per second squared"></label><p data-example-status role="status">At 10 m/s upwards: peak 5.1 m; return in 2.04 s.</p><small>Idealised vertical launch. Same start and landing height; no air resistance.</small></div>`;
    const liveLesson = `<div class="px-lesson-art"><span>THE GRAVITY LAB</span><strong>How high<br>will it go?</strong><svg viewBox="0 0 360 140" role="img" aria-label="Maximum height of a vertical launch, on a zero to 32 metre scale"><line x1="70" y1="115" x2="320" y2="115" stroke="#9bb29d"/><line x1="70" y1="18" x2="70" y2="115" stroke="#9bb29d"/><text x="28" y="119" fill="#bed2ac" font-size="11">0 m</text><text x="20" y="23" fill="#bed2ac" font-size="11">32 m</text><line data-height-line x1="195" y1="115" x2="195" y2="99.7" stroke="#d4f08a" stroke-dasharray="4 4"/><circle cx="195" cy="99.7" r="9" fill="#d4f08a"/></svg><div class="px-planet-labels"><span>Launch speed: 10 m/s ↑</span></div></div>`;
    return `<div class="px-example" data-example="${e(id)}">${id === 'interactive-lessons' ? liveLesson : art(id)}${controls}</div>`;
  }
  function mount(root) {
    root.querySelectorAll('[data-project-art]').forEach(el => { el.innerHTML = art(el.dataset.projectArt); });
    root.querySelectorAll('[data-project-preview]').forEach(el => { el.innerHTML = preview(el.dataset.projectPreview); });
  }
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-example-action]'); if (!b) return;
    const box = b.closest('.px-example'), status = box.querySelector('[data-example-status]'), action = b.dataset.exampleAction;
    box.querySelectorAll('[data-example-action]').forEach(el => el.setAttribute('aria-pressed',String(el === b)));
    if (action.startsWith('stock-')) {
      status.textContent = {'stock-growth':'B has the fastest revenue growth at 26%. Next, investigate whether profits and cash flow are keeping up. Faster growth alone does not tell the whole story.','stock-price':'C has the lowest P/E at 16×. Compare businesses in the same sector and ask what explains the price: slower growth, temporary earnings or something the market has missed.','stock-risk':'B carries the most debt relative to equity. Look at interest costs, cash flow and repayment dates, then write down what could go wrong with your original case.'}[action];
    } else if (action.startsWith('ad-')) {
      const i = Number(action.slice(-1));
      box.querySelector('.px-ad-copy strong').innerHTML = ['A little<br>slow.<br>A lot bold.','Cold brewed.<br>Never<br>rushed.','Make time<br>for good<br>coffee.'][i];
      box.querySelector('.px-ad-art').dataset.frame = i;
      status.textContent = ['Frame 1 · Catch attention with one clear idea.','Frame 2 · Introduce the product and its character.','Frame 3 · End with a clear invitation.'][i];
    } else if (action.startsWith('script-')) {
      const lines = ['“What if your next product launch could explain itself?”','“Start with a script. Add your presenter, visuals and captions.”','“One clear message, ready for your audience.”'];
      box.querySelector('[data-presenter-caption]').textContent = lines[Number(action.slice(-1))];
      status.textContent = 'Caption preview · ' + ['Hook the viewer.','Explain the idea.','Give a clear next step.'][Number(action.slice(-1))];
    } else if (action === 'cafe-menu') {
      status.innerHTML = '<div class="px-menu-item"><b>Original cold brew</b><span>₹180</span></div><div class="px-menu-item"><b>Oat latte</b><span>₹220</span></div><div class="px-menu-item"><b>Chocolate cookie</b><span>₹90</span></div><small>Sample menu prices.</small>';
    } else if (action === 'cafe-enquiry') {
      status.innerHTML = `<label>What would you like to ask?<select data-cafe-question><option>A table for two</option>A private gathering</option>A takeaway order</option></select></label>${button('cafe-draft','Preview enquiry')}`;
    } else if (action === 'cafe-draft') {
      const choice = box.querySelector('[data-cafe-question]').value;
      status.textContent = `Sample enquiry: “Hello Little Café, I’d like to ask about ${choice.toLowerCase()}.” A real site can hand this to the business. Nothing was sent.`;
    } else if (action.startsWith('chat-')) {
      const answers = {'chat-price':'Original Cold Brew is ₹180 for 250 ml. Oat Latte is ₹220. These are sample catalogue prices.','chat-stock':'I don’t have live stock information. I can pass your product and quantity to the team to confirm.','chat-human':'Handover example: Product: Original Cold Brew. Question: Confirm availability. A person follows up; this demo sends nothing.'};
      box.querySelectorAll('.px-bubble')[0].textContent = b.textContent;
      box.querySelectorAll('.px-bubble')[1].textContent = answers[action];
      status.textContent = action === 'chat-stock' ? 'Missing information → human handover.' : 'Response from the sample catalogue.';
    } else if (action === 'week1' || action === 'week2') {
      const data = report(action);
      box.querySelector('[data-report-total]').textContent = money(data.total);
      box.querySelectorAll('[data-bar]').forEach((bar,i)=>bar.style.height = `${data.values[i]/24000*100}%`);
      status.textContent = `${action === 'week1' ? 'Week 1' : 'Week 2'}: ${money(data.total)} total. South leads at ${money(data.values[3])}. Review before sharing.`;
    }
  });
  document.addEventListener('input', ev => {
    if (!ev.target.matches('[data-gravity]')) return;
    const box = ev.target.closest('.px-example'), gravity = Number(ev.target.value), result = flight(gravity);
    box.querySelector('[data-gravity-output]').textContent = gravity.toFixed(1) + ' m/s²';
    box.querySelector('[data-example-status]').textContent = `At 10 m/s upwards: peak ${result.height.toFixed(1)} m; return in ${result.time.toFixed(2)} s.`;
    const circle = box.querySelector('circle');
    const y = String(115-result.height/32*97);
    circle.setAttribute('cy',y);
    box.querySelector('[data-height-line]').setAttribute('y2',y);
  });
  window.PacsPreviews = {art,preview,mount};
  mount(document);
})();
