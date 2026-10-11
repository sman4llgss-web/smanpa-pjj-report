(function(){
'use strict';
const auth=window.smanpaAuth||{};
const sb=auth.sb;
const $=id=>document.getElementById(id);
$('year').textContent=new Date().getFullYear();document.getElementById('js-health').textContent='Dashboard JS aktif · tahap 5';
const warn=message=>{$('alert').textContent=message;};
const timeout=(promise,ms=9000)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Waktu koneksi habis. Periksa jaringan atau kebijakan akses Supabase.')),ms))]);
let exiting=false;

$('showPassword').addEventListener('click',()=>{const el=$('newPassword');const show=el.type==='password';el.type=show?'text':'password';$('showPassword').textContent=show?'Sembunyikan':'Tampilkan';});
$('password-form').addEventListener('submit',async e=>{
 e.preventDefault();const a=$('newPassword').value,b=$('confirmPassword').value,msg=$('passwordMessage');
 if(a.length<8||a!==b){msg.textContent='Password minimal 8 karakter dan konfirmasi harus sama.';return;}
 try{const {error}=await timeout(sb.auth.updateUser({password:a}));if(error)throw error;msg.textContent='Password berhasil diperbarui.';$('password-form').reset();}catch(err){msg.textContent='Gagal mengganti password: '+err.message;}
});
async function boot(){
 if(!auth.configured){$('identity').textContent='Konfigurasi tidak tersedia';warn('Supabase JS gagal dimuat atau config.js belum lengkap. Periksa internet dan konfigurasi.');return;}
 try{
  const {data,error}=await timeout(sb.auth.getSession());
  if(error)throw error;
  if(!data?.session){window.location.replace('index.html');return;}
  const user=data.session.user;
  const result=await timeout(sb.from('profiles').select('full_name,username,role,active').eq('id',user.id).single());
  if(result.error)throw result.error;
  const p=result.data;
  if(!p||!p.active)throw new Error('Profil belum tersedia atau tidak aktif.');
  $('greeting').textContent=p.role==='super_admin'?'Dashboard Super Admin':p.role==='admin_kurikulum'?'Dashboard Admin Kurikulum':'Dashboard Guru';
  $('identity').textContent='Selamat datang, '+p.full_name+' · '+p.username;
  $('role').textContent=({guru:'Guru',admin_kurikulum:'Admin Kurikulum',super_admin:'Super Admin'})[p.role]||p.role;
  if(p.role!=='guru'){document.getElementById('periodManagement').hidden=false;document.getElementById('teacherManagement').hidden=false;$('reportAdmin').hidden=false;$('monitoring6b').hidden=false;}else{$('reportTeacher').hidden=false;}
  if(p.role!=='guru')$('adminNotice').textContent='Akun admin terdeteksi. Modul pengelolaan data akan dikembangkan pada tahap berikutnya.';
  try{
   const {data:periods,error:periodError}=await timeout(sb.from('pjj_periods').select('title,start_date,end_date').eq('status','active').order('start_date',{ascending:false}).limit(1),7000);
   if(!periodError&&periods?.length){const period=periods[0];$('period').textContent=period.title;$('periodDates').textContent='Mulai '+period.start_date+(period.end_date?' · Selesai '+period.end_date:' · Belum ditentukan');}
  }catch(e){warn('Profil berhasil dimuat, tetapi periode PJJ belum dapat dibaca: '+e.message);}
  if(p.role==='guru'){const cnt=await sb.from('pjj_reports').select('id',{count:'exact',head:true}).eq('teacher_id',user.id);if(!cnt.error)$('count').textContent=String(cnt.count??0);else warn('Jumlah laporan belum dapat dibaca: '+cnt.error.message);}
 }catch(e){$('identity').textContent='Profil belum dapat dimuat';warn('Gagal memuat profil: '+e.message+' Jika error menyebut infinite recursion, kirim pesan ini untuk perbaikan policy RLS.');}
}
boot();

})();
