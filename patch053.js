// SevenLab 0.5.3 incremental patch on top of stable app05.js
const PASS_DOUBLE=330;
let passTimers={};

function wirePass(btn,pid){
  btn.onclick=()=>{
    if(passTimers[pid]){
      clearTimeout(passTimers[pid]);
      passTimers[pid]=null;
      addEvent(pid,'passbad');
      toast('Passaggio sbagliato');
    }else{
      passTimers[pid]=setTimeout(()=>{
        passTimers[pid]=null;
        addEvent(pid,'passok');
        toast('Passaggio corretto');
      },PASS_DOUBLE);
    }
  };
}

// Override della Live: 6 tasti su 2 righe x 3 colonne per i giocatori di movimento.
renderLive=function(){
  let c=C();
  updateTimer();
  $('#scoreA').textContent=c.score.A;
  $('#scoreB').textContent=c.score.B;
  let ids=[...new Set(assigned())];
  $('#livePlayers').innerHTML=ids.map(id=>{
    let p=DB.roster.find(x=>x.id===id),a=assignmentOf(id),z=pstats(id,c),sc=playerScore(id,c);
    let set=p?.role==='P'
      ? [['save','🧤','Parata'],['pass','↔️','Passaggio']]
      : [['shot','🎯','Tiro'],['goal','⚽','Gol'],['dribble','🌀','Dribbling'],['pass','↔️','Passaggio'],['lost','❌','Persa'],['recover','🔄','Recupero']];
    return `<div class="liveplayer"><div class="liveplayer-top"><div><div class="name">${esc(p?.name||'')}</div><div class="meta">${RN[p?.role]||''} ${a?.outRole?'· ⚠️ fuori ruolo':''}</div></div><span class="role">Squadra ${a?.team||''}</span></div><div class="countergrid countergrid3">${set.map(([t,i,l])=>`<button class="counter counterbig" data-ev="${id}|${t}"><b>${i} ${t==='shot'?z.sh:t==='dribble'?(z.dok+z.dbad):t==='pass'?(z.po+z.pb):cnt(id,t)}</b><small>${l}</small></button>`).join('')}</div><div class="microstats">Punti ${sc.total.toFixed(1)} · Voto ${sc.vote.toFixed(1)}${p?.role!=='P'?` · Tiri ${z.sh} · Porta ${z.on} · Pass ${z.po}/${z.po+z.pb} · Dribbling ${z.dok}/${z.dok+z.dbad}`:` · Pass ${z.po}/${z.po+z.pb}`}</div></div>`;
  }).join('')||'<div class="empty">Prima prepara le formazioni.</div>';

  $$('[data-ev]').forEach(b=>{
    let [id,t]=b.dataset.ev.split('|');
    if(t==='dribble') wireDribble(b,id);
    else if(t==='pass') wirePass(b,id);
    else b.onclick=()=>t==='goal'?openAssist(id):addEvent(id,t);
  });
  renderLast();
};

function csvCell(v){return `"${String(v??'').replaceAll('"','""')}"`}
function downloadText(text,name,type='text/plain;charset=utf-8'){
  let blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function safeExportName(x){return String(x||'allenamento').replace(/[^a-zA-Z0-9_-]+/g,'_')}
function exportSessionCSV(s){
  let head=['Giocatore','Ruolo','Punti','Voto','Gol','Assist','Tiri','Tiri in porta','Passaggi corretti','Passaggi sbagliati','Recuperi','Palle perse','Dribbling riusciti','Dribbling falliti','Parate'];
  let rows=(s.present||[]).map(pid=>{
    let p=DB.roster.find(x=>x.id===pid),z=pstats(pid,s),sc=playerScore(pid,s);
    return [p?.name||'',RN[p?.role]||'',sc.total.toFixed(1),sc.vote.toFixed(1),z.g,z.a,z.sh,z.on,z.po,z.pb,z.r,z.l,z.dok,z.dbad,z.sv];
  });
  let meta=[['SevenLab'],['Data',s.dateLabel||''],['Titolo',s.title||''],['Formato',`${s.size}v${s.size}`],['Modulo',s.module||''],['Risultato',`${s.score?.A||0}-${s.score?.B||0}`],['Durata minuti',Math.floor((s.elapsed||0)/60)],[]];
  let csv=[...meta,head,...rows].map(r=>r.map(csvCell).join(';')).join('\n');
  downloadText('\ufeff'+csv,`SevenLab_${safeExportName(s.dateLabel||s.title)}_${s.size}v${s.size}.csv`,'text/csv;charset=utf-8');
  toast('CSV allenamento esportato');
}
async function shareSession053(s){
  let txt=`SevenLab · ${s.dateLabel||s.title||'Allenamento'}\n${s.size}v${s.size} · ${s.score?.A||0}-${s.score?.B||0}\nDurata ${Math.floor((s.elapsed||0)/60)} min`;
  if(navigator.share){try{await navigator.share({title:'SevenLab - Allenamento',text:txt});return}catch(e){}}
  try{await navigator.clipboard.writeText(txt);toast('Riepilogo copiato')}catch(e){toast('Condivisione non disponibile')}
}

// Override dettaglio sessione con esportazione.
openSession=function(id){
  let s=DB.history.find(x=>x.id===id);if(!s)return;
  let ids=s.present||[],rows=ids.map(pid=>{
    let p=DB.roster.find(x=>x.id===pid),z=pstats(pid,s),sc=playerScore(pid,s);
    return `<tr><td>${esc(p?.name||'')}</td><td>${RN[p?.role]||''}</td><td>${sc.total.toFixed(1)}</td><td><b>${sc.vote.toFixed(1)}</b></td><td>${z.g}</td><td>${z.a}</td><td>${z.po}/${z.po+z.pb}</td><td>${z.dok}/${z.dok+z.dbad}</td><td>${z.r}</td><td>${z.l}</td></tr>`;
  }).join('');
  let links=assistLinks(s).slice(0,5).map(x=>`<div class="combo"><b>${esc(name(x.a))} → ${esc(name(x.b))}</b><span class="meta">${x.n} assist</span></div>`).join('')||'<div class="sub">Nessuna connessione assist registrata.</div>';
  $('#sessionDetail').innerHTML=`<div class="kpis"><div class="kpi"><b>${s.score?.A||0}-${s.score?.B||0}</b><small>Risultato</small></div><div class="kpi"><b>${s.size}v${s.size}</b><small>Formato</small></div><div class="kpi"><b>${Math.floor((s.elapsed||0)/60)}'</b><small>Durata</small></div></div><div class="exportbar053"><button class="btn primary" id="exportCsv053">📊 Esporta CSV</button><button class="btn ghost" id="share053">📤 Condividi</button></div><div style="overflow:auto"><table class="report"><thead><tr><th>Giocatore</th><th>Ruolo</th><th>Pti</th><th>Voto</th><th>G</th><th>A</th><th>Pass</th><th>Drib.</th><th>Rec.</th><th>Perse</th></tr></thead><tbody>${rows}</tbody></table></div><h3 class="mt">Connessioni gol/assist</h3>${links}`;
  $('#exportCsv053').onclick=()=>exportSessionCSV(s);
  $('#share053').onclick=()=>shareSession053(s);
  $('#sessionModal').classList.add('show');
};

renderLive();