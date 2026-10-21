/* ── Permission matrix shared by Lainnya & Admin pages ──────────────────── */
import type { Role } from './types';

export const JOINT_PERMISSIONS: { label: string; roles: Role[] }[] = [
  { label: 'Melihat checklist tugas sesuai shift & jabatan', roles: ['admin', 'kepala_koki', 'wakil_koki', 'anggota'] },
  { label: 'Mencentang tugas & menambah keterangan/foto bukti', roles: ['admin', 'kepala_koki', 'wakil_koki', 'anggota'] },
  { label: 'Mengirim laporan harian ke atasan', roles: ['anggota', 'wakil_koki'] },
  { label: 'Melihat checklist & laporan seluruh anggota tim', roles: ['admin', 'kepala_koki', 'wakil_koki'] },
  { label: 'Memantau pekerjaan yang terlambat & mengingatkan anggota', roles: ['admin', 'kepala_koki', 'wakil_koki'] },
  { label: 'Melakukan verifikasi & approval laporan (setujui / revisi / tolak)', roles: ['admin', 'kepala_koki'] },
  { label: 'Memberikan catatan evaluasi kepada tim', roles: ['admin', 'kepala_koki'] },
  { label: 'Menerima notifikasi masalah & laporan penting', roles: ['admin', 'kepala_koki', 'wakil_koki'] },
  { label: 'Mengajukan purchase request pengadaan bahan', roles: ['admin', 'kepala_koki', 'wakil_koki', 'anggota'] },
  { label: 'Menyetujui purchase request & pengeluaran', roles: ['admin', 'kepala_koki'] },
  { label: 'Membuat laporan ringkasan ke Kepala Koki', roles: ['wakil_koki'] },
  { label: 'Mengelola akun anggota: tambah, ubah, nonaktifkan, reset password', roles: ['admin'] },
  { label: 'Mengatur jadwal kerja shift & jam reminder', roles: ['admin'] },
  { label: 'Mengatur template daftar checklist per posisi & shift', roles: ['admin'] },
  { label: 'Mengatur email penerima laporan harian', roles: ['admin'] },
  { label: 'Melihat seluruh laporan & riwayat aktivitas (audit log)', roles: ['admin', 'kepala_koki'] },
  { label: 'Mengakses panel pengaturan restoran (nama, cabang, target)', roles: ['admin'] },
  { label: 'Menghapus / mengubah data checklist milik orang lain', roles: ['admin'] },
];

export const roleColor: Record<Role, string> = {
  admin: 'bg-violet-100 text-violet-800 border-violet-300',
  kepala_koki: 'bg-amber-100 text-amber-900 border-amber-300',
  wakil_koki: 'bg-teal-100 text-teal-800 border-teal-300',
  anggota: 'bg-sky-100 text-sky-800 border-sky-300',
};
