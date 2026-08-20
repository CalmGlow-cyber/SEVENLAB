// SevenLab 0.6.1 — team identity stored per authenticated account.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';
  const cacheKey='sevenlab_team_profile_v1';
  const Team=window.SevenLabTeam={name:'',userId:'',ready:false};

  function headers(){
    const token=window.SevenLabAuth?.token;
    if(!token)throw new Error('AUTH_REQUIRED');
    return {'apikey':KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'};
  }
  async function getUser(){
    const r=await fetch(URL+'/auth/v1/user',{headers:headers()});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.message||d.error||'Sessione non valida');
    return d;
  }
  async function request(path,opt={}){
    const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...headers(),...(opt.headers||{})}});
    const txt=await r.text();
    if(!r.ok)throw new Error(txt||'Errore profilo squadra');
    return txt?JSON.parse(txt):null;
  }
  function cache(){localStorage.setItem(cacheKey,JSON.stringify({name:Team.name,userId:Team.userId}))}
  function loadCache(){try{const c=JSON.parse(localStorage.getItem(cacheKey)||'null');if(c?.name)Team.name=c.name;if(c?.userId)Team.userId=c.userId}catch(e){}}

  function injectSettings(){
    const settings=$('#impostazioni .card');
    if(!settings||$('#teamName061'))return;
    const row=document.createElement('div');row.className='settingsrow';row.id='teamName061';
    row.innerHTML=`<div style="width:100%"><div class="settingslabel">Nome squadra</div><div class="sub" style="margin-bottom:8px">Viene usato in Game, risultati ed export.</div><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="teamNameInput061" class="input" maxlength="80" placeholder="Es. ASD Magnago"><button id="teamNameSave061" class="btn primary">Salva</button></div><div id="teamNameState061" class="sub" style="margin-top:7px"></div></div>`;
    const first=settings.querySelector('.settingsrow');first?settings.insertBefore(row,first):settings.appendChild(row);
    $('#teamNameSave061').onclick=async()=>{
      const v=$('#teamNameInput061').value.trim();
      if(!v)return toast('Inserisci il nome della squadra');
      try{await saveName(v);toast('Nome squadra salvato ☁️')}catch(e){console.error(e);toast('Salvataggio non riuscito')}
    };
    renderSettings();
  }
  function renderSettings(){
    const input=$('#teamNameInput061'),state=$('#teamNameState061');
    if(input&&document.activeElement!==input)input.value=Team.name||'';
    if(state)state.textContent=Team.name?`Squadra attiva: ${Team.name}`:'Da impostare prima di utilizzare Game.';
  }
  async function saveName(name){
    if(!Team.userId){const u=await getUser();Team.userId=u.id}
    await request('user_team_profiles?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:Team.userId,team_name:name,updated_at:new Date().toISOString()})});
    Team.name=name;Team.ready=true;cache();renderSettings();
    if(C()?.tipo==='partita'){C().team_name=name;save();if(typeof renderLive==='function')renderLive()}
    return name;
  }
  async function load(){
    loadCache();injectSettings();renderSettings();
    if(!window.SevenLabAuth?.token)return;
    try{
      const u=await getUser();Team.userId=u.id;
      const rows=await request('user_team_profiles?user_id=eq.'+encodeURIComponent(u.id)+'&select=user_id,team_name');
      if(rows?.[0])Team.name=String(rows[0].team_name||'').trim();
      Team.ready=true;cache();renderSettings();
    }catch(e){console.error('SevenLab team profile',e);Team.ready=true;renderSettings()}
  }
  Team.load=load;Team.save=saveName;
  window.addEventListener('DOMContentLoaded',()=>setTimeout(load,1100));
})();