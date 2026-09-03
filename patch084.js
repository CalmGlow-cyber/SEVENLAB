// SevenLab 0.8.4 — training session RPE (1-10) + CSV metadata.
(function(){
  function injectRPE(){
    const card=document.querySelector('#allenamento .card');
    if(!card||document.getElementById('trainingRPE084'))return;
    const title=document.getElementById('trainingTitle');
    const wrap=document.createElement('div');
    wrap.id='trainingRPE084Wrap';
    wrap.style.marginTop='10px';
    wrap.innerHTML=`<label for="trainingRPE084" class="settingslabel" style="display:block;margin-bottom:5px">RPE allenamento</label><input id="trainingRPE084" class="input" type="number" min="1" max="10" step="1" inputmode="numeric" placeholder="RPE 1–10"><div class="sub" style="margin-top:5px">Difficoltà percepita complessiva della sessione, da 1 a 10.</div>`;
    title?.insertAdjacentElement('afterend',wrap);

    const btn=document.getElementById('presenceBtn');
    if(btn&&!btn.dataset.rpe084){
      btn.dataset.rpe084='1';
      const base=btn.onclick;
      btn.onclick=function(ev){
        const inp=document.getElementById('trainingRPE084');
        const raw=String(inp?.value||'').trim();
        if(raw){
          const n=Number(raw);
          if(!Number.isInteger(n)||n<1||n>10){try{toast('RPE deve essere un numero intero da 1 a 10')}catch(e){};return}
        }
        const result=base?base.call(this,ev):undefined;
        try{const c=C();if(c?.id&&c.tipo!=='partita'){c.rpe=raw?Number(raw):null;save()}}catch(e){}
        return result;
      };
    }
  }

  function addRPEToCSV(text,s){
    if(!s||s.tipo==='partita')return text;
    const rpe=(s.rpe===0||s.rpe)?s.rpe:'';
    let clean=String(text||''),bom='';
    if(clean.charCodeAt(0)===0xFEFF){bom='\ufeff';clean=clean.slice(1)}
    const lines=clean.split(/\r?\n/);
    const rpeLine=`"RPE";"${String(rpe).replaceAll('"','""')}"`;
    const idx=lines.findIndex(x=>/^"Formato";/.test(x));
    if(idx>=0)lines.splice(idx,0,rpeLine);else lines.splice(Math.min(4,lines.length),0,rpeLine);
    return bom+lines.join('\n');
  }

  if(typeof exportSessionCSV==='function'&&typeof downloadText==='function'){
    const baseExport=exportSessionCSV;
    exportSessionCSV=function(s){
      const original=downloadText;
      downloadText=function(text,name,mime){return original(addRPEToCSV(text,s),name,mime)};
      try{return baseExport(s)}finally{downloadText=original}
    };
  }

  function markVersion(){
    document.querySelector('.beta')?.replaceChildren(document.createTextNode('BETA 0.8.4'));
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.4 · RPE allenamento + coordinate LIVE'});
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{injectRPE();markVersion()},350));
  setTimeout(()=>{injectRPE();markVersion()},900);
})();
