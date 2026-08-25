// SevenLab 0.7.1 — session lifecycle markers + wide per-event CSV timeline.
// FIX: lifecycle tracking must never replace Play/Pause/Stop handlers.
(function(){
  function mmss(sec){sec=Math.max(0,Math.floor(Number(sec)||0));return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}
  function addMarker(kind){
    const c=C();if(!c?.id)return;
    c.events=c.events||[];
    c.events.push({id:Date.now()+Math.random(),pid:null,type:'session_marker',marker:kind,t:elapsed(),phase:c.phase,team:null,void:false,wallClock:new Date().toISOString()});
    save();
  }

  // Non-invasive event observers. They DO NOT overwrite the established controls from app05/performance patches.
  function installLifecycleObservers(){
    const play=$('#playBtn'),pause=$('#pauseBtn'),stop=$('#stopBtn');
    if(play&&!play.dataset.life071){
      play.dataset.life071='1';
      play.addEventListener('click',()=>{
        const c=C();if(!c?.id||c.startedAt)return;
        const kind=c.phase==='pausa'?'second_half_start':'match_start';
        // Marker before the native handler changes phase/start timestamp.
        addMarker(kind);
      },true);
    }
    if(pause&&!pause.dataset.life071){
      pause.dataset.life071='1';
      pause.addEventListener('click',()=>{const c=C();if(c?.id&&c.startedAt)addMarker('half_time')},true);
    }
    if(stop&&!stop.dataset.life071){
      stop.dataset.life071='1';
      stop.addEventListener('click',()=>{const c=C();if(c?.id)addMarker('match_end')},true);
    }
  }

  const EVENT_COLS=[
    'Inizio partita','Fine 1° tempo','Inizio 2° tempo','Fine partita',
    'Gol','Assist','Tiro','Tiro in porta','Passaggio corretto','Passaggio sbagliato','Recupero','Palla persa','Dribbling riuscito','Dribbling fallito','Parata',
    'Cartellino giallo','Cartellino rosso','Rigore tirato','Rigore segnato','Rigore sbagliato','Punizione tirata','Punizione segnata','Punizione sbagliata','Calcio angolo','Corner con gol','Corner senza gol',
    'Cambio entra','Cambio esce','Gol subito'
  ];
  function eventFlags(e){
    const f=Object.fromEntries(EVENT_COLS.map(k=>[k,'']));
    const on=k=>f[k]=1;
    if(e.type==='session_marker'){
      if(e.marker==='match_start')on('Inizio partita');
      else if(e.marker==='half_time')on('Fine 1° tempo');
      else if(e.marker==='second_half_start')on('Inizio 2° tempo');
      else if(e.marker==='match_end')on('Fine partita');
      return f;
    }
    if(e.type==='goal'){on('Gol');on('Tiro');on('Tiro in porta')}
    else if(e.type==='assist')on('Assist');
    else if(e.type==='shot'){on('Tiro');if(e.onTarget)on('Tiro in porta')}
    else if(e.type==='passok')on('Passaggio corretto');
    else if(e.type==='passbad')on('Passaggio sbagliato');
    else if(e.type==='recover')on('Recupero');
    else if(e.type==='lost')on('Palla persa');
    else if(e.type==='dribble_ok')on('Dribbling riuscito');
    else if(e.type==='dribble_bad')on('Dribbling fallito');
    else if(e.type==='save')on('Parata');
    else if(e.type==='yellow_card')on('Cartellino giallo');
    else if(e.type==='red_card')on('Cartellino rosso');
    else if(e.type==='goal_against')on('Gol subito');
    else if(e.type==='sub')on('Cambio entra');
    else if(e.type==='set_piece'){
      if(e.kind==='penalty'){on('Rigore tirato');if(e.outcome==='scored')on('Rigore segnato');if(e.outcome==='missed')on('Rigore sbagliato')}
      if(e.kind==='free_kick'){on('Punizione tirata');if(e.outcome==='scored')on('Punizione segnata');if(e.outcome==='missed')on('Punizione sbagliata')}
      if(e.kind==='corner'){on('Calcio angolo');if(e.outcome==='goal')on('Corner con gol');if(e.outcome==='no_goal')on('Corner senza gol')}
    }
    return f;
  }
  function timelineRows(s){
    const rows=[];
    (s.events||[]).filter(e=>!e.void).forEach(e=>{
      const sec=Math.max(0,Math.floor(Number(e.t)||0)),p=DB.roster.find(x=>String(x.id)===String(e.pid)),out=DB.roster.find(x=>String(x.id)===String(e.outId));
      const flags=eventFlags(e),detail=e.type==='sub'&&out?`Esce ${out.name}`:e.reason||e.outcome||e.marker||'';
      rows.push([sec,Math.floor(sec/60),sec%60,mmss(sec),e.phase||'',p?.name||'',e.team||'',detail,...EVENT_COLS.map(k=>flags[k])]);
      if(e.type==='sub'&&out){const f2=Object.fromEntries(EVENT_COLS.map(k=>[k,'']));f2['Cambio esce']=1;rows.push([sec,Math.floor(sec/60),sec%60,mmss(sec),e.phase||'',out.name,e.team||'',`Entra ${p?.name||''}`,...EVENT_COLS.map(k=>f2[k])])}
    });
    return rows.sort((a,b)=>a[0]-b[0]);
  }
  function parseCSV(text){
    text=String(text||'').replace(/^\ufeff/,'');const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}else{if(ch==='"')q=true;else if(ch===';'){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch}}
    row.push(cell);rows.push(row);return rows;
  }
  function enc(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function rebuildCSV(text,s){
    const rows=parseCSV(text),idx=rows.findIndex(r=>r[0]==='EVENTI PARTITA'||r[0]==='TIMELINE EVENTI'),base=idx>=0?rows.slice(0,idx):rows;
    while(base.length&&base[base.length-1].every(x=>!x))base.pop();
    base.push([],['TIMELINE EVENTI'],['Secondo totale','Minuto','Secondo','Minutaggio','Fase','Giocatore','Team','Dettaglio',...EVENT_COLS],...timelineRows(s));
    base.push([],['RIEPILOGO TEMPI'],['Durata effettiva',mmss(s.elapsed||0)]);
    const marks=(s.events||[]).filter(e=>!e.void&&e.type==='session_marker'),map={match_start:'Inizio partita',half_time:'Fine 1° tempo',second_half_start:'Inizio 2° tempo',match_end:'Fine partita'};
    marks.forEach(e=>base.push([map[e.marker]||e.marker,mmss(e.t||0),e.wallClock||'']));
    return '\ufeff'+base.map(r=>r.map(enc).join(';')).join('\n');
  }

  const baseExport071=exportSessionCSV;
  exportSessionCSV=function(s){
    const original=downloadText;downloadText=function(text,name,mime){return original(rebuildCSV(text,s),name,mime)};
    try{return baseExport071(s)}finally{downloadText=original}
  };

  installLifecycleObservers();
  const baseRenderLive071=renderLive;
  renderLive=function(){baseRenderLive071();installLifecycleObservers()};
  window.SevenLab071={timelineRows};
})();