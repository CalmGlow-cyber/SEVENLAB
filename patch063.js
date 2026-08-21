// SevenLab 0.6.3 — player minutes in Live/Game CSV exports.
(function(){
  function playerSeconds(s,pid){
    let total=0;
    (s?.segments||[]).forEach(g=>{
      const onField=(g.A||[]).includes(pid)||(g.B||[]).includes(pid);
      if(onField)total+=Math.max(0,(Number(g.end)||0)-(Number(g.start)||0));
    });
    // Fallback for very old sessions without segment tracking.
    if(!total&&!(s?.segments||[]).length){
      const inFinalTeams=['A','B'].some(t=>Object.values(s?.teams?.[t]||{}).some(x=>x?.pid===pid));
      if(inFinalTeams)total=Math.max(0,Number(s?.elapsed)||0);
    }
    return Math.round(total);
  }
  function fmtMMSS(sec){
    sec=Math.max(0,Math.round(sec||0));
    const m=Math.floor(sec/60),ss=sec%60;
    return `${m}:${String(ss).padStart(2,'0')}`;
  }

  exportSessionCSV=function(s){
    const GAME_TYPE='partita';
    const type=s?.tipo===GAME_TYPE?GAME_TYPE:'allenamento';
    let head=['Giocatore','Ruolo','Minuti giocati','Minutaggio','Punti','Voto','Gol','Assist','Tiri','Tiri in porta','Passaggi corretti','Passaggi sbagliati','Recuperi','Palle perse','Dribbling riusciti','Dribbling falliti','Parate'];
    let rows=(s.present||[]).map(pid=>{
      let p=DB.roster.find(x=>x.id===pid),z=pstats(pid,s),sc=playerScore(pid,s),secs=playerSeconds(s,pid);
      return [p?.name||'',RN[p?.role]||'',(secs/60).toFixed(2),fmtMMSS(secs),sc.total.toFixed(1),sc.vote.toFixed(1),z.g,z.a,z.sh,z.on,z.po,z.pb,z.r,z.l,z.dok,z.dbad,z.sv];
    });
    const ma=s.teamModules?.A||s.module||'',mb=s.teamModules?.B||s.module||'';
    let meta=[['SevenLab'],['Tipo',type],['Data',s.dateLabel||''],['Titolo',s.title||''],...(type===GAME_TYPE?[['Avversario',s.avversario||''],['Gol fatti',s.score?.A||0],['Gol subiti',s.score?.B||0],['Modulo iniziale',ma]]:[['Formato',`${s.size}v${s.size}`],['Modulo Squadra A',ma],['Modulo Squadra B',mb],['Risultato',`${s.score?.A||0}-${s.score?.B||0}`]]),['Durata minuti',Math.floor((s.elapsed||0)/60)],[]];
    let blocks=[...meta,head,...rows];
    if(type===GAME_TYPE){
      blocks.push([],['EVENTI PARTITA'],['Secondo','Minuto','Tipo','Giocatore','Team','Dettaglio']);
      (s.events||[]).filter(e=>!e.void).forEach(e=>{
        let p=DB.roster.find(x=>x.id===e.pid);
        blocks.push([e.t||0,Math.floor((e.t||0)/60),label(e.type),p?.name||'',e.team||'',e.type==='goal_against'?'Gol avversario':e.assistId?'Con assist':'']);
      });
    }
    let csv=blocks.map(r=>r.map(csvCell).join(';')).join('\n');
    const nm=type===GAME_TYPE?`SevenLab_GAME_${safeExportName(s.avversario)}_${safeExportName(s.dateLabel)}`:`SevenLab_${safeExportName(s.dateLabel||s.title)}_${s.size}v${s.size}`;
    downloadText('\ufeff'+csv,nm+'.csv','text/csv;charset=utf-8');
    toast(type===GAME_TYPE?'CSV partita esportato':'CSV allenamento esportato');
  };

  window.SevenLabPlayerMinutes063={playerSeconds,fmtMMSS};
})();