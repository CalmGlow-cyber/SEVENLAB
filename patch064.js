// SevenLab 0.6.4 — progressive CSV filenames with season reset.
(function(){
  const RESET_KEY='sevenlab_export_season_start_v064';
  const GAME='partita', TRAINING='allenamento';

  function sessionTime(s){
    const t=Date.parse(s?.dateISO||'');
    if(Number.isFinite(t))return t;
    const id=String(s?.id||'').match(/\d{10,}/);
    return id?Number(id[0]):0;
  }
  function seasonStart(){return Number(localStorage.getItem(RESET_KEY)||0)||0}
  function typeOf(s){return s?.tipo===GAME?GAME:TRAINING}
  function sessionsInCurrentSeason(type){
    const start=seasonStart();
    return (DB.history||[]).filter(s=>typeOf(s)===type&&sessionTime(s)>=start).slice().sort((a,b)=>sessionTime(a)-sessionTime(b)||String(a.id).localeCompare(String(b.id)));
  }
  function progressiveFor(s){
    const type=typeOf(s),list=sessionsInCurrentSeason(type),idx=list.findIndex(x=>String(x.id)===String(s.id));
    if(idx>=0)return idx+1;
    // Session older than the current reset marker: keep it exportable without consuming the new season sequence.
    const old=(DB.history||[]).filter(x=>typeOf(x)===type&&sessionTime(x)<seasonStart()).slice().sort((a,b)=>sessionTime(a)-sessionTime(b)||String(a.id).localeCompare(String(b.id)));
    const oldIdx=old.findIndex(x=>String(x.id)===String(s.id));
    return oldIdx>=0?`test_${oldIdx+1}`:1;
  }

  const baseExport=exportSessionCSV;
  exportSessionCSV=function(s){
    // Temporarily intercept the existing download helper, preserving all 0.6.3 CSV contents and minutage logic.
    const originalDownload=downloadText;
    downloadText=function(text,name,mime){
      const type=typeOf(s),n=progressiveFor(s),prefix=type===GAME?'partita':'allenamento';
      return originalDownload(text,`${prefix}_${n}.csv`,mime);
    };
    try{return baseExport(s)}finally{downloadText=originalDownload}
  };

  function injectSettings(){
    const card=$('#impostazioni .card');
    if(!card||$('#seasonNumbering064'))return;
    const row=document.createElement('div');row.className='settingsrow';row.id='seasonNumbering064';
    row.innerHTML=`<div style="width:100%"><div class="settingslabel">Numerazione esportazioni</div><div class="sub">Allenamenti e partite hanno progressivi separati. Quando inizia la stagione puoi azzerarli senza cancellare i test.</div><div id="seasonNumberState064" class="settingsvalue" style="margin-top:8px"></div><button id="resetSeason064" class="btn ghost full" style="margin-top:10px">🔄 Inizia nuova stagione · riparti da 1</button></div>`;
    card.appendChild(row);
    $('#resetSeason064').onclick=()=>{
      if(!confirm('Ripartire da allenamento_1 e partita_1? Le sessioni già registrate NON verranno eliminate.'))return;
      localStorage.setItem(RESET_KEY,String(Date.now()));
      renderState();toast('Numerazione stagione azzerata');
    };
    renderState();
  }
  function renderState(){
    const el=$('#seasonNumberState064');if(!el)return;
    const a=sessionsInCurrentSeason(TRAINING).length+1,p=sessionsInCurrentSeason(GAME).length+1;
    el.textContent=`Prossimi file: allenamento_${a}.csv · partita_${p}.csv`;
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(injectSettings,500));
  setTimeout(injectSettings,800);
  window.SevenLabExport064={progressiveFor,seasonStart};
})();