// SevenLab 0.8.7 — safe Stop confirmation for Training Live and Game.
(function(){
  let allowStop087=false;

  function isGame087(){try{return C()?.tipo==='partita'}catch(e){return false}}
  function ensureStopModal087(){
    if(document.getElementById('stopConfirm087'))return;
    const m=document.createElement('div');m.id='stopConfirm087';m.className='modal';
    m.innerHTML=`<div class="sheet" style="max-width:520px;margin:auto">
      <div class="teamhead"><h3 id="stopConfirmTitle087">Conferma chiusura</h3><button class="btn small ghost" id="stopCancelTop087">Annulla</button></div>
      <div id="stopConfirmText087" class="sub" style="margin-top:10px;line-height:1.5"></div>
      <div style="min-height:24vh"></div>
      <button id="stopFinal087" class="btn danger full" style="min-height:58px;font-size:16px">■ CONFERMA CHIUSURA</button>
      <button id="stopCancel087" class="btn ghost full" style="margin-top:10px;min-height:48px">Continua la rilevazione</button>
    </div>`;
    document.body.appendChild(m);
    const close=()=>m.classList.remove('show');
    document.getElementById('stopCancel087').onclick=close;
    document.getElementById('stopCancelTop087').onclick=close;
    document.getElementById('stopFinal087').onclick=()=>{
      const btn=document.getElementById('stopBtn');
      close();allowStop087=true;
      try{btn?.click()}finally{allowStop087=false}
    };
  }
  function openStopConfirm087(){
    const c=C?.();if(!c?.id){try{toast('Nessuna sessione attiva')}catch(e){};return}
    ensureStopModal087();
    const game=isGame087();
    document.getElementById('stopConfirmTitle087').textContent=game?'Chiudere definitivamente la partita?':'Chiudere definitivamente l’allenamento?';
    document.getElementById('stopConfirmText087').innerHTML=game
      ?'La partita verrà salvata nello storico e la rilevazione Live verrà chiusa. Usa il pulsante rosso in fondo allo schermo solo se vuoi davvero terminare il Game.'
      :'L’allenamento verrà salvato nello storico e la rilevazione Live verrà chiusa. Usa il pulsante rosso in fondo allo schermo solo se vuoi davvero terminare la sessione.';
    document.getElementById('stopFinal087').textContent=game?'■ CONFERMA FINE PARTITA':'■ CONFERMA FINE ALLENAMENTO';
    document.getElementById('stopConfirm087').classList.add('show');
  }

  // Capture phase blocks every existing Stop handler until the second, spatially-separated confirmation is pressed.
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#stopBtn');if(!b||allowStop087)return;
    e.preventDefault();e.stopImmediatePropagation();openStopConfirm087();
  },true);

  function markVersion087(){
    const beta=document.querySelector('.beta');if(beta)beta.textContent='BETA 0.8.7';
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.7 · Stop protetto + Game mapping'});
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ensureStopModal087();markVersion087()},400));
  setTimeout(()=>{ensureStopModal087();markVersion087()},1000);
})();