// SevenLab 0.8.5 — RPE + effective-role controls + quick penalty outcome + richer CSV.
(function(){
  const TRAINING='allenamento', GAME='partita';
  let selectedSetPieceKind084=null;
  let penaltyOutcome084=null;

  function currentAssignment084(pid,c=C()){
    if(!c)return null;
    for(const t of ['A','B'])for(const k of Object.keys(c.teams?.[t]||{})){
      const a=c.teams[t][k];
      if(String(a?.pid)===String(pid))return {team:t,slot:k,...a};
    }
    return null;
  }
  function naturalRole084(pid){return DB.roster.find(x=>String(x.id)===String(pid))?.role||''}
  function effectiveRole084(pid,c=C()){
    const a=currentAssignment084(pid,c);return a?.desired||naturalRole084(pid)||'';
  }
  function isOutRole084(pid,c=C()){
    const a=currentAssignment084(pid,c),nat=naturalRole084(pid);if(!a||!nat)return false;
    try{return !compatible(nat,a.desired)}catch(e){return !!a.outRole}
  }
  function isEffectiveKeeper084(pid,c=C()){return effectiveRole084(pid,c)==='P'}
  function roleName084(r){return RN?.[r]||r||''}

  // Stamp every newly-created event with the natural and actually-performed role.
  // Existing stamped events are never rewritten, so substitutions/role changes preserve the role at event time.
  function stampEvents084(){
    const c=C?.();if(!c?.events)return;
    c.events.forEach(e=>{
      if(!e||!e.pid||e.void)return;
      if(e.role_natural!==undefined&&e.role_effective!==undefined&&e.out_role!==undefined)return;
      const a=currentAssignment084(e.pid,c),nat=naturalRole084(e.pid),eff=a?.desired||nat||'';
      if(e.role_natural===undefined)e.role_natural=nat||null;
      if(e.role_effective===undefined)e.role_effective=eff||null;
      if(e.slot_effective===undefined)e.slot_effective=a?.slot||null;
      if(e.out_role===undefined){
        let out=false;if(a&&nat){try{out=!compatible(nat,a.desired)}catch(err){out=!!a.outRole}}
        e.out_role=out;
      }
    });
  }
  const baseSave084=save;
  save=function(){try{stampEvents084()}catch(e){}return baseSave084.apply(this,arguments)};

  // ---------- RPE ----------
  function injectRPE(){
    const card=document.querySelector('#allenamento .card');
    if(!card||document.getElementById('trainingRPE084'))return;
    const title=document.getElementById('trainingTitle');
    const wrap=document.createElement('div');
    wrap.id='trainingRPE084Wrap';wrap.style.marginTop='10px';
    wrap.innerHTML=`<label for="trainingRPE084" class="settingslabel" style="display:block;margin-bottom:5px">RPE allenamento</label><input id="trainingRPE084" class="input" type="number" min="1" max="10" step="1" inputmode="numeric" placeholder="RPE 1–10"><div class="sub" style="margin-top:5px">Difficoltà percepita complessiva della sessione, da 1 a 10.</div>`;
    title?.insertAdjacentElement('afterend',wrap);
    const btn=document.getElementById('presenceBtn');
    if(btn&&!btn.dataset.rpe084){
      btn.dataset.rpe084='1';const base=btn.onclick;
      btn.onclick=function(ev){
        const inp=document.getElementById('trainingRPE084'),raw=String(inp?.value||'').trim();
        if(raw){const n=Number(raw);if(!Number.isInteger(n)||n<1||n>10){try{toast('RPE deve essere un numero intero da 1 a 10')}catch(e){}return}}
        const result=base?base.call(this,ev):undefined;
        try{const c=C();if(c?.id&&c.tipo!==GAME){c.rpe=raw?Number(raw):null;save()}}catch(e){}
        return result;
      };
    }
  }

  // ---------- EFFECTIVE ROLE CONTROLS ----------
  function counterValue084(pid,t,c){
    const z=pstats(pid,c);
    if(t==='shot')return z.sh;
    if(t==='dribble')return z.dok+z.dbad;
    if(t==='pass')return z.po+z.pb;
    return cnt(pid,t,c);
  }
  function controlSet084(pid,c){
    if(isEffectiveKeeper084(pid,c))return [['save','🧤','Parata'],['pass','↔️','Passaggio']];
    const out=[['shot','🎯','Tiro'],['goal','⚽','Gol'],['dribble','🌀','Dribbling'],['pass','↔️','Passaggio'],['lost','❌','Persa']];
    if(c?.tipo===GAME)out.push(['recover','🔄','Recupero']);
    return out;
  }
  function wireRoleControls084(card,pid,c){
    const grid=card.querySelector('.countergrid');if(!grid)return;
    const keeper=isEffectiveKeeper084(pid,c),set=controlSet084(pid,c);
    grid.classList.toggle('keepergrid',keeper);
    grid.innerHTML=set.map(([t,i,l])=>`<button class="counter counterbig" data-ev="${pid}|${t}"><b>${i} ${counterValue084(pid,t,c)}</b><small>${l}</small></button>`).join('');
    grid.querySelectorAll('[data-ev]').forEach(b=>{
      const t=b.dataset.ev.split('|')[1];
      if(t==='dribble')wireDribble(b,pid);
      else if(t==='pass')wirePass(b,pid);
      else b.onclick=()=>t==='goal'?openAssist(pid):addEvent(pid,t);
    });
    const p=DB.roster.find(x=>String(x.id)===String(pid)),a=currentAssignment084(pid,c),meta=card.querySelector('.liveplayer-top .meta');
    if(meta){
      const nat=roleName084(p?.role),eff=roleName084(a?.desired||p?.role);
      meta.textContent=nat+(a?.desired&&a.desired!==p?.role?` · ruolo svolto ${eff}`:'')+(isOutRole084(pid,c)?' · ⚠️ fuori ruolo':'');
    }
    const micro=card.querySelector('.microstats'),z=pstats(pid,c),sc=playerScore(pid,c);
    if(micro)micro.textContent=keeper
      ?`Punti ${sc.total.toFixed(1)} · Voto ${sc.vote.toFixed(1)} · Parate ${z.sv} · Pass ${z.po}/${z.po+z.pb}`
      :`Punti ${sc.total.toFixed(1)} · Voto ${sc.vote.toFixed(1)} · Tiri ${z.sh} · Porta ${z.on} · Pass ${z.po}/${z.po+z.pb} · Dribbling ${z.dok}/${z.dok+z.dbad}`;
  }
  function adaptRoleControls084(){
    const c=C?.();if(!c?.id)return;
    document.querySelectorAll('#livePlayers .liveplayer').forEach(card=>{
      const ev=card.querySelector('[data-ev]');if(!ev)return;const pid=ev.dataset.ev.split('|')[0];
      wireRoleControls084(card,pid,c);
    });
  }
  const baseRenderLive084=renderLive;
  renderLive=function(){const r=baseRenderLive084.apply(this,arguments);try{adaptRoleControls084()}catch(e){}return r};

  // ---------- QUICK PENALTY OUTCOME ----------
  function closePreviousPending084(){
    const c=C(),p=c?.pendingSetPiece070;if(!p)return;
    const e=(c.events||[]).find(x=>String(x.id)===String(p.eventId));
    if(e&&!e.void&&e.outcome==='pending'){
      if(p.kind==='corner')e.outcome='no_goal';
      else{
        e.outcome='missed';
        c.events.push({id:Date.now()+Math.random(),pid:p.pid,type:'shot',t:e.t,phase:e.phase,team:e.team||teamOf(p.pid),void:false,onTarget:false,pendingTarget:false,setPiece070:p.kind,sourceEventId:e.id});
      }
    }
    c.pendingSetPiece070=null;
  }
  function beginPenaltyOutcome084(){
    const c=C(),sel=document.getElementById('setPiecePlayer070');if(!c?.id||!sel)return;
    const pid=sel.value;if(!pid)return;
    closePreviousPending084();
    const t=elapsed(),e={id:Date.now()+Math.random(),pid,type:'set_piece',kind:'penalty',outcome:'pending',t,phase:c.phase,team:teamOf(pid),void:false,quickOutcome084:true};
    c.events.push(e);c.pendingSetPiece070={eventId:e.id,pid,kind:'penalty'};penaltyOutcome084={eventId:e.id,pid};
    const sheet=document.querySelector('#setPieceModal070 .sheet');if(!sheet)return;
    let box=document.getElementById('penaltyOutcome084');if(box)box.remove();
    box=document.createElement('div');box.id='penaltyOutcome084';box.style.marginTop='12px';
    const pname=DB.roster.find(x=>String(x.id)===String(pid))?.name||'Giocatore';
    box.innerHTML=`<div class="sub" style="margin-bottom:8px">Esito rigore · <b>${esc(pname)}</b></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><button class="btn primary" id="penaltyGoal084">⚽ Goal</button><button class="btn danger" id="penaltyNoGoal084">❌ No goal</button></div>`;
    sheet.appendChild(box);sel.disabled=true;const confirm=document.getElementById('setPieceConfirm070');if(confirm)confirm.disabled=true;
    save();
    document.getElementById('penaltyGoal084').onclick=()=>finishPenalty084(true);
    document.getElementById('penaltyNoGoal084').onclick=()=>finishPenalty084(false);
  }
  function resetPenaltyModal084(){
    document.getElementById('penaltyOutcome084')?.remove();const sel=document.getElementById('setPiecePlayer070'),confirm=document.getElementById('setPieceConfirm070');if(sel)sel.disabled=false;if(confirm)confirm.disabled=false;penaltyOutcome084=null;
  }
  function finishPenalty084(scored){
    const c=C(),p=penaltyOutcome084;if(!c||!p)return;
    const sp=(c.events||[]).find(x=>String(x.id)===String(p.eventId));if(!sp||sp.void)return resetPenaltyModal084();
    sp.outcome=scored?'scored':'missed';
    if(scored){
      c.events.push({id:Date.now()+Math.random(),pid:p.pid,type:'goal',t:sp.t,phase:sp.phase,team:sp.team||teamOf(p.pid),void:false,onTarget:true,pendingTarget:false,assistId:null,setPiece070:'penalty',penalty_outcome:'scored',sourceEventId:sp.id});
      const team=sp.team||teamOf(p.pid);if(team)c.score[team]=(c.score[team]||0)+1;
    }else{
      c.events.push({id:Date.now()+Math.random(),pid:p.pid,type:'shot',t:sp.t,phase:sp.phase,team:sp.team||teamOf(p.pid),void:false,onTarget:false,pendingTarget:false,setPiece070:'penalty',penalty_outcome:'missed',sourceEventId:sp.id});
    }
    c.pendingSetPiece070=null;save();resetPenaltyModal084();document.getElementById('setPieceModal070')?.classList.remove('show');renderLive();toast(scored?'Rigore segnato':'Rigore sbagliato');
  }
  document.addEventListener('click',e=>{
    const sp=e.target.closest?.('[data-sp]');if(sp)selectedSetPieceKind084=sp.dataset.sp;
    const confirm=e.target.closest?.('#setPieceConfirm070');
    if(confirm&&selectedSetPieceKind084==='penalty'){
      e.preventDefault();e.stopImmediatePropagation();beginPenaltyOutcome084();return;
    }
    const close=e.target.closest?.('#setPieceClose070');if(close){resetPenaltyModal084();selectedSetPieceKind084=null}
  },true);

  // Composite undo: a quick penalty result and its set-piece record are one operator action.
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#undoBtn');if(!b)return;
    const c=C(),last=[...(c?.events||[])].reverse().find(x=>!x.void);if(!last||last.setPiece070!=='penalty'||!last.sourceEventId)return;
    e.preventDefault();e.stopImmediatePropagation();last.void=true;
    const sp=(c.events||[]).find(x=>String(x.id)===String(last.sourceEventId));if(sp)sp.void=true;
    if(last.type==='goal'&&last.team&&c.score[last.team]>0)c.score[last.team]--;
    if(c.pendingSetPiece070&&String(c.pendingSetPiece070.eventId)===String(last.sourceEventId))c.pendingSetPiece070=null;
    save();renderLive();toast('Rigore annullato');
  },true);

  // ---------- CSV ----------
  function parseCSV084(text){
    text=String(text||'').replace(/^\ufeff/,'');const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}else{if(ch==='"')q=true;else if(ch===';'){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch}}
    row.push(cell);rows.push(row);return rows;
  }
  function enc084(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function roleSummary084(pid,s){
    const ev=(s.events||[]).filter(e=>!e.void&&String(e.pid)===String(pid));
    const roles=[...new Set(ev.map(e=>e.role_effective).filter(Boolean))];
    if(!roles.length){for(const t of ['A','B'])for(const a of Object.values(s.teams?.[t]||{}))if(String(a?.pid)===String(pid)&&a?.desired)roles.push(a.desired)}
    const out=ev.some(e=>e.out_role===true)||(s.outRoles||[]).some(x=>String(x.pid)===String(pid));
    return {roles:[...new Set(roles)],out};
  }
  function augmentCSV084(text,s){
    let rows=parseCSV084(text);
    if(s?.tipo!==GAME){
      const rpe=(s?.rpe===0||s?.rpe)?s.rpe:'';const idx=rows.findIndex(r=>r[0]==='Formato');rows.splice(idx>=0?idx:Math.min(4,rows.length),0,['RPE',rpe]);
    }
    const hi=rows.findIndex(r=>r[0]==='Giocatore'&&r.includes('Ruolo'));
    if(hi>=0){
      rows[hi].push('Ruolo naturale','Ruolo/i svolto/i','Fuori ruolo');
      for(let i=hi+1;i<rows.length;i++){
        if(!rows[i][0]||rows[i][0]==='EVENTI PARTITA'||rows[i][0]==='TIMELINE EVENTI'||rows[i][0]==='DATI SPAZIALI')break;
        const p=DB.roster.find(x=>x.name===rows[i][0]);if(!p)continue;const rs=roleSummary084(p.id,s);
        rows[i].push(roleName084(p.role),rs.roles.map(roleName084).join(' / '),rs.out?'SI':'NO');
      }
    }
    const roleEvents=(s?.events||[]).filter(e=>!e.void&&e.pid);
    if(roleEvents.length){
      rows.push([],['RUOLI EVENTI'],['Secondo','Giocatore','Evento','Team','Ruolo naturale','Ruolo svolto','Fuori ruolo','Slot']);
      roleEvents.forEach(e=>{const p=DB.roster.find(x=>String(x.id)===String(e.pid));rows.push([e.t??'',p?.name||'',typeof label==='function'?label(e.type):e.type,e.team||'',roleName084(e.role_natural||p?.role),roleName084(e.role_effective||''),e.out_role===true?'SI':'NO',e.slot_effective||''])});
    }
    const pens=(s?.events||[]).filter(e=>!e.void&&e.type==='set_piece'&&e.kind==='penalty');
    if(pens.length){
      rows.push([],['DETTAGLIO RIGORI'],['Secondo','Giocatore','Team','Esito']);
      pens.forEach(e=>{const p=DB.roster.find(x=>String(x.id)===String(e.pid));rows.push([e.t??'',p?.name||'',e.team||'',e.outcome==='scored'?'SEGNATO':e.outcome==='missed'?'SBAGLIATO':String(e.outcome||'').toUpperCase()])});
    }
    return '\ufeff'+rows.map(r=>r.map(enc084).join(';')).join('\n');
  }
  if(typeof exportSessionCSV==='function'&&typeof downloadText==='function'){
    const baseExport084=exportSessionCSV;
    exportSessionCSV=function(s){
      const original=downloadText;downloadText=function(text,name,mime){return original(augmentCSV084(text,s),name,mime)};
      try{return baseExport084(s)}finally{downloadText=original}
    };
  }

  function markVersion(){
    document.querySelector('.beta')?.replaceChildren(document.createTextNode('BETA 0.8.5'));
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.5 · Ruolo effettivo + rigori rapidi + RPE'});
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{injectRPE();markVersion()},350));
  setTimeout(()=>{injectRPE();markVersion();try{adaptRoleControls084()}catch(e){}},900);
})();
