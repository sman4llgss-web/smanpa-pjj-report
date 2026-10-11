(()=>{'use strict';
const sb=window.smanpaAuth?.sb,$=id=>document.getElementById(id);
let subjects=[],classes=[],profiles=[],data=[],links=[],view=[],role='',deleting=false;
const msg=s=>{$('notice').textContent=s};
const cell=(tr,t)=>{const d=document.createElement('td');d.textContent=t??'';tr.append(d);return d};
const csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
function formatDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return v||'';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`}
function refreshDates(){const el=$('date'),old=el.value;const dates=[...new Set(data.map(x=>x.report_date).filter(Boolean))].sort().reverse();el.replaceChildren(new Option('Semua tanggal',''));for(const d of dates)el.add(new Option(formatDate(d),d));el.value=dates.includes(old)?old:'';}
async function init(){if(!sb){msg('Konfigurasi Supabase tidak tersedia');return}
 const {data:authData,error}=await sb.auth.getUser();const user=authData?.user;
 if(error||!user){location.replace('index.html');return}
 const pr=await sb.from('profiles').select('full_name,role,active').eq('id',user.id).single();
 if(pr.error||!pr.data?.active||!['super_admin','admin_kurikulum'].includes(pr.data.role)){msg('Halaman khusus Admin Kurikulum/Super Admin');return}
 role=pr.data.role;$('identity').textContent='Admin: '+pr.data.full_name;
 $('actionHead').hidden=role!=='super_admin';
 const [s,c,p]=await Promise.all([sb.from('subjects').select('id,name').order('name'),sb.from('classes').select('id,name'),sb.from('profiles').select('id,full_name')]);
 if(s.error||c.error||p.error){msg('Data referensi belum dapat dibaca: '+(s.error||c.error||p.error).message);return}
 subjects=s.data||[];classes=c.data||[];profiles=p.data||[];
 for(const x of classes)$('class').add(new Option(x.name,x.id));for(const x of subjects)$('subject').add(new Option(x.name,x.id));
 await load();
}
async function load(){msg('Mengambil laporan…');data=[];
 for(let from=0;from<10000;from+=500){const q=await sb.from('pjj_reports').select('id,report_date,teacher_id,subject_id,jp_start,jp_end,platform,material,assignment,execution_status,obstacle,evidence_link,evidence_path').order('report_date',{ascending:false}).range(from,from+499);if(q.error){msg('Gagal membaca laporan: '+q.error.message);return}data.push(...(q.data||[]));if((q.data||[]).length<500)break}
 links=[];for(let i=0;i<data.length;i+=400){const ids=data.slice(i,i+400).map(x=>x.id);const q=await sb.from('pjj_report_classes').select('report_id,class_id').in('report_id',ids);if(q.error){msg('Relasi kelas gagal dimuat: '+q.error.message);return}links.push(...(q.data||[]))}
 refreshDates();apply();msg('Rekap berhasil dimuat. '+data.length+' laporan tersedia.');
}
function apply(){const date=$('date').value,cl=$('class').value,sub=$('subject').value;
 view=data.filter(x=>(!date||x.report_date===date)&&(!sub||String(x.subject_id)===sub)&&(!cl||links.some(y=>y.report_id===x.id&&String(y.class_id)===cl)));
 const out=$('rows');out.replaceChildren();
 for(const r of view){const tr=document.createElement('tr');const cls=links.filter(y=>y.report_id===r.id).map(y=>classes.find(c=>String(c.id)===String(y.class_id))?.name).filter(Boolean).join(', ');
 const values=[formatDate(r.report_date),profiles.find(p=>p.id===r.teacher_id)?.full_name||'—',subjects.find(s=>String(s.id)===String(r.subject_id))?.name||'—',cls,`${r.jp_start}–${r.jp_end}`,r.platform,r.material,r.assignment,r.execution_status+(r.obstacle?' — '+r.obstacle:'')];
 for(const v of values)cell(tr,v);
 const d=cell(tr,'');if(r.evidence_link){const a=document.createElement('a');a.href=r.evidence_link;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Tautan ↗';d.append(a)}
 if(r.evidence_path){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Foto';b.onclick=async()=>{const x=await sb.storage.from('pjj-evidence').createSignedUrl(r.evidence_path,120);if(x.error||!x.data?.signedUrl){msg('Tidak dapat membuka foto: '+(x.error?.message||'URL tidak tersedia'));return}window.open(x.data.signedUrl,'_blank','noopener,noreferrer')};d.append(b)}
 if(role==='super_admin'){const a=cell(tr,'');a.className='no-print';const b=document.createElement('button');b.type='button';b.className='danger';b.textContent='Hapus';b.disabled=deleting;b.title='Hapus satu laporan ini secara permanen';b.addEventListener('click',()=>removeReport(r));a.append(b)}
 out.append(tr)}
 $('summary').textContent=view.length+' laporan ditampilkan dari '+data.length+' laporan tersimpan.';
 $('filterInfo').textContent= date?'Tanggal terpilih: '+formatDate(date)+' · Klik Reset untuk semua tanggal.':'Menampilkan '+(view.length===data.length?'semua':'hasil filter')+' laporan. Pilih tanggal dari daftar untuk menyaring.';
}
async function removeReport(r){if(role!=='super_admin'||deleting)return;
 const teacher=profiles.find(p=>p.id===r.teacher_id)?.full_name||'guru';
 const detail=`Tanggal: ${formatDate(r.report_date)}\nGuru: ${teacher}\nMateri: ${r.material||'-'}`;
 if(!window.confirm(`HAPUS SATU LAPORAN PJJ INI?\n\n${detail}\n\nTindakan ini tidak dapat dibatalkan.`))return;
 const answer=window.prompt('Untuk konfirmasi terakhir, ketik HAPUS (huruf kapital):','');if(answer!=='HAPUS'){msg('Penghapusan dibatalkan.');return}
 deleting=true;document.querySelectorAll('#rows button.danger').forEach(b=>b.disabled=true);msg('Menghapus laporan yang dipilih…');
 try{const res=await sb.rpc('admin_delete_pjj_report',{p_report_id:r.id});if(res.error)throw res.error;
  let photoMessage='';if(r.evidence_path){const rm=await sb.storage.from('pjj-evidence').remove([r.evidence_path]);if(rm.error)photoMessage=' Foto lama belum terhapus dari Storage; hubungi admin untuk pembersihan.'}
  await load();msg('Satu laporan berhasil dihapus secara permanen.'+photoMessage);
 }catch(e){msg('Gagal menghapus: '+(e?.message||String(e))+'. Pastikan SQL izin hapus Tahap 6B telah dijalankan.');}
 finally{deleting=false;document.querySelectorAll('#rows button.danger').forEach(b=>b.disabled=false)}
}
$('filter').addEventListener('click',apply);
$('date').addEventListener('change',apply);
$('clear').addEventListener('click',()=>{$('date').value='';$('class').value='';$('subject').value='';apply();msg('Filter direset. Semua laporan ditampilkan.')});
$('print').addEventListener('click',()=>window.print());
$('csv').addEventListener('click',()=>{const headers=['Tanggal','Guru','Mapel','Kelas','JP','Media','Materi','Tugas','Status','Kendala','Tautan bukti','Foto tersimpan'];const body=view.map(r=>{const cls=links.filter(x=>x.report_id===r.id).map(x=>classes.find(c=>String(c.id)===String(x.class_id))?.name).filter(Boolean).join('; ');return[r.report_date,profiles.find(p=>p.id===r.teacher_id)?.full_name,subjects.find(s=>String(s.id)===String(r.subject_id))?.name,cls,`${r.jp_start}-${r.jp_end}`,r.platform,r.material,r.assignment,r.execution_status,r.obstacle,r.evidence_link,r.evidence_path?'Ya':'Tidak']});const content='\uFEFF'+[headers,...body].map(x=>x.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Rekap_PJJ_SMANPA_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('year').textContent=new Date().getFullYear();init().catch(e=>msg('Kesalahan memuat rekap: '+(e?.message||String(e))));
})();