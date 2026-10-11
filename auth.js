'use strict';
const cfg=window.SMANPA_CONFIG||{};
const configured=Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?.createClient);
const sb=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
window.smanpaAuth={sb,configured};
window.smanpaAuth.usernameToEmail=function(username){
 const name=username.trim().toLowerCase();
 if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(name))throw new Error('Masukkan NIP, ID guru, atau username admin yang valid.');
 if(name==='admin.smanpa')return 'smanpallg.ss@gmail.com';
 return `${name}@${cfg.loginDomain||'smanpa.invalid'}`;
};
