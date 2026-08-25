// SevenLab 0.6.4 — progressive CSV filenames with shared season reset.
(function(){
  const RESET_KEY='sevenlab_export_season_start_v064';
  const SETTING_KEY='export_season_start';
  const GAME='partita', TRAINING='allenamento';
  const SUPA='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const APIKEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';

  function sessionTime(s){
    const t=Date.parse(s?.dateISO||'');
    if(Number.isFinite(t))return t;
    const id=String(s?.id||'').match(/\d{10,}/);
    return id?Number(id[0]):0;
  }
  function seasonStart(){return Number(localStorage.getItem(RESET_KEY)||0)||0}
  function setSeasonStart(v){localStorage.setItem(RESET_KEY,String(Number(v)||0))}
  function typeOf(s){return s?.tipo===GAME?GAME:TRAINING}
  function sessionsInCurrentSeason(type){
    const start=seasonStart();
    return (DB.history||[]).filter(s=>typeOf(s)===type&&sessionTime(s)>=start).slice().sort((a,b)=>sessionTime(a)-sessionTime(b)||String(a.id).localeCompare(String(b.id)));
  }
  function progressiveFor(s){
    const type=typeOf(s),list=sessionsInCurrentSeason(type),idx=list.findIndex(x=>String(x.id)===String(s.id));
    if(idx>=0)return idx+1;
    const old=(DB.history||[]).filter(x=>typeOf(x)===type&&sessionTime(x)<seasonStart()).slice().sort((a,b)=>sessionTime(a)-sessionTime(b)||String(a.id).localeCompare(String(b.id)));
    const oldIdx=old.findIndex(x=>String(x.id)===String(s.id));
    return oldIdx>=0?`test_${oldIdx+1}`:1;
  }

  async function cloudReq(path,opt={}){
    const token=window.SevenLabAuth?.token;if(!token)throw new Error('AUTH_REQUIRED');
    const r=await fetch(SUPA+'/rest/v1/'+path,{...opt,headers:{apikey:APIKEY,Authorization:'Bearer '+token,'Content-Type':'application/json',...(opt.headers||{})}});
    const txt=await r.text();if(!r.ok)throw new Error(txt||'Errore impostazioni cloud');return txt?JSON.parse(txt):null;
  }
  async function pullReset(){
    if(!window.SevenLabAuth?.token)return;
    try{
      const rows=await cloudReq('app_settings?key=eq.'+encodeURIComponent(SETTING_KEY)+'&select=value');
      const v=Number(rows?.[0]?.value?.timestamp||0)||0;
      if(v){setSeasonStart(v);renderState()}
    }catch(e){if(e.message!=='AUTH_REQUIRED')console.warn('SevenLab season reset sync',e)}
  }
  async function pushReset(v){
    setSeasonStart(v);renderState();
    if(!window.SevenLabAuth?.token)return;
    await cloudReq('app_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({key:SETTING_KEY,value:{timestamp:v},updated_at:new Date().toISOString()})});
  }

  const baseExport=exportSessionCSV;
  exportSessionCSV=function(s){
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
    row.innerHTML=`<div style="width:100%"><div class="settingslabel">Numerazione esportazioni</div><div class="sub">Allenamenti e partite hanno progressivi separati. Quando inizia la stagione puoi azzerarli senza cancellare i test. L'azzeramento è condiviso tra i dispositivi autorizzati.</div><div id="seasonNumberState064" class="settingsvalue" style="margin-top:8px"></div><button id="resetSeason064" class="btn ghost full" style="margin-top:10px">🔄 Inizia nuova stagione · riparti da 1</button></div>`;
    card.appendChild(row);
    $('#resetSeason064').onclick=async()=>{
      if(!confirm('Ripartire da allenamento_1 e partita_1? Le sessioni già registrate NON verranno eliminate.'))return;
      const v=Date.now();
      try{await pushReset(v);toast('Numerazione stagione azzerata ☁️')}catch(e){console.error(e);setSeasonStart(v);renderState();toast('Azzerata sul dispositivo; sync cloud non riuscita')}
    };
    renderState();pullReset();
  }
  function renderState(){
    const el=$('#seasonNumberState064');if(!el)return;
    const a=sessionsInCurrentSeason(TRAINING).length+1,p=sessionsInCurrentSeason(GAME).length+1;
    el.textContent=`Prossimi file: allenamento_${a}.csv · partita_${p}.csv`;
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(injectSettings,500));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pullReset()});
  setTimeout(injectSettings,800);setTimeout(pullReset,1300);
  window.SevenLabExport064={progressiveFor,seasonStart,pullReset};
})();