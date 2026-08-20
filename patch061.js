// SevenLab 0.6.1 — apply configured team identity to Game without touching stable 0.5.14.
(function(){
  function teamName(s=C()){
    return String(s?.team_name||window.SevenLabTeam?.name||'').trim();
  }

  // Block official Game start until the account has a team identity.
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#startGame');
    if(!b)return;
    const n=teamName();
    if(!n){
      e.preventDefault();e.stopImmediatePropagation();
      toast('Prima imposta il nome squadra in Impostazioni');
      go('impostazioni');
    }
  },true);

  // Attach team identity to the session before Live renders.
  const baseGo061=go;
  go=function(id){
    if(id==='live'&&C()?.tipo==='partita'){
      const n=teamName();
      if(n){
        C().team_name=n;
        C().title=`${n} vs ${C().avversario||'Avversario'}`;
        save();
      }
    }
    baseGo061(id);
  };

  // Replace SevenLab placeholder labels in official-game Live UI.
  const baseRenderLive061=renderLive;
  renderLive=function(){
    baseRenderLive061();
    const c=C();if(c?.tipo!=='partita')return;
    const n=teamName(c)||'SQUADRA';
    const first=$('.gameScoreNames span:first-child');if(first)first.textContent=n.toUpperCase();
    $$('#livePlayers .liveplayer .role').forEach(x=>x.textContent=n);
    const meta=$('.gameMeta');
    if(meta){const spans=meta.querySelectorAll('span');if(spans[0])spans[0].textContent=`${n} vs ${c.avversario||''}`}
  };

  // Preserve the team identity in Game CSV metadata and filename.
  const baseExport061=exportSessionCSV;
  exportSessionCSV=function(s){
    if(s?.tipo!=='partita')return baseExport061(s);
    const n=teamName(s)||'Squadra';
    let head=['Giocatore','Ruolo','Punti','Voto','Gol','Assist','Tiri','Tiri in porta','Passaggi corretti','Passaggi sbagliati','Recuperi','Palle perse','Dribbling riusciti','Dribbling falliti','Parate'];
    let rows=(s.present||[]).map(pid=>{let p=DB.roster.find(x=>x.id===pid),z=pstats(pid,s),sc=playerScore(pid,s);return[p?.name||'',RN[p?.role]||'',sc.total.toFixed(1),sc.vote.toFixed(1),z.g,z.a,z.sh,z.on,z.po,z.pb,z.r,z.l,z.dok,z.dbad,z.sv]});
    const ma=s.teamModules?.A||s.module||'';
    let blocks=[['SevenLab'],['Tipo','partita'],['Squadra',n],['Avversario',s.avversario||''],['Data',s.dateLabel||''],['Titolo',s.title||`${n} vs ${s.avversario||''}`],['Gol fatti',s.score?.A||0],['Gol subiti',s.score?.B||0],['Modulo iniziale',ma],['Durata minuti',Math.floor((s.elapsed||0)/60)],[],head,...rows,[],['EVENTI PARTITA'],['Secondo','Minuto','Tipo','Giocatore','Team','Dettaglio']];
    (s.events||[]).filter(e=>!e.void).forEach(e=>{let p=DB.roster.find(x=>x.id===e.pid);blocks.push([e.t||0,Math.floor((e.t||0)/60),label(e.type),p?.name||'',e.team==='A'?n:(e.team==='B'?(s.avversario||'Avversario'):(e.team||'')),e.type==='goal_against'?'Gol avversario':e.assistId?'Con assist':''])});
    let csv=blocks.map(r=>r.map(csvCell).join(';')).join('\n');
    downloadText('\ufeff'+csv,`${safeExportName(n)}_GAME_${safeExportName(s.avversario)}_${safeExportName(s.dateLabel)}.csv`,'text/csv;charset=utf-8');
    toast('CSV partita esportato');
  };

  // Refresh any active Game after team profile arrives from Supabase.
  const oldLoad=window.SevenLabTeam?.load;
  if(oldLoad)window.SevenLabTeam.load=async function(){const x=await oldLoad.apply(this,arguments);if(C()?.tipo==='partita'&&window.SevenLabTeam.name){C().team_name=window.SevenLabTeam.name;C().title=`${window.SevenLabTeam.name} vs ${C().avversario||'Avversario'}`;save();renderLive()}return x};
})();