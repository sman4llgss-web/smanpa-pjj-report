# SMANPA PJJ REPORT — GitHub Pages Ready

Paket ini berisi **website statis Tahap 6B Perbaikan**. Tidak berisi database, SQL, daftar akun, password guru, atau kode Edge Function. Backend Supabase yang sudah aktif **tetap dipakai**, tidak perlu instal ulang.

## Cara paling sederhana (GitHub melalui browser)
1. **Cadangkan website lama** dan pastikan Tahap 6B versi perbaikan sudah diuji secara lokal, terutama filter tanggal, Reset, serta penghapusan laporan.
2. Masuk ke https://github.com/ lalu buat repository baru, contoh `smanpa-pjj-report`. **Pilih Private dahulu** saat pemeriksaan keamanan. GitHub Pages pada repository private bergantung pada jenis akun/plan; jika tidak tersedia, jangan ubah menjadi Public sebelum seluruh pemeriksaan keamanan selesai.
3. Buka repository > **Add file > Upload files**. Unggah **isi folder ini**, bukan folder induknya. Pastikan `index.html` berada di root repository bersama `config.js`.
4. Commit changes. Pada repository yang mendukung GitHub Pages, buka **Settings > Pages > Build and deployment**, pilih **Deploy from a branch**, branch `main`, folder `/(root)`, kemudian Save.
5. Alamat website biasanya `https://NAMA-AKUN.github.io/smanpa-pjj-report/`. Tunggu GitHub Pages selesai menerbitkan situs.
6. Di Supabase > Authentication > URL Configuration, sesuaikan **Site URL / Redirect URLs** dengan alamat situs yang benar **jika alur autentikasi memerlukan redirect**. Pertahankan URL lama bila masih digunakan; tambahkan URL baru pada allow list sesuai kebutuhan.
7. Uji login guru dan Super Admin, simpan laporan percobaan, buka foto bukti, filter tanggal, Reset, ekspor, cetak, dan tombol Hapus dengan akun berwenang.

## PENTING: Pemeriksaan keamanan sebelum membuat repository Public
- Jangan unggah Excel daftar 58 username/password, hasil ekspor laporan, dokumen identitas, screenshot sensitif, SQL, `.env`, atau Secret Supabase.
- `config.js` memuat **Supabase anon key** (bukan service_role). Anon key boleh ada di frontend **hanya jika** RLS pada tabel dan Storage sudah benar; anon key tidak boleh dianggap rahasia.
- Uji menggunakan akun guru A dan guru B: guru A tidak dapat membaca/mengubah/menghapus laporan atau foto guru B; pengguna anonim tidak dapat membaca data guru/laporan atau foto private.
- Uji akun admin_kurikulum: tidak boleh memperoleh hak menghapus laporan bila kebijakan hanya mengizinkan super_admin. **Menyembunyikan tombol di browser bukan pengamanan.**
- Pastikan Edge Function `manage-teacher-account` memeriksa peran Super Admin **di server**, dan kunci service_role hanya berada di Secret server.
- **Catatan dari audit kode:** `auth.js` memuat alamat email admin yang tertanam untuk pemetaan login `admin.smanpa`. Itu bukan password, tetapi dapat terlihat oleh publik. Pertimbangkan mengganti pemetaan login admin dengan cara yang tidak mengekspos email pribadi sebelum repository dipublikasikan.
- Password awal yang sama bagi seluruh guru berisiko. Minta seluruh guru mengganti password awal; idealnya gunakan password unik atau reset per akun.
- GitHub Pages adalah hosting statis: backend Supabase dan koneksi internet tetap dibutuhkan. GitHub Pages bukan penyimpanan aman untuk data guru.

## Berkas dalam paket
`index.html`, halaman dashboard/guru/laporan/monitoring/rekap/periode, file CSS/JS pendukung, `assets/`, `config.js`, `.nojekyll`, `.gitignore`, dan panduan ini.

## Pemulihan
Jika ada masalah setelah deploy, gunakan folder website lokal yang dicadangkan; deployment GitHub Pages tidak mengubah data Supabase.
