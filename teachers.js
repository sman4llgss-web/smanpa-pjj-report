(function(){
'use strict';
const auth=window.smanpaAuth, sb=auth?.sb, $=id=>document.getElementById(id);
let role='', teachers=[],subjects=[], lastCredential='', bulkRunning=false, bulkStop=false;
$('year').textContent=new Date().getFullYear();
function notice(s){$('notice').textContent=s;}
function errMessage(e){return e?.message||String(e);}
async function gate(){
 if(!sb){notice('config.js atau library Supabase belum tersedia.');return false;}
 const {data:{user},error}=await sb.auth.getUser();
 if(error||!user){location.replace('index.html');return false;}
 const {data,error:pe}=await sb.from('profiles').select('role,active').eq('id',user.id).single();
 if(pe||!data?.active||!['super_admin','admin_kurikulum'].includes(data.role)){
  notice('Akses dibatasi untuk Admin Kurikulum atau Super Admin: '+(pe?.message||'tidak diizinkan'));return false;
 }
 role=String(data.role||'').trim().toLowerCase();
  $('manager').hidden=false;
  const bulkPanel=$('bulkPanel');
  if(role==='super_admin'){
   bulkPanel.hidden=false;
   bulkPanel.removeAttribute('hidden');
   bulkPanel.style.setProperty('display','block','important');
   $('bulkDiagnostic').textContent='Mode Super Admin aktif · Fitur akun massal tersedia (Tahap 6A PATCH).';
  }else{
   bulkPanel.hidden=true;
   bulkPanel.style.display='none';
   $('bulkDiagnostic').textContent='Mode '+(role||'tidak diketahui')+' · Pembuatan akun massal hanya untuk Super Admin.';
  }
 if(role!=='super_admin'){$('addSection').hidden=true;$('addSubjectForm').hidden=true;}
 return true;
}
async function load(){
 const [a,b]=await Promise.all([
  sb.from('teacher_directory').select('id,full_name,login_id,nip,position,auth_user_id,active').order('full_name'),
  sb.from('subjects').select('id,name').order('name')
 ]);
 if(a.error||b.error){notice('Gagal memuat data: '+(a.error?.message||b.error?.message));return;}
 teachers=a.data||[];subjects=b.data||[];
 $('teacherCount').textContent=teachers.length;
 $('accountCount').textContent=teachers.filter(t=>t.auth_user_id).length;
 $('subjectCount').textContent=subjects.length;
 $('subjectList').replaceChildren();
 for(const s of subjects){const el=document.createElement('span');el.className='chip';el.textContent=s.name;$('subjectList').append(el)}
 draw();notice('Data berhasil dimuat. '+teachers.length+' guru, '+subjects.length+' pilihan mata pelajaran.');
}
function button(label,fn,disabled=false,secondary=false){const b=document.createElement('button');b.type='button';b.className='smallbtn'+(secondary?' secondary':'');b.textContent=label;b.disabled=disabled;b.addEventListener('click',fn);return b;}
function draw(){
 const query=$('searchTeacher').value.trim().toLowerCase(), f=$('filterTeacher').value;
 const out=$('teacherList');out.replaceChildren();
 const filtered=teachers.filter(t=>(f==='all'||(f==='pending'?!t.auth_user_id:!!t.auth_user_id))&&[t.full_name,t.login_id,t.position,t.nip].join(' ').toLowerCase().includes(query));
 if(!filtered.length){out.textContent='Tidak ada guru sesuai pencarian.';return;}
 for(const t of filtered){
  const item=document.createElement('article');item.className='entry';
  const left=document.createElement('div'),h=document.createElement('h3'),p1=document.createElement('p'),p2=document.createElement('p');
  h.textContent=t.full_name;p1.textContent=t.position+' · Login: '+t.login_id;
  p2.textContent=(t.nip?'NIP/NI PPPK: '+t.nip:'NIP belum tercantum')+' · '+(t.auth_user_id?'Akun dibuat':'Belum memiliki akun')+(t.active?'':' · Nonaktif');
  left.append(h,p1,p2);const buttons=document.createElement('div');buttons.className='actions';
  if(role==='super_admin'){
   if(!t.auth_user_id)buttons.append(button('Buat Akun',()=>provision('create',t)));
   else buttons.append(button('Reset Password',()=>provision('reset',t)));
   buttons.append(button('Ubah Data',()=>editTeacher(t),false,true));
  }
  item.append(left,buttons);out.append(item);
 }
}
async function editTeacher(t){
 const full_name=prompt('Nama lengkap:',t.full_name);if(full_name===null)return;
 if(!full_name.trim()){notice('Nama tidak boleh kosong.');return;}
 const position=prompt('Jabatan:',t.position);if(position===null)return;
 const v={full_name:full_name.trim(),position:position.trim()||'Guru'};
 if(!t.auth_user_id){
  const id=prompt('ID Login (harus unik):',t.login_id);if(id===null)return;
  if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}$/.test(id)){notice('Format ID login tidak valid.');return;}
  v.login_id=id;
  const nip=prompt('NIP/NI PPPK (boleh kosong):',t.nip||'');if(nip===null)return;
  v.nip=nip.trim()||null;
 }
 const {error}=await sb.from('teacher_directory').update(v).eq('id',t.id);
 if(error){notice('Gagal memperbarui: '+error.message);return;}await load();
}
async function provision(action,t){
 if(!confirm(action==='create'?'Buat akun login untuk '+t.full_name+'?':'Reset password milik '+t.full_name+'? Password lama tidak dapat dipakai kembali.'))return;
 $('accountNotice').textContent='Memproses akun di server…';
 const {data,error}=await sb.functions.invoke('manage-teacher-account',{body:{action,teacher_id:t.id}});
 if(error||data?.error){$('accountNotice').textContent='Gagal: '+(data?.error||errMessage(error))+'. Pastikan Edge Function sudah di-deploy.';return;}
 lastCredential='Nama: '+t.full_name+'\nLogin: '+t.login_id+'\nPassword sementara: '+data.temporary_password+'\nGanti password setelah masuk.';
 $('credentialText').textContent=lastCredential;$('credentialBox').hidden=false;
 $('accountNotice').textContent='Akun diproses. Catat password sementara sekarang; aplikasi tidak menyimpannya.';
 await load();
}
$('copyCredential').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(lastCredential);$('accountNotice').textContent='Kredensial disalin. Kirim secara pribadi, bukan di grup.';}catch(e){$('accountNotice').textContent='Tidak dapat menyalin otomatis; salin teks secara manual.';}});
$('hideCredential').addEventListener('click',()=>{$('credentialBox').hidden=true;$('credentialText').textContent='';lastCredential='';});
$('bulkStop').addEventListener('click',()=>{bulkStop=true;$('bulkStatus').textContent='Menghentikan setelah batch saat ini selesai…';});
$('bulkCreate').addEventListener('click',async()=>{
 if(role!=='super_admin'||bulkRunning)return;
 const pending=teachers.filter(t=>t.active&&!t.auth_user_id).length;
 if(!pending){$('bulkStatus').textContent='Tidak ada guru aktif yang perlu dibuatkan akun.';return;}
 if(!confirm('Buat akun untuk '+pending+' guru yang belum memiliki akun? Akun yang sudah ada tidak akan direset.'))return;
 bulkRunning=true;bulkStop=false;$('bulkCreate').disabled=true;$('bulkStop').disabled=false;
 $('bulkResults').replaceChildren();let total=0,failed=0,cycles=0;
 try{
  while(!bulkStop && cycles<30){
   cycles++;$('bulkStatus').textContent='Memproses batch '+cycles+'… '+total+' akun berhasil dibuat.';
   const {data,error}=await sb.functions.invoke('manage-teacher-account',{body:{action:'bulk_create'}});
   if(error||data?.error)throw new Error(data?.error||errMessage(error));
   const results=data?.results||[];
   for(const r of results){
    const el=document.createElement('div');el.textContent=(r.status==='created'?'✓ ':'✕ ')+r.name+(r.message?' — '+r.message:'');
    $('bulkResults').append(el);
    if(r.status==='created')total++;else failed++;
   }
   $('bulkStatus').textContent='Berhasil: '+total+' · Gagal: '+failed+' · Belum dibuat: '+(data.remaining??'tidak diketahui');
   if(!results.length||data.remaining===0)break;
   // Jika satu batch tidak menghasilkan akun, hentikan agar data bermasalah tidak diproses berulang.
   if(data.created===0){$('bulkStatus').textContent+=' · Dihentikan: periksa guru gagal sebelum mengulang.';break;}
  }
 }catch(e){$('bulkStatus').textContent='Proses terhenti: '+errMessage(e)+' · Akun yang sudah berhasil tetap tersimpan.';}
 finally{bulkRunning=false;$('bulkCreate').disabled=false;$('bulkStop').disabled=true;await load();}
});
$('searchTeacher').addEventListener('input',draw);$('filterTeacher').addEventListener('change',draw);
$('addTeacherForm').addEventListener('submit',async e=>{
 e.preventDefault();if(role!=='super_admin')return;
 const f=Object.fromEntries(new FormData(e.currentTarget));
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}$/.test(f.login_id)){notice('ID login minimal 3 karakter dan hanya huruf, angka, titik, - atau _.');return;}
 const {error}=await sb.from('teacher_directory').insert({full_name:f.full_name.trim(),login_id:f.login_id.trim(),nip:f.nip.trim()||null,position:f.position.trim()||'Guru'});
 if(error){notice('Gagal menyimpan guru: '+error.message);return;}
 e.currentTarget.reset();await load();
});
$('addSubjectForm').addEventListener('submit',async e=>{
 e.preventDefault();if(role!=='super_admin')return;
 const name=new FormData(e.currentTarget).get('name').trim();
 const {error}=await sb.from('subjects').insert({name});
 if(error){notice('Gagal menambah mapel: '+error.message);return;}e.currentTarget.reset();await load();
});
(async()=>{try{if(await gate())await load()}catch(e){notice('Kesalahan: '+errMessage(e));}})();
})();
