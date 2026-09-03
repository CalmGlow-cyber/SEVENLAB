// SevenLab 0.8.9 — Game goalkeeper stats: shots faced, saves and goals conceded stay separate.
(function(){
  const GAME='partita';
  function isGame089(c=C?.()){return c?.tipo===GAME}
  function assignment089(pid,c=C?.()){
    if(!c)return null;
    for(const t of ['A','B'])for(const k of Object.keys(c.teams?.[t]||{})){
      const a=c.teams[t][k];if(String(a?.pid)===String(pid))return {team:t,slot:k,...a};
    }
    return null;
  }
  function isKeeper089(pid,c=C?.()){
    const a=assignment089(pid,c),p=DB.roster.find(x=>String(x.id)===String(pid));
    return (a?.desired||p?.role)==='P';
  }
  function count089(pid,type,c=C?.()){
    return (c?.events||[]).filter(e=>!e.void&&e.type===type&&String(e.pid)===String(pid)).length;
  }
  function keeperStats089(pid,c=C?.()){
    const shots=count089(pid,'shot_against',c);   // category: shot faced, neither save nor goal
    const saves=count089(pid,'save',c);           // category: save
    const goals=count089(pid,'goal_against',c);   // category: goal conceded
    return {shots,saves,goals,total:shots+saves+goals};
  }
  function currentKeeperFromCard089(card,c=C?.()){
    const ev=card?.querySelector('[data-ev]');if(!ev)return null;
    const pid=ev.dataset.ev?.split('|')?.[0];return pid&&isKeeper089(pid,c)?pid:null;
  }
  function addGoalAgainst089(pid){
    const c=C?.();if(!isGame089(c)||!pid||!isKeeper089(pid,c))return;
    c.score=c.score||{A:0,B:0};c.score.B=(c.score.B||0)+1;c.gol_subiti=c.score.B;
    c.events=c.events||[];
    c.events.push({id:Date.now()+Math.random(),pid,type:'goal_against',t:elapsed(),phase:c.phase,team:'B',void:false,keeper_stat089:true});
    save();renderLive();toast('Gol subito registrato');
  }
  function adaptKeeperCards089(){
    const c=C?.();if(!isGame089(c))return;
    document.querySelectorAll('#livePlayers .liveplayer').forEach(card=>{
      const pid=currentKeeperFromCard089(card,c);if(!pid)return;
      const z=keeperStats089(pid,c),grid=card.querySelector('.countergrid');if(!grid)return;

      // Keep the three goalkeeper outcomes independent. A "Tiro subito" never increments goals or saves.
      const shotBtn=grid.querySelector('[data-shot-against086]');
      if(shotBtn)shotBtn.innerHTML=`<b>🥅 ${z.shots}</b><small>Tiro subito</small>`;

      // Goal conceded is credited to the goalkeeper currently on the pitch and also updates team score.
      let goalBtn=grid.querySelector('[data-goal-against088],.gameAgainst');
      if(goalBtn){
        goalBtn.dataset.goalAgainst089=pid;
        goalBtn.innerHTML=`<b>⚽ ${z.goals}</b><small>Gol subito</small>`;
        goalBtn.onclick=()=>addGoalAgainst089(pid);
      }

      const saveBtn=grid.querySelector('[data-ev$="|save"]');
      if(saveBtn)saveBtn.innerHTML=`<b>🧤 ${z.saves}</b><small>Parata</small>`;

      const micro=card.querySelector('.microstats');
      if(micro)micro.textContent=`Tiri subiti ${z.shots} · Parate ${z.saves} · Gol subiti ${z.goals} · Totale tiri affrontati ${z.total}`;
    });
  }

  const renderBefore089=renderLive;
  renderLive=function(){const r=renderBefore089.apply(this,arguments);try{adaptKeeperCards089()}catch(e){}return r};

  // Undo stays compatible with the existing Game handler; goal_against has a keeper pid now,
  // while the team score remains the authoritative match score.

  function parseCSV089(text){
    text=String(text||'').replace(/^\ufeff/,'');const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}else{if(ch==='"')q=true;else if(ch===';'){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch}}
    row.push(cell);rows.push(row);return rows;
  }
  function enc089(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function augmentCSV089(text,s){
    if(!isGame089(s))return text;
    const rows=parseCSV089(text);
    // Correct the older ambiguous team label: this count is only the standalone shot-against category.
    rows.forEach(r=>{if(r[0]==='Tiri subiti squadra')r[0]='Tiri subiti · categoria separata'});
    const keepers=(s.present||[]).filter(pid=>{
      const p=DB.roster.find(x=>String(x.id)===String(pid));
      if(p?.role==='P')return true;
      return (s.events||[]).some(e=>!e.void&&String(e.pid)===String(pid)&&['shot_against','save','goal_against'].includes(e.type));
    });
    if(keepers.length){
      rows.push([],['STATISTICHE PORTIERI GAME'],['Portiere','Tiri subiti','Parate','Gol subiti','Totale tiri affrontati']);
      keepers.forEach(pid=>{const p=DB.roster.find(x=>String(x.id)===String(pid)),z=keeperStats089(pid,s);rows.push([p?.name||'',z.shots,z.saves,z.goals,z.total])});
      const team=keepers.reduce((a,pid)=>{const z=keeperStats089(pid,s);a.shots+=z.shots;a.saves+=z.saves;a.goals+=z.goals;a.total+=z.total;return a},{shots:0,saves:0,goals:0,total:0});
      rows.push(['TOTALE SQUADRA',team.shots,team.saves,team.goals,team.total]);
    }
    return '\ufeff'+rows.map(r=>r.map(enc089).join(';')).join('\n');
  }
  const exportBefore089=exportSessionCSV;
  exportSessionCSV=function(s){const original=downloadText;downloadText=function(text,name,mime){return original(augmentCSV089(text,s),name,mime)};try{return exportBefore089(s)}finally{downloadText=original}};

  function markVersion089(){
    const beta=document.querySelector('.beta');if(beta)beta.textContent='BETA 0.8.9';
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.9 · Statistiche portiere separate'});
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{markVersion089();try{adaptKeeperCards089()}catch(e){}},500));
  setTimeout(()=>{markVersion089();try{adaptKeeperCards089()}catch(e){}},1100);
})();
