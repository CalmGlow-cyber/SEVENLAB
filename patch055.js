// SevenLab 0.5.5 incremental patch on top of STABLE 0.5.4
// Adds: independent module per team + bulk roster import from Excel/CSV.

(function(){
  const XL_SRC='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

  function inject055Styles(){
    if(document.getElementById('style055')) return;
    const s=document.createElement('style');
    s.id='style055';
    s.textContent=`
      .teamModuleBox{margin-top:12px;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.025)}
      .teamModuleTitle{font-size:12px;font-weight:800;letter-spacing:.05em;margin-bottom:7px}
      .import055{margin-top:12px}
      .import055 input[type=file]{width:100%;box-sizing:border-box}
      .import055 .hint{font-size:11px;opacity:.7;margin-top:7px;line-height:1.35}
    `;
    document.head.appendChild(s);
  }

  function teamModule(c,t){
    const mods=Object.keys(F[c.size]||{});
    c.teamModules=c.teamModules||{};
    let m=c.teamModules[t]||c.module||mods[0];
    if(!mods.includes(m)) m=mods[0];
    c.teamModules[t]=m;
    return m;
  }

  // Replace the single module selector with one selector for each team.
  renderForm=function(){
    let c=C(),mods=Object.keys(F[c.size]||{});
    teamModule(c,'A');teamModule(c,'B');
    $('#sizeSeg').innerHTML=[3,4,5,6,7].map(n=>`<button class="seg ${c.size===n?'on':''}" data-size="${n}">${n} vs ${n}</button>`).join('');
    $('#moduleSeg').innerHTML=`
      <div class="teamModuleBox"><div class="teamModuleTitle">SQUADRA A · MODULO</div><div class="segment" id="moduleSegA">${mods.map(m=>`<button class="seg ${teamModule(c,'A')===m?'on':''}" data-teammod="A|${m}">${m}</button>`).join('')}</div></div>
      <div class="teamModuleBox"><div class="teamModuleTitle">SQUADRA B · MODULO</div><div class="segment" id="moduleSegB">${mods.map(m=>`<button class="seg ${teamModule(c,'B')===m?'on':''}" data-teammod="B|${m}">${m}</button>`).join('')}</div></div>`;

    $$('[data-size]').forEach(b=>b.onclick=()=>{
      c.size=+b.dataset.size;
      const first=Object.keys(F[c.size])[0];
      c.module=first; // legacy compatibility
      c.teamModules={A:first,B:first};
      c.teams={A:{},B:{}};
      save();renderForm();
    });
    $$('[data-teammod]').forEach(b=>b.onclick=()=>{
      let [t,m]=b.dataset.teammod.split('|');
      c.teamModules=c.teamModules||{};
      c.teamModules[t]=m;
      if(t==='A') c.module=m; // legacy field retained for older analysis/export compatibility
      c.teams[t]={}; // only this team's positions depend on the chosen module
      save();renderForm();
    });
    renderPitch('A');renderPitch('B');
  };

  renderPitch=function(t){
    let c=C(),e=$('#pitch'+t),mod=teamModule(c,t);
    e.innerHTML='';
    (F[c.size][mod]||[]).forEach(([k,r,x,y])=>{
      let a=c.teams[t][k],p=DB.roster.find(z=>z.id===a?.pid),b=document.createElement('button');
      b.className='slot '+(!p?'empty':a.outRole?'outrole':'');
      b.style.left=x+'%';b.style.top=y+'%';
      b.innerHTML=p?`${esc(p.name)}<span class="tiny">${k}${a.outRole?' · fuori ruolo':''}</span>`:`+ ${k}<span class="tiny">${r}</span>`;
      b.onclick=()=>openPicker(t,k,r);
      e.appendChild(b);
    });
  };

  function normalizeRole(v){
    let x=String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
    const map={
      p:'P',por:'P',port:'P',portiere:'P',goalkeeper:'P',keeper:'P',
      d:'D',dif:'D',difensore:'D',defender:'D',
      c:'C',cen:'C',centrocampista:'C',centrocampo:'C',midfielder:'C',ala:'C',esterno:'C',
      a:'A',att:'A',attaccante:'A',attacker:'A',forward:'A',punta:'A'
    };
    return map[x]||null;
  }

  function isHeaderRow(r){
    let x=(r||[]).slice(0,3).map(v=>String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
    return x.some(v=>['nome','name'].includes(v)) && x.some(v=>['cognome','surname','lastname'].includes(v));
  }

  function ensureXLSX(){
    if(window.XLSX) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      let old=document.querySelector('script[data-sevenlab-xlsx]');
      if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return;}
      let s=document.createElement('script');s.src=XL_SRC;s.dataset.sevenlabXlsx='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  async function importRosterFile(file){
    if(!file) return;
    try{
      await ensureXLSX();
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      let rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
      if(rows.length && isHeaderRow(rows[0])) rows=rows.slice(1);
      const existing=new Set(DB.roster.map(p=>String(p.name||'').trim().toLowerCase()));
      let added=0,duplicates=0,invalid=0;
      for(const r of rows){
        if(!r || !r.some(v=>String(v??'').trim())) continue;
        const first=String(r[0]??'').trim(),last=String(r[1]??'').trim(),role=normalizeRole(r[2]);
        const full=[first,last].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
        if(!full || !role){invalid++;continue;}
        const key=full.toLowerCase();
        if(existing.has(key)){duplicates++;continue;}
        DB.roster.push({id:''+Date.now()+Math.random(),name:full,role});
        existing.add(key);added++;
      }
      save();renderRoster();renderPresence();
      toast(`${added} giocatori importati`);
      alert(`Importazione completata.\n\nAggiunti: ${added}\nDuplicati ignorati: ${duplicates}\nRighe non valide/ruolo non riconosciuto: ${invalid}`);
    }catch(err){
      console.error(err);
      alert('Non riesco a leggere il file. Usa un file Excel .xlsx/.xls o CSV con 3 colonne: Nome, Cognome, Ruolo.');
    }
  }

  function installRosterImport(){
    if(document.getElementById('excelImport055')) return;
    const rosa=$('#rosa');
    const firstCard=rosa?.querySelector('.card');
    if(!rosa||!firstCard) return;
    const card=document.createElement('div');card.className='card import055';card.id='excelImport055';
    card.innerHTML=`<h3>📥 Importa rosa da Excel</h3><div class="sub">File con 3 colonne: <b>Nome · Cognome · Ruolo</b>. Nome e cognome vengono uniti automaticamente; il ruolo viene convertito in Portiere, Difensore, Centrocampista o Attaccante.</div><input class="input mt" id="rosterFile055" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"><div class="hint">Ruoli riconosciuti anche in forma abbreviata: POR/P, DIF/D, CEN/C, ATT/A. Ala ed esterno vengono classificati come centrocampisti. I nomi già presenti non vengono duplicati.</div>`;
    firstCard.insertAdjacentElement('afterend',card);
    $('#rosterFile055').onchange=e=>{let f=e.target.files?.[0];importRosterFile(f);e.target.value='';};
  }

  // Keep CSV as the only export and include both team modules in the metadata.
  exportSessionCSV=function(s){
    let head=['Giocatore','Ruolo','Punti','Voto','Gol','Assist','Tiri','Tiri in porta','Passaggi corretti','Passaggi sbagliati','Recuperi','Palle perse','Dribbling riusciti','Dribbling falliti','Parate'];
    let rows=(s.present||[]).map(pid=>{
      let p=DB.roster.find(x=>x.id===pid),z=pstats(pid,s),sc=playerScore(pid,s);
      return [p?.name||'',RN[p?.role]||'',sc.total.toFixed(1),sc.vote.toFixed(1),z.g,z.a,z.sh,z.on,z.po,z.pb,z.r,z.l,z.dok,z.dbad,z.sv];
    });
    const ma=s.teamModules?.A||s.module||'',mb=s.teamModules?.B||s.module||'';
    let meta=[['SevenLab'],['Data',s.dateLabel||''],['Titolo',s.title||''],['Formato',`${s.size}v${s.size}`],['Modulo Squadra A',ma],['Modulo Squadra B',mb],['Risultato',`${s.score?.A||0}-${s.score?.B||0}`],['Durata minuti',Math.floor((s.elapsed||0)/60)],[]];
    let csv=[...meta,head,...rows].map(r=>r.map(csvCell).join(';')).join('\n');
    downloadText('\ufeff'+csv,`SevenLab_${safeExportName(s.dateLabel||s.title)}_${s.size}v${s.size}.csv`,'text/csv;charset=utf-8');
    toast('CSV allenamento esportato');
  };

  inject055Styles();
  installRosterImport();
  renderForm();
  save();
})();
