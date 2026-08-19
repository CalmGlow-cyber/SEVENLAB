// SevenLab Cloud roster sync - Supabase is authoritative; localStorage is only cache/fallback.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';
  const headers={'apikey':KEY,'Content-Type':'application/json'};
  let syncing=false,lastPull=0;

  const cloudId=p=>p?.cloudId||null;
  const norm=s=>String(s||'').trim().toLowerCase();
  async function req(path,opt={}){
    const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers,...(opt.headers||{})}});
    if(!r.ok) throw new Error(await r.text());
    const txt=await r.text(); return txt?JSON.parse(txt):null;
  }

  // Cloud is the source of truth. Existing local IDs are preserved by name so old local
  // sessions keep resolving player names correctly while only the roster is cloud-enabled.
  async function pull({quiet=false}={}){
    if(syncing)return; syncing=true;
    try{
      const rows=await req('players?active=eq.true&select=id,name,role&order=created_at.asc');
      const localByCloud=new Map((DB.roster||[]).filter(p=>p.cloudId).map(p=>[p.cloudId,p]));
      const localByName=new Map((DB.roster||[]).map(p=>[norm(p.name),p]));

      // Only seed an EMPTY cloud from local data. Once the cloud has data, local-only
      // records are NEVER uploaded during pull: this prevents deleted players resurrecting.
      if(!rows.length && DB.roster.length && !localStorage.getItem('sevenlab_cloud_seeded')){
        for(const p of DB.roster){
          const out=await req('players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:p.name,role:p.role})});
          if(out?.[0])p.cloudId=out[0].id;
        }
        localStorage.setItem('sevenlab_cloud_seeded','1');
        stableSave();
        lastPull=Date.now();
        renderRoster();renderPresence();
        if(!quiet)toast('Rosa sincronizzata ☁️');
        return;
      }

      DB.roster=rows.map(r=>{
        const old=localByCloud.get(r.id)||localByName.get(norm(r.name));
        return {id:old?.id||('p'+r.id),cloudId:r.id,name:r.name,role:r.role};
      });
      localStorage.setItem('sevenlab_cloud_seeded','1');
      stableSave();
      lastPull=Date.now();
      renderRoster();renderPresence();
      if(!quiet)toast('Rosa sincronizzata ☁️');
    }catch(e){
      console.error('SevenLab cloud pull',e);
      if(!quiet)toast('Offline: uso rosa locale');
    }finally{syncing=false}
  }

  async function createPlayer(p){
    try{
      const out=await req('players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:p.name,role:p.role})});
      if(out?.[0]){p.cloudId=out[0].id;stableSave();snapshot=makeSnapshot()}
    }catch(e){console.error('SevenLab cloud create',e);toast('Salvato sul telefono; cloud non raggiungibile')}
  }
  async function updatePlayer(p){
    if(!cloudId(p))return createPlayer(p);
    try{await req('players?id=eq.'+encodeURIComponent(p.cloudId),{method:'PATCH',body:JSON.stringify({name:p.name,role:p.role,updated_at:new Date().toISOString()})})}
    catch(e){console.error('SevenLab cloud update',e);toast('Modifica locale; cloud non raggiungibile')}
  }
  async function deleteCloudPlayer(p){
    try{
      if(cloudId(p)){
        await req('players?id=eq.'+encodeURIComponent(p.cloudId),{method:'DELETE',headers:{Prefer:'return=representation'}});
      }else{
        // Fallback for legacy local players that do not yet carry the Supabase UUID.
        await req('players?name=eq.'+encodeURIComponent(p.name),{method:'DELETE',headers:{Prefer:'return=representation'}});
      }
      return true;
    }catch(e){console.error('SevenLab cloud delete',e);toast('Eliminazione cloud non riuscita');return false}
  }

  const stableSave=save;
  const makeSnapshot=()=>new Map((DB.roster||[]).map(p=>[p.id,{name:p.name,role:p.role,cloudId:p.cloudId}]));
  let snapshot=makeSnapshot();

  // Keep all pre-existing app calls to save() working. New/edited players are mirrored.
  // Deletion is handled explicitly in renderRoster below, so a failed cloud delete cannot
  // silently disappear locally and later reappear.
  save=function(){
    const before=snapshot,now=makeSnapshot();
    stableSave();
    if(!syncing){
      for(const p of DB.roster){
        const prev=before.get(p.id);
        if(!prev) createPlayer(p);
        else if(prev.name!==p.name||prev.role!==p.role) updatePlayer(p);
      }
    }
    snapshot=now;
  };

  // Override only the roster renderer so deletion is cloud-first and definitive.
  const stableRenderRoster=renderRoster;
  renderRoster=function(){
    stableRenderRoster();
    $$('[data-del]').forEach(b=>b.onclick=async()=>{
      const p=DB.roster.find(x=>x.id===b.dataset.del);
      if(!p||!confirm('Rimuovere questo giocatore dalla rosa condivisa?'))return;
      b.disabled=true;
      const ok=await deleteCloudPlayer(p);
      if(!ok){b.disabled=false;return}
      syncing=true;
      DB.roster=DB.roster.filter(x=>x.id!==p.id);
      stableSave();snapshot=makeSnapshot();
      syncing=false;
      renderRoster();renderPresence();
      toast('Giocatore eliminato ☁️');
    });
  };

  // Refresh automatically when the user returns to Rosa and when the app regains focus.
  const stableGo=go;
  go=function(id){stableGo(id);if(id==='rosa'&&Date.now()-lastPull>1500)pull({quiet:true})};
  window.addEventListener('focus',()=>pull({quiet:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull({quiet:true})});
  // Lightweight polling while the page is open so a second phone sees roster changes.
  setInterval(()=>{if(!document.hidden)pull({quiet:true})},8000);

  window.SevenLabCloudRoster={pull};
  pull();
})();