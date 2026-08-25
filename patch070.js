// SevenLab 0.7 — cards (Game) + penalties/free kicks/corners (Live & Game)
(function(){
  const GAME='partita';
  const SP={penalty:'Rigore',free_kick:'Punizione',corner:'C. angolo'};

  function isGame(s=C()){return s?.tipo===GAME}
  function evs(s=C()){return (s?.events||[]).filter(e=>!e.void)}
  function count(pid,type,s=C()){return evs(s).filter(e=>e.pid===pid&&e.type===type).length}
  function setPieceStats(pid,s){
    const mine=evs(s).filter(e=>e.pid===pid&&e.type==='set_piece');
    const by=k=>mine.filter(e=>e.kind===k);
    const pen=by('penalty'),fk=by('free_kick'),co=by('corner');
    return {
      yellow:count(pid,'yellow_card',s),red:count(pid,'red_card',s),
      penT:pen.length,penG:pen.filter(e=>e.outcome==='scored').length,penM:pen.filter(e=>e.outcome==='missed').length,
      fkT:fk.length,fkG:fk.filter(e=>e.outcome==='scored').length,fkM:fk.filter(e=>e.outcome==='missed').length,
      coT:co.length,coG:co.filter(e=>e.outcome==='goal').length,coN:co.filter(e=>e.outcome==='no_goal').length
    };
  }
  function dismissed(pid,c=C()){return (c?.dismissed||[]).includes(pid)}

  // ---------- SET PIECES ----------
  function ensureSetPieceUI(){
    const controls=$('#live .controls');
    if(controls&&!$('#setPieceBar070')){
      const bar=document.createElement('div');bar.id='setPieceBar070';bar.className='setpiecebar070';
      bar.innerHTML='<button class="btn ghost" data-sp="penalty">⚽ Rigore</button><button class="btn ghost" data-sp="free_kick">🎯 Punizione</button><button class="btn ghost" data-sp="corner">🚩 C. angolo</button>';
      controls.insertAdjacentElement('afterend',bar);
      bar.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>openSetPiece(b.dataset.sp));
    }
    if(!$('#setPieceModal070')){
      const m=document.createElement('div');m.id='setPieceModal070';m.className='modal';
      m.innerHTML='<div class="sheet"><div class="teamhead"><h3 id="setPieceTitle070">Palla inattiva</h3><button class="btn small ghost" id="setPieceClose070">Chiudi</button></div><div class="sub">Seleziona chi batte.</div><select id="setPiecePlayer070" class="select full mt"></select><button id="setPieceConfirm070" class="btn primary full mt">Conferma tiratore</button></div>';
      document.body.appendChild(m);$('#setPieceClose070').onclick=()=>m.classList.remove('show');
    }
  }
  function openSetPiece(kind){
    const c=C();if(!c?.id)return toast('Nessuna sessione attiva');
    const ids=[...new Set(assigned())].filter(id=>!dismissed(id,c));
    if(!ids.length)return toast('Nessun giocatore in campo');
    ensureSetPieceUI();$('#setPieceTitle070').textContent=SP[kind]||'Palla inattiva';
    $('#setPiecePlayer070').innerHTML=ids.map(id=>`<option value="${id}">${esc(DB.roster.find(p=>p.id===id)?.name||'Giocatore')}</option>`).join('');
    $('#setPieceConfirm070').onclick=()=>startSetPiece(kind,$('#setPiecePlayer070').value);
    $('#setPieceModal070').classList.add('show');
  }
  function startSetPiece(kind,pid){
    const c=C();if(!pid)return;
    // If one was left unresolved, close it as unsuccessful before starting the next one.
    if(c.pendingSetPiece070)resolveSetPiece(null,'other');
    const e={id:Date.now()+Math.random(),pid,type:'set_piece',kind,outcome:'pending',t:elapsed(),phase:c.phase,team:teamOf(pid),void:false};
    c.events.push(e);c.pendingSetPiece070={eventId:e.id,pid,kind};save();
    $('#setPieceModal070').classList.remove('show');renderLive();toast(`${SP[kind]} · ${DB.roster.find(p=>p.id===pid)?.name||''}`);
  }
  function resolveSetPiece(goalScorer,trigger){
    const c=C(),p=c?.pendingSetPiece070;if(!p)return;
    const e=(c.events||[]).find(x=>x.id===p.eventId);if(!e||e.void){c.pendingSetPiece070=null;return}
    if(p.kind==='corner'){
      const goal=trigger==='goal';e.outcome=goal?'goal':'no_goal';
      c.events.push({id:Date.now()+Math.random(),pid:p.pid,type:goal?'passok':'passbad',t:elapsed(),phase:c.phase,team:teamOf(p.pid),void:false,setPiece070:p.kind,sourceEventId:e.id});
    }else{
      const scored=trigger==='goal'&&String(goalScorer)===String(p.pid);e.outcome=scored?'scored':'missed';
      if(!scored){
        // A missed penalty/free kick is also a shot attempt in the existing accuracy model.
        c.events.push({id:Date.now()+Math.random(),pid:p.pid,type:'shot',t:elapsed(),phase:c.phase,team:teamOf(p.pid),void:false,onTarget:false,pendingTarget:false,setPiece070:p.kind,sourceEventId:e.id});
      }
    }
    c.pendingSetPiece070=null;
  }

  const baseCommitGoal070=commitGoal;
  commitGoal=function(assistId){
    const scorer=pendingGoal?.scorer||null;
    if(C()?.pendingSetPiece070)resolveSetPiece(scorer,'goal');
    return baseCommitGoal070(assistId);
  };
  const baseAddEvent070=addEvent;
  addEvent=function(pid,type){
    if(C()?.pendingSetPiece070)resolveSetPiece(null,'other');
    return baseAddEvent070(pid,type);
  };
  const baseWirePass070=typeof wirePass==='function'?wirePass:null;
  if(baseWirePass070){
    wirePass=function(btn,pid){
      baseWirePass070(btn,pid);
      const old=btn.onclick;btn.onclick=function(){if(C()?.pendingSetPiece070)resolveSetPiece(null,'other');return old.apply(this,arguments)};
    };
  }
  const baseWireDribble070=wireDribble;
  wireDribble=function(btn,pid){
    baseWireDribble070(btn,pid);const old=btn.onclick;
    btn.onclick=function(){if(C()?.pendingSetPiece070)resolveSetPiece(null,'other');return old.apply(this,arguments)};
  };

  // ---------- CARDS / DISMISSALS (GAME ONLY) ----------
  function addCard(pid,color){
    const c=C();if(!isGame(c)||dismissed(pid,c))return;
    const p=DB.roster.find(x=>x.id===pid);if(!p)return;
    if(color==='yellow'){
      c.events.push({id:Date.now()+Math.random(),pid,type:'yellow_card',t:elapsed(),phase:c.phase,team:teamOf(pid),void:false});
      const yellows=count(pid,'yellow_card',c);
      if(yellows>=2){
        c.events.push({id:Date.now()+Math.random(),pid,type:'red_card',reason:'second_yellow',t:elapsed(),phase:c.phase,team:teamOf(pid),void:false});
        dismissPlayer(pid,'Secondo giallo');return;
      }
      save();renderLive();toast(`🟨 Giallo · ${p.name}`);return;
    }
    c.events.push({id:Date.now()+Math.random(),pid,type:'red_card',reason:'direct',t:elapsed(),phase:c.phase,team:teamOf(pid),void:false});
    dismissPlayer(pid,'Rosso diretto');
  }
  function dismissPlayer(pid,reason){
    const c=C();closeSeg();c.dismissed=c.dismissed||[];if(!c.dismissed.includes(pid))c.dismissed.push(pid);
    for(const t of ['A','B'])for(const k of Object.keys(c.teams?.[t]||{}))if(c.teams[t][k]?.pid===pid)delete c.teams[t][k];
    if(c.startedAt)beginSeg();save();renderLive();toast(`🟥 ${reason} · giocatore espulso`);
  }
  function addCardButtons(){
    if(!isGame())return;
    $$('#livePlayers .liveplayer').forEach(card=>{
      if(card.querySelector('.cards070'))return;
      const ev=card.querySelector('[data-ev]');if(!ev)return;const pid=ev.dataset.ev.split('|')[0];
      const s=setPieceStats(pid,C()),bar=document.createElement('div');bar.className='cards070';
      bar.innerHTML=`<button class="btn ghost" data-card070="${pid}|yellow">🟨 Giallo ${s.yellow}</button><button class="btn danger" data-card070="${pid}|red">🟥 Rosso ${s.red}</button>`;
      card.appendChild(bar);
    });
    $$('[data-card070]').forEach(b=>b.onclick=()=>{const [pid,col]=b.dataset.card070.split('|');addCard(pid,col)});
  }
  // A dismissed player stays in present/history but must never appear as a possible substitute.
  const subObserver=new MutationObserver(()=>{
    const c=C();if(!isGame(c))return;(c.dismissed||[]).forEach(pid=>{
      const b=document.querySelector(`#subChoices [data-in="${CSS.escape(pid)}"]`);if(b)b.remove();
    });
  });
  const subChoices=$('#subChoices');if(subChoices)subObserver.observe(subChoices,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-in]');if(b&&isGame()&&dismissed(b.dataset.in)){e.preventDefault();e.stopImmediatePropagation();toast('Giocatore espulso: non può rientrare')}
  },true);

  // ---------- LIVE RENDER / LABELS ----------
  const baseRenderLive070=renderLive;
  renderLive=function(){baseRenderLive070();ensureSetPieceUI();addCardButtons();
    const c=C();const p=c?.pendingSetPiece070;if(p){
      let info=$('#pendingSetPiece070');if(!info){info=document.createElement('div');info.id='pendingSetPiece070';info.className='sub';info.style.marginTop='8px';$('#setPieceBar070')?.insertAdjacentElement('afterend',info)}
      info.textContent=`In attesa esito: ${SP[p.kind]} · ${DB.roster.find(x=>x.id===p.pid)?.name||''}`;
    }else $('#pendingSetPiece070')?.remove();
  };
  const baseLabel070=label;
  label=function(t){return({yellow_card:'Cartellino giallo',red_card:'Cartellino rosso',set_piece:'Palla inattiva'})[t]||baseLabel070(t)};

  // ---------- HISTORY / CSV ----------
  function extraRowsHtml(s){
    const rows=(s.present||[]).map(pid=>{const p=DB.roster.find(x=>x.id===pid),x=setPieceStats(pid,s);return `<tr><td>${esc(p?.name||'')}</td><td>${x.yellow}</td><td>${x.red}</td><td>${x.penT}</td><td>${x.penG}</td><td>${x.penM}</td><td>${x.fkT}</td><td>${x.fkG}</td><td>${x.fkM}</td><td>${x.coT}</td><td>${x.coG}</td><td>${x.coN}</td></tr>`}).join('');
    return `<h3 class="mt">Disciplina e palle inattive</h3><div style="overflow:auto"><table class="report"><thead><tr><th>Giocatore</th><th>🟨</th><th>🟥</th><th>Rig.</th><th>Rig. gol</th><th>Rig. err.</th><th>Pun.</th><th>Pun. gol</th><th>Pun. err.</th><th>Corner</th><th>con gol</th><th>senza gol</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const baseOpenSession070=openSession;
  openSession=function(id){baseOpenSession070(id);const s=DB.history.find(x=>String(x.id)===String(id));if(s&&$('#sessionDetail'))$('#sessionDetail').insertAdjacentHTML('beforeend',extraRowsHtml(s))};

  // Append extra columns to the already-established 0.6.5 CSV, preserving minutes, test mode and progressive filenames.
  function parseCSV(text){
    text=String(text||'').replace(/^\ufeff/,'');const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}else{if(ch==='"')q=true;else if(ch===';'){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch}}
    row.push(cell);rows.push(row);return rows;
  }
  function enc(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function augmentCSV(text,s){
    const rows=parseCSV(text),hi=rows.findIndex(r=>r[0]==='Giocatore'&&r.includes('Ruolo'));if(hi<0)return text;
    const extras=['Cartellini gialli','Cartellini rossi','Rigori tirati','Rigori segnati','Rigori sbagliati','Punizioni tirate','Punizioni segnate','Punizioni sbagliate','Calci angolo','Corner con goal','Corner senza goal'];rows[hi].push(...extras);
    for(let i=hi+1;i<rows.length;i++){
      if(!rows[i][0]||rows[i][0]==='EVENTI PARTITA')break;
      const name=rows[i][0],p=DB.roster.find(x=>x.name===name);if(!p)continue;const x=setPieceStats(p.id,s);
      rows[i].push(x.yellow,x.red,x.penT,x.penG,x.penM,x.fkT,x.fkG,x.fkM,x.coT,x.coG,x.coN);
    }
    return '\ufeff'+rows.map(r=>r.map(enc).join(';')).join('\n');
  }
  const baseExport070=exportSessionCSV;
  exportSessionCSV=function(s){
    const original=downloadText;downloadText=function(text,name,mime){return original(augmentCSV(text,s),name,mime)};
    try{return baseExport070(s)}finally{downloadText=original}
  };

  function addGlobalSummary(boxId,type){
    const box=$(boxId);if(!box||box.querySelector('.spglobal070'))return;
    const sessions=(DB.history||[]).filter(s=>(s.tipo===GAME?'partita':'allenamento')===type);
    if(!sessions.length)return;
    const rows=DB.roster.map(p=>{let a={yellow:0,red:0,penT:0,penG:0,penM:0,fkT:0,fkG:0,fkM:0,coT:0,coG:0,coN:0};sessions.forEach(s=>{if(!(s.present||[]).includes(p.id))return;const x=setPieceStats(p.id,s);Object.keys(a).forEach(k=>a[k]+=x[k]||0)});return{p,a}}).filter(x=>Object.values(x.a).some(Boolean));
    if(!rows.length)return;
    const d=document.createElement('div');d.className='spglobal070';d.innerHTML='<h3 class="mt">Disciplina e palle inattive</h3>'+rows.map(x=>`<div class="combo"><b>${esc(x.p.name)}</b><span class="meta">🟨 ${x.a.yellow} · 🟥 ${x.a.red} · Rig ${x.a.penG}/${x.a.penT} · Pun ${x.a.fkG}/${x.a.fkT} · Corner+gol ${x.a.coG}/${x.a.coT}</span></div>`).join('');box.appendChild(d);
  }
  const baseRenderHistory070=renderHistory;
  renderHistory=function(){baseRenderHistory070();setTimeout(()=>{addGlobalSummary('#globalStats','allenamento');addGlobalSummary('#gameGlobalStats','partita')},0)};

  const style=document.createElement('style');style.id='style070';style.textContent=`
    .setpiecebar070{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.setpiecebar070 .btn{min-height:44px;padding:7px 4px;font-size:12px}.cards070{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.cards070 .btn{min-height:38px;font-size:11px;padding:6px}.full{width:100%}
  `;document.head.appendChild(style);

  ensureSetPieceUI();renderLive();renderHistory();
  window.SevenLab070={setPieceStats};
})();