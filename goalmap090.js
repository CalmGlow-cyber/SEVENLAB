// SevenLab 0.9 — UI-only polish for the Game goal-origin popup.
// Keeps patch086 event/coordinate logic intact and replaces only the visible pitch.
(function(){
  function ensureStyles090(){
    if(document.getElementById('goalMapPrettyStyle090'))return;
    const s=document.createElement('style');s.id='goalMapPrettyStyle090';s.textContent=`
      #goalMapModal086.gmPretty090{align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(2,10,7,.78)!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      #goalMapModal086.gmPretty090 .sheet{position:relative;width:min(92vw,820px)!important;max-width:820px!important;max-height:94vh!important;margin:auto!important;padding:18px!important;border-radius:24px!important;border:1px solid rgba(118,190,151,.28)!important;background:linear-gradient(180deg,#10231a,#091711)!important;box-shadow:0 26px 70px rgba(0,0,0,.48)!important;overflow:auto!important}
      #goalMapModal086.gmPretty090 .teamhead{align-items:center!important;margin-bottom:4px}
      #goalMapModal086.gmPretty090 .teamhead h3{font-size:clamp(20px,2.5vw,29px)!important;line-height:1.08!important;margin:0!important}
      #goalMapModal086.gmPretty090 #goalMapCancel086{min-height:44px!important;padding:9px 14px!important;border-radius:14px!important;white-space:nowrap}
      #goalMapModal086.gmPretty090 #goalMapInstruction086{font-size:clamp(14px,1.7vw,18px)!important;margin:10px 0 14px!important;color:#b9cbc2!important}

      /* Keep the original patch086 pitch measurable for its proven coordinate logic, but invisible/off-canvas. */
      #goalMapModal086.gmPretty090 #goalMapPitch086{position:absolute!important;left:-10000px!important;top:0!important;width:400px!important;height:300px!important;aspect-ratio:auto!important;opacity:0!important;pointer-events:none!important;margin:0!important}
      #goalMapModal086.gmPretty090 #goalMapLegend086{display:none!important}

      .gmPrettyWrap090{width:min(100%,680px);margin:0 auto}
      .gmPrettyTop090,.gmPrettyBottom090{display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;font-weight:850;letter-spacing:.03em}
      .gmPrettyTop090{color:#ff6666;margin:0 0 7px}
      .gmPrettyBottom090{color:#b7c9bf;margin:7px 0 0}
      .gmPrettyDot090{width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 12px currentColor}

      #goalMapPretty090{position:relative;width:100%;aspect-ratio:30/25;max-height:66vh;background:
        linear-gradient(180deg,rgba(255,255,255,.025),rgba(0,0,0,.035)),
        repeating-linear-gradient(90deg,#11683d 0,#11683d 12.5%,#0f6038 12.5%,#0f6038 25%);
        border:3px solid rgba(245,255,249,.92);border-radius:16px;overflow:visible;touch-action:manipulation;cursor:crosshair;box-shadow:inset 0 0 34px rgba(0,0,0,.12),0 10px 28px rgba(0,0,0,.20)}
      #goalMapPretty090:after{content:'';position:absolute;left:0;right:0;bottom:0;border-bottom:2px solid rgba(255,255,255,.88);pointer-events:none}
      #goalMapPretty090 .gpPenalty090{position:absolute;left:16.67%;top:-2px;width:66.66%;height:40%;border:2px solid rgba(255,255,255,.82);border-top:0;pointer-events:none}
      #goalMapPretty090 .gpGoalArea090{position:absolute;left:33.33%;top:-2px;width:33.34%;height:17%;border:2px solid rgba(255,255,255,.84);border-top:0;pointer-events:none}
      #goalMapPretty090 .gpGoal090{position:absolute;left:40%;top:-9px;width:20%;height:10px;border:3px solid #ff3939;border-bottom:0;border-radius:4px 4px 0 0;background:rgba(255,57,57,.16);box-shadow:0 -2px 13px rgba(255,57,57,.38);pointer-events:none}
      #goalMapPretty090 .gpSpot090{position:absolute;left:50%;top:31%;width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,.9);box-shadow:0 0 0 2px rgba(0,0,0,.08);pointer-events:none}
      #goalMapPretty090 .gpAttack090{position:absolute;left:50%;top:4%;transform:translateX(-50%);font-size:10px;font-weight:900;letter-spacing:.08em;color:rgba(255,255,255,.48);pointer-events:none;text-transform:uppercase}
      #goalMapPretty090 .gpHalf090{position:absolute;left:50%;bottom:3%;transform:translateX(-50%);font-size:10px;font-weight:850;color:rgba(255,255,255,.50);pointer-events:none}
      .gmPrettyMarker090{position:absolute;z-index:5;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:950;color:#fff;border:2px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.48);pointer-events:none}
      .gmPrettyMarker090.assist{background:#188bff}
      .gmPrettyMarker090.shot{background:#ff5b45}
      #goalMapModal086.gmPretty090 #goalMapCoords086{width:min(100%,680px);margin:10px auto 0!important;min-height:18px;text-align:center;font-size:12px!important;color:#b9cbc2!important}

      @media(max-width:600px){
        #goalMapModal086.gmPretty090{align-items:flex-end!important;padding:0!important}
        #goalMapModal086.gmPretty090 .sheet{width:100%!important;max-width:none!important;margin:0!important;padding:15px 14px calc(16px + env(safe-area-inset-bottom))!important;border-radius:22px 22px 0 0!important;max-height:92vh!important}
        .gmPrettyWrap090{width:min(100%,520px)}
        #goalMapPretty090{border-radius:13px;max-height:58vh}
        #goalMapModal086.gmPretty090 .teamhead h3{font-size:20px!important}
        #goalMapModal086.gmPretty090 #goalMapCancel086{font-size:12px!important;padding:8px 10px!important;min-height:40px!important}
      }
    `;document.head.appendChild(s);
  }

  function clearPrettyMarkers090(){document.querySelectorAll('#goalMapPretty090 .gmPrettyMarker090').forEach(x=>x.remove())}

  function prettyPoint090(ev){
    const r=ev.currentTarget.getBoundingClientRect();
    const hx=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width));
    const vy=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
    // Visible orientation: field width (0..30m) left→right, attacking half (Y 25..50m) bottom→top.
    return {x:hx*30,y:25+(1-vy)*25,hx,vy};
  }

  function mirrorMarker090(kind,p){
    const pitch=document.getElementById('goalMapPretty090');if(!pitch)return;
    const d=document.createElement('div');d.className=`gmPrettyMarker090 ${kind}`;d.textContent=kind==='assist'?'A':'T';
    d.style.left=`${p.hx*100}%`;d.style.top=`${p.vy*100}%`;pitch.appendChild(d);
  }

  function forwardPrettyTap090(ev){
    const pretty=ev.currentTarget,original=document.getElementById('goalMapPitch086');if(!original)return;
    const instruction=(document.getElementById('goalMapInstruction086')?.textContent||'').toLowerCase();
    const kind=instruction.includes('assist')?'assist':'shot';
    const p=prettyPoint090(ev);
    mirrorMarker090(kind,p);

    // Translate the new vertical half-pitch tap into patch086's original hidden horizontal coordinate system.
    // patch086 expects horizontal progress = (Y-25)/25 and vertical progress = X/30.
    const or=original.getBoundingClientRect();
    const horizontalProgress=(p.y-25)/25;
    const verticalProgress=p.x/30;
    original.dispatchEvent(new MouseEvent('click',{
      bubbles:true,cancelable:true,view:window,
      clientX:or.left+horizontalProgress*or.width,
      clientY:or.top+verticalProgress*or.height
    }));
  }

  function enhanceGoalMap090(){
    ensureStyles090();
    const modal=document.getElementById('goalMapModal086'),original=document.getElementById('goalMapPitch086');
    if(!modal||!original)return false;
    modal.classList.add('gmPretty090');
    if(document.getElementById('goalMapPretty090'))return true;

    const wrap=document.createElement('div');wrap.className='gmPrettyWrap090';
    wrap.innerHTML=`
      <div class="gmPrettyTop090"><span class="gmPrettyDot090"></span><span>PORTA AVVERSARIA · Y=50</span></div>
      <div id="goalMapPretty090" aria-label="Metà campo avversaria: tocca il punto dell'azione">
        <div class="gpGoal090"></div>
        <div class="gpPenalty090"></div>
        <div class="gpGoalArea090"></div>
        <div class="gpSpot090"></div>
        <div class="gpAttack090">↑ direzione attacco</div>
        <div class="gpHalf090">LINEA DI METÀ CAMPO</div>
      </div>
      <div class="gmPrettyBottom090"><span>Metà campo · Y=25</span></div>`;
    original.parentNode.insertBefore(wrap,original);
    document.getElementById('goalMapPretty090').addEventListener('click',forwardPrettyTap090);

    const obs=new MutationObserver(()=>{
      if(modal.classList.contains('show')&&!modal.dataset.prettyOpen090){modal.dataset.prettyOpen090='1';clearPrettyMarkers090()}
      if(!modal.classList.contains('show'))delete modal.dataset.prettyOpen090;
    });
    obs.observe(modal,{attributes:true,attributeFilter:['class']});
    if(modal.classList.contains('show')){modal.dataset.prettyOpen090='1';clearPrettyMarkers090()}
    return true;
  }

  ensureStyles090();
  const bodyObs=new MutationObserver(()=>{if(enhanceGoalMap090())bodyObs.disconnect()});
  if(document.body)bodyObs.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('DOMContentLoaded',()=>{enhanceGoalMap090();setTimeout(enhanceGoalMap090,700)});
  setTimeout(enhanceGoalMap090,1200);
})();
