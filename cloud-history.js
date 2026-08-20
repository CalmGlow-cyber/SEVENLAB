// SevenLab Cloud history sync 0.6. Sessions carry type metadata; events are normalized in public.events.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co',KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';let syncing=false,initialized=false;
  function headers(){const t=window.SevenLabAuth?.token;if(!t)throw new Error('AUTH_REQUIRED');return{'apikey':KEY,'Authorization':'Bearer '+t,'Content-Type':'application/json'}}
  async function req(path,opt={}){const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers(),...(opt.headers||{})}});if(!r.ok)throw new Error(await r.text());const t=await r.text();return t?JSON.parse(t):null}
  function cache(){localStorage.setItem(K,JSON.stringify(DB))}
  async function syncEvents(s){await req('events?sessione_id=eq.'+encodeURIComponent(s.id),{method:'DELETE'});const ev=(s.events||[]).map(e=>({id:String(e.id),sessione_id:s.id,tipo:e.type||'evento',giocatore_id:e.pid?String(e.pid):null,team:e.team||null,secondi:Math.max(0,Math.floor(e.t||0)),phase:e.phase||null,payload:e}));if(ev.length)await req('events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(ev)})}
  async function upsert(s){const tipo=s.tipo==='partita'?'partita':'allenamento';await req('sessions?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:s.id,tipo,avversario:tipo==='partita'?(s.avversario||null):null,gol_fatti:s.score?.A||0,gol_subiti:s.score?.B||0,session_data:s,updated_at:new Date().toISOString()})});await syncEvents(s)}
  async function remove(id){return req('sessions?id=eq.'+encodeURIComponent(id),{method:'DELETE'})}
  async function pull(){if(!window.SevenLabAuth?.token)return;if(syncing)return;syncing=true;try{const rows=await req('sessions?select=id,tipo,avversario,gol_fatti,gol_subiti,session_data,created_at&order=created_at.desc');if(!initialized&&!rows.length&&DB.history.length){for(const s of DB.history)await upsert(s);initialized=true;toast('Storico caricato nel cloud ☁️');return}initialized=true;DB.history=(rows||[]).map(r=>{const s=r.session_data||{};s.tipo=r.tipo||s.tipo||'allenamento';if(r.tipo==='partita'){s.avversario=r.avversario||s.avversario||'';s.score=s.score||{A:0,B:0};s.score.A=r.gol_fatti??s.score.A??0;s.score.B=r.gol_subiti??s.score.B??0}s.id=s.id||r.id;return s}).filter(Boolean);cache();renderHistory()}catch(e){console.error('SevenLab history pull',e);if(e.message!=='AUTH_REQUIRED')toast('Storico cloud non raggiungibile')}finally{syncing=false}}
  const stableArchive=archive;archive=function(){const before=new Set(DB.history.map(s=>s.id));stableArchive();const s=DB.history.find(x=>!before.has(x.id));if(s&&window.SevenLabAuth?.token)upsert(s).then(()=>pull()).catch(e=>{console.error(e);toast('Sessione locale: cloud non raggiungibile')})};
  const stableRenderHistory=renderHistory;renderHistory=function(){stableRenderHistory();$$('[data-rm]').forEach(b=>{b.onclick=async()=>{if(!confirm('Eliminare definitivamente questa sessione da tutti i dispositivi?'))return;const id=b.dataset.rm;try{await remove(id);DB.history=DB.history.filter(s=>s.id!==id);cache();stableRenderHistory();toast('Sessione eliminata dal cloud')}catch(e){console.error(e);toast('Eliminazione cloud non riuscita')}}})};
  document.querySelectorAll('[data-go="storico"]').forEach(b=>b.addEventListener('click',()=>setTimeout(pull,50)));document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});setInterval(()=>{if(document.getElementById('storico')?.classList.contains('active'))pull()},8000);window.SevenLabCloudHistory={pull};setTimeout(pull,900);
})();

// UI isolation guard: Game-only decorations must never leak back into training Live.
(function(){
  const previousRenderLive=renderLive;
  renderLive=function(){
    previousRenderLive();
    if((C()?.tipo||'allenamento')!=='partita'){
      document.querySelectorAll('.gameScoreNames,.gameLiveBadge,.gameMeta').forEach(x=>x.remove());
      $$('[data-score]').forEach(b=>b.style.display='');
    }
  };
})();