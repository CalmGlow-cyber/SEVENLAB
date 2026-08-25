// SevenLab 0.6.5 touch fix + 0.7 incremental loader.
(function(){
  function install(){
    const b=document.getElementById('startGame');if(!b||b.dataset.touchfix065)return;
    b.dataset.touchfix065='1';
    b.style.position='relative';b.style.zIndex='5';b.style.width='100%';b.style.minHeight='52px';b.style.touchAction='manipulation';b.style.pointerEvents='auto';
    b.addEventListener('pointerup',function(e){
      if(e.pointerType==='mouse')return;
      e.preventDefault();
      const n=String(window.SevenLabTeam?.name||'').trim();
      if(!n){toast('Prima imposta il nome squadra in Impostazioni');go('impostazioni');return}
      if(typeof b.onclick==='function')b.onclick.call(b,e);
    },{passive:false});
  }
  function load070(){
    if(window.SevenLab070||document.querySelector('script[data-sevenlab070]'))return;
    const s=document.createElement('script');s.src='patch070.js?v=700';s.dataset.sevenlab070='1';
    s.onload=()=>{
      const beta=document.querySelector('.top .beta');if(beta)beta.textContent='BETA 0.7';
      document.querySelectorAll('#impostazioni .settingsvalue').forEach(x=>{if(/Beta 0\.6\.5/i.test(x.textContent||''))x.textContent='Beta 0.7 · Cards + Set Pieces'});
    };
    s.onerror=()=>console.error('SevenLab 0.7 module load failed');document.body.appendChild(s);
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{install();load070()},500));
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="game"]'))setTimeout(install,50)});
  setTimeout(()=>{install();load070()},900);
})();