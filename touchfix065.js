// SevenLab 0.6.5 touch fix — make the whole Avvia Game button reliably tappable on Safari/iPad/iPhone.
(function(){
  function install(){
    const b=document.getElementById('startGame');if(!b||b.dataset.touchfix065)return;
    b.dataset.touchfix065='1';
    b.style.position='relative';b.style.zIndex='5';b.style.width='100%';b.style.minHeight='52px';b.style.touchAction='manipulation';b.style.pointerEvents='auto';
    // Rebind through a clean listener so the complete button rectangle is the hit target.
    b.addEventListener('pointerup',function(e){
      if(e.pointerType==='mouse')return;
      e.preventDefault();
      // Preserve the 0.6.1 team-name guard before starting.
      const n=String(window.SevenLabTeam?.name||'').trim();
      if(!n){toast('Prima imposta il nome squadra in Impostazioni');go('impostazioni');return}
      if(typeof b.onclick==='function')b.onclick.call(b,e);
    },{passive:false});
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="game"]'))setTimeout(install,50)});
  setTimeout(install,900);
})();