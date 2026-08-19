// SevenLab Cloud history sync. Supabase is authoritative for archived sessions; localStorage remains cache.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';
  const headers={'apikey':KEY,'Content-Type':'application/json'};
  let syncing=false, initialized=false;
  async function req(path,opt={}){const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers,...(opt.headers||{})}});if(!r.ok)throw new Error(await r.text());const t=await r.text();return t?JSON.parse(t):null}
  function cache(){localStorage.setItem(K,JSON.stringify(DB))}
  async function upsert(s){return req('sessions?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:s.id,session_data:s,updated_at:new Date().toISOString()})})}
  async function remove(id){return req('sessions?id=eq.'+encodeURIComponent(id),{method:'DELETE'})}
  async function pull(){
    if(syncing)return;syncing=true;
    try{
      const rows=await req('sessions?select=id,session_data,created_at&order=created_at.desc');
      // First activation: migrate existing local history once, preserving all test/real sessions currently on this phone.
      if(!initialized && !rows.length && DB.history.length){for(const s of DB.history)await upsert(s);initialized=true;toast('Storico caricato nel cloud ☁️');return}
      initialized=true;
      DB.history=(rows||[]).map(r=>r.session_data).filter(Boolean);
      cache();renderHistory();
    }catch(e){console.error('SevenLab history pull',e);toast('Storico cloud non raggiungibile')}
    finally{syncing=false}
  }
  const stableArchive=archive;
  archive=function(){
    const before=new Set(DB.history.map(s=>s.id));
    stableArchive();
    const s=DB.history.find(x=>!before.has(x.id));
    if(s)upsert(s).then(()=>pull()).catch(e=>{console.error(e);toast('Sessione locale: cloud non raggiungibile')});
  };
  const stableRenderHistory=renderHistory;
  renderHistory=function(){
    stableRenderHistory();
    $$('[data-rm]').forEach(b=>{
      b.onclick=async()=>{
        if(!confirm('Eliminare definitivamente questa sessione da tutti i dispositivi?'))return;
        const id=b.dataset.rm;
        try{await remove(id);DB.history=DB.history.filter(s=>s.id!==id);cache();stableRenderHistory();toast('Sessione eliminata dal cloud')}
        catch(e){console.error(e);toast('Eliminazione cloud non riuscita')}
      };
    });
  };
  // Refresh when Storico is opened and periodically while another device may be editing.
  document.querySelectorAll('[data-go="storico"]').forEach(b=>b.addEventListener('click',()=>setTimeout(pull,50)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
  setInterval(()=>{if(document.getElementById('storico')?.classList.contains('active'))pull()},8000);
  window.SevenLabCloudHistory={pull};
  setTimeout(pull,500);
})();