// SevenLab 0.6 — Game mode layered on top of stable 0.5.14
(function(){
  const GAME_TYPE='partita', TRAINING_TYPE='allenamento';
  const GAME_MODULES=Object.keys(F[7]||{});

  function ensureDraft(){
    DB.gameDraft=DB.gameDraft||{opponent:'',present:[],module:GAME_MODULES[0]||'1-2-3-1',team:{}};
    if(!GAME_MODULES.includes(DB.gameDraft.module))DB.gameDraft.module=GAME_MODULES[0];
    return DB.gameDraft;
  }
  function isGame(s=C()){return (s?.tipo||TRAINING_TYPE)===GAME_TYPE}
  function gameAssigned(){return Object.values(ensureDraft().team||{}).map(x=>x?.pid).filter(Boolean)}
  function sessionType(s){return s?.tipo===GAME_TYPE?GAME_TYPE:TRAINING_TYPE}

  function injectGameUI(){
    if($('#game'))return;
    const settings=$('#impostazioni');
    const game=document.createElement('section');
    game.id='game';game.className='screen';
    game.innerHTML=`
      <div class="card"><h2>🎮 Game</h2><div class="sub">Partita ufficiale: dati separati dagli allenamenti.</div>
        <input id="gameOpponent" class="input mt" placeholder="Squadra avversaria (obbligatorio)">
        <div class="sub mt">Convocati / presenti</div><div id="gamePresence" class="presence"></div>
      </div>
      <div class="card"><h3>Modulo iniziale · 7 vs 7</h3><div class="segment" id="gameModules"></div></div>
      <div class="card"><div class="teamhead"><h3>Formazione iniziale</h3><button class="btn small ghost" id="gameClear">Svuota</button></div><div class="pitch" id="gamePitch"></div></div>
      <button class="btn primary full" id="startGame">Avvia Game →</button>`;
    settings?.insertAdjacentElement('beforebegin',game);

    const nav=$('.nav');
    const storicoBtn=nav?.querySelector('[data-go="storico"]');
    if(nav&&!nav.querySelector('[data-go="game"]')){
      const b=document.createElement('button');b.dataset.go='game';b.innerHTML='<span>🎮</span>Game';
      storicoBtn?nav.insertBefore(b,storicoBtn):nav.appendChild(b);
      b.onclick=()=>{if(isGame()&&C().id)go('live');else go('game')};
    }

    // Split history visually into training vs official games.
    const storico=$('#storico');
    const firstCard=$('#historyList')?.closest('.card');
    if(firstCard){
      firstCard.querySelector('h2').textContent='Allenamenti ☁️';
      firstCard.querySelector('.sub').textContent='Storico allenamenti. Dati e CSV separati dalle partite ufficiali.';
      $('#historyList').id='trainingHistoryList';
      const g=document.createElement('div');g.className='card';
      g.innerHTML='<h2>Partite ufficiali ☁️</h2><div class="sub">Storico Game, risultati e CSV delle sole partite ufficiali.</div><div id="gameHistoryList"></div>';
      firstCard.insertAdjacentElement('afterend',g);
    }
    const globalCard=$('#globalStats')?.closest('.card');
    if(globalCard){
      globalCard.querySelector('h2').textContent='Statistiche globali · Allenamenti';
      const gg=document.createElement('div');gg.className='card';
      gg.innerHTML='<h2>Statistiche globali · Partite</h2><div class="sub">Solo prestazioni registrate in modalità Game.</div><div id="gameGlobalStats"></div>';
      globalCard.insertAdjacentElement('afterend',gg);
    }
    const analysisCard=$('#comboAnalysis')?.closest('.card');
    if(analysisCard){
      analysisCard.querySelector('h2').textContent='Analisi · Allenamenti';
      const ga=document.createElement('div');ga.className='card';
      ga.innerHTML='<h2>Analisi · Partite</h2><div class="sub">Migliori voti e combinazioni rilevate nelle partite ufficiali.</div><div id="gameAnalysis"></div>';
      analysisCard.insertAdjacentElement('afterend',ga);
    }

    const st=document.createElement('style');st.id='style060';st.textContent=`
      .nav{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important}.nav button{min-width:0!important;padding:6px 1px!important;font-size:8.5px!important;white-space:nowrap}.nav button span{font-size:15px!important;margin-bottom:2px!important}
      .gameScoreNames{display:flex;justify-content:center;gap:26px;font-size:11px;font-weight:800;opacity:.8;margin-bottom:4px}.gameOpponentTag{font-weight:800}.gameAgainst{border-color:rgba(255,100,100,.35)!important}.gameAgainst b{font-size:15px!important}.gameLiveBadge{margin-top:8px;text-align:center;font-size:12px;font-weight:800}.gameMeta{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:8px}.gameMeta span{font-size:11px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.06)}
      @media(max-width:390px){.nav button{font-size:7.8px!important}.nav button span{font-size:14px!important}}
    `;document.head.appendChild(st);
  }

  function renderGame(){
    const d=ensureDraft();
    $('#gameOpponent').value=d.opponent||'';
    $('#gamePresence').innerHTML=DB.roster.length?DB.roster.map(p=>`<label><input type="checkbox" value="${p.id}" ${d.present.includes(p.id)?'checked':''}><span>${esc(p.name)}<small class="meta" style="display:block">${p.role}</small></span></label>`).join(''):'<div class="empty">Prima inserisci la rosa.</div>';
    $('#gameModules').innerHTML=GAME_MODULES.map(m=>`<button class="seg ${d.module===m?'on':''}" data-gmod="${m}">${m}</button>`).join('');
    renderGamePitch();
    $$('#gamePresence input').forEach(x=>x.onchange=()=>{d.present=$$('#gamePresence input:checked').map(x=>x.value);save();renderGamePitch()});
    $$('[data-gmod]').forEach(b=>b.onclick=()=>{d.module=b.dataset.gmod;d.team={};save();renderGame()});
    $('#gameOpponent').oninput=e=>{d.opponent=e.target.value;save()};
    $('#gameClear').onclick=()=>{d.team={};save();renderGamePitch()};
    $('#startGame').onclick=startGame;
  }
  function renderGamePitch(){
    const d=ensureDraft(),e=$('#gamePitch');if(!e)return;e.innerHTML='';
    (F[7][d.module]||[]).forEach(([k,r,x,y])=>{
      const a=d.team[k],p=DB.roster.find(z=>z.id===a?.pid),b=document.createElement('button');
      b.className='slot '+(!p?'empty':a.outRole?'outrole':'');b.style.left=x+'%';b.style.top=y+'%';
      b.innerHTML=p?`${esc(p.name)}<span class="tiny">${k}${a.outRole?' · fuori ruolo':''}</span>`:`+ ${k}<span class="tiny">${r}</span>`;
      b.onclick=()=>openGamePicker(k,r);e.appendChild(b);
    });
  }
  function openGamePicker(k,desired){
    const d=ensureDraft(),used=gameAssigned(),current=d.team[k]?.pid;
    const av=DB.roster.filter(p=>d.present.includes(p.id)&&(!used.includes(p.id)||p.id===current));
    const good=av.filter(p=>compatible(p.role,desired)),other=av.filter(p=>!compatible(p.role,desired));
    $('#pickerTitle').textContent=`Game · ${k} (${desired})`;
    $('#pickerChoices').innerHTML=(current?'<button class="choice" data-gpid="">➖ Libera posizione</button>':'')+`<div class="groupTitle">CONSIGLIATI (${good.length})</div>`+good.map(p=>choice(p,true).replaceAll('data-pid','data-gpid')).join('')+`<div class="groupTitle">ADATTABILI (${other.length})</div>`+other.map(p=>choice(p,false).replaceAll('data-pid','data-gpid')).join('');
    $$('#pickerChoices [data-gpid]').forEach(b=>b.onclick=()=>{
      const pid=b.dataset.gpid;if(!pid)delete d.team[k];else{const p=DB.roster.find(x=>x.id===pid);d.team[k]={pid,desired,outRole:!compatible(p.role,desired)}}
      save();$('#pickerModal').classList.remove('show');renderGamePitch();
    });$('#pickerModal').classList.add('show');
  }
  function startGame(){
    const d=ensureDraft();d.opponent=$('#gameOpponent').value.trim();d.present=$$('#gamePresence input:checked').map(x=>x.value);
    if(!d.opponent)return toast('Inserisci la squadra avversaria');
    if(!d.present.length)return toast('Seleziona almeno un convocato');
    const field=Object.values(d.team).filter(Boolean);if(!field.length)return toast('Prepara la formazione iniziale');
    if(field.length>7)return toast('Massimo 7 giocatori in campo');
    const dt=nd();DB.current=EC();Object.assign(C(),{id:'g'+Date.now(),tipo:GAME_TYPE,avversario:d.opponent,dateISO:dt.iso,dateLabel:dt.label,title:`SevenLab vs ${d.opponent}`,present:[...d.present],size:7,module:d.module,teamModules:{A:d.module,B:d.module},teams:{A:JSON.parse(JSON.stringify(d.team)),B:{}},score:{A:0,B:0},gol_fatti:0,gol_subiti:0});
    save();go('live');
  }

  // Preserve training creation but mark it explicitly.
  $('#presenceBtn').onclick=()=>{let d=nd(),ids=$$('#presenceList input:checked').map(x=>x.value);DB.current=EC();Object.assign(C(),{id:'s'+Date.now(),tipo:TRAINING_TYPE,dateISO:d.iso,dateLabel:d.label,title:$('#trainingTitle').value.trim()||'Allenamento',present:ids});save();go('formazioni')};

  const baseGo=go;
  go=function(id){
    baseGo(id);
    if(id==='game')renderGame();
    if(id==='live'&&isGame()){$$('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.go==='game'))}
  };

  const baseRenderLive=renderLive;
  renderLive=function(){
    baseRenderLive();
    const c=C();
    if(!isGame())return;
    const score=$('.scorebox');
    let names=$('.gameScoreNames');if(!names){names=document.createElement('div');names.className='gameScoreNames';score?.parentElement?.insertBefore(names,score)}
    names.innerHTML=`<span>SEVENLAB</span><span>${esc(c.avversario||'AVVERSARIO')}</span>`;
    $$('[data-score]').forEach(b=>b.style.display='none');
    $$('#livePlayers .liveplayer').forEach(card=>{const role=card.querySelector('.role');if(role)role.textContent='SevenLab'});
    $$('#livePlayers [data-ev$="|save"]').forEach(saveBtn=>{
      const grid=saveBtn.closest('.countergrid');if(!grid||grid.querySelector('.gameAgainst'))return;
      const btn=document.createElement('button');btn.className='counter counterbig gameAgainst';btn.innerHTML='<b>🥅 '+(c.score.B||0)+'</b><small>Gol subito</small>';
      btn.onclick=()=>{c.score.B=(c.score.B||0)+1;c.gol_subiti=c.score.B;c.events.push({id:Date.now()+Math.random(),pid:null,type:'goal_against',t:elapsed(),phase:c.phase,team:'B',void:false});save();renderLive();toast('Gol subito registrato')};grid.appendChild(btn);
    });
    const head=$('#live .card');if(head&&!head.querySelector('.gameLiveBadge')){const x=document.createElement('div');x.className='gameLiveBadge';x.textContent='🎮 PARTITA UFFICIALE';head.insertBefore(x,head.firstChild)}
    const meta=head?.querySelector('.gameMeta')||document.createElement('div');if(!meta.classList.contains('gameMeta'))meta.className='gameMeta';meta.innerHTML=`<span>vs ${esc(c.avversario||'')}</span><span>${c.teamModules?.A||c.module||''}</span>`;if(head&&!meta.parentElement)head.appendChild(meta);
    $('#undoBtn').onclick=()=>{let e=[...c.events].reverse().find(x=>!x.void);if(!e)return toast('Niente da annullare');e.void=true;if(e.type==='goal_against'&&c.score.B>0)c.score.B--;else if(e.type==='goal'&&e.team&&c.score[e.team]>0)c.score[e.team]--;if(e.type==='assist'&&e.goalId){let g=c.events.find(x=>x.id===e.goalId);if(g)g.assistId=null}if(e.type==='save'&&e.linkedShot){let sh=c.events.find(x=>x.id===e.linkedShot);if(sh){sh.onTarget=false;sh.pendingTarget=true}}c.gol_fatti=c.score.A;c.gol_subiti=c.score.B;save();renderLive()};
  };

  const baseLabel=label;label=function(t){return t==='goal_against'?'Gol subito':baseLabel(t)};

  // Keep automatic own score aligned with dedicated match fields.
  const baseCommitGoal=commitGoal;
  commitGoal=function(assistId){baseCommitGoal(assistId);if(isGame()){C().gol_fatti=C().score.A||0;save()}};

  archive=function(){
    let c=JSON.parse(JSON.stringify(C()));c.startedAt=null;c.activeSegment=null;c.tipo=sessionType(c);c.gol_fatti=c.score?.A||0;c.gol_subiti=c.score?.B||0;c.playerScores={};c.present.forEach(id=>c.playerScores[id]=playerScore(id,c));DB.history.unshift(c);DB.current=EC();save();renderPresence();renderHistory();go('storico');toast(c.tipo===GAME_TYPE?'Partita salvata':'Allenamento salvato')
  };

  function filtered(type){return DB.history.filter(s=>sessionType(s)===type)}
  function historyRows(list,type){return list.length?list.map(s=>`<div class="historyItem"><div class="grow"><div class="name">${type===GAME_TYPE?'🎮 ':''}${esc(s.title)}${type===TRAINING_TYPE?` · ${s.size}v${s.size}`:''}</div><div class="meta">${esc(s.dateLabel||'')} · ${s.score?.A||0}-${s.score?.B||0}${type===GAME_TYPE?` · vs ${esc(s.avversario||'')}`:''}</div></div><button class="btn small ghost" data-open="${s.id}">Apri</button><button class="btn small danger" data-rm="${s.id}">×</button></div>`).join(''):'<div class="empty">Nessuna sessione registrata.</div>'}
  function withHistory(type,fn){const old=DB.history;DB.history=filtered(type);try{return fn()}finally{DB.history=old}}
  function globalStatsFor(type){
    const all=filtered(type);let rows=DB.roster.map(p=>{let sessions=all.filter(s=>(s.present||[]).includes(p.id));if(!sessions.length)return null;let agg={sessions:sessions.length,g:0,a:0,sh:0,on:0,po:0,pb:0,r:0,l:0,dok:0,dbad:0,sv:0,points:0,votes:0};sessions.forEach(s=>{let z=pstats(p.id,s),sc=playerScore(p.id,s);agg.g+=z.g;agg.a+=z.a;agg.sh+=z.sh;agg.on+=z.on;agg.po+=z.po;agg.pb+=z.pb;agg.r+=z.r;agg.l+=z.l;agg.dok+=z.dok;agg.dbad+=z.dbad;agg.sv+=z.sv;agg.points+=sc.total;agg.votes+=sc.vote});agg.avgVote=agg.votes/agg.sessions;return{p,...agg}}).filter(Boolean).sort((a,b)=>b.avgVote-a.avgVote||b.points-a.points);
    if(!rows.length)return '<div class="sub">Nessun dato disponibile.</div>';
    return `<div class="globalstatswrap"><table class="report globaltable"><thead><tr><th>Giocatore</th><th>Ruolo</th><th>Sessioni</th><th>Voto medio</th><th>Punti</th><th>Gol</th><th>Assist</th><th>Tiri</th><th>In porta</th><th>Pass +</th><th>Pass -</th><th>Rec.</th><th>Perse</th><th>Drib +</th><th>Drib -</th><th>Parate</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.p.name)}</td><td>${RN[x.p.role]}</td><td>${x.sessions}</td><td><b>${x.avgVote.toFixed(2)}</b></td><td>${x.points.toFixed(1)}</td><td>${x.g}</td><td>${x.a}</td><td>${x.sh}</td><td>${x.on}</td><td>${x.po}</td><td>${x.pb}</td><td>${x.r}</td><td>${x.l}</td><td>${x.dok}</td><td>${x.dbad}</td><td>${x.sv}</td></tr>`).join('')}</tbody></table></div>`
  }
  renderHistory=function(){
    const tr=filtered(TRAINING_TYPE),ga=filtered(GAME_TYPE);if($('#trainingHistoryList'))$('#trainingHistoryList').innerHTML=historyRows(tr,TRAINING_TYPE);if($('#gameHistoryList'))$('#gameHistoryList').innerHTML=historyRows(ga,GAME_TYPE);
    $$('[data-open]').forEach(b=>b.onclick=()=>openSession(b.dataset.open));
    $$('[data-rm]').forEach(b=>b.onclick=()=>{if(confirm('Eliminare definitivamente questa sessione?')){DB.history=DB.history.filter(s=>s.id!==b.dataset.rm);save();renderHistory()}});
    if($('#globalStats'))$('#globalStats').innerHTML=globalStatsFor(TRAINING_TYPE);if($('#gameGlobalStats'))$('#gameGlobalStats').innerHTML=globalStatsFor(GAME_TYPE);
    if($('#comboAnalysis'))$('#comboAnalysis').innerHTML=withHistory(TRAINING_TYPE,()=>topSevenHtml()+comboHtmlAll());
    if($('#gameAnalysis'))$('#gameAnalysis').innerHTML=withHistory(GAME_TYPE,()=>topSevenHtml()+comboHtmlAll());
  };

  exportSessionCSV=function(s){
    let head=['Giocatore','Ruolo','Punti','Voto','Gol','Assist','Tiri','Tiri in porta','Passaggi corretti','Passaggi sbagliati','Recuperi','Palle perse','Dribbling riusciti','Dribbling falliti','Parate'];
    let rows=(s.present||[]).map(pid=>{let p=DB.roster.find(x=>x.id===pid),z=pstats(pid,s),sc=playerScore(pid,s);return[p?.name||'',RN[p?.role]||'',sc.total.toFixed(1),sc.vote.toFixed(1),z.g,z.a,z.sh,z.on,z.po,z.pb,z.r,z.l,z.dok,z.dbad,z.sv]});
    const type=sessionType(s),ma=s.teamModules?.A||s.module||'',mb=s.teamModules?.B||s.module||'';
    let meta=[['SevenLab'],['Tipo',type],['Data',s.dateLabel||''],['Titolo',s.title||''],...(type===GAME_TYPE?[['Avversario',s.avversario||''],['Gol fatti',s.score?.A||0],['Gol subiti',s.score?.B||0],['Modulo iniziale',ma]]:[['Formato',`${s.size}v${s.size}`],['Modulo Squadra A',ma],['Modulo Squadra B',mb],['Risultato',`${s.score?.A||0}-${s.score?.B||0}`]]),['Durata minuti',Math.floor((s.elapsed||0)/60)],[]];
    let blocks=[...meta,head,...rows];
    if(type===GAME_TYPE){
      blocks.push([],['EVENTI PARTITA'],['Secondo','Minuto','Tipo','Giocatore','Team','Dettaglio']);
      (s.events||[]).filter(e=>!e.void).forEach(e=>{let p=DB.roster.find(x=>x.id===e.pid);blocks.push([e.t||0,Math.floor((e.t||0)/60),label(e.type),p?.name||'',e.team||'',e.type==='goal_against'?'Gol avversario':e.assistId?'Con assist':''])});
    }
    let csv=blocks.map(r=>r.map(csvCell).join(';')).join('\n');const nm=type===GAME_TYPE?`SevenLab_GAME_${safeExportName(s.avversario)}_${safeExportName(s.dateLabel)}`:`SevenLab_${safeExportName(s.dateLabel||s.title)}_${s.size}v${s.size}`;downloadText('\ufeff'+csv,nm+'.csv','text/csv;charset=utf-8');toast(type===GAME_TYPE?'CSV partita esportato':'CSV allenamento esportato')
  };

  openSession=function(id){
    let s=DB.history.find(x=>x.id===id);if(!s)return;let type=sessionType(s),ids=s.present||[],rows=ids.map(pid=>{let p=DB.roster.find(x=>x.id===pid),z=pstats(pid,s),sc=playerScore(pid,s);return`<tr><td>${esc(p?.name||'')}</td><td>${RN[p?.role]||''}</td><td>${sc.total.toFixed(1)}</td><td><b>${sc.vote.toFixed(1)}</b></td><td>${z.g}</td><td>${z.a}</td><td>${z.po}/${z.po+z.pb}</td><td>${z.dok}/${z.dok+z.dbad}</td><td>${z.r}</td><td>${z.l}</td></tr>`}).join('');
    let links=assistLinks(s).slice(0,5).map(x=>`<div class="combo"><b>${esc(name(x.a))} → ${esc(name(x.b))}</b><span class="meta">${x.n} assist</span></div>`).join('')||'<div class="sub">Nessuna connessione assist registrata.</div>';
    const result=`${s.score?.A||0}-${s.score?.B||0}`,extra=type===GAME_TYPE?`<div class="kpi"><b>${esc(s.avversario||'')}</b><small>Avversario</small></div>`:`<div class="kpi"><b>${s.size}v${s.size}</b><small>Formato</small></div>`;
    $('#sessionDetail').innerHTML=`<div class="kpis"><div class="kpi"><b>${result}</b><small>Risultato</small></div>${extra}<div class="kpi"><b>${Math.floor((s.elapsed||0)/60)}'</b><small>Durata</small></div></div><div class="exportbar053 single"><button class="btn primary" id="exportCsv053">📊 Esporta CSV ${type===GAME_TYPE?'partita':'allenamento'}</button></div><div style="overflow:auto"><table class="report"><thead><tr><th>Giocatore</th><th>Ruolo</th><th>Pti</th><th>Voto</th><th>G</th><th>A</th><th>Pass</th><th>Drib.</th><th>Rec.</th><th>Perse</th></tr></thead><tbody>${rows}</tbody></table></div><h3 class="mt">Connessioni gol/assist</h3>${links}`;
    $('#exportCsv053').onclick=()=>exportSessionCSV(s);$('#sessionModal').classList.add('show')
  };

  injectGameUI();ensureDraft();renderGame();renderHistory();save();
})();