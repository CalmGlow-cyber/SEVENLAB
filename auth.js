// SevenLab Auth gate — only whitelisted Supabase users can access cloud data.
(function(){
  const URL='https://xkpjuevmygvsuhqvhqvx.supabase.co';
  const KEY='sb_publishable_YwcEhLvfxVtQtaichsSSUw_nKVsCuzv';
  const ALLOWED_FIRST='project2000music@gmail.com';
  const storeKey='sevenlab_auth_session_v1';
  let session=null;

  function authHeaders(token){return {'apikey':KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'}}
  async function call(path,body){const r=await fetch(URL+'/auth/v1/'+path,{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.msg||data.message||data.error_description||data.error||'Errore autenticazione');return data}
  async function allowed(token,email){const r=await fetch(URL+'/rest/v1/authorized_users?email=eq.'+encodeURIComponent(email)+'&select=email',{headers:authHeaders(token)});return r.ok&&(await r.json()).length>0}
  function saveSession(s){session=s;localStorage.setItem(storeKey,JSON.stringify(s))}
  function clearSession(){session=null;localStorage.removeItem(storeKey)}
  function showApp(){document.documentElement.classList.add('sevenlab-authenticated');document.getElementById('authGate')?.classList.remove('show')}
  function showGate(msg){document.documentElement.classList.remove('sevenlab-authenticated');const g=document.getElementById('authGate');if(g)g.classList.add('show');const m=document.getElementById('authMsg');if(m&&msg)m.textContent=msg}
  async function refresh(){if(!session?.refresh_token)return false;try{const d=await call('token?grant_type=refresh_token',{refresh_token:session.refresh_token});saveSession(d);return true}catch(e){clearSession();return false}}
  async function validate(){if(!session?.access_token)return false;let email=session.user?.email;if(!email)return false;let ok=await allowed(session.access_token,email);if(!ok&&await refresh()){email=session.user?.email;ok=await allowed(session.access_token,email)}if(!ok){clearSession();return false}return true}
  async function login(email,password){const d=await call('token?grant_type=password',{email,password});if(!(await allowed(d.access_token,d.user?.email||email)))throw new Error('Questo account non è autorizzato a SevenLab.');saveSession(d);showApp();location.reload()}
  async function signup(email,password){if(email.trim().toLowerCase()!==ALLOWED_FIRST)throw new Error('Email non autorizzata.');const d=await call('signup',{email,password});if(d.access_token){saveSession(d);showApp();location.reload()}else showGate('Account creato. Controlla la mail e conferma l’indirizzo, poi accedi.')}
  function logout(){clearSession();location.reload()}

  window.SevenLabAuth={get token(){return session?.access_token||''},get email(){return session?.user?.email||''},login,signup,logout,headers(){return authHeaders(session?.access_token||'')}};
  try{session=JSON.parse(localStorage.getItem(storeKey)||'null')}catch(e){session=null}
  window.addEventListener('DOMContentLoaded',async()=>{
    const loginBtn=document.getElementById('authLogin'),signupBtn=document.getElementById('authSignup');
    loginBtn.onclick=async()=>{const e=document.getElementById('authEmail').value.trim(),p=document.getElementById('authPassword').value;try{loginBtn.disabled=true;await login(e,p)}catch(err){showGate(err.message)}finally{loginBtn.disabled=false}};
    signupBtn.onclick=async()=>{const e=document.getElementById('authEmail').value.trim(),p=document.getElementById('authPassword').value;if(p.length<6)return showGate('Usa una password di almeno 6 caratteri.');try{signupBtn.disabled=true;await signup(e,p)}catch(err){showGate(err.message)}finally{signupBtn.disabled=false}};
    document.getElementById('authLogout').onclick=logout;
    if(await validate()){showApp();document.getElementById('authUser').textContent=session.user.email}else showGate('Accesso riservato agli utenti autorizzati.')
  });
})();