// SevenLab Auth gate — robust Safari/iPad networking, whitelist, recovery and token refresh.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';
  const ALLOWED_FIRST='project2000music@gmail.com';
  const storeKey='sevenlab_auth_session_v1';
  let session=null;

  function authHeaders(token){return {'apikey':KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'}}
  function isNetworkError(e){return e?.name==='TypeError'||e?.name==='AbortError'||/load failed|failed to fetch|network|offline|timeout/i.test(String(e?.message||e||''))}
  function friendly(e){return isNetworkError(e)?'Connessione a SevenLab non riuscita. Controlla la rete e riprova: la sessione non è stata cancellata.':String(e?.message||e||'Errore autenticazione')}
  async function fetchRetry(url,opts={},tries=2){
    let last;
    for(let i=0;i<tries;i++){
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
      try{return await fetch(url,{...opts,signal:ctrl.signal,cache:'no-store'})}
      catch(e){last=e;if(!isNetworkError(e)||i===tries-1)throw e;await new Promise(r=>setTimeout(r,450*(i+1)))}
      finally{clearTimeout(timer)}
    }
    throw last;
  }
  async function parse(r){return await r.json().catch(()=>({}))}
  async function post(path,body,extra={}){const r=await fetchRetry(URL+'/auth/v1/'+path,{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});const data=await parse(r);if(!r.ok){const e=new Error(data.msg||data.message||data.error_description||data.error||'Errore autenticazione');e.status=r.status;throw e}return data}
  async function getUser(token){const r=await fetchRetry(URL+'/auth/v1/user',{headers:authHeaders(token)});const d=await parse(r);if(!r.ok){const e=new Error(d.msg||d.message||d.error||'Sessione non valida');e.status=r.status;throw e}return d}
  async function allowed(token,email){const r=await fetchRetry(URL+'/rest/v1/authorized_users?email=eq.'+encodeURIComponent(email)+'&select=email',{headers:authHeaders(token)});if(!r.ok){const e=new Error('Verifica autorizzazione non riuscita');e.status=r.status;throw e}return (await parse(r)).length>0}
  function saveSession(s){session=s;localStorage.setItem(storeKey,JSON.stringify(s))}
  function clearSession(){session=null;localStorage.removeItem(storeKey)}
  function showApp(){document.documentElement.classList.add('sevenlab-authenticated');document.getElementById('authGate')?.classList.remove('show')}
  function showGate(msg){document.documentElement.classList.remove('sevenlab-authenticated');document.getElementById('authGate')?.classList.add('show');if(msg)document.getElementById('authMsg').textContent=msg}
  function cleanAuthUrl(){if(location.hash||location.search)history.replaceState(null,'',location.pathname)}
  async function refresh(){
    if(!session?.refresh_token)return false;
    try{const fresh=await post('token?grant_type=refresh_token',{refresh_token:session.refresh_token});saveSession(fresh);return true}
    catch(e){if(isNetworkError(e))throw e;if(e.status===400||e.status===401||e.status===403)clearSession();return false}
  }
  async function validate(){
    if(!session?.access_token)return false;
    try{
      let email=session.user?.email;
      try{if(!email){const u=await getUser(session.access_token);session.user=u;saveSession(session);email=u.email}}
      catch(e){if((e.status===401||e.status===403)&&await refresh()){const u=await getUser(session.access_token);session.user=u;saveSession(session);email=u.email}else throw e}
      let ok;
      try{ok=await allowed(session.access_token,email)}
      catch(e){if((e.status===401||e.status===403)&&await refresh())ok=await allowed(session.access_token,session.user?.email||email);else throw e}
      if(!ok)clearSession();return ok;
    }catch(e){
      // Never destroy a valid stored session because Safari briefly returns "Load failed".
      if(isNetworkError(e))throw e;
      if(e.status===401||e.status===403)clearSession();
      return false;
    }
  }
  async function login(email,password){const d=await post('token?grant_type=password',{email,password});if(!(await allowed(d.access_token,d.user?.email||email)))throw new Error('Questo account non è autorizzato a SevenLab.');saveSession(d);showApp();setTimeout(()=>location.reload(),60)}
  async function signup(email,password){if(email.trim().toLowerCase()!==ALLOWED_FIRST)throw new Error('Email non autorizzata.');try{const d=await post('signup',{email,password});if(d.access_token){saveSession(d);showApp();setTimeout(()=>location.reload(),60);return}showGate('Account creato. Se l’email è già confermata, usa “Accedi”; non ripetere il primo accesso.')}catch(e){const m=String(e.message||'');if(/already|registered|exists/i.test(m))throw new Error('Account già esistente. Usa “Accedi” oppure “Password dimenticata?”.');throw e}}
  async function recover(email){if(!email)throw new Error('Inserisci prima la tua email.');const redirect='https://calmglow-cyber.github.io/SEVENLAB/';await post('recover',{email},{'x-redirect-to':redirect});showGate('Ti ho inviato il link per scegliere una nuova password. Controlla anche Spam.')}
  function authFromUrl(){const h=new URLSearchParams(location.hash.replace(/^#/,''));const access=h.get('access_token');if(!access)return null;return{type:h.get('type')||'',access_token:access,refresh_token:h.get('refresh_token')||''}}
  async function acceptMagicLink(a){const u=await getUser(a.access_token);if(!(await allowed(a.access_token,u.email)))throw new Error('Questo account non è autorizzato a SevenLab.');saveSession({access_token:a.access_token,refresh_token:a.refresh_token,user:u,token_type:'bearer'});cleanAuthUrl();showApp();setTimeout(()=>location.reload(),60)}
  async function updatePasswordWithToken(password,token){if(password.length<6)throw new Error('Usa almeno 6 caratteri.');const r=await fetchRetry(URL+'/auth/v1/user',{method:'PUT',headers:authHeaders(token),body:JSON.stringify({password})});const d=await parse(r);if(!r.ok){const e=new Error(d.msg||d.message||d.error||'Impossibile aggiornare la password');e.status=r.status;throw e}return d}
  async function setNewPassword(password,token){await updatePasswordWithToken(password,token);cleanAuthUrl();clearSession();showGate('Password aggiornata ✅ Ora accedi con la nuova password.')}
  async function changePasswordLoggedIn(){if(!session?.access_token)throw new Error('Sessione non valida.');const p1=prompt('Nuova password SevenLab (almeno 6 caratteri):');if(p1===null)return;const p2=prompt('Ripeti la nuova password:');if(p2===null)return;if(p1!==p2)throw new Error('Le due password non coincidono.');await updatePasswordWithToken(p1,session.access_token);alert('Password SevenLab aggiornata ✅')}
  function logout(){clearSession();location.reload()}

  window.SevenLabAuth={get token(){return session?.access_token||''},get email(){return session?.user?.email||''},login,signup,logout,changePasswordLoggedIn,headers(){return authHeaders(session?.access_token||'')}};
  try{session=JSON.parse(localStorage.getItem(storeKey)||'null')}catch(e){session=null}

  window.addEventListener('DOMContentLoaded',async()=>{
    const loginBtn=document.getElementById('authLogin'),signupBtn=document.getElementById('authSignup'),forgot=document.getElementById('authForgot');
    const inbound=authFromUrl();
    if(inbound?.type==='recovery'){showGate('Scegli qui sotto la nuova password, poi premi “Salva nuova password”.');signupBtn.style.display='none';forgot.style.display='none';loginBtn.textContent='Salva nuova password';loginBtn.onclick=async()=>{try{loginBtn.disabled=true;await setNewPassword(document.getElementById('authPassword').value,inbound.access_token)}catch(e){showGate(friendly(e))}finally{loginBtn.disabled=false}};return}
    if(inbound?.access_token){showGate('Accesso in corso…');try{await acceptMagicLink(inbound);return}catch(e){if(!isNetworkError(e))cleanAuthUrl();showGate(friendly(e))}}
    loginBtn.onclick=async()=>{const e=document.getElementById('authEmail').value.trim(),p=document.getElementById('authPassword').value;try{loginBtn.disabled=true;showGate('Accesso in corso…');await login(e,p)}catch(err){showGate(friendly(err))}finally{loginBtn.disabled=false}};
    signupBtn.onclick=async()=>{const e=document.getElementById('authEmail').value.trim(),p=document.getElementById('authPassword').value;if(p.length<6)return showGate('Usa una password di almeno 6 caratteri.');try{signupBtn.disabled=true;await signup(e,p)}catch(err){showGate(friendly(err))}finally{signupBtn.disabled=false}};
    forgot.onclick=async()=>{try{forgot.disabled=true;await recover(document.getElementById('authEmail').value.trim())}catch(e){showGate(friendly(e))}finally{forgot.disabled=false}};
    document.getElementById('authLogout').onclick=logout;
    const cp=document.getElementById('authChangePassword');if(cp)cp.onclick=async()=>{try{cp.disabled=true;await changePasswordLoggedIn()}catch(e){alert(friendly(e))}finally{cp.disabled=false}};
    try{
      if(await validate()){showApp();const u=document.getElementById('authUser');if(u)u.textContent=session.user?.email||''}
      else showGate('Accesso riservato agli utenti autorizzati.');
    }catch(e){
      showGate(friendly(e)+' Premi di nuovo Accedi oppure ricarica la pagina.');
    }
  });
})();