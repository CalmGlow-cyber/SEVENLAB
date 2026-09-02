// SevenLab 0.8.1 — spatial coordinates for Recover/Lost in Live + Game + Test CSV.
(function(){
  const FIELD_L=50,FIELD_W=30;
  let pending=null;

  function third(x){return x<FIELD_L/3?'difensivo':x<2*FIELD_L/3?'centrale':'offensivo'}
  function lane(y){return y<FIELD_W/3?'sinistra':y<2*FIELD_W/3?'centro':'destra'}
  function playerName(pid){try{return DB.roster.find(p=>String(p.id)===String(pid))?.name||''}catch(e){return''}}
  function teamFor(pid,c){try{return c?.tipo==='partita'?'A':(teamOf(pid,c)||'A')}catch(e){return'A'}}

  function ensureUI(){
    if(document.getElementById('spatialModal081'))return;
    const style=document.createElement('style');
    style.id='spatialStyle081';
    style.textContent=`
      #spatialModal081{position:fixed;inset:0;z-index:120000;background:rgba(3,9,7,.94);display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
      #spatialModal081.show{display:flex}
      .sp081box{width:min(960px,100%);max-height:96vh;overflow:auto;background:#0d1c16;border:1px solid #294a3b;border-radius:18px;padding:14px;box-sizing:border-box}
      .sp081head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
      .sp081title{font-size:18px;font-weight:900}.sp081meta{font-size:12px;opacity:.72;margin-top:3px}
      .sp081cancel{border:1px solid rgba(255,255,255,.18);background:transparent;color:inherit;border-radius:10px;min-height:38px;padding:6px 12px}
      .sp081pitch{position:relative;width:100%;aspect-ratio:5/3;background:#174f32;border:3px solid rgba(255,255,255,.9);border-radius:8px;overflow:visible;touch-action:none;cursor:crosshair}
      .sp081pitch:before{content:'';position:absolute;left:50%;top:0;bottom:0;border-left:2px solid rgba(255,255,255,.72)}
      .sp081pitch:after{content:'';position:absolute;left:50%;top:50%;width:16%;aspect-ratio:1;border:2px solid rgba(255,255,255,.72);border-radius:50%;transform:translate(-50%,-50%)}
      .sp081third{position:absolute;top:0;bottom:0;border-left:1px dashed rgba(255,255,255,.28)}.sp081t1{left:33.333%}.sp081t2{left:66.666%}
      .sp081boxarea{position:absolute;top:22%;bottom:22%;width:14%;border:2px solid rgba(255,255,255,.72)}.sp081boxL{left:-2px}.sp081boxR{right:-2px}
      .sp081goal{position:absolute;top:37%;bottom:37%;width:3.2%;border:4px solid currentColor;box-shadow:0 0 12px currentColor,0 0 22px color-mix(in srgb,currentColor 65%,transparent);z-index:4;pointer-events:none}
      .sp081goalL{left:-4px;color:#1687ff;background:rgba(22,135,255,.18)}
      .sp081goalR{right:-4px;color:#ff1f1f;background:rgba(255,31,31,.2)}
      .sp081opp{position:absolute;right:10px;top:8px;font-size:11px;font-weight:900;background:#ff1f1f;color:#fff;padding:5px 8px;border-radius:7px;box-shadow:0 0 10px rgba(255,31,31,.65);pointer-events:none;z-index:5}.sp081own{position:absolute;left:10px;top:8px;font-size:11px;font-weight:900;background:#1687ff;color:#fff;padding:5px 8px;border-radius:7px;box-shadow:0 0 10px rgba(22,135,255,.6);pointer-events:none;z-index:5}
      .sp081dot{position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;border:4px solid #111;transform:translate(-50%,-50%);pointer-events:none;box-sizing:border-box;z-index:6}
      .sp081hint{text-align:center;margin-top:8px;font-size:12px;opacity:.78}.sp081coords{text-align:center;font-weight:800;margin-top:5px;min-height:20px}
      @media(max-width:700px){.sp081box{padding:10px}.sp081title{font-size:16px}.sp081pitch{aspect-ratio:5/3}.sp081hint{font-size:11px}.sp081own,.sp081opp{font-size:10px;padding:4px 6px}}
    `;
    document.head.appendChild(style);
    const m=document.createElement('div');m.id='spatialModal081';
    m.innerHTML=`<div class="sp081box"><div class="sp081head"><div><div id="sp081Title" class="sp081title">Posizione evento</div><div id="sp081Meta" class="sp081meta"></div></div><button id="sp081Cancel" class="sp081cancel">Annulla</button></div><div id="sp081Pitch" class="sp081pitch"><i class="sp081third sp081t1"></i><i class="sp081third sp081t2"></i><i class="sp081boxarea sp081boxL"></i><i class="sp081boxarea sp081boxR"></i><i class="sp081goal sp081goalL"></i><i class="sp081goal sp081goalR"></i><span class="sp081own">PORTA SQUADRA · X=0</span><span class="sp081opp">PORTA AVVERSARIA · X=50 →</span><span id="sp081Dot" class="sp081dot" hidden></span></div><div class="sp081hint">Un tap salva subito il punto. Coordinate normalizzate: X 0–50 m verso la porta avversaria, Y 0–30 m.</div><div id="sp081Coords" class="sp081coords"></div></div>`;
    document.body.appendChild(m);
    document.getElementById('sp081Cancel').onclick=close;
    document.getElementById('sp081Pitch').addEventListener('pointerdown',choose,{passive:false});
  }

  function open(pid,type){
    ensureUI();
    const c=C();if(!c?.id)return;
    const team=teamFor(pid,c),isGame=c.tipo==='partita';
    pending={pid,type,team};
    document.getElementById('sp081Title').textContent=(type==='recover'?'🔄 Recupero':'❌ Palla persa')+' · '+playerName(pid);
    document.getElementById('sp081Meta').textContent=isGame?'GAME · nostra squadra':`LIVE · Squadra ${team}`;
    document.getElementById('sp081Coords').textContent='';document.getElementById('sp081Dot').hidden=true;
    document.getElementById('spatialModal081').classList.add('show');
  }
  function close(){document.getElementById('spatialModal081')?.classList.remove('show');pending=null}

  function choose(ev){
    if(!pending)return;ev.preventDefault();
    const pitch=ev.currentTarget,r=pitch.getBoundingClientRect();
    const xp=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),yp=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
    const x=+(xp*FIELD_L).toFixed(2),y=+(yp*FIELD_W).toFixed(2),before=(C().events||[]).length;
    addEvent(pending.pid,pending.type);
    const c=C(),events=c.events||[];if(events.length<=before){close();return}
    let e=null;for(let i=events.length-1;i>=0;i--){const q=events[i];if(!q.void&&String(q.pid)===String(pending.pid)&&q.type===pending.type){e=q;break}}
    if(!e){close();return}
    e.team=e.team||pending.team;e.x_m=x;e.y_m=y;e.x_pct=+(xp*100).toFixed(2);e.y_pct=+(yp*100).toFixed(2);e.field_length_m=FIELD_L;e.field_width_m=FIELD_W;e.field_third=third(x);e.field_lane=lane(y);e.spatial=true;e.attack_direction='x_positive';
    save();
    const dot=document.getElementById('sp081Dot');dot.hidden=false;dot.style.left=(xp*100)+'%';dot.style.top=(yp*100)+'%';
    document.getElementById('sp081Coords').textContent=`X ${x.toFixed(1)} m · Y ${y.toFixed(1)} m`;
    setTimeout(()=>{close();try{renderLive()}catch(err){}},110);
  }

  document.addEventListener('click',ev=>{
    const b=ev.target.closest?.('[data-ev]');if(!b)return;
    const parts=String(b.dataset.ev||'').split('|'),pid=parts[0],type=parts[1];
    if(type!=='recover'&&type!=='lost')return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();open(pid,type);
  },true);

  function enc(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function appendSpatialCSV(text,s){
    const evs=(s?.events||[]).filter(e=>!e.void&&(e.type==='recover'||e.type==='lost')&&Number.isFinite(Number(e.x_m))&&Number.isFinite(Number(e.y_m)));
    const rows=[['DATI SPAZIALI'],['Tipo evento','Giocatore','Team','X metri','Y metri','X %','Y %','Terzo campo','Fascia','Lunghezza campo m','Larghezza campo m','Direzione attacco']];
    evs.forEach(e=>rows.push([e.type==='recover'?'Recupero':'Palla persa',playerName(e.pid),e.team||teamFor(e.pid,s),e.x_m,e.y_m,e.x_pct,e.y_pct,e.field_third||third(Number(e.x_m)),e.field_lane||lane(Number(e.y_m)),e.field_length_m||FIELD_L,e.field_width_m||FIELD_W,e.attack_direction||'x_positive']));
    return String(text||'')+'\n\n'+rows.map(r=>r.map(enc).join(';')).join('\n');
  }

  if(typeof exportSessionCSV==='function'&&typeof downloadText==='function'){
    const base=exportSessionCSV;
    exportSessionCSV=function(s){
      const original=downloadText;downloadText=function(text,name,mime){return original(appendSpatialCSV(text,s),name,mime)};
      try{return base(s)}finally{downloadText=original}
    };
  }

  function markVersion(){
    document.querySelector('.beta')?.replaceChildren(document.createTextNode('BETA 0.8.1'));
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.1 · Coordinate Recupero/Palla persa'});
  }
  window.addEventListener('DOMContentLoaded',()=>{ensureUI();markVersion()});setTimeout(()=>{ensureUI();markVersion()},700);
  window.SevenLabSpatial081={open,fieldLength:FIELD_L,fieldWidth:FIELD_W};
})();
