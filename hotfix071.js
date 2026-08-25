// SevenLab 0.7.1 HOTFIX — recover active Live/Game session before Stop / set-piece actions.
(function(){
  const FAST_KEY='sevenlab_current_fast_v062';

  function restoreActive(){
    try{
      if(C()?.id)return true;
      const fast=JSON.parse(localStorage.getItem(FAST_KEY)||'null');
      if(fast?.id){
        DB.current=fast;
        return true;
      }
    }catch(e){console.error('SevenLab active-session restore',e)}
    return !!C()?.id;
  }

  // Run before the existing button handlers. This leaves the stable 0.7 logic untouched.
  document.addEventListener('pointerdown',function(e){
    const target=e.target.closest?.('#stopBtn,#pauseBtn,#playBtn,[data-sp]');
    if(!target)return;
    restoreActive();
  },true);

  document.addEventListener('click',function(e){
    const target=e.target.closest?.('#stopBtn,[data-sp]');
    if(!target)return;
    restoreActive();
  },true);

  // Extra Stop safeguard: if the old handler still sees no session because another layer reset
  // DB.current between pointerdown and click, restore once more before it executes.
  const stop=document.getElementById('stopBtn');
  if(stop&&!stop.dataset.sessionfix071){
    stop.dataset.sessionfix071='1';
    stop.addEventListener('click',function(){restoreActive()},true);
  }

  window.SevenLab071Hotfix={restoreActive};
})();