// SevenLab 0.8 — responsive Live/Game layout for tablet/iPad landscape.
(function(){
  function teamLabel(t,c){
    if(c?.tipo==='partita'){
      if(t==='A') return String(c.team_name||window.SevenLabTeam?.name||'Squadra').trim()||'Squadra';
      return String(c.avversario||'Avversario').trim()||'Avversario';
    }
    return `Squadra ${t}`;
  }

  function ensureStyles(){
    if(document.getElementById('layout080style'))return;
    const s=document.createElement('style');s.id='layout080style';s.textContent=`
      #live.live080 .card:first-child{z-index:40}
      #livePlayers.liveTeams080{display:block}
      .liveTeamsGrid080{display:grid;grid-template-columns:1fr;gap:12px}
      .teamLiveCol080{min-width:0}
      .teamLiveTitle080{position:sticky;top:0;z-index:5;padding:8px 10px;margin:0 0 8px;border-radius:10px;background:#0d1c16;border:1px solid rgba(255,255,255,.08);font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}
      .teamLiveList080{display:grid;grid-template-columns:1fr;gap:9px}
      .teamLiveEmpty080{padding:18px 10px;text-align:center;opacity:.6;border:1px dashed rgba(255,255,255,.12);border-radius:12px}
      #live.live080 .counter{min-height:48px}
      #live.live080 .controls .btn,#live.live080 .setpiecebar070 .btn,#live.live080 #subBtn{min-height:46px}
      #live.live080 .liveplayer{margin-bottom:0}
      #live.live080 .countergrid{gap:7px}
      @media (min-width:768px){
        #live.live080 .liveplayer-top .name{font-size:17px}
        #live.live080 .counter b{font-size:15px}
        #live.live080 .counter small{font-size:11px}
      }
      @media (orientation:landscape) and (min-width:700px){
        body{overscroll-behavior-y:none}
        #live.live080{padding-bottom:76px}
        #live.live080>.card:first-child{position:sticky;top:0;z-index:60;margin-bottom:10px;box-shadow:0 10px 24px rgba(0,0,0,.28);backdrop-filter:blur(12px)}
        #live.live080 .livehead{grid-template-columns:1fr auto 1fr!important;align-items:center!important}
        #live.live080 .livehead>div:first-child{grid-column:1!important;justify-self:start}
        #live.live080 .scorebox{grid-column:2!important;justify-self:center}
        #live.live080 #subBtn{grid-column:3!important;width:auto!important;justify-self:end!important;margin:0!important}
        #live.live080 .controls{display:grid!important;grid-template-columns:repeat(3,minmax(110px,1fr))!important;gap:8px!important;max-width:620px;margin:8px auto 0!important}
        #live.live080 .setpiecebar070{display:grid!important;grid-template-columns:repeat(3,minmax(110px,1fr))!important;gap:8px!important;max-width:620px;margin:8px auto 0!important}
        #live.live080 .gameScoreNames,#live.live080 .gameMeta,#live.live080 .gameLiveBadge,#live.live080 #pendingSetPiece070{text-align:center}
        .liveTeamsGrid080{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
        .teamLiveCol080{border-radius:14px;padding:8px;background:rgba(255,255,255,.018);border:1px solid rgba(255,255,255,.05)}
        .teamLiveTitle080{top:178px;text-align:center;font-size:13px}
        .teamLiveList080{gap:8px}
        #live.live080 .liveplayer{padding:10px}
        #live.live080 .countergrid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
        #live.live080 .counter{min-height:56px;padding:7px 4px!important}
        #live.live080 .counter b{font-size:14px!important}
        #live.live080 .counter small{font-size:10px!important}
        #live.live080 .microstats{font-size:10px}
        #live.live080 .cards070{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        #live.live080 .cards070 .btn{min-height:42px}
      }
      @media (orientation:landscape) and (min-width:1024px){
        #live.live080 .wrap,#live.live080{max-width:none}
        #live.live080 .counter{min-height:60px}
        #live.live080 .counter b{font-size:15px!important}
        #live.live080 .counter small{font-size:11px!important}
        .liveTeamsGrid080{gap:18px}
        .teamLiveCol080{padding:10px}
      }
    `;document.head.appendChild(s);
  }

  function reorganizeLive(){
    const c=C?.(),root=document.getElementById('livePlayers');if(!root||!c?.id)return;
    const cards=[...root.querySelectorAll(':scope > .liveplayer')];
    if(!cards.length){root.classList.add('liveTeams080');return}
    const grid=document.createElement('div');grid.className='liveTeamsGrid080';
    const cols={};
    ['A','B'].forEach(t=>{
      const col=document.createElement('section');col.className='teamLiveCol080';col.dataset.team=t;
      const title=document.createElement('div');title.className='teamLiveTitle080';title.textContent=teamLabel(t,c);
      const list=document.createElement('div');list.className='teamLiveList080';
      col.append(title,list);grid.appendChild(col);cols[t]=list;
    });
    cards.forEach(card=>{
      const ev=card.querySelector('[data-ev]');const pid=ev?.dataset.ev?.split('|')?.[0];
      let team=null;
      try{team=pid?teamOf(pid,c):null}catch(e){}
      (cols[team]||cols.A).appendChild(card);
    });
    if(!cols.A.children.length)cols.A.innerHTML='<div class="teamLiveEmpty080">Nessun giocatore in campo</div>';
    if(!cols.B.children.length){
      const msg=c.tipo==='partita'?'Statistiche individuali avversarie non rilevate':'Nessun giocatore in campo';
      cols.B.innerHTML=`<div class="teamLiveEmpty080">${msg}</div>`;
    }
    root.innerHTML='';root.appendChild(grid);root.classList.add('liveTeams080');
  }

  function install(){ensureStyles();document.getElementById('live')?.classList.add('live080');reorganizeLive()}
  const oldRender=renderLive;
  renderLive=function(){oldRender();install()};
  window.addEventListener('resize',()=>{if(document.getElementById('live')?.classList.contains('active'))setTimeout(install,30)});
  window.addEventListener('orientationchange',()=>setTimeout(install,150));
  window.addEventListener('DOMContentLoaded',()=>setTimeout(install,600));
  setTimeout(install,900);
  window.SevenLab080={reorganizeLive};
})();