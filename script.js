'use strict';
const passwordInput=document.getElementById('password');
const toggle=document.getElementById('password-toggle');
toggle.addEventListener('click',()=>{
 const showing=passwordInput.type==='password';
 passwordInput.type=showing?'text':'password';
 toggle.setAttribute('aria-pressed',String(showing));
 toggle.setAttribute('aria-label',showing?'Sembunyikan password':'Tampilkan password');
 document.getElementById('eye-show').classList.toggle('is-hidden',showing);
 document.getElementById('eye-hide').classList.toggle('is-hidden',!showing);
});
const form=document.getElementById('login-form');
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const username=document.getElementById('username').value;
 const message=document.getElementById('form-message');
 if(!username.trim()||!passwordInput.value){message.textContent='Isi username dan password terlebih dahulu.';return;}
 if(!window.smanpaAuth.configured){message.textContent='Supabase belum dikonfigurasi. Isi config.js sesuai panduan README.';return;}
 const button=form.querySelector('[type="submit"]');button.disabled=true;message.textContent='Memeriksa akun...';
 try{
  const email=window.smanpaAuth.usernameToEmail(username);
  const {error}=await window.smanpaAuth.sb.auth.signInWithPassword({email,password:passwordInput.value});
  if(error)throw new Error('Username atau password tidak sesuai.');
  window.location.assign('dashboard.html');
 }catch(e){message.textContent=e.message;}finally{button.disabled=false;}
});
document.getElementById('year').textContent=String(new Date().getFullYear());
(async()=>{if(new URLSearchParams(location.search).has('logged_out'))return;if(!window.smanpaAuth.configured)return;const {data}=await window.smanpaAuth.sb.auth.getUser();if(data.user)window.location.replace('dashboard.html');})();
