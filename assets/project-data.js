/* One project identity is shared by the course page, examples and enquiry. */
(function (root) {
  'use strict';
  const projects = [
    {"id":"product-ads","title":"Product ads","description":"Turn a product photo into a short commercial.","routes":["earn","create","business"],"label":"MAKE IT STAND OUT","deliverable":"A short branded product ad, with a storyboard, campaign visuals and captions.","steps":["Turn a product brief into a story","Create and refine campaign visuals","Edit the sequence, sound and captions","Prepare versions for different screens"],"audience":"Creators, photographers, business owners and aspiring freelancers.","needs":"Bring a product or use a practice brief. Ask us which device and image/video tools your project needs.","sample":"Sample campaign · AI-generated product image"},
    {"id":"ai-presenter","title":"AI presenter","description":"Make a digital presenter for your script.","routes":["create","work"],"label":"GIVE YOUR IDEA A VOICE","deliverable":"A short presenter-led explainer with a clear script, authorised avatar and readable captions.","steps":["Write a script people can follow","Choose an avatar and voice you have permission to use","Build the presentation and captions","Review pronunciation, pacing and the final edit"],"audience":"Creators, trainers and people who explain products or ideas.","needs":"Bring a short script or topic. Avatar tools may need paid access; confirm the tool costs with us first.","sample":"Sample storyboard · preview the script and captions"},
    {"id":"client-websites","title":"Client websites","description":"Build a business website people can actually use.","routes":["earn","business"],"label":"TAKE A BUSINESS ONLINE","deliverable":"A small-business website with clear pages and an enquiry flow, ready to test and publish.","steps":["Turn a business brief into a page plan","Build the pages with AI and refine the design","Test the enquiry flow on phone and desktop","Publish and prepare a client handover"],"audience":"Business owners, designers and aspiring website freelancers.","needs":"A laptop is useful for building and testing. Confirm hosting, domain and tool costs before starting.","sample":"Working sample · a fictional café website"},
    {"id":"sales-assistants","title":"Sales assistants","description":"Answer product questions and organise enquiries.","routes":["earn","business","work"],"label":"TURN QUESTIONS INTO ENQUIRIES","deliverable":"A catalogue assistant that answers from product information and hands uncertain questions to a person.","steps":["Prepare a clear product catalogue","Set the assistant’s answers and boundaries","Collect a useful enquiry for a human follow-up","Test missing information and handover"],"audience":"Shop owners, service businesses and aspiring automation freelancers.","needs":"Start with sample product data. Discuss channel integrations and ongoing tool costs separately.","sample":"Scripted sample · no live AI or WhatsApp integration"},
    {"id":"reports-on-autopilot","title":"Reports on autopilot","description":"Turn recurring data into a report worth reading.","routes":["business","work"],"label":"LESS COPYING. MORE CLARITY.","deliverable":"A repeatable reporting workflow that turns a data file into charts and a summary for review.","steps":["Clean and structure a sample data file","Build the report and useful charts","Connect the repeatable steps","Check the output before sharing it"],"audience":"People who work with sales, operations and recurring spreadsheets.","needs":"Bring a laptop and use practice data. We’ll scope the workflow around the tools you can access.","sample":"Working sample · two fictional sales datasets"},
    {"id":"interactive-lessons","title":"Interactive lessons","description":"Make a concept students can experiment with.","routes":["create","work"],"label":"MAKE THE CONCEPT CLICK","deliverable":"A small interactive teaching tool with controls, an explanation and questions to explore.","steps":["Choose a concept students find difficult","Build a simulation with AI assistance","Add controls and clear feedback","Check the model and prepare a teaching activity"],"audience":"Teachers, tutors and people who create learning material.","needs":"Bring a topic you know well. A laptop is useful; subject review is part of preparing a lesson.","sample":"Working simulation · vertical launch without air resistance"}
  ];
  projects.splice(1,0,{id:'stocks',title:'Learn to earn with stocks',description:'Spot opportunities and make better investing decisions with AI.',routes:['earn','invest'],label:'BUILD YOUR INVESTING SKILLS',deliverable:'Your own stock-selection checklist and a comparison of companies, with a clear case for the opportunity, the price and the risks.',steps:['Find and shortlist companies using a stock screener','Use AI to read results, compare valuations and check the original numbers','Understand market news, sector trends, price and volume','Build a decision framework for entry, position size and downside risk','Test your reasoning with historical case studies and keep a decision journal'],audience:'People who want to understand stocks and make more informed investing decisions.',needs:'Bring a laptop if you can. We’ll discuss your starting point and the research tools for the learning plan.',sample:'Interactive practice · fictional companies and figures'});
  const routes = {earn:'Earn',create:'Create',business:'Business',work:'Work',invest:'Invest'};
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const get = id => projects.find(p => p.id === id);
  function state(search) {
    const params = new URLSearchParams(search);
    const rawGoal = params.get('goal');
    let goal = Object.hasOwn(routes, rawGoal) ? rawGoal : '';
    const project = get(params.get('project'))?.id || (rawGoal === 'build' ? 'client-websites' : '');
    if (project && goal && !get(project).routes.includes(goal)) goal = '';
    return {goal, project};
  }
  function selection(ids) {
    return Array.isArray(ids) ? [...new Set(ids.filter(id=>typeof id === 'string' && get(id)))] : [];
  }
  function message({project, projectIds, goal, note = '', ref = ''}) {
    const item = get(project);
    const chosen = selection(projectIds);
    return [chosen.length ? 'Hi PACS AI, I’d like to learn these projects:' : item ? `Hi PACS AI, I’m interested in learning ${item.title}.` : 'Hi PACS AI, please help me choose an AI project.',
      chosen.length && chosen.map(id=>'• '+get(id).title).join('\n'),
      routes[goal] && `My goal: ${routes[goal]}.`, note.trim().slice(0,300) && `My idea: ${note.trim().slice(0,300)}`,
      'Please share the learning plan, dates, fees and any extra tool costs.', ref && `Enquiry reference: ${ref}`].filter(Boolean).join('\n');
  }
  function report(period) {
    const values = period === 'week2' ? [15000,19000,17000,24000] : [12000,18000,15000,21000];
    return {values,total:values.reduce((a,b)=>a+b,0),top:values.indexOf(Math.max(...values))+1};
  }
  function flight(gravity) { return {height:100/(2*gravity),time:20/gravity}; }
  const api = {projects,routes,get,state,message,selection,escape,report,flight};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PacsProjects = api;
})(typeof window !== 'undefined' ? window : globalThis);
