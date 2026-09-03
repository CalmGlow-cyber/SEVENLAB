// SevenLab 0.9 — wide-screen Live/Game workspace for iPad and desktop.
// Goal: use the full horizontal viewport and keep more players visible at once.
(function(){
  function ensureWideStyles090(){
    if(document.getElementById('style090'))return;
    const s=document.createElement('style');s.id='style090';s.textContent=`
      /* Wide mode is enabled only while Live/Game is active. Other screens keep their normal width. */
      main.wrap.liveWide090{max-width:none!important;width:100%!important;margin:0!important;padding-left:12px!important;padding-right:12px!important}
      main.wrap.liveWide090 #live{width:100%;max-width:none!important}
      main.wrap.liveWide090 #livePlayers{width:100%}

      @media (min-width:768px){
        main.wrap.liveWide090{padding-left:14px!important;padding-right:14px!important}
        main.wrap.liveWide090 .liveTeamsGrid080{width:100%;max-width:none!important;gap:12px!important}
        main.wrap.liveWide090 #live.live080:not(.game080) .liveTeamsGrid080{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
        main.wrap.liveWide090 #live.live080:not(.game080) .teamLiveList080{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
        main.wrap.liveWide090 #live.live080.game080 .liveTeamsGrid080{grid-template-columns:1fr!important}
        main.wrap.liveWide090 #live.live080.game080 .teamLiveList080{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important}
        main.wrap.liveWide090 .liveplayer{min-width:0!important;margin-bottom:0!important;padding:9px!important}
        main.wrap.liveWide090 .liveplayer-top{gap:6px;margin-bottom:6px!important}
        main.wrap.liveWide090 .liveplayer-top .name{font-size:15px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        main.wrap.liveWide090 .liveplayer-top .meta{font-size:10px!important}
        main.wrap.liveWide090 .countergrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
        main.wrap.liveWide090 .counter{min-width:0!important;min-height:50px!important;padding:6px 2px!important}
        main.wrap.liveWide090 .counter b{font-size:13px!important;white-space:nowrap}
        main.wrap.liveWide090 .counter small{font-size:9px!important;line-height:1.05}
        main.wrap.liveWide090 .microstats{font-size:9px!important;line-height:1.25;margin-top:6px!important;padding-top:5px!important}
      }

      @media (min-width:1180px){
        main.wrap.liveWide090{padding-left:18px!important;padding-right:18px!important}
        main.wrap.liveWide090 #live.live080:not(.game080) .teamLiveList080{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important}
        main.wrap.liveWide090 #live.live080.game080 .teamLiveList080{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}
        main.wrap.liveWide090 .liveplayer{padding:10px!important}
        main.wrap.liveWide090 .liveplayer-top .name{font-size:16px!important}
        main.wrap.liveWide090 .counter{min-height:52px!important}
        main.wrap.liveWide090 .counter b{font-size:14px!important}
        main.wrap.liveWide090 .microstats{font-size:10px!important}
      }

      @media (min-width:1680px){
        main.wrap.liveWide090 #live.live080:not(.game080) .teamLiveList080{grid-template-columns:repeat(4,minmax(0,1fr))!important}
        main.wrap.liveWide090 #live.live080.game080 .teamLiveList080{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      }
    `;document.head.appendChild(s);
  }

  function applyWide090(){
    const wrap=document.querySelector('main.wrap'),live=document.getElementById('live');
    if(!wrap||!live)return;
    wrap.classList.toggle('liveWide090',live.classList.contains('active'));
  }

  // Keep the wide workspace in sync with navigation and every Live re-render.
  const goBefore090=go;
  go=function(id){const r=goBefore090.apply(this,arguments);requestAnimationFrame(applyWide090);return r};
  const renderBefore090=renderLive;
  renderLive=function(){const r=renderBefore090.apply(this,arguments);ensureWideStyles090();requestAnimationFrame(applyWide090);return r};

  function markVersion090(){
    const beta=document.querySelector('.beta');if(beta)beta.textContent='BETA 0.9';
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\./.test(e.textContent||''))e.textContent='Beta 0.9 · Live/Game wide screen iPad + desktop'});
  }

  ensureWideStyles090();
  window.addEventListener('resize',applyWide090);
  window.addEventListener('orientationchange',()=>setTimeout(applyWide090,120));
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{markVersion090();applyWide090()},450));
  setTimeout(()=>{markVersion090();applyWide090()},1000);
  setTimeout(()=>{markVersion090();applyWide090()},1800);
})();
