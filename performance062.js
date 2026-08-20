// SevenLab 0.6.2 PERFORMANCE
// Non-invasive layer: faster Live/Game persistence and lazy history analytics.
(function(){
  const FULL_KEY=(typeof K!=='undefined'&&K)||'sevenlab_db';
  const CURRENT_KEY='sevenlab_current_fast_v062';
  let fullSaveTimer=null;

  // Keep current session in a small dedicated record. Full DB persistence is debounced while Live/Game is active.
  const baseSave=save;
  function currentActive(){const c=C?.();return !!(c&&c.id&&c.phase&&c.phase!=='ended')}
  function fastCurrent(){
    try{localStorage.setItem(CURRENT_KEY,JSON.stringify(DB.current||null))}catch(e){console.warn('SevenLab fast current cache',e)}
  }
  function scheduleFullSave(delay=900){
    clearTimeout(fullSaveTimer);
    fullSaveTimer=setTimeout(()=>{try{baseSave()}catch(e){console.error(e)}},delay);
  }
  save=function(){
    if(currentActive()){
      fastCurrent();
      scheduleFullSave();
      return;
    }
    clearTimeout(fullSaveTimer);
    baseSave();
    try{localStorage.removeItem(CURRENT_KEY)}catch(e){}
  };
  window.addEventListener('pagehide',()=>{try{baseSave()}catch(e){}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){try{baseSave()}catch(e){}}});

  // Restore the freshest lightweight current-session snapshot after an unexpected refresh/crash.
  try{
    const fast=JSON.parse(localStorage.getItem(CURRENT_KEY)||'null');
    if(fast?.id&&(!DB.current?.id||((fast.events||[]).length>(DB.current.events||[]).length)))DB.current=fast;
  }catch(e){}

  // History cards appear immediately. Heavy global tables/combination analysis are deferred until browser is idle.
  const baseRenderHistory=renderHistory;
  let analyticsToken=0;
  renderHistory=function(){
    const token=++analyticsToken;
    const gs=$('#globalStats'),ga=$('#gameGlobalStats'),ca=$('#comboAnalysis'),gca=$('#gameAnalysis');
    const old={gs:gs?.innerHTML,ga:ga?.innerHTML,ca:ca?.innerHTML,gca:gca?.innerHTML};
    baseRenderHistory();
    // Preserve lightweight placeholders instead of blocking navigation on repeated analytics redraws.
    if(gs)gs.innerHTML='<div class="sub">Calcolo statistiche…</div>';
    if(ga)ga.innerHTML='<div class="sub">Calcolo statistiche…</div>';
    if(ca)ca.innerHTML='<div class="sub">Calcolo analisi…</div>';
    if(gca)gca.innerHTML='<div class="sub">Calcolo analisi…</div>';
    const run=()=>{
      if(token!==analyticsToken)return;
      // Re-run the established renderer once idle; all existing 0.6.1 calculations remain authoritative.
      try{baseRenderHistory()}catch(e){console.error('SevenLab lazy analytics',e);if(gs)gs.innerHTML=old.gs||'';if(ga)ga.innerHTML=old.ga||'';if(ca)ca.innerHTML=old.ca||'';if(gca)gca.innerHTML=old.gca||'';}
    };
    if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:700});else setTimeout(run,80);
  };

  // Make Stop responsive: archive work starts after the pressed-state frame has painted.
  const stop=$('#stopBtn');
  if(stop){
    const old=stop.onclick;
    if(old)stop.onclick=function(ev){stop.disabled=true;requestAnimationFrame(()=>setTimeout(()=>{try{old.call(stop,ev)}finally{stop.disabled=false}},0))};
  }

  window.SevenLabPerformance062={version:'0.6.2'};
})();