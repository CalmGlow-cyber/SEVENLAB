// SevenLab 0.9 UI refinement — faster, clearer input ergonomics without changing event logic.
(function(){
  function ensureStyles091(){
    if(document.getElementById('style091'))return;
    const s=document.createElement('style');s.id='style091';s.textContent=`
      /* Acquisition workspace: use width, reduce dead space, keep touch targets readable. */
      body.sl091-live main.wrap{max-width:none!important;width:100%!important;margin:0!important;padding-left:12px!important;padding-right:12px!important}
      body.sl091-live #live.active{width:100%;max-width:none!important;padding-bottom:92px}
      body.sl091-live #live.active>.card:first-child{padding:10px 12px!important;margin-bottom:8px!important;border-radius:15px!important}
      body.sl091-live #live.active>.card:first-child .sub.mt8{font-size:10px!important;line-height:1.2!important;margin:4px 0 6px!important;opacity:.76}
      body.sl091-live #live.active .controls{margin-top:6px!important;gap:6px!important}
      body.sl091-live #live.active .controls .btn{min-height:42px!important;padding:8px 10px!important}
      body.sl091-live #live.active #subBtn{min-height:40px!important}
      body.sl091-live #live.active .setpiecebar070{margin-top:6px!important;gap:6px!important}
      body.sl091-live #live.active .teamLiveCol080{padding:6px!important;border-radius:13px!important}
      body.sl091-live #live.active .teamLiveTitle080{padding:6px 8px!important;margin-bottom:6px!important;border-radius:9px!important;font-size:11px!important}
      body.sl091-live #live.active .teamLiveList080{gap:8px!important}
      body.sl091-live #live.active .liveplayer{min-width:0!important;padding:8px!important;margin:0!important;border-radius:14px!important;background:linear-gradient(180deg,#0d1b15,#09140f)!important;box-shadow:0 5px 14px rgba(0,0,0,.18)}
      body.sl091-live #live.active .liveplayer.keeper091{border-color:rgba(76,151,255,.34)!important}
      body.sl091-live #live.active .liveplayer-top{gap:6px!important;margin-bottom:6px!important}
      body.sl091-live #live.active .liveplayer-top .name{font-size:15px!important;line-height:1.05!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      body.sl091-live #live.active .liveplayer-top .meta{font-size:9px!important;line-height:1.15!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      body.sl091-live #live.active .liveplayer-top .role{font-size:9px!important;padding:3px 6px!important;white-space:nowrap}
      body.sl091-live #live.active .countergrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
      body.sl091-live #live.active .counter{position:relative;min-width:0!important;min-height:54px!important;padding:6px 3px!important;border-radius:10px!important;transition:transform .08s ease,filter .08s ease,border-color .08s ease,box-shadow .08s ease}
      body.sl091-live #live.active .counter:active{transform:scale(.965);filter:brightness(1.18)}
      body.sl091-live #live.active .counter b{font-size:14px!important;line-height:1.05!important;white-space:nowrap}
      body.sl091-live #live.active .counter small{font-size:9px!important;line-height:1.05!important;margin-top:3px!important;white-space:normal}
      body.sl091-live #live.active .microstats{font-size:9px!important;line-height:1.15!important;margin-top:5px!important;padding-top:5px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.76}

      /* Semantic accents: recognition by position + color, with no change to handlers. */
      body.sl091-live #live.active [data-ev$="|goal"]{border-color:rgba(54,215,126,.58)!important;box-shadow:inset 0 3px 0 rgba(54,215,126,.72)}
      body.sl091-live #live.active [data-ev$="|shot"]{border-color:rgba(232,177,72,.48)!important;box-shadow:inset 0 3px 0 rgba(232,177,72,.66)}
      body.sl091-live #live.active [data-ev$="|save"],body.sl091-live #live.active [data-ev$="|recover"]{border-color:rgba(70,145,255,.52)!important;box-shadow:inset 0 3px 0 rgba(70,145,255,.70)}
      body.sl091-live #live.active [data-ev$="|lost"]{border-color:rgba(239,91,91,.54)!important;box-shadow:inset 0 3px 0 rgba(239,91,91,.72)}
      body.sl091-live #live.active [data-ev$="|pass"]{border-color:rgba(70,188,171,.42)!important;box-shadow:inset 0 3px 0 rgba(70,188,171,.58)}
      body.sl091-live #live.active [data-ev$="|dribble"]{border-color:rgba(159,117,232,.45)!important;box-shadow:inset 0 3px 0 rgba(159,117,232,.60)}
      body.sl091-live #live.active [data-shot-against086]{border-color:rgba(232,177,72,.52)!important;box-shadow:inset 0 3px 0 rgba(232,177,72,.70)}
      body.sl091-live #live.active [data-goal-against088],body.sl091-live #live.active [data-goal-against089],body.sl091-live #live.active .gameAgainst{border-color:rgba(239,91,91,.60)!important;box-shadow:inset 0 3px 0 rgba(239,91,91,.76)}
      body.sl091-live #live.active [data-ev$="|pass"] small:after,body.sl091-live #live.active [data-ev$="|dribble"] small:after{content:" · 1×✓ 2×✕";opacity:.58;font-size:8px}

      /* Undo always reachable on tablet/desktop, without occupying a whole horizontal row. */
      @media (min-width:768px){
        body.sl091-live #live.active #undoBtn{position:fixed!important;right:14px!important;bottom:calc(66px + env(safe-area-inset-bottom))!important;left:auto!important;width:auto!important;max-width:310px!important;min-width:205px!important;z-index:76!important;padding:9px 12px!important;border-radius:12px!important;box-shadow:0 8px 24px rgba(0,0,0,.36)!important;background:#10251bfa!important}
        body.sl091-live #live.active .liveTeamsGrid080{width:100%!important;max-width:none!important;gap:10px!important}
        body.sl091-live #live.active:not(.game080) .liveTeamsGrid080{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
        body.sl091-live #live.active:not(.game080) .teamLiveList080{grid-template-columns:repeat(auto-fit,minmax(225px,1fr))!important}
        body.sl091-live #live.active.game080 .liveTeamsGrid080{grid-template-columns:1fr!important}
        body.sl091-live #live.active.game080 .teamLiveList080{grid-template-columns:repeat(auto-fit,minmax(275px,1fr))!important}
      }
      @media (min-width:1180px){
        body.sl091-live main.wrap{padding-left:16px!important;padding-right:16px!important}
        body.sl091-live #live.active:not(.game080) .teamLiveList080{grid-template-columns:repeat(auto-fit,minmax(225px,1fr))!important}
        body.sl091-live #live.active.game080 .teamLiveList080{grid-template-columns:repeat(auto-fit,minmax(285px,1fr))!important}
      }

      /* Presence screen: wider, more scannable, easy to correct manually. */
      body.sl091-presence main.wrap{max-width:1120px!important;width:100%!important}
      #presenceCount091{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:7px 0 9px;padding:8px 10px;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:#0a1711;font-size:12px;color:#a8bdb1}
      #presenceCount091 b{color:#eaf7ef;font-size:13px}
      #presenceList.presence091{gap:7px!important}
      #presenceList.presence091 label{min-height:52px!important;margin:0!important;border-radius:11px!important;padding:8px 9px!important;transition:border-color .12s ease,background .12s ease,transform .08s ease}
      #presenceList.presence091 label:active{transform:scale(.985)}
      #presenceList.presence091 label.selected091{background:#10291d!important;border-color:rgba(56,210,125,.56)!important;box-shadow:inset 3px 0 0 rgba(56,210,125,.75)}
      #presenceList.presence091 input{width:22px!important;height:22px!important;flex:0 0 22px}
      @media (min-width:768px){#presenceList.presence091{grid-template-columns:repeat(auto-fit,minmax(175px,1fr))!important}}

      /* Keep phone ergonomics conservative. */
      @media (max-width:767px){
        body.sl091-live #live.active .liveplayer{padding:9px!important}
        body.sl091-live #live.active .counter{min-height:56px!important}
        body.sl091-live #live.active #undoBtn{position:sticky!important;width:100%!important}
      }
    `;document.head.appendChild(s);
  }

  function applyMode091(){
    document.body.classList.toggle('sl091-live',!!document.getElementById('live')?.classList.contains('active'));
    document.body.classList.toggle('sl091-presence',!!document.getElementById('allenamento')?.classList.contains('active'));
  }

  function compactHelp091(){
    const h=document.querySelector('#live>.card:first-child .sub.mt8');
    if(!h||h.dataset.compact091)return;
    h.dataset.compact091='1';
    h.textContent='⚡ Gol → scegli assist · Passaggio e Dribbling: 1 tap = riuscito, 2 tap = non riuscito.';
  }

  function decorateLive091(){
    document.querySelectorAll('#livePlayers .liveplayer').forEach(card=>{
      const keeper=!!card.querySelector('[data-ev$="|save"]');
      card.classList.toggle('keeper091',keeper);card.classList.toggle('field091',!keeper);
      const name=card.querySelector('.liveplayer-top .name')?.textContent?.trim()||'Giocatore';
      card.querySelectorAll('.counter').forEach(btn=>{
        btn.classList.add('action091');
        const label=btn.querySelector('small')?.textContent?.replace(/\s*·\s*1×.*$/,'')?.trim()||'Evento';
        if(!btn.getAttribute('aria-label'))btn.setAttribute('aria-label',`${label} · ${name}`);
      });
    });
  }

  function updatePresence091(){
    const list=document.getElementById('presenceList');if(!list)return;
    list.classList.add('presence091');
    const boxes=[...list.querySelectorAll('input[type="checkbox"]')];
    boxes.forEach(x=>x.closest('label')?.classList.toggle('selected091',x.checked));
    let info=document.getElementById('presenceCount091');
    if(!info){info=document.createElement('div');info.id='presenceCount091';list.parentNode?.insertBefore(info,list)}
    const selected=boxes.filter(x=>x.checked).length;
    info.innerHTML=`<span>Disponibili in rosa: ${boxes.length}</span><b>Presenti selezionati: ${selected}</b>`;
  }

  function bind091(){
    ensureStyles091();compactHelp091();decorateLive091();updatePresence091();applyMode091();
    const lp=document.getElementById('livePlayers');
    if(lp&&!lp.dataset.obs091){lp.dataset.obs091='1';new MutationObserver(()=>requestAnimationFrame(decorateLive091)).observe(lp,{childList:true,subtree:true})}
    const pl=document.getElementById('presenceList');
    if(pl&&!pl.dataset.obs091){pl.dataset.obs091='1';new MutationObserver(()=>requestAnimationFrame(updatePresence091)).observe(pl,{childList:true,subtree:true})}
  }

  document.addEventListener('change',e=>{if(e.target.closest?.('#presenceList'))updatePresence091()});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-go]'))setTimeout(()=>{applyMode091();updatePresence091();decorateLive091()},20)},true);
  window.addEventListener('resize',applyMode091);
  window.addEventListener('orientationchange',()=>setTimeout(()=>{applyMode091();decorateLive091()},120));
  window.addEventListener('DOMContentLoaded',()=>setTimeout(bind091,700));
  setTimeout(bind091,1200);
  setTimeout(bind091,2200);
})();
