// SevenLab 0.8.6 — Game-only shots against + goal origin mapping in opponent half.
(function(){
  const GAME='partita';
  let goalMap086=null;

  function isGame086(c=C?.()){return c?.tipo===GAME}
  function assignment086(pid,c=C?.()){
    if(!c)return null;
    for(const t of ['A','B'])for(const k of Object.keys(c.teams?.[t]||{})){
      const a=c.teams[t][k];if(String(a?.pid)===String(pid))return {team:t,slot:k,...a};
    }
    return null;
  }
  function isKeeper086(pid,c=C?.()){return assignment086(pid,c)?.desired==='P'}
  function countAgainst086(pid,c=C?.()){return (c?.events||[]).filter(e=>!e.void&&e.type==='shot_against'&&String(e.pid)===String(pid)).length}
  function totalAgainst086(s){return (s?.events||[]).filter(e=>!e.void&&e.type==='shot_against').length}

  // ---------- GAME-ONLY SHOTS AGAINST ----------
  function addShotAgainst086(pid){
    const c=C?.();if(!isGame086(c)||!isKeeper086(pid,c))return;
    const a=assignment086(pid,c);
    c.events.push({
      id:Date.now()+Math.random(),pid,type:'shot_against',t:elapsed(),phase:c.phase,team:a?.team||'A',
      opponent_team:(a?.team||'A')==='A'?'B':'A',void:false,game_only:true,team_stat:'shots_against'
    });
    save();renderLive();toast('Tiro subito registrato');
  }
  function injectKeeperShot086(){
    const c=C?.();if(!isGame086(c))return;
    document.querySelectorAll('#livePlayers .liveplayer').forEach(card=>{
      const first=card.querySelector('[data-ev]');if(!first)return;
      const pid=first.dataset.ev.split('|')[0];if(!isKeeper086(pid,c))return;
      const grid=card.querySelector('.countergrid');if(!grid||grid.querySelector('[data-shot-against086]'))return;
      const b=document.createElement('button');b.className='counter counterbig';b.dataset.shotAgainst086=pid;
      b.innerHTML=`<b>🥅 ${countAgainst086(pid,c)}</b><small>Tiro subito</small>`;
      b.onclick=()=>addShotAgainst086(pid);grid.appendChild(b);
      const micro=card.querySelector('.microstats');if(micro&&!/Tiri subiti/.test(micro.textContent||''))micro.textContent+=` · Tiri subiti ${countAgainst086(pid,c)}`;
    });
  }
  const renderBefore086=renderLive;
  renderLive=function(){const r=renderBefore086.apply(this,arguments);try{injectKeeperShot086()}catch(e){}return r};

  // ---------- GAME GOAL MAP ----------
  function ensureGoalMap086(){
    if(document.getElementById('goalMapModal086'))return;
    const style=document.createElement('style');style.id='goalMapStyle086';style.textContent=`
      #goalMapPitch086{position:relative;width:100%;aspect-ratio:1.45/1;background:linear-gradient(90deg,#0f5c34,#147443);border:2px solid rgba(255,255,255,.75);border-radius:12px;overflow:hidden;touch-action:manipulation;cursor:crosshair;margin-top:12px}
      #goalMapPitch086:before{content:'';position:absolute;inset:0;border-left:2px solid rgba(255,255,255,.8);pointer-events:none}
      #goalMapPitch086 .gmPenalty{position:absolute;right:0;top:24%;width:30%;height:52%;border:2px solid rgba(255,255,255,.72);border-right:0;pointer-events:none}
      #goalMapPitch086 .gmGoalArea{position:absolute;right:0;top:37%;width:12%;height:26%;border:2px solid rgba(255,255,255,.72);border-right:0;pointer-events:none}
      #goalMapPitch086 .gmGoal{position:absolute;right:-1px;top:42%;width:2%;height:16%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.08);pointer-events:none}
      #goalMapPitch086 .gmArc{position:absolute;right:22%;top:40%;width:12%;height:20%;border:2px solid rgba(255,255,255,.55);border-left-color:transparent;border-top-color:transparent;border-bottom-color:transparent;border-radius:50%;pointer-events:none}
      #goalMapPitch086 .gmMid{position:absolute;left:0;top:0;bottom:0;border-left:2px dashed rgba(255,255,255,.45);pointer-events:none}
      .gmMarker086{position:absolute;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #fff;background:#111;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.45);pointer-events:none}
      #goalMapLegend086{display:flex;justify-content:space-between;gap:8px;font-size:11px;opacity:.72;margin-top:6px}
      #goalMapCoords086{font-size:12px;margin-top:8px;line-height:1.45}
    `;document.head.appendChild(style);
    const m=document.createElement('div');m.id='goalMapModal086';m.className='modal';
    m.innerHTML=`<div class="sheet"><div class="teamhead"><h3>🎯 Origine azione del gol</h3><button class="btn small ghost" id="goalMapCancel086">Annulla gol</button></div><div id="goalMapInstruction086" class="sub"></div><div id="goalMapPitch086"><div class="gmPenalty"></div><div class="gmGoalArea"></div><div class="gmGoal"></div><div class="gmArc"></div><div class="gmMid"></div></div><div id="goalMapLegend086"><span>Metà campo · Y=25</span><span>Porta avversaria · Y=50</span></div><div id="goalMapCoords086"></div></div>`;
    document.body.appendChild(m);
    document.getElementById('goalMapPitch086').addEventListener('click',handleGoalMapTap086);
    document.getElementById('goalMapCancel086').onclick=cancelGoalMap086;
  }
  function resetGoalMapVisual086(){document.querySelectorAll('#goalMapPitch086 .gmMarker086').forEach(x=>x.remove());const c=document.getElementById('goalMapCoords086');if(c)c.textContent=''}
  function mark086(kind,pos){
    const pitch=document.getElementById('goalMapPitch086');if(!pitch)return;
    const d=document.createElement('div');d.className='gmMarker086';d.textContent=kind==='assist'?'A':'T';
    d.style.left=`${((pos.y-25)/25)*100}%`;d.style.top=`${(pos.x/30)*100}%`;pitch.appendChild(d);
  }
  function pointFromTap086(ev){
    const r=ev.currentTarget.getBoundingClientRect();
    const hx=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width));
    const vy=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
    return {x:Math.round(vy*300)/10,y:Math.round((25+hx*25)*10)/10,x_pct:Math.round(vy*1000)/10,y_pct:Math.round(((25+hx*25)/50)*1000)/10};
  }
  function updateGoalMapText086(){
    const i=document.getElementById('goalMapInstruction086'),c=document.getElementById('goalMapCoords086');if(!goalMap086||!i)return;
    if(goalMap086.assistId&&!goalMap086.assistOrigin)i.textContent='1° tocco: indica da dove è partito l’assist.';
    else i.textContent='Indica da dove è partito il tiro che ha prodotto il gol.';
    if(c){const a=goalMap086.assistOrigin?`Assist: X ${goalMap086.assistOrigin.x} · Y ${goalMap086.assistOrigin.y}`:'';const t=goalMap086.shotOrigin?`Tiro: X ${goalMap086.shotOrigin.x} · Y ${goalMap086.shotOrigin.y}`:'';c.textContent=[a,t].filter(Boolean).join('  |  ')}
  }
  function openGoalMap086(assistId){
    if(!isGame086()||!pendingGoal)return false;
    ensureGoalMap086();resetGoalMapVisual086();
    goalMap086={scorer:pendingGoal.scorer,team:pendingGoal.team,t:pendingGoal.t,assistId:assistId||null,assistOrigin:null,shotOrigin:null};
    document.getElementById('assistModal')?.classList.remove('show');document.getElementById('goalMapModal086')?.classList.add('show');updateGoalMapText086();return true;
  }
  function handleGoalMapTap086(ev){
    if(!goalMap086)return;const p=pointFromTap086(ev);
    if(goalMap086.assistId&&!goalMap086.assistOrigin){goalMap086.assistOrigin=p;mark086('assist',p);updateGoalMapText086();return}
    goalMap086.shotOrigin=p;mark086('shot',p);updateGoalMapText086();finishMappedGoal086();
  }
  function cancelGoalMap086(){
    document.getElementById('goalMapModal086')?.classList.remove('show');goalMap086=null;
    try{pendingGoal=null}catch(e){}
    toast('Gol annullato');
  }

  const commitGoalBefore086=commitGoal;
  let finishing086=false;
  commitGoal=function(assistId){
    if(!finishing086&&isGame086()&&pendingGoal){if(openGoalMap086(assistId))return}
    return commitGoalBefore086.apply(this,arguments);
  };
  function finishMappedGoal086(){
    const c=C?.(),gctx=goalMap086;if(!c||!gctx?.shotOrigin)return;
    finishing086=true;
    try{commitGoalBefore086(gctx.assistId)}finally{finishing086=false}
    const goal=[...(c.events||[])].reverse().find(e=>!e.void&&e.type==='goal'&&String(e.pid)===String(gctx.scorer)&&Number(e.t)===Number(gctx.t));
    if(goal){
      goal.goal_map086=true;goal.shot_origin_x_m=gctx.shotOrigin.x;goal.shot_origin_y_m=gctx.shotOrigin.y;goal.shot_origin_x_pct=gctx.shotOrigin.x_pct;goal.shot_origin_y_pct=gctx.shotOrigin.y_pct;goal.field_width_m=30;goal.field_length_m=50;goal.map_zone='opponent_half';
      if(gctx.assistOrigin){goal.assist_origin_x_m=gctx.assistOrigin.x;goal.assist_origin_y_m=gctx.assistOrigin.y;goal.assist_origin_x_pct=gctx.assistOrigin.x_pct;goal.assist_origin_y_pct=gctx.assistOrigin.y_pct}
      if(gctx.assistId){const ae=[...(c.events||[])].reverse().find(e=>!e.void&&e.type==='assist'&&String(e.pid)===String(gctx.assistId)&&String(e.goalId)===String(goal.id));if(ae&&gctx.assistOrigin){ae.origin_x_m=gctx.assistOrigin.x;ae.origin_y_m=gctx.assistOrigin.y;ae.origin_x_pct=gctx.assistOrigin.x_pct;ae.origin_y_pct=gctx.assistOrigin.y_pct;ae.map_zone='opponent_half'}}
    }
    save();document.getElementById('goalMapModal086')?.classList.remove('show');goalMap086=null;toast('Gol e coordinate registrati');
  }

  // ---------- LABEL + CSV ----------
  const labelBefore086=label;
  label=function(t){return t==='shot_against'?'Tiro subito':labelBefore086(t)};

  function parseCSV086(text){
    text=String(text||'').replace(/^\ufeff/,'');const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}else{if(ch==='"')q=true;else if(ch===';'){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch}}
    row.push(cell);rows.push(row);return rows;
  }
  function enc086(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function augmentCSV086(text,s){
    if(!isGame086(s))return text;
    const rows=parseCSV086(text),total=totalAgainst086(s);
    const resultIdx=rows.findIndex(r=>r[0]==='Risultato');rows.splice(resultIdx>=0?resultIdx+1:Math.min(6,rows.length),0,['Tiri subiti squadra',total]);
    const hi=rows.findIndex(r=>r[0]==='Giocatore'&&r.includes('Ruolo'));
    if(hi>=0){rows[hi].push('Tiri subiti rilevati');for(let i=hi+1;i<rows.length;i++){if(!rows[i][0]||['EVENTI PARTITA','TIMELINE EVENTI','DATI SPAZIALI','RUOLI EVENTI'].includes(rows[i][0]))break;const p=DB.roster.find(x=>x.name===rows[i][0]);if(p)rows[i].push((s.events||[]).filter(e=>!e.void&&e.type==='shot_against'&&String(e.pid)===String(p.id)).length)}}
    const goals=(s.events||[]).filter(e=>!e.void&&e.type==='goal'&&e.goal_map086);
    if(goals.length){
      rows.push([],['DETTAGLIO GOL GAME'],['Secondo','Marcatore','Assist','Assist X m','Assist Y m','Tiro X m','Tiro Y m','Larghezza campo m','Lunghezza campo m','Zona mappa']);
      goals.forEach(g=>{const scorer=DB.roster.find(x=>String(x.id)===String(g.pid))?.name||'';const an=g.assistId?DB.roster.find(x=>String(x.id)===String(g.assistId))?.name||'':'';rows.push([g.t??'',scorer,an,g.assist_origin_x_m??'',g.assist_origin_y_m??'',g.shot_origin_x_m??'',g.shot_origin_y_m??'',30,50,'metà campo avversaria'])});
    }
    return '\ufeff'+rows.map(r=>r.map(enc086).join(';')).join('\n');
  }
  const exportBefore086=exportSessionCSV;
  exportSessionCSV=function(s){const original=downloadText;downloadText=function(text,name,mime){return original(augmentCSV086(text,s),name,mime)};try{return exportBefore086(s)}finally{downloadText=original}};

  function markVersion086(){
    document.querySelector('.beta')?.replaceChildren(document.createTextNode('BETA 0.8.6'));
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.6 · Game tiri subiti + mappa origine gol'});
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{markVersion086();try{injectKeeperShot086()}catch(e){}},500));
  setTimeout(()=>{markVersion086();try{injectKeeperShot086()}catch(e){}},1100);
})();
