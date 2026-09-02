// SevenLab 0.8.2 — spatial Recover/Lost + paired opponent recovery in LIVE only.
(function(){
  const FIELD_L=50,FIELD_W=30;
  let pending=null,lastLostEvent=null;

  function third(x){return x<FIELD_L/3?'difensivo':x<2*FIELD_L/3?'centrale':'offensivo'}
  function lane(y){return y<FIELD_W/3?'sinistra':y<2*FIELD_W/3?'centro':'destra'}
  function playerName(pid){try{return DB.roster.find(p=>String(p.id)===String(pid))?.name||''}catch(e){return''}}
  function teamFor(pid,c){try{return c?.tipo==='partita'?'A':(teamOf(pid,c)||'A')}catch(e){return'A'}}
  function isGame(c){return c?.tipo==='partita'}
  function oppositeTeam(team){return team==='A'?'B':'A'}
  function activeTeamPlayers(team,c){try{return [...new Set(Object.values(c?.teams?.[team]||{}).map(a=>a?.pid).filter(Boolean))]}catch(e){return[]}}

  function ensureUI(){
    if(document.getElementById('spatialModal081'))return;
    const style=document.createElement('style');style.id='spatialStyle081';style.textContent=`
      #spatialModal081{position:fixed;inset:0;z-index:120000;background:rgba(3,9,7,.94);display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
      #spatialModal081.show{display:flex}.sp081box{width:min(960px,100%);max-height:96vh;overflow:auto;background:#0d1c16;border:1px solid #294a3b;border-radius:18px;padding:14px;box-sizing:border-box}
      .sp081head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.sp081title{font-size:18px;font-weight:900}.sp081meta{font-size:12px;opacity:.72;margin-top:3px}
      .sp081cancel{border:1px solid rgba(255,255,255,.18);background:transparent;color:inherit;border-radius:10px;min-height:38px;padding:6px 12px}.sp081pitch{position:relative;width:100%;aspect-ratio:5/3;background:#174f32;border:3px solid rgba(255,255,255,.9);border-radius:8px;overflow:visible;touch-action:none;cursor:crosshair}
      .sp081pitch:before{content:'';position:absolute;left:50%;top:0;bottom:0;border-left:2px solid rgba(255,255,255,.72)}.sp081pitch:after{content:'';position:absolute;left:50%;top:50%;width:16%;aspect-ratio:1;border:2px solid rgba(255,255,255,.72);border-radius:50%;transform:translate(-50%,-50%)}
      .sp081third{position:absolute;top:0;bottom:0;border-left:1px dashed rgba(255,255,255,.28)}.sp081t1{left:33.333%}.sp081t2{left:66.666%}.sp081boxarea{position:absolute;top:22%;bottom:22%;width:14%;border:2px solid rgba(255,255,255,.72)}.sp081boxL{left:-2px}.sp081boxR{right:-2px}
      .sp081goal{position:absolute;top:37%;bottom:37%;width:3.2%;border:4px solid currentColor;box-shadow:0 0 12px currentColor;z-index:4;pointer-events:none}.sp081goalL{left:-4px;color:#1687ff;background:rgba(22,135,255,.18)}.sp081goalR{right:-4px;color:#ff1f1f;background:rgba(255,31,31,.2)}
      .sp081opp{position:absolute;right:10px;top:8px;font-size:11px;font-weight:900;background:#ff1f1f;color:#fff;padding:5px 8px;border-radius:7px;box-shadow:0 0 10px rgba(255,31,31,.65);pointer-events:none;z-index:5}.sp081own{position:absolute;left:10px;top:8px;font-size:11px;font-weight:900;background:#1687ff;color:#fff;padding:5px 8px;border-radius:7px;box-shadow:0 0 10px rgba(22,135,255,.6);pointer-events:none;z-index:5}
      .sp081dot{position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;border:4px solid #111;transform:translate(-50%,-50%);pointer-events:none;box-sizing:border-box;z-index:6}.sp081hint{text-align:center;margin-top:8px;font-size:12px;opacity:.78}.sp081coords{text-align:center;font-weight:800;margin-top:5px;min-height:20px}
      .sp081recoverpick{display:none}.sp081recoverpick.show{display:block}.sp081recoverhead{font-size:17px;font-weight:900;margin:8px 0 4px}.sp081recoverhelp{font-size:12px;opacity:.75;margin-bottom:10px}.sp081choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sp081choice{min-height:54px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#14271f;color:inherit;padding:10px;font-weight:800;text-align:left}.sp081none{grid-column:1/-1;background:#2a2118;border-color:#5f4a2c}.sp081pitchwrap.hidden{display:none}
      .sp081merged-note{font-size:10px;opacity:.7;margin-top:3px}
      @media(max-width:700px){.sp081box{padding:10px}.sp081title{font-size:16px}.sp081own,.sp081opp{font-size:10px;padding:4px 6px}.sp081choices{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
    const m=document.createElement('div');m.id='spatialModal081';m.innerHTML=`<div class="sp081box"><div class="sp081head"><div><div id="sp081Title" class="sp081title">Posizione evento</div><div id="sp081Meta" class="sp081meta"></div></div><button id="sp081Cancel" class="sp081cancel">Annulla</button></div><div id="sp081PitchWrap" class="sp081pitchwrap"><div id="sp081Pitch" class="sp081pitch"><i class="sp081third sp081t1"></i><i class="sp081third sp081t2"></i><i class="sp081boxarea sp081boxL"></i><i class="sp081boxarea sp081boxR"></i><i class="sp081goal sp081goalL"></i><i class="sp081goal sp081goalR"></i><span class="sp081own">PORTA SQUADRA · X=0</span><span class="sp081opp">PORTA AVVERSARIA · X=50 →</span><span id="sp081Dot" class="sp081dot" hidden></span></div><div class="sp081hint">Un tap salva il punto. X 0–50 m verso la porta avversaria, Y 0–30 m.</div><div id="sp081Coords" class="sp081coords"></div></div><div id="sp081RecoverPick" class="sp081recoverpick"><div class="sp081recoverhead">Chi ha recuperato il pallone?</div><div id="sp081RecoverHelp" class="sp081recoverhelp"></div><div id="sp081RecoverChoices" class="sp081choices"></div></div></div>`;
    document.body.appendChild(m);document.getElementById('sp081Cancel').onclick=cancelCurrent;document.getElementById('sp081Pitch').addEventListener('pointerdown',choose,{passive:false});
  }

  function resetModal(){document.getElementById('sp081PitchWrap')?.classList.remove('hidden');document.getElementById('sp081RecoverPick')?.classList.remove('show');const c=document.getElementById('sp081Cancel');if(c)c.textContent='Annulla'}
  function open(pid,type){ensureUI();const c=C();if(!c?.id)return;const team=teamFor(pid,c);pending={pid,type,team};lastLostEvent=null;resetModal();document.getElementById('sp081Title').textContent=(type==='recover'?'🔄 Recupero':'❌ Palla persa')+' · '+playerName(pid);document.getElementById('sp081Meta').textContent=isGame(c)?'GAME · nostra squadra':`LIVE · Squadra ${team}`;document.getElementById('sp081Coords').textContent='';document.getElementById('sp081Dot').hidden=true;document.getElementById('spatialModal081').classList.add('show')}
  function close(){document.getElementById('spatialModal081')?.classList.remove('show');pending=null;lastLostEvent=null;resetModal()}
  function cancelCurrent(){if(lastLostEvent&&!isGame(C())){close();try{renderLive()}catch(e){};return}close()}

  function attachSpatial(e,p,x,y,xp,yp){e.team=e.team||p.team;e.x_m=x;e.y_m=y;e.x_pct=+(xp*100).toFixed(2);e.y_pct=+(yp*100).toFixed(2);e.field_length_m=FIELD_L;e.field_width_m=FIELD_W;e.field_third=third(x);e.field_lane=lane(y);e.spatial=true;e.attack_direction='x_positive'}
  function showOpponentRecoveryPicker(lostEvent){
    const c=C(),opp=oppositeTeam(lostEvent.team||pending.team),ids=activeTeamPlayers(opp,c),choices=document.getElementById('sp081RecoverChoices');lastLostEvent=lostEvent;
    document.getElementById('sp081PitchWrap').classList.add('hidden');document.getElementById('sp081RecoverPick').classList.add('show');document.getElementById('sp081Cancel').textContent='Nessun recupero';document.getElementById('sp081Title').textContent='❌ Palla persa registrata';document.getElementById('sp081Meta').textContent=`LIVE · Squadra ${lostEvent.team} → possibile recupero Squadra ${opp}`;document.getElementById('sp081RecoverHelp').textContent='Seleziona solo un giocatore attualmente in campo. Il recupero avrà lo stesso tempo e lo stesso punto fisico, normalizzato rispetto alla direzione d’attacco della squadra che recupera.';
    choices.innerHTML=ids.map(pid=>`<button class="sp081choice" data-sp081recover="${pid}">🔄 ${playerName(pid)}</button>`).join('')+`<button class="sp081choice sp081none" data-sp081recover="">Nessun recupero avversario</button>`;choices.querySelectorAll('[data-sp081recover]').forEach(b=>b.onclick=()=>finishRecoveryPair(b.dataset.sp081recover,opp));
  }
  function finishRecoveryPair(pid,opp){
    const c=C();if(!lastLostEvent){close();return}
    if(pid){
      const pairId='pair'+Date.now()+Math.random(),rx=+(FIELD_L-Number(lastLostEvent.x_m)).toFixed(2),ry=+(FIELD_W-Number(lastLostEvent.y_m)).toFixed(2),rxp=+(100-Number(lastLostEvent.x_pct)).toFixed(2),ryp=+(100-Number(lastLostEvent.y_pct)).toFixed(2);
      lastLostEvent.paired_event_id=pairId;lastLostEvent.paired_with_pid=pid;lastLostEvent.paired_source='live_lost';
      const r={id:Date.now()+Math.random(),pid,type:'recover',t:lastLostEvent.t,phase:lastLostEvent.phase||c.phase,team:opp,void:false,x_m:rx,y_m:ry,x_pct:rxp,y_pct:ryp,field_length_m:FIELD_L,field_width_m:FIELD_W,field_third:third(rx),field_lane:lane(ry),spatial:true,attack_direction:'x_positive',paired_event_id:pairId,paired_with_pid:lastLostEvent.pid,paired_source:'live_lost'};
      c.events=c.events||[];c.events.push(r);save();try{toast('Palla persa + recupero registrati')}catch(e){}
    }else{lastLostEvent.no_recovery=true;save();try{toast('Palla persa registrata · nessun recupero')}catch(e){}}
    close();try{renderLive()}catch(e){}
  }

  function choose(ev){
    if(!pending)return;ev.preventDefault();const pitch=ev.currentTarget,r=pitch.getBoundingClientRect(),xp=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),yp=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height)),x=+(xp*FIELD_L).toFixed(2),y=+(yp*FIELD_W).toFixed(2),before=(C().events||[]).length,p={...pending};
    addEvent(p.pid,p.type);const c=C(),events=c.events||[];if(events.length<=before){close();return}let e=null;for(let i=events.length-1;i>=0;i--){const q=events[i];if(!q.void&&String(q.pid)===String(p.pid)&&q.type===p.type){e=q;break}}if(!e){close();return}attachSpatial(e,p,x,y,xp,yp);save();const dot=document.getElementById('sp081Dot');dot.hidden=false;dot.style.left=(xp*100)+'%';dot.style.top=(yp*100)+'%';document.getElementById('sp081Coords').textContent=`X ${x.toFixed(1)} m · Y ${y.toFixed(1)} m`;if(!isGame(c)&&p.type==='lost'){setTimeout(()=>showOpponentRecoveryPicker(e),80);return}setTimeout(()=>{close();try{renderLive()}catch(err){}},110)
  }

  document.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-ev]');if(!b)return;const parts=String(b.dataset.ev||'').split('|'),pid=parts[0],type=parts[1];if(type!=='recover'&&type!=='lost')return;const c=C();if(!isGame(c)&&type==='recover')return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();open(pid,type)},true);

  function applyLiveMergeUI(){const c=C();if(!c?.id||isGame(c))return;document.querySelectorAll('#live [data-ev]').forEach(b=>{const p=String(b.dataset.ev||'').split('|');if(p[1]==='recover')b.remove()});document.querySelectorAll('#live .liveplayer').forEach(card=>{const grid=card.querySelector('.countergrid');if(grid&&!card.querySelector('.sp081merged-note')){const n=document.createElement('div');n.className='sp081merged-note';n.textContent='Recupero avversario: assegnabile dopo Palla persa';card.appendChild(n)}})}
  const baseRenderSpatial=renderLive;renderLive=function(){baseRenderSpatial();applyLiveMergeUI()};setTimeout(applyLiveMergeUI,900);

  function enc(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function appendSpatialCSV(text,s){const evs=(s?.events||[]).filter(e=>!e.void&&(e.type==='recover'||e.type==='lost')&&Number.isFinite(Number(e.x_m))&&Number.isFinite(Number(e.y_m)));const rows=[['DATI SPAZIALI'],['Tipo evento','Giocatore','Team','X metri','Y metri','X %','Y %','Terzo campo','Fascia','Lunghezza campo m','Larghezza campo m','Direzione attacco','Evento collegato','Nessun recupero']];evs.forEach(e=>rows.push([e.type==='recover'?'Recupero':'Palla persa',playerName(e.pid),e.team||teamFor(e.pid,s),e.x_m,e.y_m,e.x_pct,e.y_pct,e.field_third||third(Number(e.x_m)),e.field_lane||lane(Number(e.y_m)),e.field_length_m||FIELD_L,e.field_width_m||FIELD_W,e.attack_direction||'x_positive',e.paired_event_id||'',e.no_recovery?'SI':'']));return String(text||'')+'\n\n'+rows.map(r=>r.map(enc).join(';')).join('\n')}
  if(typeof exportSessionCSV==='function'&&typeof downloadText==='function'){const base=exportSessionCSV;exportSessionCSV=function(s){const original=downloadText;downloadText=function(text,name,mime){return original(appendSpatialCSV(text,s),name,mime)};try{return base(s)}finally{downloadText=original}}}

  function markVersion(){document.querySelector('.beta')?.replaceChildren(document.createTextNode('BETA 0.8.2'));document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.2 · Palla persa + recupero LIVE'})}
  window.addEventListener('DOMContentLoaded',()=>{ensureUI();markVersion();setTimeout(applyLiveMergeUI,200)});setTimeout(()=>{ensureUI();markVersion()},700);window.SevenLabSpatial081={open,fieldLength:FIELD_L,fieldWidth:FIELD_W};
})();
