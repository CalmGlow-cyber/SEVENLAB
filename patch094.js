// SevenLab 0.9.7 — session acquisition mode: Diretta / Differita + video playback speed.
// Additive patch: preserves all existing Live/Game event, timing, archive and CSV logic.
(function(){
  const GAME='partita';
  const MODE_DIRECT='diretta', MODE_DELAYED='differita';

  function ensureStyles094(){
    if(document.getElementById('style094'))return;
    const s=document.createElement('style');s.id='style094';s.textContent=`
      .capture094{margin:12px 0 10px;padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.025)}
      .capture094-title{font-size:12px;font-weight:850;letter-spacing:.02em;margin-bottom:7px;color:#eaf7ef}
      .capture094-options{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .capture094-option{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;min-height:43px;padding:8px 10px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:#0a1711;cursor:pointer;font-size:13px;font-weight:750;user-select:none;-webkit-user-select:none}
      .capture094-option:has(input:checked){background:#10291d;border-color:rgba(56,210,125,.56);box-shadow:inset 0 0 0 1px rgba(56,210,125,.12)}
      .capture094-option input{width:18px;height:18px;margin:0;accent-color:#4dd98a}
      .capture094-speed{display:none;margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,.07)}
      .capture094-speed.show{display:block}
      .capture094-speedlabel{display:block;font-size:11px;font-weight:750;color:#b9cec2;margin-bottom:5px}
      .capture094-speedrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center}
      .capture094-speedrow .input{margin:0!important}
      .capture094-unit{min-width:34px;text-align:center;font-size:16px;font-weight:850;color:#8fe2b3}
      .capture094-help{font-size:10px;line-height:1.25;opacity:.66;margin-top:5px}
      @media(min-width:768px){.capture094{padding:12px}.capture094-options{max-width:520px}.capture094-speed{max-width:520px}}
    `;document.head.appendChild(s);
  }

  function blockHTML094(kind){
    const prefix=kind==='game'?'game':'training';
    const group=`${prefix}CaptureMode094`;
    return `
      <div class="capture094-title">Modalità di rilevazione <span style="opacity:.62;font-weight:650">· obbligatoria</span></div>
      <div class="capture094-options" role="radiogroup" aria-label="Modalità di rilevazione">
        <label class="capture094-option"><input type="radio" name="${group}" value="${MODE_DIRECT}"><span>Diretta</span></label>
        <label class="capture094-option"><input type="radio" name="${group}" value="${MODE_DELAYED}"><span>Differita</span></label>
      </div>
      <div class="capture094-speed" data-speed-wrap094>
        <label class="capture094-speedlabel" for="${prefix}PlaybackSpeed094">Velocità di riproduzione video · obbligatoria</label>
        <div class="capture094-speedrow"><input id="${prefix}PlaybackSpeed094" class="input" type="number" min="0.05" step="0.05" inputmode="decimal" placeholder="es. 0,50"><span class="capture094-unit">×</span></div>
        <div class="capture094-help">Inserisci la velocità usata durante la raccolta, ad esempio 0,50×, 0,75×, 1,00× o 1,50×.</div>
      </div>`;
  }

  function bindBlock094(block){
    if(!block||block.dataset.bound094)return;block.dataset.bound094='1';
    const refresh=()=>{
      const mode=block.querySelector('input[type="radio"]:checked')?.value||'';
      const speedWrap=block.querySelector('[data-speed-wrap094]');
      const speed=block.querySelector('input[type="number"]');
      const delayed=mode===MODE_DELAYED;
      speedWrap?.classList.toggle('show',delayed);
      if(speed){speed.required=delayed;if(!delayed)speed.value=''}
    };
    block.querySelectorAll('input[type="radio"]').forEach(x=>x.addEventListener('change',refresh));
    refresh();
  }

  function injectTraining094(){
    const list=document.getElementById('presenceList');if(!list||document.getElementById('trainingCapture094'))return;
    const block=document.createElement('div');block.id='trainingCapture094';block.className='capture094';block.innerHTML=blockHTML094('training');
    const anchor=list.previousElementSibling;
    if(anchor)anchor.insertAdjacentElement('beforebegin',block);else list.insertAdjacentElement('beforebegin',block);
    bindBlock094(block);
  }

  function injectGame094(){
    const list=document.getElementById('gamePresence');if(!list||document.getElementById('gameCapture094'))return;
    const block=document.createElement('div');block.id='gameCapture094';block.className='capture094';block.innerHTML=blockHTML094('game');
    const anchor=list.previousElementSibling;
    if(anchor)anchor.insertAdjacentElement('beforebegin',block);else list.insertAdjacentElement('beforebegin',block);
    bindBlock094(block);
  }

  function ensureUI094(){ensureStyles094();injectTraining094();injectGame094()}

  function readSetup094(kind){
    const block=document.getElementById(kind==='game'?'gameCapture094':'trainingCapture094');
    if(!block)return{mode:'',speed:null,block:null};
    const mode=block.querySelector('input[type="radio"]:checked')?.value||'';
    const input=block.querySelector('input[type="number"]');
    const raw=String(input?.value||'').trim().replace(',','.');
    const speed=raw===''?null:Number(raw);
    return{mode,speed:Number.isFinite(speed)?speed:null,block,input};
  }

  function validate094(kind){
    ensureUI094();const x=readSetup094(kind);
    if(!x.mode){
      try{toast('Seleziona Diretta oppure Differita')}catch(e){}
      x.block?.scrollIntoView({behavior:'smooth',block:'center'});
      return false;
    }
    if(x.mode===MODE_DELAYED&&!(x.speed>0)){
      try{toast('Inserisci la velocità di riproduzione video')}catch(e){}
      x.input?.focus();
      return false;
    }
    return true;
  }

  // Validate before the existing onclick handlers run. No existing handler is replaced.
  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('#presenceBtn,#startGame');if(!btn)return;
    const kind=btn.id==='startGame'?'game':'training';
    if(validate094(kind))return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);

  function applyToCurrent094(kind){
    const c=C?.();if(!c?.id)return;
    const x=readSetup094(kind);if(!x.mode)return;
    c.modalita_rilevazione=x.mode;
    if(x.mode===MODE_DELAYED&&x.speed>0)c.velocita_riproduzione=x.speed;
    else delete c.velocita_riproduzione;
    try{save()}catch(e){}
  }

  // patch060 creates the session immediately before navigating to Formazioni/Live.
  // Capture the setup metadata at that exact point, leaving the working session structure untouched otherwise.
  if(typeof go==='function'){
    const goBefore094=go;
    go=function(id){
      try{
        const c=C?.();
        if(c?.id&&id==='formazioni'&&c.tipo!==GAME)applyToCurrent094('training');
        if(c?.id&&id==='live'&&c.tipo===GAME)applyToCurrent094('game');
      }catch(e){console.error('SevenLab 0.9.7 acquisition metadata',e)}
      return goBefore094.apply(this,arguments);
    };
  }

  function resetSetup094(kind){
    const block=document.getElementById(kind==='game'?'gameCapture094':'trainingCapture094');if(!block)return;
    block.querySelectorAll('input[type="radio"]').forEach(x=>x.checked=false);
    const speed=block.querySelector('input[type="number"]');if(speed)speed.value='';
    block.querySelector('[data-speed-wrap094]')?.classList.remove('show');
  }

  if(typeof archive==='function'){
    const archiveBefore094=archive;
    archive=function(){
      let kind='training';try{kind=C?.()?.tipo===GAME?'game':'training'}catch(e){}
      const r=archiveBefore094.apply(this,arguments);
      resetSetup094(kind);
      return r;
    };
  }

  function parseCSV094(text){
    text=String(text||'').replace(/^\ufeff/,'');const rows=[];let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}
      else{if(ch==='"')q=true;else if(ch===';'){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch}
    }
    row.push(cell);rows.push(row);return rows;
  }
  function enc094(v){return `"${String(v??'').replaceAll('"','""')}"`}
  function modeLabel094(v){return v===MODE_DELAYED?'Differita':v===MODE_DIRECT?'Diretta':''}
  function speedLabel094(v){const n=Number(v);return Number.isFinite(n)&&n>0?`${n.toFixed(2)}x`:''}
  function augmentCSV094(text,s){
    const label=modeLabel094(s?.modalita_rilevazione);if(!label)return text;
    let rows=parseCSV094(text).filter(r=>r[0]!=='Modalità rilevazione'&&r[0]!=='Velocità riproduzione');
    const additions=[['Modalità rilevazione',label]];
    if(s.modalita_rilevazione===MODE_DELAYED){
      const speed=speedLabel094(s.velocita_riproduzione);if(speed)additions.push(['Velocità riproduzione',speed]);
    }
    let idx=rows.findIndex(r=>r[0]==='Titolo');
    if(idx<0)idx=rows.findIndex(r=>r[0]==='Data');
    if(idx<0)idx=rows.findIndex(r=>r[0]==='SevenLab');
    rows.splice(Math.max(0,idx+1),0,...additions);
    return '\ufeff'+rows.map(r=>r.map(enc094).join(';')).join('\n');
  }

  // Wrap the established export instead of rebuilding it: all current CSV sections/patches remain intact.
  if(typeof exportSessionCSV==='function'&&typeof downloadText==='function'){
    const exportBefore094=exportSessionCSV;
    exportSessionCSV=function(s){
      const original=downloadText;
      downloadText=function(text,name,mime){return original(augmentCSV094(text,s),name,mime)};
      try{return exportBefore094(s)}finally{downloadText=original}
    };
  }

  function markVersion094(){
    const beta=document.querySelector('.beta');if(beta)beta.textContent='BETA 0.9.7';
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\./.test(e.textContent||''))e.textContent='Beta 0.9.7 · Diretta/Differita + Game fuori ruolo'});
  }

  ensureUI094();markVersion094();
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="allenamento"],[data-go="game"]'))setTimeout(ensureUI094,20)},true);
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ensureUI094();markVersion094()},500));
  setTimeout(()=>{ensureUI094();markVersion094()},1200);
  setTimeout(()=>{ensureUI094();markVersion094()},2400);
  window.SevenLab094={readSetup:readSetup094,augmentCSV:augmentCSV094};
})();
