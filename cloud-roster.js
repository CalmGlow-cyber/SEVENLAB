// SevenLab Cloud roster sync - incremental layer. LocalStorage remains fallback/cache.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';
  const headers={'apikey':KEY,'Content-Type':'application/json'};
  let syncing=false;

  const cloudId=p=>p?.cloudId||null;
  async function req(path,opt={}){
    const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers,...(opt.headers||{})}});
    if(!r.ok) throw new Error(await r.text());
    const txt=await r.text(); return txt?JSON.parse(txt):null;
  }
  async function pull(){
    if(syncing)return; syncing=true;
    try{
      const rows=await req('players?active=eq.true&select=id,name,role&order=created_at.asc');
      const localByName=new Map((DB.roster||[]).map(p=>[String(p.name||'').trim().toLowerCase(),p]));
      // First cloud launch: preserve and upload the existing local roster.
      if(!rows.length && DB.roster.length){
        for(const p of DB.roster){
          const out=await req('players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:p.name,role:p.role})});
          if(out?.[0]) p.cloudId=out[0].id;
        }
        save();
      } else {
        const merged=[];
        for(const r of rows){
          const old=localByName.get(r.name.trim().toLowerCase());
          merged.push({id:old?.id||('p'+r.id),cloudId:r.id,name:r.name,role:r.role});
        }
        // Upload local-only players rather than silently deleting them.
        for(const p of DB.roster){
          if(!rows.some(r=>r.name.trim().toLowerCase()===p.name.trim().toLowerCase())){
            const out=await req('players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:p.name,role:p.role})});
            if(out?.[0]){p.cloudId=out[0].id;merged.push(p)}
          }
        }
        DB.roster=merged; save();
      }
      renderRoster();renderPresence();toast('Rosa sincronizzata ☁️');
    }catch(e){console.error('SevenLab cloud pull',e);toast('Offline: uso rosa locale')}
    finally{syncing=false}
  }
  async function pushPlayer(p){
    try{
      if(cloudId(p)) await req('players?id=eq.'+encodeURIComponent(p.cloudId),{method:'PATCH',body:JSON.stringify({name:p.name,role:p.role,updated_at:new Date().toISOString()})});
      else {
        const out=await req('players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:p.name,role:p.role})});
        if(out?.[0]){p.cloudId=out[0].id;save()}
      }
    }catch(e){console.error('SevenLab cloud push',e);toast('Salvato sul telefono; cloud non raggiungibile')}
  }
  async function deletePlayer(p){
    if(!cloudId(p))return;
    try{await req('players?id=eq.'+encodeURIComponent(p.cloudId),{method:'DELETE'})}catch(e){console.error('SevenLab cloud delete',e)}
  }

  // Wrap stable save: roster changes are detected and mirrored without changing existing app logic.
  let snapshot=new Map((DB.roster||[]).map(p=>[p.id,JSON.stringify({name:p.name,role:p.role,cloudId:p.cloudId})]));
  const stableSave=save;
  save=function(){
    const before=snapshot,now=new Map((DB.roster||[]).map(p=>[p.id,JSON.stringify({name:p.name,role:p.role,cloudId:p.cloudId})]));
    stableSave();
    if(!syncing){
      for(const p of DB.roster){if(before.get(p.id)!==now.get(p.id)) pushPlayer(p)}
      for(const [id] of before){if(!now.has(id)){const raw=JSON.parse(before.get(id));deletePlayer({cloudId:raw.cloudId})}}
    }
    snapshot=now;
  };
  window.SevenLabCloudRoster={pull};
  pull();
})();