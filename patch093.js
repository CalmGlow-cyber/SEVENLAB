// SevenLab 0.9.3 — iPad-safe Undo input. No event/stat/field logic changes.
(function(){
  function ensureStyle093(){
    if(document.getElementById('style093'))return;
    const s=document.createElement('style');s.id='style093';s.textContent=`
      @media (min-width:768px){
        body.sl091-live #live.active #undoBtn{
          z-index:96!important;
          bottom:calc(88px + env(safe-area-inset-bottom))!important;
          min-height:50px!important;
          pointer-events:auto!important;
          touch-action:manipulation!important;
          -webkit-tap-highlight-color:rgba(126,239,174,.12)!important;
        }
      }
    `;document.head.appendChild(s);
  }

  function installUndo093(){
    ensureStyle093();
    const b=document.getElementById('undoBtn');if(!b||b.dataset.undo093)return;
    b.dataset.undo093='1';
    b.style.pointerEvents='auto';
    b.style.touchAction='manipulation';

    // Safari/iPad fallback: a real touch on Undo is converted into the same
    // click path already used by Training/Game. This preserves all existing
    // handlers (Game score rollback, save/shot linking and penalty composite undo).
    b.addEventListener('touchend',function(e){
      if(e.changedTouches&&e.changedTouches.length!==1)return;
      e.preventDefault();
      e.stopPropagation();
      if(b.disabled)return;
      requestAnimationFrame(()=>b.click());
    },{passive:false});
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(installUndo093,500));
  window.addEventListener('orientationchange',()=>setTimeout(installUndo093,120));
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="live"],[data-go="game"]'))setTimeout(installUndo093,40)},true);
  setTimeout(installUndo093,900);
  setTimeout(installUndo093,1800);
})();