// SevenLab Cloud roster sync - Supabase is authoritative; localStorage is only cache/fallback.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';
  let syncing=false,lastPull=0;
  const cloudId=p=>p?.cloudId||null,norm=s=>String(s||'').trim().toLowerCase();
  function headers(){const t=window.SevenLabAuth?.token;if(!t)throw new Error('AUTH_REQUIRED');return {'apikey':KEY,'Authorization':'Bearer '+t,'Content-Type':'application/json'}}
  async function req(path,opt={}){const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers(),...(opt.headers||{})}});if(!r.ok)throw new Error(await r.text());const txt=await r.text();return txt?JSON.parse(txt):null}

  // Preserve any selections the user is currently making before a cloud refresh rebuilds the DOM.
  // Previously renderPresence() was called by the 8s roster sync and unchecked unsaved selections.
  function capturePresenceDraft(){
    const screen=document.getElementById('allenamento');
    if(!screen?.classList.contains('active'))return;
    const boxes=[...document.querySelectorAll('#presenceList input[type="checkbox"]')];
    if(!boxes.length)return;
    C().present=boxes.filter(x=>x.checked).map(x=>x.value);
    stableSave();
  }

  async function pull({quiet=false}={}){
    if(!window.SevenLabAuth?.token)return;if(syncing)return;
    capturePresenceDraft();
    syncing=true;
    try{
      const rows=await req('players?active=eq.true&select=id,name,role&order=created_at.asc');
      const localByCloud=new Map((DB.roster||[]).filter(p=>p.cloudId).map(p=>[p.cloudId,p])),localByName=new Map((DB.roster||[]).map(p=>[norm(p.name),p]));
      if(!rows.length&&DB.roster.length&&!localStorage.getItem('sevenlab_cloud_seeded')){
        for(const p of DB.roster){const out=await req('players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:p.name,role:p.role})});if(out?.[0])p.cloudId=out[0].id}
        localStorage.setItem('sevenlab_cloud_seeded','1');stableSave();lastPull=Date.now();renderRoster();renderPresence();if(!quiet)toast('Rosa sincronizzata ☁️');return
      }
      DB.roster=rows.map(r=>{const old=localByCloud.get(r.id)||localByName.get(norm(r.name));return{id:old?.id||('p'+r.id),cloudId:r.id,name:r.name,role:r.role}});
      // Remove only players that no longer exist from the draft; keep all other checked selections.
      const valid=new Set(DB.roster.map(p=>p.id));C().present=(C().present||[]).filter(id=>valid.has(id));
      localStorage.setItem('sevenlab_cloud_seeded','1');stableSave();lastPull=Date.now();renderRoster();renderPresence();if(!quiet)toast('Rosa sincronizzata ☁️')
    }catch(e){console.error('SevenLab cloud pull',e);if(!quiet&&e.message!=='AUTH_REQUIRED')toast('Offline: uso rosa locale')}finally{syncing=false}
  }
  async function createPlayer(p){if(!window.SevenLabAuth?.token)return;try{const out=await req('players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:p.name,role:p.role})});if(out?.[0]){p.cloudId=out[0].id;stableSave();snapshot=makeSnapshot()}}catch(e){console.error(e);toast('Cloud non raggiungibile')}}
  async function updatePlayer(p){if(!cloudId(p))return createPlayer(p);try{await req('players?id=eq.'+encodeURIComponent(p.cloudId),{method:'PATCH',body:JSON.stringify({name:p.name,role:p.role,updated_at:new Date().toISOString()})})}catch(e){console.error(e)}}
  async function deleteCloudPlayer(p){try{if(cloudId(p))await req('players?id=eq.'+encodeURIComponent(p.cloudId),{method:'DELETE',headers:{Prefer:'return=representation'}});else await req('players?name=eq.'+encodeURIComponent(p.name),{method:'DELETE',headers:{Prefer:'return=representation'}});return true}catch(e){console.error(e);toast('Eliminazione cloud non riuscita');return false}}
  const stableSave=save,makeSnapshot=()=>new Map((DB.roster||[]).map(p=>[p.id,{name:p.name,role:p.role,cloudId:p.cloudId}]));let snapshot=makeSnapshot();save=function(){const before=snapshot,now=makeSnapshot();stableSave();if(!syncing&&window.SevenLabAuth?.token){for(const p of DB.roster){const prev=before.get(p.id);if(!prev)createPlayer(p);else if(prev.name!==p.name||prev.role!==p.role)updatePlayer(p)}}snapshot=now};
  const stableRenderRoster=renderRoster;renderRoster=function(){stableRenderRoster();$$('[data-del]').forEach(b=>b.onclick=async()=>{const p=DB.roster.find(x=>x.id===b.dataset.del);if(!p||!confirm('Rimuovere questo giocatore dalla rosa condivisa?'))return;b.disabled=true;const ok=await deleteCloudPlayer(p);if(!ok){b.disabled=false;return}syncing=true;DB.roster=DB.roster.filter(x=>x.id!==p.id);stableSave();snapshot=makeSnapshot();syncing=false;renderRoster();renderPresence();toast('Giocatore eliminato ☁️')})};
  const stableGo=go;go=function(id){stableGo(id);if(id==='rosa'&&Date.now()-lastPull>1500)pull({quiet:true})};window.addEventListener('focus',()=>pull({quiet:true}));document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull({quiet:true})});setInterval(()=>{if(!document.hidden)pull({quiet:true})},8000);window.SevenLabCloudRoster={pull};setTimeout(()=>pull(),700);
})();