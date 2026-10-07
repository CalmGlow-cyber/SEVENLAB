// SevenLab 0.9.6 — Game scoreboard "Gol subito" follows the keeper slot, not the roster role.
(function(){
  function isGame088(c=C?.()){return c?.tipo==='partita'}
  function assignment088(pid,c=C?.()){
    if(!c)return null;
    for(const t of ['A','B'])for(const k of Object.keys(c.teams?.[t]||{})){
      const a=c.teams[t][k];if(String(a?.pid)===String(pid))return {team:t,slot:k,...a};
    }
    return null;
  }
  function isPlayerInGoal088(pid,c=C?.()){
    const a=assignment088(pid,c);
    // The scoreboard must remain usable even when a movement player covers the goal.
    // This does not reclassify the player as a goalkeeper or add goalkeeper stats.
    return a?.team==='A'&&a?.desired==='P';
  }
  function addGoalAgainst088(){
    const c=C?.();if(!isGame088(c))return;
    c.score=c.score||{A:0,B:0};c.score.B=(c.score.B||0)+1;c.gol_subiti=c.score.B;
    c.events=c.events||[];c.events.push({id:Date.now()+Math.random(),pid:null,type:'goal_against',t:elapsed(),phase:c.phase,team:'B',void:false});
    save();renderLive();toast('Gol subito registrato');
  }
  function injectGoalAgainst088(){
    const c=C?.();if(!isGame088(c))return;
    document.querySelectorAll('#livePlayers .liveplayer').forEach(card=>{
      const ev=card.querySelector('[data-ev]');if(!ev)return;
      const pid=ev.dataset.ev.split('|')[0];if(!isPlayerInGoal088(pid,c))return;
      const grid=card.querySelector('.countergrid');if(!grid||grid.querySelector('[data-goal-against088],.gameAgainst'))return;
      const b=document.createElement('button');b.className='counter counterbig gameAgainst';b.dataset.goalAgainst088='1';
      b.innerHTML=`<b>🥅 ${c.score?.B||0}</b><small>Gol subito</small>`;b.onclick=addGoalAgainst088;grid.appendChild(b);
    });
  }
  const renderBefore088=renderLive;
  renderLive=function(){const r=renderBefore088.apply(this,arguments);try{injectGoalAgainst088()}catch(e){}return r};
  function markVersion088(){
    const beta=document.querySelector('.beta');if(beta&&!/BETA 0\.9(?:\.|\b)/.test(beta.textContent||''))beta.textContent='BETA 0.8.8';
    document.querySelectorAll('.settingsvalue').forEach(e=>{if(/Beta 0\.8/.test(e.textContent||''))e.textContent='Beta 0.8.8 · Ripristino Gol subito in Game'});
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{markVersion088();try{injectGoalAgainst088()}catch(e){}},500));
  setTimeout(()=>{markVersion088();try{injectGoalAgainst088()}catch(e){}},1100);
})();