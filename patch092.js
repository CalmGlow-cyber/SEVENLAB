// SevenLab 0.9 layout refinement — desktop/iPad-only formation visibility and Game setup workspace.
(function(){
  const WIDE='(min-width:768px)';

  function isWide092(){return window.matchMedia(WIDE).matches}
  function isGame092(c=C?.()){return c?.tipo==='partita'}

  function ensureStyles092(){
    if(document.getElementById('style092'))return;
    const s=document.createElement('style');s.id='style092';s.textContent=`
      /* ---------- LIVE: formation snapshots below the player acquisition area ---------- */
      #liveFormations092{display:none;margin-top:12px;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}
      #liveFormations092 .lfCard092{background:linear-gradient(180deg,#102019,#0b1712);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:10px;min-width:0}
      #liveFormations092 .lfHead092{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      #liveFormations092 .lfTitle092{font-size:13px;font-weight:900;letter-spacing:.03em}
      #liveFormations092 .lfModule092{font-size:10px;color:#a7bcb1;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);white-space:nowrap}
      #liveFormations092 .liveFormationPitch092{position:relative;aspect-ratio:1.55/1;background:linear-gradient(90deg,#1d693c,#267846 50%,#1d693c);border:2px solid rgba(240,255,246,.88);border-radius:13px;overflow:hidden}
      #liveFormations092 .liveFormationPitch092:before{content:'';position:absolute;left:50%;top:0;bottom:0;border-left:2px solid rgba(255,255,255,.65)}
      #liveFormations092 .liveFormationPitch092:after{content:'';position:absolute;left:50%;top:50%;width:18%;aspect-ratio:1;border:2px solid rgba(255,255,255,.58);border-radius:50%;transform:translate(-50%,-50%)}
      #liveFormations092 .lfBox092{position:absolute;top:23%;width:18%;height:54%;border:2px solid rgba(255,255,255,.45);pointer-events:none}
      #liveFormations092 .lfBox092.left{left:-2px;border-left:0}
      #liveFormations092 .lfBox092.right{right:-2px;border-right:0}
      #liveFormations092 .formationSlot092{position:absolute;transform:translate(-50%,-50%);width:min(84px,18%);min-height:40px;padding:4px 5px;border-radius:10px;background:#07160eea;border:1px solid rgba(255,255,255,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:10px;font-weight:850;line-height:1.05;color:#fff;z-index:3;box-shadow:0 3px 10px rgba(0,0,0,.28)}
      #liveFormations092 .formationSlot092 small{display:block;margin-top:2px;font-size:8px;color:#a8c7b6;font-weight:700}
      #liveFormations092 .formationSlot092.empty092{opacity:.45;border-style:dashed}
      #liveFormations092 .formationSlot092.out092{border-color:#ffd36a}
      @media (min-width:768px){body.sl092-live #liveFormations092:not([hidden]){display:grid}}
      @media (min-width:1180px){#liveFormations092{gap:16px}#liveFormations092 .lfCard092{padding:12px}#liveFormations092 .formationSlot092{font-size:11px;min-height:43px}}
      @media (max-width:767px){#liveFormations092{display:none!important}}

      /* ---------- GAME SETUP: full-width two-column workspace ---------- */
      @media (min-width:768px){
        body.sl092-gameSetup main.wrap{max-width:none!important;width:100%!important;margin:0!important;padding-left:14px!important;padding-right:14px!important}
        body.sl092-gameSetup #game.active{display:grid!important;grid-template-columns:minmax(360px,.95fr) minmax(360px,1.05fr);grid-template-rows:auto auto auto;gap:12px 14px;align-items:start;width:100%;max-width:none}
        body.sl092-gameSetup #game.active>.card{margin-bottom:0!important}
        body.sl092-gameSetup #game.active>.card:nth-of-type(1){grid-column:1;grid-row:1}
        body.sl092-gameSetup #game.active>.card:nth-of-type(2){grid-column:1;grid-row:2}
        body.sl092-gameSetup #game.active>.card:nth-of-type(3){grid-column:2;grid-row:1 / span 3;position:sticky;top:calc(64px + env(safe-area-inset-top));align-self:start;padding:12px!important;z-index:8}
        body.sl092-gameSetup #game.active>#startGame{grid-column:1;grid-row:3;margin:0!important;min-height:50px}
        body.sl092-gameSetup #gamePresence{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))!important;gap:7px!important}
        body.sl092-gameSetup #gamePresence label{min-height:50px!important;padding:8px 10px!important;margin:0!important;border-radius:11px!important}
        body.sl092-gameSetup #gamePresence input{width:22px!important;height:22px!important;flex:0 0 22px}
        body.sl092-gameSetup #gameModules{flex-wrap:wrap;overflow:visible}
        body.sl092-gameSetup #gamePitch.vertical092{width:min(100%,50vh,620px)!important;aspect-ratio:30/50!important;height:auto!important;margin:4px auto 0!important;background:linear-gradient(180deg,#236f42,#2d804a 50%,#236f42)!important;border-width:2px!important;border-radius:15px!important;overflow:hidden!important}
        body.sl092-gameSetup #gamePitch.vertical092:before{left:0!important;right:0!important;top:50%!important;bottom:auto!important;height:0!important;border-left:0!important;border-top:2px solid rgba(255,255,255,.68)!important}
        body.sl092-gameSetup #gamePitch.vertical092:after{left:50%!important;top:50%!important;width:24%!important;aspect-ratio:1!important;border:2px solid rgba(255,255,255,.68)!important;border-radius:50%!important;transform:translate(-50%,-50%)!important}
        body.sl092-gameSetup #gamePitch.vertical092 .slot{width:76px!important;min-height:46px!important;font-size:10px!important;border-radius:11px!important;padding:4px!important;z-index:5}
        body.sl092-gameSetup #gamePitch .fieldMark092{position:absolute;pointer-events:none;z-index:1}
        body.sl092-gameSetup #gamePitch .fieldMark092.penaltyTop{left:20%;right:20%;top:-2px;height:17%;border:2px solid rgba(255,255,255,.5);border-top:0}
        body.sl092-gameSetup #gamePitch .fieldMark092.goalTop{left:37%;right:37%;top:-2px;height:7%;border:2px solid rgba(255,255,255,.58);border-top:0}
        body.sl092-gameSetup #gamePitch .fieldMark092.penaltyBottom{left:20%;right:20%;bottom:-2px;height:17%;border:2px solid rgba(255,255,255,.5);border-bottom:0}
        body.sl092-gameSetup #gamePitch .fieldMark092.goalBottom{left:37%;right:37%;bottom:-2px;height:7%;border:2px solid rgba(255,255,255,.58);border-bottom:0}
        body.sl092-gameSetup #gamePitch .attackLabel092{position:absolute;top:9px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:900;letter-spacing:.08em;color:#d9eee2;background:rgba(4,20,12,.62);border:1px solid rgba(255,255,255,.1);padding:4px 7px;border-radius:999px;z-index:2;pointer-events:none}
      }
      @media (min-width:1100px){
        body.sl092-gameSetup #game.active{grid-template-columns:minmax(430px,.9fr) minmax(480px,1.1fr);gap:14px 18px}
        body.sl092-gameSetup #gamePresence{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
      @media (max-width:767px){
        body.sl092-gameSetup #game.active{display:block!important}
        #gamePitch.vertical092{aspect-ratio:1.34/1!important}
      }
    `;document.head.appendChild(s);
  }

  function playerName092(pid){return DB.roster.find(p=>String(p.id)===String(pid))?.name||''}
  function module092(c,t){return c?.teamModules?.[t]||c?.module||Object.keys(F[c?.size]||{})[0]||''}

  function formationPitchHTML092(c,t){
    const mod=module092(c,t),shape=F[c.size]?.[mod]||[],team=c.teams?.[t]||{};
    const slots=shape.map(([k,r,x,y])=>{
      const a=team[k],name=a?.pid?playerName092(a.pid):'';
      const cls=`formationSlot092${name?'':' empty092'}${a?.outRole?' out092':''}`;
      return `<div class="${cls}" style="left:${x}%;top:${y}%">${name?esc(name):`+ ${esc(k)}`}<small>${esc(k)} · ${esc(r)}${a?.outRole?' · fuori ruolo':''}</small></div>`;
    }).join('');
    return `<div class="liveFormationPitch092"><div class="lfBox092 left"></div><div class="lfBox092 right"></div>${slots}</div>`;
  }

  function renderLiveFormations092(){
    const live=document.getElementById('live'),root=document.getElementById('livePlayers');if(!live||!root)return;
    let panel=document.getElementById('liveFormations092');
    if(!panel){panel=document.createElement('div');panel.id='liveFormations092';root.insertAdjacentElement('afterend',panel)}
    const c=C?.();
    if(!c?.id||isGame092(c)){panel.hidden=true;panel.innerHTML='';return}
    panel.hidden=false;
    panel.innerHTML=['A','B'].map(t=>`<section class="lfCard092"><div class="lfHead092"><div class="lfTitle092">Squadra ${t} · formazione</div><div class="lfModule092">${esc(module092(c,t))}</div></div>${formationPitchHTML092(c,t)}</section>`).join('');
  }

  function ensureGameFieldMarks092(pitch){
    if(!pitch||pitch.querySelector('.fieldMark092'))return;
    ['penaltyTop','goalTop','penaltyBottom','goalBottom'].forEach(cls=>{const d=document.createElement('div');d.className=`fieldMark092 ${cls}`;pitch.appendChild(d)});
    const a=document.createElement('div');a.className='attackLabel092';a.textContent='ATTACCO ↑';pitch.appendChild(a);
  }

  function orientGamePitch092(){
    const pitch=document.getElementById('gamePitch');if(!pitch)return;
    const wide=isWide092();pitch.classList.toggle('vertical092',wide);
    [...pitch.querySelectorAll('.slot')].forEach(slot=>{
      if(wide){
        if(slot.dataset.vertical092==='1')return;
        const left=parseFloat(slot.style.left),top=parseFloat(slot.style.top);if(!Number.isFinite(left)||!Number.isFinite(top))return;
        slot.dataset.origLeft092=String(left);slot.dataset.origTop092=String(top);slot.dataset.vertical092='1';
        slot.style.left=`${top}%`;slot.style.top=`${100-left}%`;
      }else if(slot.dataset.vertical092==='1'){
        slot.style.left=`${slot.dataset.origLeft092}%`;slot.style.top=`${slot.dataset.origTop092}%`;
        delete slot.dataset.vertical092;delete slot.dataset.origLeft092;delete slot.dataset.origTop092;
      }
    });
    if(wide)ensureGameFieldMarks092(pitch);else pitch.querySelectorAll('.fieldMark092,.attackLabel092').forEach(x=>x.remove());
  }

  function applyMode092(){
    const liveActive=!!document.getElementById('live')?.classList.contains('active');
    const gameActive=!!document.getElementById('game')?.classList.contains('active');
    document.body.classList.toggle('sl092-live',liveActive);
    document.body.classList.toggle('sl092-gameSetup',gameActive);
    if(liveActive)renderLiveFormations092();
    if(gameActive)requestAnimationFrame(orientGamePitch092);
  }

  function bindGameObserver092(){
    const pitch=document.getElementById('gamePitch');if(!pitch||pitch.dataset.obs092)return;
    pitch.dataset.obs092='1';
    new MutationObserver(()=>requestAnimationFrame(orientGamePitch092)).observe(pitch,{childList:true});
  }

  const renderBefore092=renderLive;
  renderLive=function(){const r=renderBefore092.apply(this,arguments);try{renderLiveFormations092()}catch(e){}return r};

  ensureStyles092();
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-go],#gameModules,#pickerChoices'))setTimeout(()=>{applyMode092();bindGameObserver092();orientGamePitch092()},35)},true);
  window.addEventListener('resize',()=>{applyMode092();orientGamePitch092()});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{applyMode092();orientGamePitch092()},140));
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{bindGameObserver092();applyMode092();orientGamePitch092();renderLiveFormations092()},750));
  setTimeout(()=>{bindGameObserver092();applyMode092();orientGamePitch092();renderLiveFormations092()},1250);
  setTimeout(()=>{bindGameObserver092();applyMode092();orientGamePitch092();renderLiveFormations092()},2200);
})();
