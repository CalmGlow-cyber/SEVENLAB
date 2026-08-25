// SevenLab 0.6.5 — isolated Test Mode: local-only sessions, official cloud stays clean.
(function(){
  const TEST_MODE_KEY='sevenlab_test_mode_v065';
  const TEST_HISTORY_KEY='sevenlab_test_history_v065';
  const GAME='partita', TRAINING='allenamento';

  function isTestMode(){return localStorage.getItem(TEST_MODE_KEY)==='1'}
  function setTestMode(v){localStorage.setItem(TEST_MODE_KEY,v?'1':'0');renderSettings()}
  function getTestHistory(){try{return JSON.parse(localStorage.getItem(TEST_HISTORY_KEY)||'[]')||[]}catch(e){return[]}}
  function setTestHistory(v){localStorage.setItem(TEST_HISTORY_KEY,JSON.stringify(v||[]))}
  function typeOf(s){return s?.tipo===GAME?GAME:TRAINING}
  function testProgressive(s){
    const list=getTestHistory().filter(x=>typeOf(x)===typeOf(s)).sort((a,b)=>(Date.parse(a.dateISO||'')||0)-(Date.parse(b.dateISO||'')||0));
    const i=list.findIndex(x=>String(x.id)===String(s.id));
    return i>=0?i+1:list.length+1;
  }
  function officialProgressive(s){
    const list=(DB.history||[]).filter(x=>!x.testMode&&typeOf(x)===typeOf(s)).slice().sort((a,b)=>(Date.parse(a.dateISO||'')||0)-(Date.parse(b.dateISO||'')||0)||String(a.id).localeCompare(String(b.id)));
    const i=list.findIndex(x=>String(x.id)===String(s.id));
    return i>=0?i+1:list.length+1;
  }

  // Mark the current session before the cloud archive wrapper sees it.
  const baseArchive=archive;
  archive=function(){
    const test=isTestMode();
    if(C()?.id)C().testMode=test;
    const before=new Set((DB.history||[]).map(s=>s.id));
    baseArchive();
    if(!test)return;
    const created=(DB.history||[]).find(s=>!before.has(s.id)&&s.testMode);
    if(!created)return;
    // Move test session out of official history immediately; it remains available locally for export.
    DB.history=DB.history.filter(s=>s.id!==created.id);
    const tests=getTestHistory();tests.unshift(created);setTestHistory(tests);
    try{localStorage.setItem(K,JSON.stringify(DB))}catch(e){}
    renderHistory();
    toast('Sessione TEST salvata solo su questo dispositivo');
  };

  // Reuse the established CSV content/minutes logic, only replace filenames and expose local test exports.
  const baseExport=exportSessionCSV;
  exportSessionCSV=function(s){
    const originalDownload=downloadText;
    downloadText=function(text,name,mime){
      const prefix=typeOf(s)===GAME?'partita':'allenamento';
      const n=s?.testMode?testProgressive(s):officialProgressive(s);
      return originalDownload(text,`${prefix}_${n}.csv`,mime);
    };
    try{return baseExport(s)}finally{downloadText=originalDownload}
  };

  const baseRenderHistory=renderHistory;
  renderHistory=function(){
    baseRenderHistory();
    const hist=$('#storico');if(!hist)return;
    let card=$('#testHistory065')?.closest('.card');
    if(!card){
      card=document.createElement('div');card.className='card';card.innerHTML='<h2>🧪 Sessioni TEST locali</h2><div class="sub">Solo su questo dispositivo. Non vengono inviate a Supabase e non entrano nelle statistiche ufficiali.</div><div id="testHistory065"></div>';
      const first=hist.querySelector('.card');first?first.insertAdjacentElement('beforebegin',card):hist.prepend(card);
    }
    const tests=getTestHistory(),box=$('#testHistory065');
    box.innerHTML=tests.length?tests.map(s=>`<div class="historyItem"><div class="grow"><div class="name">🧪 ${s.tipo===GAME?'Partita':'Allenamento'} · ${esc(s.title||'Test')}</div><div class="meta">${esc(s.dateLabel||'')} · ${s.score?.A||0}-${s.score?.B||0}</div></div><button class="btn small ghost" data-test-export="${s.id}">CSV</button><button class="btn small danger" data-test-rm="${s.id}">×</button></div>`).join(''):'<div class="empty">Nessun test salvato su questo dispositivo.</div>';
    $$('[data-test-export]').forEach(b=>b.onclick=()=>{const s=getTestHistory().find(x=>String(x.id)===String(b.dataset.testExport));if(s)exportSessionCSV(s)});
    $$('[data-test-rm]').forEach(b=>b.onclick=()=>{if(!confirm('Eliminare questo test locale?'))return;setTestHistory(getTestHistory().filter(x=>String(x.id)!==String(b.dataset.testRm)));renderHistory()});
  };

  function injectSettings(){
    const card=$('#impostazioni .card');if(!card||$('#testMode065'))return;
    const old=$('#seasonNumbering064');if(old)old.style.display='none';
    const row=document.createElement('div');row.className='settingsrow';row.id='testMode065';
    row.innerHTML=`<div style="width:100%"><div class="settingslabel">Modalità Test</div><div class="sub">Per provare Live/Game ed esportare CSV senza salvare nulla su Supabase. Quando la disattivi, la numerazione ufficiale parte solo dalle sessioni reali.</div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px"><div id="testModeState065" class="settingsvalue"></div><button id="toggleTest065" class="btn ghost"></button></div><button id="clearTests065" class="btn danger full" style="margin-top:10px">🗑 Elimina tutti i test locali</button></div>`;
    card.appendChild(row);
    $('#toggleTest065').onclick=()=>{const next=!isTestMode();if(next&&!confirm('Attivare Modalità Test? Le sessioni create saranno solo locali e NON verranno salvate su Supabase.'))return;setTestMode(next);toast(next?'Modalità TEST attiva':'Modalità TEST disattivata')};
    $('#clearTests065').onclick=()=>{if(!confirm('Eliminare tutti i test salvati su questo dispositivo?'))return;setTestHistory([]);renderHistory();toast('Test locali eliminati')};
    renderSettings();
  }
  function renderSettings(){
    const st=$('#testModeState065'),bt=$('#toggleTest065');if(!st||!bt)return;
    const on=isTestMode();st.textContent=on?'🧪 ATTIVA · solo locale':'✅ DISATTIVA · modalità ufficiale';bt.textContent=on?'Disattiva':'Attiva';
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{injectSettings();renderHistory()},600));
  setTimeout(()=>{injectSettings();renderHistory()},1000);
  window.SevenLabTest065={isTestMode,getTestHistory};
})();