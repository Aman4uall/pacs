/* Beyond the Blackboard: self-contained, local worked examples. No AI requests. */
(function () {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0));
  function buoyancy(shape = 'wide', cargo = 0) {
    const capacity = ({solid: 2 / 7.85, small: 3, wide: 5})[shape] || 5;
    cargo = shape === 'solid' ? 0 : clamp(cargo, 0, 4);
    const mass = 2 + cargo, ratio = mass / capacity;
    return {capacity, cargo, mass, ratio, status: ratio > 1 ? 'sinks' : ratio === 1 ? 'limit' : 'floats'};
  }
  const lessons = objects => [
    [4, 'Notice', objects ? 'Pass around a metal spoon and a wooden spoon. Predict which handle warms faster in warm water.' : 'Project a drawing of metal and wooden spoons in warm water. Ask which handle will warm faster.'],
    [8, 'Explain', objects ? 'Draw arrows on the board from warm water along the spoon. Label conduction and compare the materials.' : 'Build the explanation on the projected drawing: energy moves from the warmer water through the spoon. Label conduction.'],
    [10, 'Investigate', 'In groups, plan a fair comparison: same water temperature, immersion depth and time. The teacher handles warm water and supervises the observation.'],
    [8, 'Apply', 'Discuss a pan handle, a fabric sleeve around a warm cup and a steel lunchbox. Which material choice helps in each situation, and why?'],
    [5, 'Check', 'Exit ticket: draw the path of heat, explain one material choice, and write one question you still have.']
  ];
  const questions = [
    ['Heat',2,'What is conduction? Give one everyday example.','Heat transfer through a material without bulk movement of the material; for example, a spoon warming in hot water.','Meaning (1); valid example (1).'],
    ['Light',2,'A light ray meets a plane mirror at 35° to the normal. State the angle of reflection and the rule used.','35°. The angle of reflection equals the angle of incidence, both measured from the normal.','35° (1); correct rule (1).'],
    ['Force',2,'Describe two different effects a force can have on an object.','Any two: change speed, change direction, change shape.','One mark per different valid effect (2).'],
    ['Heat',2,'How does energy from the Sun reach Earth? Why cannot conduction carry it across space?','By radiation. Conduction needs matter, which is absent in a vacuum.','Radiation (1); conduction requires matter (1).'],
    ['Heat',3,'A pan has a metal body and a wooden handle. Explain both material choices and one limitation of the handle.','Metal conducts heat to the food. Wood is a poorer conductor and slows heat transfer to the hand. It can still become hot after prolonged heating or near a flame.','Metal explanation (1); wood explanation (1); valid limitation (1).'],
    ['Light',3,'A toy stands 20 cm in front of a plane mirror. State the image distance, relative size and whether the image can be caught on a screen.','20 cm behind the mirror; the same size; virtual, so it cannot be formed on a screen.','Distance and side (1); size (1); virtual / no screen (1).'],
    ['Force',3,'You slide the same box at a steady speed across a smooth floor and a rough mat. Which usually needs a larger push? Explain the role and direction of friction.','The rough mat usually needs a larger push. Friction opposes relative sliding; a larger push balances the larger friction at steady speed.','Rough mat (1); opposing direction (1); balance at steady speed (1).'],
    ['Light',3,'A wall does not produce light. Explain how you can see it in a room lit by a lamp, including the path of light.','Light travels from the lamp to the wall, reflects from the wall and reaches the eye.','Lamp to wall (1); reflection (1); wall to eye (1).'],
    ['Heat',5,'Plan a fair comparison of heat conduction in metal and wooden spoons using warm water. Give a question, what you change, two controls and what you observe or measure.','Ask which material warms the handle faster. Change spoon material; keep immersion depth and starting water temperature the same. Compare handle temperature after the same time with teacher supervision.','Testable question (1); material variable (1); two valid controls (2); relevant observation or measurement (1).'],
    ['Light',5,'Draw and label a ray reflecting from a plane mirror. Include the normal, incident ray, reflected ray and both angles. State how you would check the drawing.','Normal perpendicular to mirror; incident ray toward mirror; reflected ray away; angles measured from normal; angles equal.','Perpendicular normal (1); incident ray and direction (1); reflected ray and direction (1); angles from normal (1); equal-angle check (1).'],
    ['Force',5,'Two identical toy cars start at rest; one carries an added mass. Predict which changes speed more under the same push for the same duration. Explain and describe a fair test.','The lighter car changes speed more. For the same force, greater mass gives less acceleration. Vary added mass; control push duration, force and surface. Measure the change in speed.','Prediction (1); reason (1); mass as variable (1); relevant controls (1); speed-change measurement (1).'],
    ['Force',5,'Why can a broad schoolbag strap feel more comfortable than a narrow one for the same load? Explain force, area and pressure, then suggest a fair comparison.','Weight gives the same force; a broader strap spreads it over a larger area, reducing pressure and discomfort. Compare straps with the same load and material.','Same force (1); larger area (1); lower pressure (1); comfort connection (1); fair comparison (1).']
  ];
  function paper(revised = false, alternate = false) {
    const result = questions.map((q, i) => ({number:i+1, topic:q[0], marks:q[1], question:q[2], answer:q[3], marking:q[4], changed:false}));
    if (revised) result[3] = {number:4, topic:'Heat', marks:2, question:'A metal spoon and a wooden spoon stand in the same warm water. Which handle usually warms faster, and why?', answer:'The metal handle usually warms faster because metal conducts heat better than wood.', marking:'Metal handle (1); better conduction explanation (1).', changed:true};
    return alternate ? [0,4,8].flatMap(start => result.slice(start,start+4).reverse()).map((q,i)=>({...q,number:i+1})) : result;
  }
  function paperTotals(revised = false) { return paper(revised).reduce((a,q)=>{a.total+=q.marks; a[q.topic]=(a[q.topic]||0)+q.marks;return a;},{total:0}); }
  function evidenceFeedback(headline, selected) {
    const supporting = headline === 0 ? [0,2] : [1];
    if (!selected.length) return 'Pick a source to support your headline.';
    if (!selected.some(i => supporting.includes(i))) return 'Context, but not proof of this headline. Try another source.';
    return headline === 0 ? 'This supports the protest angle. What does the headline leave out?' : 'This supports the official warning. Whose perspective is missing?';
  }
  const subjects = {
    science:{label:'Science',title:'Build a ship. Find its limit.',intro:'Same steel. Change the shape, then load it until it sinks.',outcome:'Turn a difficult question into an experiment students can control.',pack:['Observation sheet','Visual explanation','Audio explanation']},
    maths:{label:'Maths',title:'Same fence. A bigger playground?',intro:'Reshape the field. Find the largest area with 40 metres of fence.',outcome:'Build a model students can change, measure and explain.',pack:['Challenge sheet','Playground model','Audio explanation']},
    history:{label:'History',title:'Make tomorrow’s front page.',intro:'Pick an angle. Back it with a source.',outcome:'Turn a chapter into an investigation where students have to defend a decision.',pack:['Newspaper template','Source timeline','Narrated introduction']},
    english:{label:'English',title:'The school trophy has disappeared.',intro:'Two accounts. One missing detail. Ask the question that cracks the case.',outcome:'Create a story students explore through dialogue, clues and their own reasoning.',pack:['Evidence worksheet','Story illustration','Character audio']}
  };
  function shipMarkup(id, compact = false) {
    return `<div class="bb-ship ${compact?'bb-ship-compact':''}" data-ship="${id}"><div class="bb-demo-label"><span>Same steel. Different shape.</span><span>2 kg of steel</span></div><div role="group" aria-label="Choose a steel shape" class="bb-segment"><button type="button" data-shape="solid" aria-pressed="false">Solid piece</button><button type="button" data-shape="small" aria-pressed="false">Small hull</button><button type="button" data-shape="wide" aria-pressed="true">Wide hull</button></div><div data-ship-art></div><div class="bb-cargo"><label for="cargo-${id}">Add cargo <output data-cargo-value>0 kg</output></label><input id="cargo-${id}" type="range" min="0" max="4" step="0.5" value="0" aria-label="Cargo in kilograms"><span class="bb-range-labels"><span>0 kg</span><span>4 kg</span></span></div><p class="bb-feedback" data-ship-feedback aria-live="polite"></p>${compact?'':`<details class="bb-model-note"><summary>What this model shows</summary><p>Fresh water supports 1 kg for each litre displaced. The small and wide open hulls can displace up to 3 and 5 litres before the rim reaches the water. At that limit there is no spare capacity; adding more cargo floods the hull. This simplified model assumes a stable hull and omits waves and tipping. The solid steel piece has a volume of about 0.25 litres.</p><a href="https://www.grc.nasa.gov/www/k-12/WindTunnel/Activities/buoy_Archimedes.html" target="_blank" rel="noopener">The principle of buoyancy · NASA ↗</a></details>`}</div>`;
  }

  const sources = [
    ['02 MAR 1930','A letter explaining the protest','Gandhi writes to the Viceroy, setting out grievances and his reasons for breaking the salt law.'],
    ['MAR 1930','The official response','The Viceroy’s office replies with concern about breaking the law and the danger to public peace.'],
    ['12 MAR 1930','The march begins','Gandhi and the marchers leave Sabarmati Ashram on their journey to Dandi.']
  ];

  const accounts = [
    ['Mira','At 10:05, I saw the metal trophy in the cabinet. It had a blue ribbon.'],
    ['Arun','At 10:00, I took a trophy to the hall. I stayed there with it until 10:20.']
  ];
  const clues = [
    ['Ask Arun','“It was very light. The back was plain brown cardboard.” The two accounts may describe different objects.'],
    ['Ask Mira','“I saw the blue-ribbon trophy, but I did not see anyone move it.” Her observation does not identify the person who moved it.'],
    ['Ask the caretaker','“At 10:15 I moved the metal trophy to the library display. I left a note.” Now you can explain where the original went.']
  ];
  function trophyArt() { return `<svg viewBox="0 0 510 200" role="img" aria-label="A trophy cabinet and a rehearsal note"><rect width="510" height="200" rx="12" fill="#e9e4ef"/><rect x="46" y="24" width="231" height="155" rx="7" fill="#675875"/><rect x="58" y="36" width="207" height="126" fill="#d3cadf"/><path d="M143 64h48v32q0 28-24 28t-24-28Z" fill="#c79042"/><path d="M142 69h-15v22q0 15 20 15m44-37h15v22q0 15-20 15" fill="none" stroke="#c79042" stroke-width="7"/><path d="M167 121v21m-19 3h38" stroke="#a66c29" stroke-width="9"/><path d="M166 73v47l10-8 10 8V73" fill="#547eb8"/><path d="M50 163h223" stroke="#48394f" stroke-width="5"/><g transform="translate(307 36) rotate(5)"><rect width="154" height="127" fill="#fffdf5"/><text x="17" y="29" fill="#5c4a65" font-family="sans-serif" font-size="12">REHEARSAL NOTE</text><path d="M17 46h117m-117 16h104m-104 16h115m-115 16h79" stroke="#c8bed1" stroke-width="4"/><circle cx="77" cy="5" r="5" fill="#cf343e"/></g></svg>`; }
  function englishMarkup() {
    return `<div class="bb-mystery"><div class="bb-demo-label"><span>Case file 01 · The missing trophy</span><span>Fictional story</span></div>${trophyArt()}<div class="bb-witnesses">${accounts.map((a,i)=>`<article><span class="bb-avatar">${a[0][0]}</span><h4>${a[0]}’s account</h4><p>“${a[1]}”</p><button type="button" class="bb-text-button" data-speak="account-${i}">Read aloud ↗</button></article>`).join('')}</div><details class="bb-clue"><summary>Open the rehearsal note</summary><p>“Use the cardboard replica for rehearsal. Leave the original trophy in the cabinet.”</p></details><p class="bb-kicker">Who will you question?</p><div class="bb-clue-buttons">${clues.map((c,i)=>`<button type="button" data-clue="${i}" aria-pressed="false">${c[0]} <span>↗</span></button>`).join('')}</div><p class="bb-feedback" data-clue-feedback aria-live="polite">Choose a question to uncover the next detail.</p><details class="bb-model-note"><summary>Compare your explanation</summary><p>Arun carried a cardboard replica. Mira saw the metal original. The caretaker later moved that original to the library. Two truthful accounts described different objects; neither account alone proved a theft.</p><p>Retell the scene from Mira’s point of view, showing when she learns each new detail.</p></details></div>`;
  }
  function worksheet(subject) {
    if(subject==='maths')return `<h3>Design the biggest playground.</h3><p>Your fence is 40 metres long. Test three rectangles.</p><table><thead><tr><th>Width</th><th>Length</th><th>Area</th></tr></thead><tbody><tr><td>16 m</td><td>4 m</td><td>64 m²</td></tr><tr><td>____</td><td>____</td><td>____</td></tr><tr><td>____</td><td>____</td><td>____</td></tr></tbody></table><h4>Defend your design</h4><p>Why does changing the shape change the area when the perimeter stays fixed? Can you show why no rectangle beats 10 × 10 m?</p>`;
    if(subject==='science') return `<h3>Predict. Test. Explain.</h3><p>Keep the steel at 2 kg. Record your prediction before each change.</p><table><thead><tr><th>Trial</th><th>My prediction</th><th>What happened?</th></tr></thead><tbody><tr><td>Solid steel</td><td>________</td><td>________</td></tr><tr><td>Hollow hull</td><td>________</td><td>________</td></tr><tr><td>Add cargo</td><td>________</td><td>________</td></tr></tbody></table><h4>Explain your result</h4><p>What stayed the same? What changed? Why does a wider hull support more cargo before water reaches the rim?</p><h4>Take it further</h4><p>Make a foil boat. Predict how many identical counters it can carry. Reshape the same foil and test again in a shallow tray.</p>`;
    if(subject==='history') return `<h3>Tomorrow’s front page</h3><p><strong>Headline:</strong> __________________________</p><p><strong>Opening sentence:</strong> what happened, where and when?</p><p><strong>Evidence:</strong> name the source that supports each claim.</p><p><strong>Missing perspective:</strong> what does your angle leave out?</p><div class="bb-role-grid"><span>Reporter<br><small>Draft the report</small></span><span>Editor<br><small>Choose the angle</small></span><span>Source checker<br><small>Match claims to evidence</small></span><span>Reader<br><small>Question what is missing</small></span></div><h4>Reasoning rubric · 6 points</h4><p>Accurate claim (2) · relevant evidence (2) · acknowledgement of another perspective (2).</p>`;
    return `<h3>What do we know for sure?</h3><table><thead><tr><th>Character</th><th>Observed</th><th>Still unknown</th></tr></thead><tbody><tr><td>Mira</td><td>Metal trophy, 10:05</td><td>Who moved it?</td></tr><tr><td>Arun</td><td>Carried a trophy, 10:00</td><td>Which trophy?</td></tr></tbody></table><h4>Build an explanation</h4><p>Which clue changed your interpretation? Quote or paraphrase the detail, then explain your reasoning.</p><h4>Write from another viewpoint</h4><p>Retell the scene as Mira. Keep the times and objects consistent, and show the difference between what she knows and what she assumes.</p>`;
  }
  function paperMarkup(view, revised) {
    const totals = paperTotals(revised), alt = view==='alternate';
    return `<div class="bb-document-heading"><span>Science · teacher draft</span><b>40 marks</b></div><h3>${({paper:'Question paper',answers:'Answer key',marking:'Marking scheme',alternate:'Version B'})[view]}</h3><p class="bb-small">Heat ${totals.Heat} · Light ${totals.Light} · Force ${totals.Force} · 12 questions</p>${alt?'<p class="bb-notice">Same questions, reordered within each marks section. Review before using with another class.</p>':''}${revised?'<p class="bb-change">Revised: the 2-mark recall question now uses a classroom situation. Total remains 40.</p>':''}<ol class="bb-paper">${paper(revised,alt).map(q=>`<li${q.changed?' class="bb-updated"':''}><div><span>${q.topic}${q.changed?' · revised':''}</span><b>${q.marks} marks</b></div><p>${esc(q.question)}</p>${view==='answers'?`<p class="bb-answer">${esc(q.answer)}</p>`:view==='marking'?`<p class="bb-answer">${esc(q.marking)}</p>`:''}</li>`).join('')}</ol>`;
  }
  const assistantData = {
    lesson:{name:'Tomorrow’s lesson',context:'Class 7 science · 35-minute periods · observation → explanation → activity → check',request:'“Create a 35-minute heat-transfer lesson for Class 7.”',revision:'“No projector tomorrow. Use the board and everyday objects.”'},
    paper:{name:'Question-paper assistant',context:'Science · school paper format · 40 marks · approved chapter material · marking style',request:'“Make a 40-mark science paper, answer key and marking scheme.”',revision:'“Replace the last recall question with a classroom situation. Keep 40 marks.”'},
    tutor:{name:'A tutor for every student',context:'Approved buoyancy material · class vocabulary · hints before answers',request:'Learner: “The ship floats because steel becomes lighter when we change its shape.”',revision:'“Use everyday language before introducing displacement.”'},
    media:{name:'A chapter as a visual story',context:'Circulation · six scenes · short narration · simple labels',request:'“Turn blood circulation into a six-scene visual explanation.”',revision:'“Pause at the lungs and ask where the cell travels next.”'},
    language:{name:'Every child’s language',context:'Class 7 science · English, Hindi and Kannada · read aloud for students who read slowly',request:'“Explain why a steel ship floats, in English, Hindi and Kannada. Read each one aloud.”',revision:'“Add one example from home.”'},
    message:{name:'School-communication assistant',context:'School tone · parent, staff and assembly formats · English and Hindi',request:'“Sports Day is indoors at 9 am. Draft parent, staff and assembly messages.”',revision:'“Make the parent message shorter. Put the arrival time first.”'}
  };
  const scenes = [
    ['From body to heart','After delivering oxygen to body tissues, the blood returns to the right side of the heart.'],
    ['Right heart → lungs','The right ventricle pumps blood through the pulmonary arteries towards the lungs.'],
    ['At the lungs','In the lungs, blood releases carbon dioxide and takes up oxygen.'],
    ['Lungs → left heart','Blood returns through the pulmonary veins to the left atrium.'],
    ['Left heart → body','The left ventricle pumps oxygen-rich blood through the aorta to the body.'],
    ['Back around again','Body tissues use the oxygen. The blood returns to the right heart and the journey continues.']
  ];
  const narration = {
    science:'A solid steel piece sinks because it cannot displace enough water to support its weight. A hollow hull spreads the same steel around a space. It can displace more water before the rim goes under. Add cargo and it sits deeper. Once the rim reaches the water, adding more cargo can flood the boat.',
    history:'It is 12 March 1930. Gandhi and the marchers leave Sabarmati Ashram for Dandi. Earlier correspondence sets out the reasons for the protest and the official response. Your task is to choose a headline, attach supporting evidence and explain which perspective it leaves out.',
    maths:'The fence stays at 40 metres. As you increase the width, the length must decrease. Area is width times length. A 16 by 4 metre field has 64 square metres. A 10 by 10 metre square has 100 square metres, the largest possible area for this rectangular playground.',
    english:accounts.map(a=>`${a[0]} says: ${a[1]}`).join(' ')
  };
  function playground(width) {
    const w = Math.round(clamp(width,2,18)), length = 20-w;
    return {width:w,length,area:w*length,perimeter:40};
  }
  function circuit(parallel,broken) { return [!broken,parallel||!broken,parallel||!broken]; }
  function shipArt(id) {
    return `<svg class="bb-ship-scene" viewBox="0 0 520 290" role="img" aria-label="Steel hull floating in water">
      <defs><linearGradient id="sea-shade-${id}" x2="0" y2="1"><stop stop-color="#9fcfc7"/><stop offset="1" stop-color="#659c9a"/></linearGradient></defs>
      <rect width="520" height="290" fill="#e7eee5"/><circle cx="449" cy="51" r="25" fill="#ebcc91"/>
      <path d="M53 76h44m-28-10h45m239 22h40" stroke="#d1dfd3" stroke-width="5" stroke-linecap="round"/>
      <path d="M0 180Q65 172 130 180T260 180T390 180T520 180V290H0Z" fill="url(#sea-shade-${id})"/>
      <g data-solid-body style="opacity:0;transform:translateY(128px)"><path d="M253 0h14v52l-7 14-7-14Z" fill="#5d7180"/><rect x="248" y="-4" width="24" height="7" rx="2" fill="#334c5a"/><path d="M257 4v45" stroke="#bdcdd0" stroke-width="2"/></g>
      <g data-hull-motion style="transform:translateY(145.2px)"><g class="bb-hull-settle"><path data-hull-path d="M140 0H380L354 45Q260 70 166 45Z" fill="#f8f5df" stroke="#284c4b" stroke-width="2.5"/><path data-hull-shade d="M149 15H371L354 45Q260 70 166 45Z" fill="#cfdbd0"/><path data-hull-rim d="M140 0H380" stroke="#284c4b" stroke-width="4" stroke-linecap="round"/><path d="M289 0V-60" stroke="#284c4b" stroke-width="3"/><path class="bb-flag" d="M291-59H329L319-47L329-35H291Z" fill="#c72f3d"/><g data-cargo-crates></g><path data-hull-detail d="M174 37Q260 56 346 37" fill="none" stroke="#80998c" stroke-width="2"/></g></g>
      <g class="bb-bubbles">${[[238,196,0],[262,206,.5],[282,190,1],[250,214,1.4]].map(([x,y,d])=>`<circle cx="${x}" cy="${y}" r="4" style="animation-delay:${d}s"/>`).join('')}</g><path class="bb-front-water" d="M-40 182Q25 174 90 182T220 182T350 182T480 182T610 182V310H-40Z" fill="#4d99983b"/><path class="bb-water-line" d="M-40 182Q25 174 90 182T220 182T350 182T480 182T610 182" fill="none" stroke="#4b8682" stroke-width="2"/>
      <path d="M26 231h70m295 17h68m-298 26h62" stroke="#b6d8cc" stroke-width="2" stroke-linecap="round"/>
      <g fill="#315753" font-family="sans-serif" font-size="12"><text x="23" y="29" data-ship-mass>2 kg total</text><text x="23" y="49" data-ship-status>Floating</text></g>
    </svg>`;
  }
  function mathsMarkup(id='main') {
    return `<div class="bb-maths" data-maths><div class="bb-demo-label"><span>40 metres of fence. Make more room.</span><span>Perimeter stays fixed</span></div><div class="bb-maths-metrics"><span><small>PLAYGROUND AREA</small><b data-area>64 <em>m²</em></b></span><span><small>YOUR BEST</small><b data-best>64 <em>m²</em></b></span></div><svg viewBox="90 0 340 310" class="bb-playground" role="img" aria-label="Playground 16 metres wide and 4 metres long"><defs><pattern id="grid-${id}" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" stroke="#d7dcc9" fill="none" stroke-width=".6"/></pattern></defs><rect width="520" height="310" fill="#eef0df"/><rect x="40" y="13" width="440" height="282" fill="url(#grid-${id})"/><rect data-field x="148" y="119" width="224" height="56" rx="3" fill="#83ae78" stroke="#315e37" stroke-width="3"/><rect data-field-lines x="155" y="126" width="210" height="42" rx="1" fill="none" stroke="#edf0d7" stroke-width="1.5"/><path data-field-middle d="M260 126V168" stroke="#edf0d7" stroke-width="1.5"/><circle cx="260" cy="147" r="13" fill="none" stroke="#edf0d7" stroke-width="1.5"/><g fill="#315a32" font-family="sans-serif" font-size="14" font-weight="600"><text data-field-width x="260" y="200" text-anchor="middle">16 m</text><text data-field-length x="390" y="152">4 m</text></g><path d="M61 254v25m-9-18 9-13 9 13" fill="none" stroke="#849568" stroke-width="2"/></svg><div class="bb-maths-controls"><label for="maths-${id}">Change the width <output data-width-value>16 m</output></label><input id="maths-${id}" type="range" min="2" max="18" step="1" value="16" aria-label="Playground width in metres"><div class="bb-range-labels"><span>2 m</span><span>18 m</span></div></div><p class="bb-feedback" data-maths-feedback aria-live="polite">Slide to reshape it. Can the same fence enclose more space?</p><details class="bb-model-note"><summary>Why does the area change?</summary><p>Width + length stays at 20 m, so the boundary stays at 40 m. Area = width × length. The square, 10 × 10 m, gives the largest area: 100 m².</p></details></div>`;
  }
  function marchArt() { return `<svg viewBox="0 0 520 230" role="img" aria-label="Illustration of marchers, with a 12 March 1930 dateline"><rect width="520" height="230" fill="#e5dbb8"/><circle cx="421" cy="51" r="30" fill="#cf794c"/><path d="M0 168Q116 109 259 173T520 160V230H0Z" fill="#b8bb8d"/><path d="M0 194Q209 123 520 202" stroke="#eee7ce" stroke-width="32" fill="none"/>${[110,181,251,321].map((x,i)=>`<g transform="translate(${x} ${110-i*5})"><circle cx="0" cy="-30" r="10" fill="#624a34"/><path d="M-13-14L-22 37H19L11-14Z" fill="${i%2?'#d6cab0':'#f5edda'}"/><path d="M-8 37L-18 67M7 37L20 64M11-5L31 11" stroke="#624a34" stroke-width="5" stroke-linecap="round"/><path d="M37-9L32 71" stroke="#725c3f" stroke-width="3"/></g>`).join('')}<text x="24" y="33" font-family="sans-serif" font-size="11" fill="#6c654c">SABARMATI · 12 MARCH 1930</text></svg>`; }
  function historyMarkup() {
    return `<div class="bb-news bb-news-v2"><div class="bb-editor"><p class="bb-kicker">Choose the front-page angle</p><div class="bb-headlines" role="group" aria-label="Choose a headline"><button type="button" data-headline="0" aria-pressed="true">The protest</button><button type="button" data-headline="1" aria-pressed="false">The official warning</button></div><p class="bb-kicker">Attach your evidence</p><div class="bb-source-grid">${sources.map((s,i)=>`<label class="bb-source"><input type="checkbox" value="${i}" data-evidence><span><strong>${['Gandhi’s letter','The official reply','The march begins'][i]}</strong><small>${s[0]}</small></span></label>`).join('')}</div><p class="bb-feedback" data-editor-feedback aria-live="polite">Pick a source to support your headline.</p></div><div class="bb-front-page"><div class="bb-news-mast">The Classroom Chronicle</div><div class="bb-news-date">12 March 1930 <span>Classroom edition</span></div><h4 data-newspaper-headline>Salt protest begins at Sabarmati</h4>${marchArt()}<p data-attached-source>Choose a source to write your opening line.</p><span class="bb-evidence-stamp" data-evidence-count>No evidence attached</span></div><details class="bb-model-note"><summary>Read the three source notes</summary>${sources.map(s=>`<p><b>${s[1]}.</b> ${s[2]}</p>`).join('')}<a href="https://www.gandhiheritageportal.org/background-to-the-salt-satyagraha" target="_blank" rel="noopener">Paraphrased from the Gandhi Heritage Portal ↗</a></details></div>`;
  }
  function circuitArt(parallel=false,broken=false) {
    const bulbs=circuit(parallel,broken);
    const wiring=parallel?'<path d="M55 137H455M55 55H455M95 55V137M260 55V137M425 55V137M55 55V137"/>':'<path d="M55 55H455V137H55Z"/>';
    return `<svg viewBox="0 0 520 180" role="img" aria-label="${parallel?'Parallel':'Series'} circuit: ${bulbs.filter(Boolean).length} of 3 bulbs lit"><rect width="520" height="180" fill="#272d42"/><g fill="none" stroke="#7786a9" stroke-width="3">${wiring}</g><path d="M40 83H70M46 93H64" stroke="#f9d46b" stroke-width="4"/>${[95,260,425].map((x,i)=>`<g transform="translate(${x} ${parallel?90:55})">${bulbs[i]?'<circle r="31" fill="#f3cd5733"/>':''}<circle r="18" fill="${bulbs[i]?'#f2d06e':'#3d465c'}" stroke="${bulbs[i]?'#f9e4a9':'#8993a9'}" stroke-width="2"/><path d="M-10-6L10 6M-10 6L10-6" stroke="${bulbs[i]?'#9c7628':'#8993a9'}" stroke-width="2"/>${i===0&&broken?'<path d="M-24-25L24 25" stroke="#ee887f" stroke-width="4"/>':''}</g>`).join('')}</svg>`;
  }
  function rainArt(reverse=false) {
    const wet=reverse?390:125;
    return `<svg viewBox="0 0 520 230" role="img" aria-label="${reverse?'Right':'Left'} slope receives rain as moist air rises"><rect width="520" height="230" fill="#dce9eb"/><circle cx="${reverse?79:449}" cy="52" r="23" fill="#edc578"/><path d="M58 230L260 43L462 230Z" fill="#aabcb1"/><path d="M58 230L260 43V230Z" fill="${reverse?'#bcb196':'#7eaa89'}"/><path d="M260 43L462 230H260Z" fill="${reverse?'#7eaa89':'#bcb196'}"/><path d="M225 76L260 43L295 76L271 69L255 83L244 70Z" fill="#f5f2e5"/><g transform="translate(${wet-44} 50)"><path d="M0 39Q-8 20 13 17Q19-9 44 5Q62-7 72 20Q94 18 91 39Z" fill="#f5f9f4"/>${[10,28,46,64,82].map((x,i)=>`<path class="bb-rain-drop" style="animation-delay:${i*.1}s" d="M${x} 50l-7 17" stroke="#558fad" stroke-width="3"/>`).join('')}</g><path d="${reverse?'M465 120Q377 130 291 72':'M55 120Q143 130 229 72'}" fill="none" stroke="#507c89" stroke-width="3" stroke-dasharray="8 6"/><path d="${reverse?'M291 72l19 1-8 17':'M229 72l-19 1 8 17'}" fill="#507c89"/><text x="${wet}" y="211" text-anchor="middle" fill="#264b37" font-size="13" font-family="sans-serif">RISING AIR · RAIN</text></svg>`;
  }
  function bloodArt(stop=0) {
    const points=[[100,83],[300,83],[300,225],[100,225]], labels=['Body','Right heart','Lungs','Left heart'];
    return `<svg viewBox="0 0 400 310" role="img" aria-label="Blood circulation route, currently at ${labels[stop]}"><rect width="400" height="310" fill="#f2e4df"/><path d="M100 83H300V225H100Z" fill="none" stroke="#c1a49d" stroke-width="3"/><path d="M196 77l12 6-12 6M294 149l6 12 6-12M204 219l-12 6 12 6M94 161l6-12 6 12" fill="#ad8175"/>${points.map(([x,y],i)=>`<g><circle cx="${x}" cy="${y}" r="42" fill="${stop===i?'#b93444':'#faf5ec'}" stroke="#cebbb0" stroke-width="2"/><text x="${x}" y="${y+5}" font-family="sans-serif" font-size="14" fill="${stop===i?'#fff':'#765f55'}" text-anchor="middle">${labels[i]}</text></g>`).join('')}<text x="200" y="19" text-anchor="middle" fill="#855b53" font-family="sans-serif" font-size="10">FOLLOW ONE RED BLOOD CELL</text><text x="200" y="295" text-anchor="middle" fill="#855b53" font-family="sans-serif" font-size="11">Choose the next stop on the route.</text></svg>`;
  }
  function libraryMarkup() {
    const cards=[['circuit','Physics','One bulb breaks. What goes dark?',circuitArt()],['rain','Geography','Reverse the wind. Move the rain.',rainArt()],['blood','Biology','You’re a blood cell. Where next?',bloodArt()]];
    return cards.map(c=>`<button type="button" class="bb-live-card" data-mini="${c[0]}"><span class="bb-mini-art">${c[3]}</span><span class="bb-mini-copy"><small>${c[1]}</small><strong>${c[2]}</strong><span>Try it <b aria-hidden="true">↗</b></span></span></button>`).join('');
  }
  function miniMarkup(kind) {
    if(kind==='circuit')return `<div data-circuit data-parallel="false" data-broken="false"><div class="bb-mini-controls" role="group" aria-label="Circuit layout"><button type="button" data-circuit-layout="series" aria-pressed="true">Series</button><button type="button" data-circuit-layout="parallel" aria-pressed="false">Parallel</button></div><div data-mini-scene>${circuitArt()}</div><button type="button" class="bb-primary" data-break-bulb>Break the first bulb</button><p class="bb-feedback" data-mini-feedback aria-live="polite">Three bulbs. One complete circuit.</p><details class="bb-model-note"><summary>How a teacher creates this</summary><p>Chapter diagram → ask AI for switchable circuits → add a broken-bulb control → check every current path.</p></details></div>`;
    if(kind==='rain')return `<div data-rain data-reverse="false"><div data-mini-scene>${rainArt()}</div><button type="button" class="bb-primary" data-reverse-wind>Reverse the wind ↔</button><p class="bb-feedback" data-mini-feedback aria-live="polite">Moist air rises on the left, cools and brings rain.</p><details class="bb-model-note"><summary>How a teacher creates this</summary><p>Rain-shadow diagram → ask AI to animate rising air → add wind reversal → check the explanation. A simplified model, not a weather forecast.</p></details></div>`;
    return `<div data-blood data-stop="0"><div data-mini-scene>${bloodArt()}</div><p class="bb-kicker" data-blood-prompt>Leaving the body. Choose the next stop.</p><div class="bb-mini-controls">${['Body','Right heart','Lungs','Left heart'].map((x,i)=>`<button type="button" data-blood-next="${i}">${x}</button>`).join('')}</div><p class="bb-feedback" data-mini-feedback aria-live="polite">Follow the route. Find where blood picks up oxygen.</p><details class="bb-model-note"><summary>How a teacher creates this</summary><p>Approved circulation diagram → ask AI for a branching journey → add hints at wrong turns → check the route and labels.</p></details></div>`;
  }

  const api = {buoyancy,playground,circuit,lessons,paper,paperTotals,evidenceFeedback};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  let subject='science', mode='try', step=0, assistant='tutor', revised=false, paperView='paper', scene=0, dialogOrigin=null;
  const shipStates = new WeakMap();
  const press = (selector, value, attribute) => $$(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attribute]===String(value))));
  function updateShip(el) {
    const state=shipStates.get(el), b=buoyancy(state.shape,state.cargo), art=$('[data-ship-art]',el);
    if(!art.querySelector('svg'))art.innerHTML=shipArt(el.dataset.ship);
    const solid=state.shape==='solid', half=state.shape==='small'?79:127;
    const top=b.status==='sinks'?225:122+58*b.ratio;
    const hull=$('[data-hull-motion]',el), nail=$('[data-solid-body]',el);
    hull.style.opacity=solid?'0':'1';hull.style.transform=`translateY(${solid?145:top}px) rotate(${!solid&&b.status==='sinks'?5:0}deg)`;
    nail.style.opacity=solid?'1':'0';nail.style.transform=`translateY(${solid?221:128}px)`;
    $('[data-hull-path]',el).setAttribute('d',`M${260-half} 0H${260+half}L${238+half} 45Q260 70 ${282-half} 45Z`);
    $('[data-hull-shade]',el).setAttribute('d',`M${268-half} 15H${252+half}L${238+half} 45Q260 70 ${282-half} 45Z`);
    $('[data-hull-rim]',el).setAttribute('d',`M${260-half} 0H${260+half}`);
    $('[data-hull-detail]',el).setAttribute('d',`M${289-half} 37Q260 56 ${231+half} 37`);
    $('[data-cargo-crates]',el).innerHTML=Array.from({length:Math.ceil(b.cargo)},(_,i)=>`<g transform="translate(${211+i*20} -23)" opacity="${b.cargo-i<1?.55:1}"><rect width="18" height="22" rx="2" fill="#bf6444" stroke="#874d3b"/><path d="M2 3l14 16m0-16L2 19" stroke="#f1bc86"/></g>`).join('');
    $('[data-ship-mass]',el).textContent=`${b.mass} kg total`;
    $('[data-ship-status]',el).textContent=b.status==='sinks'?'Sinking':b.status==='limit'?'At the waterline':'Floating';
    $('svg',art).setAttribute('aria-label',solid?'Steel nail at the bottom':b.status==='sinks'?'Overloaded hull sinking':b.status==='limit'?'Hull at the waterline':'Steel hull floating');
    el.dataset.float=b.status;
    $$('[data-shape]',el).forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.shape===state.shape)));
    $('input',el).disabled=solid; $('input',el).value=b.cargo;
    $('[data-cargo-value]',el).textContent=`${b.cargo} kg`;
    $('[data-ship-feedback]',el).innerHTML=solid?'<b>It sinks.</b> Same steel, too little water displaced.':b.status==='sinks'?`<b>Overloaded.</b> ${b.mass} kg aboard; this hull supports up to ${b.capacity} kg.`:b.status==='limit'?'<b>At the limit.</b> One more load will flood the hull.':`<b>It floats.</b> ${b.mass} litres of displaced water supports ${b.mass} kg.`;
  }
  function initShips(root) { $$('[data-ship]',root).forEach(el=>{shipStates.set(el,{shape:'wide',cargo:0});updateShip(el);}); }
  function updateMaths(root) {
    const p=playground($('input',root).value), best=Math.max(Number(root.dataset.best)||64,p.area), w=p.width*14,h=p.length*14,x=260-w/2,y=147-h/2;
    root.dataset.best=best;
    $('[data-area]',root).innerHTML=`${p.area} <em>m²</em>`;$('[data-best]',root).innerHTML=`${best} <em>m²</em>`;$('[data-width-value]',root).textContent=`${p.width} m`;
    for(const [selector,values] of [['[data-field]',{x,y,width:w,height:h}],['[data-field-lines]',{x:x+7,y:y+7,width:w-14,height:h-14}]])for(const [key,value] of Object.entries(values))$(selector,root).setAttribute(key,value);
    $('[data-field-middle]',root).setAttribute('d',`M260 ${y+7}V${y+h-7}`);
    const wl=$('[data-field-width]',root),ll=$('[data-field-length]',root);wl.textContent=`${p.width} m`;wl.setAttribute('y',y+h+24);ll.textContent=`${p.length} m`;ll.setAttribute('x',x+w+15);
    $('svg',root).setAttribute('aria-label',`Playground ${p.width} metres wide and ${p.length} metres long, area ${p.area} square metres`);
    $('[data-maths-feedback]',root).innerHTML=p.area===100?'<b>100 m². Your biggest playground!</b> Same fence, 36 m² more space than your first design.':`<b>${p.width} × ${p.length} = ${p.area} m².</b> The fence is still 40 m. Keep exploring.`;
  }
  function activityMarkup() {return subject==='science'?shipMarkup('main'):subject==='maths'?mathsMarkup():subject==='history'?historyMarkup():englishMarkup();}
  function syncHeaderHeight() {document.body.style.setProperty('--bb-header-height', `${Math.ceil($('.site-header').getBoundingClientRect().height)}px`);}
  function jumpToExample() {const h=Math.ceil($('.site-header').getBoundingClientRect().height);window.scrollTo({top:window.scrollY+$('.bb-stage').getBoundingClientRect().top-h,behavior:'instant'});}
  function updateCircuit(root) {
    const parallel=root.dataset.parallel==='true',broken=root.dataset.broken==='true';
    $('[data-mini-scene]',root).innerHTML=circuitArt(parallel,broken);
    $$('[data-circuit-layout]',root).forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.circuitLayout==='parallel')===parallel)));
    $('[data-break-bulb]',root).textContent=broken?'Repair the first bulb':'Break the first bulb';
    $('[data-mini-feedback]',root).textContent=!broken?'All three bulbs have a complete path.':parallel?'Two stay on. Each parallel branch has its own complete path.':'All three go out. The break opens the only path.';
  }

  function renderExperience() {
    stopSpeech(); const s=subjects[subject];
    $('[data-example-title]').textContent=s.title; $('[data-example-intro]').textContent=s.intro; $('[data-example-outcome]').textContent=s.outcome;
    press('[data-subject]',subject,'subject'); press('[data-mode]',mode,'mode');
    const root=$('[data-experience]');
    if(mode==='try') root.innerHTML=activityMarkup();
    else {
      const short={
        science:[['Your question','“Why does a steel ship float?”'],['A first draft','A diagram that shows floating and sinking.'],['Your change','“Keep the steel fixed. Let students add cargo.”'],['For the classroom','Experiment + prediction sheet + cargo challenge.']],
        maths:[['Your question','“Same fence. Can we make a bigger playground?”'],['A first draft','One rectangle with its area already calculated.'],['Your change','“Lock the fence length. Let students reshape the field.”'],['For the classroom','Adjustable model + three trials + explain your best design.']],
        history:[['Your question','“How can two newspapers report the same event differently?”'],['A first draft','One report with the interpretation already chosen.'],['Your change','“Let students pick the angle and attach evidence.”'],['For the classroom','Newsroom + source notes + reasoning rubric.']],
        english:[['Your question','“Can two truthful accounts sound contradictory?”'],['A first draft','A written story that gives away the answer.'],['Your change','“Hide the answer. Add characters we can question.”'],['For the classroom','Story + replayable accounts + evidence worksheet.']]
      }, p=short[subject][step];
      let preview=step===2?activityMarkup():step===3?`<div class="bb-finished-pack"><span>READY TO USE</span><h3>${subjects[subject].title}</h3><div><b>01</b> Interactive activity</div><div><b>02</b> ${subjects[subject].pack[0]}</div><div><b>03</b> Discussion prompt</div><button type="button" data-resource="0" class="bb-primary">Open the classroom sheet ↗</button></div>`:subject==='science'?`<div class="bb-draft-visual"><span>${step===0?'THE TEACHER’S QUESTION':'FIRST DRAFT'}</span>${shipArt('draft')}<p>${step===0?'A heavy ship floats. A small nail sinks. Why?':'A picture with labels. No cargo controls yet.'}</p></div>`:subject==='maths'?`<div class="bb-draft-visual"><span>${step===0?'THE TEACHER’S QUESTION':'FIRST DRAFT'}</span><svg viewBox="0 0 520 260" role="img" aria-label="Rectangle 16 by 4 metres"><rect width="520" height="260" fill="#e5ead6"/><rect x="80" y="91" width="360" height="90" fill="#84ac74" stroke="#39603a" stroke-width="3"/><text x="260" y="144" fill="#fff" font-size="31" text-anchor="middle">64 m²</text><text x="260" y="211" text-anchor="middle" fill="#39603a" font-size="17">16 m × 4 m</text></svg><p>${step===0?'40 metres of fence. Is this the best use of it?':'One fixed drawing. Nothing for the student to change.'}</p></div>`:subject==='history'?`<div class="bb-draft-visual"><span>${step===0?'THE TEACHER’S QUESTION':'FIRST DRAFT'}</span>${marchArt()}<p>${step===0?'Who decides what makes the front page?':'“Salt protest begins at Sabarmati.” The angle is already chosen.'}</p></div>`:`<div class="bb-draft-visual"><span>${step===0?'THE TEACHER’S QUESTION':'FIRST DRAFT'}</span>${trophyArt()}<p>${step===0?'Two witnesses describe a trophy. Did they see the same thing?':'The draft reveals the cardboard replica before students investigate.'}</p></div>`;
      root.innerHTML=`<div class="bb-path-controls" role="group" aria-label="Teacher creation pathway">${['Idea','First draft','Teacher’s change','Ready to use'].map((label,i)=>`<button type="button" data-step="${i}" aria-pressed="${step===i}"><span>0${i+1}</span>${label}</button>`).join('')}</div><div class="bb-build"><aside><p class="bb-kicker">Worked creation example</p><h3>${p[0]}</h3><blockquote>${p[1]}</blockquote><div class="bb-step-nav"><button type="button" data-step="${Math.max(0,step-1)}" ${step===0?'disabled':''}>← Back</button><button type="button" data-step="${Math.min(3,step+1)}" ${step===3?'disabled':''}>Next →</button></div></aside><div class="bb-build-preview">${preview}</div></div>`;
    }
    const order=Object.keys(subjects),index=order.indexOf(subject);
    $('[data-example-prev]').dataset.subject=order[(index+order.length-1)%order.length];
    $('[data-example-next]').dataset.subject=order[(index+1)%order.length];
    $('[data-example-next]').textContent=`Try ${subjects[order[(index+1)%order.length]].label} →`;
    $('[data-example-position]').textContent=`${index+1} / ${order.length}`;
    initShips(root); $('[data-resource-subject]').textContent=s.label;
    $('[data-resource-buttons]').innerHTML=s.pack.map((label,i)=>`<button type="button" class="bb-resource-card" data-resource="${i}"><span class="bb-resource-icon">${['▤','◈','◖'][i]}</span><span><small>${['PRINT & USE','SHOW & DISCUSS','LISTEN & REVISIT'][i]}</small><strong>${label}</strong></span><span aria-hidden="true">↗</span></button>`).join('');
  }
  function lessonMarkup() {
    return `<div class="bb-document-heading"><span>Class 7 · heat transfer</span><b>35 minutes</b></div><h3>Tomorrow’s lesson</h3>${revised?'<p class="bb-change">Revised for a board and everyday objects.</p>':''}<ol class="bb-lesson">${lessons(revised).map(l=>`<li><span>${l[0]}<small>min</small></span><div><h4>${l[1]}</h4><p>${l[2]}</p></div></li>`).join('')}</ol><h4>Prepare before class</h4><p>Metal and wooden spoons, cups and warm water. Check the class vocabulary and supervise handling.</p><h4>Home task</h4><p>Find one object at home designed to slow heat transfer. Sketch it and explain the material choice.</p>`;
  }
  function mediaMarkup() { return `<p class="bb-kicker">Storyboard preview · scene ${scene+1} of 6</p><div class="bb-blood-path">${['Body','Right heart','Lungs','Left heart'].map((x,i)=>`<span class="${[0,1,2,3,3,0][scene]===i?'is-current':''}">${x}</span>`).join('<b>→</b>')}</div><h3>${scenes[scene][0]}</h3><p>${scenes[scene][1]}</p>${revised&&scene===2?'<p class="bb-change">Pause and predict: which side of the heart does the blood return to?</p>':''}<div class="bb-step-nav"><button type="button" data-scene="${scene-1}" ${scene===0?'disabled':''}>← Previous</button><button type="button" data-scene="${scene+1}" ${scene===5?'disabled':''}>Next scene →</button></div><details class="bb-model-note"><summary>Full narration script</summary><p>${scenes.map(s=>s[1]).join(' ')}</p></details><p class="bb-small">This is the assistant’s storyboard and script. A teacher can use these to produce a narrated clip with media tools.</p>`; }
  const tongues = [
    ['English','en-IN','A steel ship floats because of its shape. Its wide, hollow body pushes aside a lot of water, and the water pushes back up. When that push equals the ship’s weight, it floats.','At home: a steel plate can float in a bucket, but a steel spoon sinks.'],
    ['हिन्दी','hi-IN','स्टील का जहाज़ अपने आकार की वजह से तैरता है। उसका चौड़ा, खोखला ढाँचा बहुत सारा पानी हटाता है, और पानी उसे ऊपर धकेलता है। जब यह धक्का जहाज़ के वज़न के बराबर होता है, तो जहाज़ तैरता है।','घर पर: बाल्टी में स्टील की थाली तैर सकती है, पर चम्मच डूब जाता है।'],
    ['ಕನ್ನಡ','kn-IN','ಉಕ್ಕಿನ ಹಡಗು ತನ್ನ ಆಕಾರದಿಂದಾಗಿ ತೇಲುತ್ತದೆ. ಅದರ ಅಗಲವಾದ, ಟೊಳ್ಳಾದ ದೇಹವು ಬಹಳಷ್ಟು ನೀರನ್ನು ಪಕ್ಕಕ್ಕೆ ತಳ್ಳುತ್ತದೆ, ಮತ್ತು ನೀರು ಅದನ್ನು ಮೇಲಕ್ಕೆ ತಳ್ಳುತ್ತದೆ. ಆ ತಳ್ಳುವಿಕೆ ಹಡಗಿನ ತೂಕಕ್ಕೆ ಸಮನಾದಾಗ, ಹಡಗು ತೇಲುತ್ತದೆ.','ಮನೆಯಲ್ಲಿ: ಬಕೆಟ್‌ನಲ್ಲಿ ಉಕ್ಕಿನ ತಟ್ಟೆ ತೇಲಬಹುದು, ಆದರೆ ಚಮಚ ಮುಳುಗುತ್ತದೆ.']
  ];
  function languageMarkup() { return `<p class="bb-kicker">One explanation · three languages · read aloud</p>${tongues.map(([name,code,text,home],i)=>`<div class="bb-tongue" lang="${code.slice(0,2)}"><div class="bb-tongue-top"><b>${name}</b><button type="button" class="bb-text-button" data-read-lang="${i}">Listen ▶</button></div><p>${text}${revised?` <span class="bb-change">${home}</span>`:''}</p></div>`).join('')}<p class="bb-small">Voices depend on the phone. Every version is checked by a teacher who speaks the language.</p>`; }
  function readLang(button) {
    stopSpeech(); if(!('speechSynthesis' in window)){button.textContent='No audio on this device';return;}
    const t=tongues[Number(button.dataset.readLang)], u=new SpeechSynthesisUtterance(t[2]+(revised?' '+t[3]:''));
    u.lang=t[1]; u.rate=.9;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang.replace('_','-').toLowerCase().startsWith(t[1].slice(0,2)));
    if(voice)u.voice=voice; else if(t[1]!=='en-IN'){button.textContent='No '+t[0]+' voice on this phone';return;}
    button.textContent='Reading…'; u.onend=u.onerror=()=>{button.textContent='Listen ▶';};
    window.speechSynthesis.speak(u);
  }
  function assistantOutput() {
    if(assistant==='lesson')return lessonMarkup();
    if(assistant==='paper')return `<div class="bb-document-tabs" role="group" aria-label="Question paper documents">${[['paper','Paper'],['answers','Answers'],['marking','Marking'],['alternate','Version B']].map(v=>`<button type="button" data-paper-view="${v[0]}" aria-pressed="${v[0]===paperView}">${v[1]}</button>`).join('')}</div>${paperMarkup(paperView,revised)}`;
    if(assistant==='tutor')return `<p class="bb-kicker">Worked conversation · buoyancy</p><div class="bb-chat-student">The ship floats because steel becomes lighter when we change its shape.</div><div class="bb-chat-tutor"><b>Chapter tutor</b><p>${revised?'We still have the same 2 kg of steel. What changed: the amount of steel, or the space inside the shape?':'The model uses 2 kg of steel in both cases. Compare the solid piece with the hollow hull. Which can displace more water before it is fully under water?'}</p></div><p class="bb-small">Try a learner’s reply:</p><div class="bb-tutor-choices"><button type="button" data-tutor="shape">The shape changed</button><button type="button" data-tutor="answer">Just tell me the answer</button></div><p class="bb-feedback" data-tutor-feedback aria-live="polite">The tutor starts with a hint from the teacher’s chosen material.</p><a class="bb-text-link" href="#main">Try the ship experiment at the top ↑</a>`;
    if(assistant==='media')return mediaMarkup();
    if(assistant==='language')return languageMarkup();
    return `<p class="bb-kicker">Three drafts · one set of confirmed facts</p><h3>Sports Day has moved indoors</h3><div class="bb-message-output"><h4>For parents</h4><p>${revised?'Please arrive at 9 am. Sports Day will be in the indoor hall because of rain. Scheduled activities will take place there.':'Because of rain, Sports Day will take place in the indoor hall. Please arrive at 9 am; the scheduled activities will take place in the hall.'}</p><details><summary>Hindi version</summary><p lang="hi">कृपया सुबह 9 बजे पहुँचें। बारिश के कारण खेल दिवस का आयोजन इनडोर हॉल में होगा। निर्धारित गतिविधियाँ हॉल में होंगी।</p></details><h4>For staff</h4><p>Sports Day will be in the indoor hall due to rain. Arrival remains 9 am. Please direct families to the hall; scheduled activities will take place there.</p><h4>For assembly</h4><p>Sports Day is moving indoors because of the rain. Meet at the indoor hall at 9 am for the scheduled activities.</p></div><p class="bb-small">Fictional school arrangements, shown as drafts for review.</p>`;
  }
  function renderAssistant() {
    const a=assistantData[assistant]; press('[data-assistant]',assistant,'assistant');
    $('[data-assistant-workspace]').innerHTML=`<div class="bb-assistant-request"><p class="bb-kicker">Your own ${assistant==='tutor'?'chapter tutor':'teaching assistant'}</p><h3>${a.name}</h3><details class="bb-context"><summary>What this assistant already knows</summary><p>${a.context}</p></details><blockquote>${a.request}</blockquote><button type="button" class="bb-revision" data-revise aria-pressed="${revised}"><span>${revised?'✓ Revised · show original':'MAKE A CHANGE ↗'}</span>${({lesson:'No projector? Adapt the lesson.',paper:'Swap a recall question for a real situation.',tutor:'Explain it in everyday language.',media:'Add a prediction at the lungs.',language:'Add an example from home.',message:'Put the arrival time first.'})[assistant]}</button><p class="bb-small">Worked example · sample AI outputs.</p></div><div class="bb-assistant-result"><div class="bb-result-label"><span>THE OUTPUT</span><span data-output-state>${revised?'Revised draft':'First draft'}</span></div><div class="bb-output-scroll" tabindex="0" role="region" aria-label="Assistant output">${assistantOutput()}</div></div>`;
  }
  function openDialog(title,html,origin) { stopSpeech();dialogOrigin=origin; $('[data-dialog-title]').textContent=title; $('[data-dialog-body]').innerHTML=html; $('[data-school-dialog]').showModal(); $('[data-dialog-close]').focus(); }
  function resource(index,origin) {
    const s=subjects[subject]; let content='';
    if(index===0)content=worksheet(subject);
    if(index===1)content=subject==='science'?shipMarkup('resource'):subject==='maths'?mathsMarkup('resource'):subject==='history'?`<div class="bb-timeline">${sources.map(s=>`<article><small>${s[0]}</small><h3>${s[1]}</h3><p>${s[2]}</p></article>`).join('')}</div><p class="bb-small">Paraphrased from the <a href="https://www.gandhiheritageportal.org/background-to-the-salt-satyagraha" target="_blank" rel="noopener">Gandhi Heritage Portal</a>.</p>`:trophyArt()+'<p>One metal trophy. One cardboard replica. Use the illustration to ask what each character actually saw.</p>';
    if(index===2)content=`<p class="bb-kicker">Narration with transcript</p><h3>${s.title}</h3><p>${narration[subject]}</p><button type="button" class="bb-primary" data-speak="narration-${subject}">Read aloud · device voice</button><p class="bb-small">Uses an available English voice on your device. The complete text is shown above.</p>`;
    openDialog(`${s.label} · ${s.pack[index]}`,content,origin);initShips($('[data-dialog-body]'));
  }
  function resetAudio(button) {
    if(button.dataset.originalLabel)button.textContent=button.dataset.originalLabel;
    delete button.dataset.audioState;button.removeAttribute('aria-pressed');
    const stop=button.nextElementSibling;if(stop&&stop.hasAttribute('data-stop-audio'))stop.hidden=true;
  }
  function stopSpeech() { if('speechSynthesis' in window) window.speechSynthesis.cancel(); $$('[data-speak]').forEach(resetAudio); }
  function speak(button) {
    if(button.dataset.audioState==='speaking'){window.speechSynthesis.pause();button.dataset.audioState='paused';button.textContent='Resume reading ▶';return;}
    if(button.dataset.audioState==='paused'){window.speechSynthesis.resume();button.dataset.audioState='speaking';button.textContent='Pause reading Ⅱ';return;}
    stopSpeech(); if(!('speechSynthesis' in window)){button.textContent='Audio unavailable · use the transcript';return;}
    const key=button.dataset.speak, content=key.startsWith('account-')?accounts[Number(key.slice(8))][1]:narration[key.slice(10)];
    const utterance=new SpeechSynthesisUtterance(content); utterance.lang='en-IN';utterance.rate=.9;
    button.dataset.originalLabel=button.dataset.originalLabel||button.textContent;button.textContent='Pause reading Ⅱ';button.dataset.audioState='speaking';button.setAttribute('aria-pressed','true');
    let stop=button.nextElementSibling;
    if(!stop||!stop.hasAttribute('data-stop-audio')){stop=document.createElement('button');stop.type='button';stop.className='bb-text-button bb-audio-stop';stop.setAttribute('data-stop-audio','');stop.textContent='Stop ■';button.after(stop);}
    stop.hidden=false;
    utterance.onend=()=>resetAudio(button);
    utterance.onerror=event=>{resetAudio(button);if(!['interrupted','canceled'].includes(event.error))button.textContent='Audio unavailable · use the transcript';};
    window.speechSynthesis.speak(utterance);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button, a');if(!b)return;
    if(b.hasAttribute('data-shape')) {const el=b.closest('[data-ship]'),s=shipStates.get(el);s.shape=b.dataset.shape;if(s.shape==='solid')s.cargo=0;updateShip(el);}
    if(b.hasAttribute('data-subject')) {subject=b.dataset.subject;mode='try';step=0;renderExperience();jumpToExample();}
    if(b.hasAttribute('data-mode')) {mode=b.dataset.mode;renderExperience();}
    if(b.hasAttribute('data-step')) {step=Number(b.dataset.step);renderExperience(); const active=$('.bb-path-controls [aria-pressed="true"]');if(active)active.focus({preventScroll:true});}
    if(b.hasAttribute('data-headline')) {const root=b.closest('.bb-news');$$('[data-headline]',root).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateEvidence(root);}
    if(b.hasAttribute('data-clue')) {const root=b.closest('.bb-mystery');$$('[data-clue]',root).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('[data-clue-feedback]',root).textContent=clues[Number(b.dataset.clue)][1];}
    if(b.hasAttribute('data-assistant')) {stopSpeech();assistant=b.dataset.assistant;revised=false;paperView='paper';scene=0;renderAssistant();}
    if(b.hasAttribute('data-revise')) {revised=!revised;if(assistant==='media'&&revised)scene=2;renderAssistant();$('[data-revise]').focus({preventScroll:true});}
    if(b.hasAttribute('data-paper-view')) {paperView=b.dataset.paperView;$('.bb-output-scroll').innerHTML=assistantOutput();$(`[data-paper-view="${paperView}"]`).focus({preventScroll:true});}
    if(b.hasAttribute('data-tutor')) $('[data-tutor-feedback]').textContent=b.dataset.tutor==='shape'?'Yes. Now compare the water displaced: the hollow shape has room to push more water aside. Why would adding cargo make it sit lower?':'Try one comparison first: keep the steel at 2 kg and switch from solid to wide hull. What changed besides the shape?';
    if(b.hasAttribute('data-scene')) {scene=clamp(b.dataset.scene,0,5);$('.bb-output-scroll').innerHTML=assistantOutput();$('.bb-output-scroll').focus({preventScroll:true});}
    if(b.hasAttribute('data-return-science')){subject='science';mode='try';renderExperience();}
    if(b.hasAttribute('data-resource'))resource(Number(b.dataset.resource),b);
    if(b.hasAttribute('data-speak'))speak(b);
    if(b.hasAttribute('data-read-lang'))readLang(b);
    if(b.hasAttribute('data-stop-audio'))stopSpeech();
    if(b.hasAttribute('data-mini'))openDialog(({circuit:'One bulb breaks. What goes dark?',rain:'Reverse the wind. Move the rain.',blood:'A red blood cell’s journey'})[b.dataset.mini],miniMarkup(b.dataset.mini),b);
    if(b.hasAttribute('data-circuit-layout')){const r=b.closest('[data-circuit]');r.dataset.parallel=String(b.dataset.circuitLayout==='parallel');updateCircuit(r);}
    if(b.hasAttribute('data-break-bulb')){const r=b.closest('[data-circuit]');r.dataset.broken=String(r.dataset.broken!=='true');updateCircuit(r);}
    if(b.hasAttribute('data-reverse-wind')){const r=b.closest('[data-rain]'),reverse=r.dataset.reverse!=='true';r.dataset.reverse=String(reverse);$('[data-mini-scene]',r).innerHTML=rainArt(reverse);$('[data-mini-feedback]',r).textContent=`The ${reverse?'right':'left'} slope now gets the rain. Moist air rises, cools and condenses on the windward side.`;}
    if(b.hasAttribute('data-blood-next')){const r=b.closest('[data-blood]'),next=(Number(r.dataset.stop)+1)%4,choice=Number(b.dataset.bloodNext);if(choice===next){r.dataset.stop=String(next);$('[data-mini-scene]',r).innerHTML=bloodArt(next);$('[data-blood-prompt]',r).textContent=`At the ${['body','right heart','lungs','left heart'][next]}. Choose the next stop.`;$('[data-mini-feedback]',r).textContent=['Back to the body: oxygen is delivered to tissues. Follow the route again.','Right heart. Next, the blood travels to pick up oxygen.','Lungs. Oxygen enters the blood here. Where does it return?','Left heart. Now it is ready to be pumped to the body.'][next];}else $('[data-mini-feedback]',r).textContent='Try again. Trace the route from the highlighted stop.';}
    if(b.hasAttribute('data-dialog-close'))$('[data-school-dialog]').close();
  });
  function updateEvidence(root) {
    const head=Number($('[data-headline][aria-pressed="true"]',root).dataset.headline),selected=$$('[data-evidence]:checked',root).map(el=>Number(el.value));
    $('[data-editor-feedback]',root).textContent=evidenceFeedback(head,selected);
    $('[data-newspaper-headline]',root).textContent=head===0?'Salt protest begins at Sabarmati':'Government warns against planned law-breaking';
    $('[data-attached-source]',root).textContent=selected.length?sources[selected[selected.length-1]][2]:'Choose a source to write your opening line.';
    $('[data-evidence-count]',root).textContent=selected.length?`${selected.length} source${selected.length>1?'s':''} attached`:'No evidence attached';
  }

  document.addEventListener('change',e=>{if(e.target.matches('[data-evidence]'))updateEvidence(e.target.closest('.bb-news'));});
  document.addEventListener('input',e=>{if(e.target.matches('[data-maths] input'))updateMaths(e.target.closest('[data-maths]'));if(e.target.matches('[data-ship] input[type="range"]')){const el=e.target.closest('[data-ship]');shipStates.get(el).cargo=Number(e.target.value);updateShip(el);}});
  $('[data-school-dialog]').addEventListener('close',()=>{stopSpeech();if(dialogOrigin&&dialogOrigin.isConnected)dialogOrigin.focus({preventScroll:true});});
  window.addEventListener('pagehide',stopSpeech);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
  syncHeaderHeight();window.addEventListener('resize',syncHeaderHeight);
  const lib=$('[data-live-library]');if(lib)lib.innerHTML=libraryMarkup();
  initShips(document);if($('[data-experience]'))renderExperience();renderAssistant();
})();
