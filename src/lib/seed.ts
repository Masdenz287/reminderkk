/* ── Indonesian realistic seed dataset (first-run database) ─────────────── */
import {
  ActivityDay, AuditLog, ChecklistTask, DB, Issue, Notification, PurchaseRequest,
  Role, Shift, TaskEntry, User, id, nowTime, todayStr,
} from './types';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const at = (dayOffset: number, time: string) => {
  const d = new Date(); d.setDate(d.getDate() - dayOffset);
  const [h, m] = time.split(':').map(Number); d.setHours(h, m, 0, 0);
  const now = new Date();
  if (d > now) return now.toISOString();
  return d.toISOString();
};

export const SEED_USERS: User[] = [
  { id: 'u-admin', email: 'admin@nusarasa.co.id', username: 'admin', password: 'admin123', name: 'Baskara Wira', initials: 'BW', role: 'admin', position: 'Admin / Owner', shift: 'pagi', phone: '0812-8000-1122', joinDate: '2019-03-11', active: true, color: '#7c3aed' },
  { id: 'u-dewi', email: 'dewi.lestari@nusarasa.co.id', username: 'dewi', password: 'dewi123', name: 'Dewi Lestari, S.Sos.', initials: 'DL', role: 'kepala_koki', position: 'Kepala Koki / Head Chef', shift: 'pagi', phone: '0813-2244-8899', joinDate: '2020-06-01', active: true, color: '#0b2440' },
  { id: 'u-raka', email: 'raka.saputra@nusarasa.co.id', username: 'raka', password: 'raka123', name: 'Raka Saputra', initials: 'RS', role: 'wakil_koki', position: 'Wakil Koki / Sous Chef', shift: 'pagi', phone: '0818-7712-3345', joinDate: '2021-02-15', active: true, color: '#0f766e' },
  { id: 'u-sari', email: 'sari.wulandari@nusarasa.co.id', username: 'sari', password: 'sari123', name: 'Sari Wulandari', initials: 'SW', role: 'anggota', position: 'Juru Masak / Line Cook', shift: 'pagi', phone: '0821-5567-9012', joinDate: '2022-09-19', active: true, color: '#b45309' },
  { id: 'u-bagus', email: 'bagus.pratama@nusarasa.co.id', username: 'bagus', password: 'bagus123', name: 'Bagus Pratama', initials: 'BP', role: 'anggota', position: 'Prep Cook / Commis', shift: 'pagi', phone: '0856-4432-7788', joinDate: '2023-01-09', active: true, color: '#be185d' },
  { id: 'u-maya', email: 'maya.anggraini@nusarasa.co.id', username: 'maya', password: 'maya123', name: 'Maya Anggraini', initials: 'MA', role: 'anggota', position: 'Steward / Kitchen Porter', shift: 'pagi', phone: '0819-3321-5566', joinDate: '2023-07-03', active: true, color: '#1d4ed8' },
  { id: 'u-dimas', email: 'dimas.nugroho@nusarasa.co.id', username: 'dimas', password: 'dimas123', name: 'Dimas Nugroho', initials: 'DN', role: 'anggota', position: 'Pastry & Bakery', shift: 'siang', phone: '0877-9988-1234', joinDate: '2024-04-22', active: true, color: '#047857' },
  { id: 'u-putri', email: 'putri.handayani@nusarasa.co.id', username: 'putri', password: 'putri123', name: 'Putri Handayani', initials: 'PH', role: 'anggota', position: 'Juru Masak / Line Cook', shift: 'siang', phone: '0852-1122-3344', joinDate: '2022-11-28', active: true, color: '#9333ea' },
  { id: 'u-hendra', email: 'hendra.gunawan@nusarasa.co.id', username: 'hendra', password: 'hendra123', name: 'Hendra Gunawan', initials: 'HG', role: 'wakil_koki', position: 'Wakil Koki / Sous Chef', shift: 'siang', phone: '0811-6677-8899', joinDate: '2021-08-16', active: true, color: '#0369a1' },
  { id: 'u-yoga', email: 'yoga.firmansyah@nusarasa.co.id', username: 'yoga', password: 'yoga123', name: 'Yoga Firmansyah', initials: 'YF', role: 'anggota', position: 'Night Cook', shift: 'malam', phone: '0822-3344-5566', joinDate: '2024-09-02', active: false, color: '#475569' },
];

const T = (positionKey: string, shift: Shift | 'semua', section: ChecklistTask['section'], title: string, targetTime: string, requiresPhoto = false, mandatory = true): ChecklistTask =>
  ({ id: id(), positionKey, shift, section, title, targetTime, requiresPhoto, mandatory });

export const buildSeedTasks = (): ChecklistTask[] => [
  // ── Sari — Juru Masak / Line Cook (pagi) ──
  T('u-sari', 'pagi', 'pembukaan', 'Cek suhu freezer & chiller, catat di log HACCP', '06:30', false),
  T('u-sari', 'pagi', 'pembukaan', 'Cuci tangan & kenakan APD lengkap (celemek, sarung tangan, penutup kepala)', '06:45'),
  T('u-sari', 'pagi', 'pembukaan', 'Sanitisasi meja kerja & talenan dengan chlorine 100ppm', '06:50', true),
  T('u-sari', 'pagi', 'persiapan', 'Siapkan bumbu dasar: bawang, cabe, rempah giling', '07:30'),
  T('u-sari', 'pagi', 'persiapan', 'Potong & portion protein harian (ayam, sapi, ikan) sesuai par stock', '08:30', true),
  T('u-sari', 'pagi', 'persiapan', 'Masak kaldu/stock utama (kaldu ayam 8L)', '09:00'),
  T('u-sari', 'pagi', 'pelayanan', 'Plating sesuai standar & suhu penyajian ≥ 65°C', '11:00'),
  T('u-sari', 'pagi', 'pelayanan', 'Cek kualitas 5 menu andalah sebelum service', '11:15'),
  T('u-sari', 'pagi', 'closing', 'Bersihkan kompor & area line, matikan api & gas', '13:30', true),
  T('u-sari', 'pagi', 'kebersihan', 'Buang sampah organik ke TPS, cuci bak sampah', '13:45'),

  // ── Bagus — Prep Cook (pagi) ──
  T('u-bagus', 'pagi', 'pembukaan', 'Cek kedatangan bahan baku dari supplier, timbang & cocokkan surat jalan', '06:30', true),
  T('u-bagus', 'pagi', 'pembukaan', 'Inspeksi kesegaran sayur & protein (warna, aroma, tekstur)', '06:45'),
  T('u-bagus', 'pagi', 'persiapan', 'Cuci & potong sayuran sesuai prep list harian', '08:00'),
  T('u-bagus', 'pagi', 'persiapan', 'Marinasi daging sesuai resep & label tanggal (first expired first out)', '08:30', true),
  T('u-bagus', 'pagi', 'persiapan', 'Siapkan garnish: daun bawang, seledri, cabe rawit', '09:30'),
  T('u-bagus', 'pagi', 'closing', 'Simpan sisa bahan di wadah tertutup + label (nama, tanggal, jam)', '13:30'),
  T('u-bagus', 'pagi', 'kebersihan', 'Bersihkan bak cuci & tiriskan peralatan prep', '14:00'),

  // ── Maya — Steward (pagi) ──
  T('u-maya', 'pagi', 'pembukaan', 'Nyalakan mesin cuci & cek ketersediaan sabun serta sanitizer', '06:30'),
  T('u-maya', 'pagi', 'pembukaan', 'Cuci peralatan yang dipakai semalam & simpan pada rak kering', '07:30'),
  T('u-maya', 'pagi', 'pelayanan', 'Angkut kotor dari dining ke area cuci tiap 15 menit', '11:00'),
  T('u-maya', 'pagi', 'closing', 'Cuci & rack semua peralatan service, bersihkan floor drain', '14:00', true),
  T('u-maya', 'pagi', 'kebersihan', 'Pel lantai kitchen dengan disinfektan, cek toilet staf', '14:15'),

  // ── Dimas — Pastry & Bakery (siang) ──
  T('u-dimas', 'siang', 'pembukaan', 'Cek suhu proofing cabinet & oven (180–220°C)', '14:30'),
  T('u-dimas', 'siang', 'persiapan', 'Siapkan adonan croissant & brioche untuk besok', '15:30', true),
  T('u-dimas', 'siang', 'persiapan', 'Produksi kue harian: banana cake, lapis legit, brownies', '16:30', true),
  T('u-dimas', 'siang', 'pelayanan', 'Display dessert di etalase, rotasi FEFO, cek suhu display ≤ 5°C', '17:30'),
  T('u-dimas', 'siang', 'closing', 'Bersihkan mixer & meja pastry, matikan oven', '21:30', true),

  // ── Putri — Line Cook (siang) ──
  T('u-putri', 'siang', 'pembukaan', 'Serah terima dari shift pagi (par stock, info menu 86\'d)', '14:15'),
  T('u-putri', 'siang', 'persiapan', 'Siapkan mise en place dinner: saus, sambal, kondimen', '15:30'),
  T('u-putri', 'siang', 'pelayanan', 'Eksekusi pesanan sesuai SOP plating & suhu', '18:00'),
  T('u-putri', 'siang', 'pelayanan', 'Quality check 10 pesanan acak sebelum diantar', '19:00'),
  T('u-putri', 'siang', 'closing', 'Shutdown line: matikan peralatan, tutup & label bahan', '21:45', true),

  // ── Hendra — Wakil Koki (siang) ──
  T('u-hendra', 'siang', 'pembukaan', 'Briefing shift siang: target, 86 menu, alergi tamu VIP', '14:05'),
  T('u-hendra', 'siang', 'pelayanan', 'Monitor kualitas & kecepatan line service, intervensi jika backlog > 5 order', '18:30'),
  T('u-hendra', 'siang', 'closing', 'Verifikasi closing checklist anggota shift siang', '22:00'),

  // ── Dewi (Kepala Koki) — pengawasan harian ──
  T('u-dewi', 'semua', 'pembukaan', 'Inspeksi operasional pembukaan: suhu, APD, sanitasi', '06:20'),
  T('u-dewi', 'semua', 'pelayanan', 'Tasting menu harian & koreksi seasoning bila perlu', '10:30'),
  T('u-dewi', 'semua', 'closing', 'Review & approve laporan harian seluruh shift', '22:15'),

  // ── Raka (Wakil Koki) ──
  T('u-raka', 'semua', 'pembukaan', 'Briefing pagi: pembagian station & target produksi', '06:10'),
  T('u-raka', 'semua', 'pelayanan', 'Kontrol par stock & ajukan purchase request bila menipis', '10:00'),
  T('u-raka', 'semua', 'closing', 'Verifikasi checklist anggota & susun laporan ke Kepala Koki', '22:30'),

  // ── Admin ──
  T('u-admin', 'semua', 'pembukaan', 'Review ringkasan operasional kemarin & buka laporan hari ini', '07:00'),
  T('u-admin', 'semua', 'closing', 'Cek rekap penjualan vs. food cost, arsipkan dokumen', '22:45'),
];
export const shiftOf = (u: User) => u.shift;
export const roleOfUser = (u: User): Role => u.role;

/* ── seeded completion for past days ──────────────────────────────────────── */
const entry = (taskId: string, by: User, dayOffset: number, time: string, status: TaskEntry['status'] = 'ok', notes = ''): TaskEntry =>
  ({ taskId, checked: status !== 'tidak_berlaku', status, notes, completedBy: by.id, completedAt: at(dayOffset, time) });

const pickShiftUsers = (users: User[], shift: Shift) => users.filter(u => u.shift === shift);

export function buildSeedDB(): DB {
  const users = SEED_USERS.map(u => ({ ...u }));
  const byId = (i: string) => users.find(u => u.id === i)!;
  const tasks = buildSeedTasks();

  const days: ActivityDay[] = [];
  // Past 9 days with realistic completion for Sari/Bagus/Maya + partial siang
  for (let d = 9; d >= 1; d--) {
    const date = daysAgo(d);
    // Shift pagi — strong completion, occasional issue
    const pagiTasks = tasks.filter(t => ['u-sari', 'u-bagus', 'u-maya', 'u-dewi', 'u-raka'].includes(t.positionKey) && (t.shift === 'pagi' || t.shift === 'semua'));
    const entries: Record<string, TaskEntry> = {};
    pagiTasks.forEach((t, idx) => {
      const owner = byId(t.positionKey);
      const complete = d > 2 ? true : idx < pagiTasks.length - 2; // recent day: 2 pending
      if (complete) {
        const st: TaskEntry['status'] = (d === 4 && idx === 3) ? 'perlu_perbaikan' : 'ok';
        entries[t.id] = entry(t.id, owner, d, t.targetTime.replace(/^(\d{2}):/, (m, h) => `${String(Math.min(23, Number(h) + (idx % 3))).padStart(2, '0')}:`), st, st === 'perlu_perbaikan' ? 'Bumbu kurang garam — sudah dikoreksi jam 09.15' : '');
      }
    });
    days.push({
      date, shift: 'pagi', entries,
      submittedAt: at(d, '13:58'),
      status: d === 1 ? 'menunggu' : d === 2 ? 'menunggu' : d === 4 ? 'revisi' : 'disetujui',
      reviewerNote: d === 4 ? 'Sanitasi meja prep belum foto — lampirkan bukti besok.' : d >= 3 ? 'Kerja bagus, pertahankan standar.' : undefined,
      reviewedBy: d >= 3 ? 'u-dewi' : undefined,
      reviewedAt: d >= 3 ? at(d - 1, '22:20') : undefined,
    });
    // Shift siang — dimas/putri/hendra
    const siangTasks = tasks.filter(t => ['u-dimas', 'u-putri', 'u-hendra'].includes(t.positionKey));
    const sEntries: Record<string, TaskEntry> = {};
    siangTasks.forEach((t, idx) => {
      const owner = byId(t.positionKey);
      const complete = d > 1 || idx < siangTasks.length - 1;
      if (complete) sEntries[t.id] = entry(t.id, owner, d, t.targetTime, 'ok', '');
    });
    days.push({
      date, shift: 'siang', entries: sEntries,
      submittedAt: at(d, '22:05'),
      status: d === 1 ? 'menunggu' : 'disetujui',
      reviewerNote: d === 1 ? undefined : 'Siap untuk besok.',
      reviewedBy: d === 1 ? undefined : 'u-dewi',
      reviewedAt: d === 1 ? undefined : at(d, '22:30'),
    });
  }

  // ── Today: partial progress (in-progress kitchen) ──
  const today = todayStr();
  const todayEntries: Record<string, TaskEntry> = {};
  const morningTeam = ['u-sari', 'u-bagus', 'u-maya'];
  const pagiToday = tasks.filter(t => morningTeam.includes(t.positionKey));
  pagiToday.forEach((t, idx) => {
    const owner = byId(t.positionKey);
    if (idx < 12) {
      const st: TaskEntry['status'] = idx === 4 ? 'perlu_perbaikan' : 'ok';
      todayEntries[t.id] = entry(t.id, owner, 0, t.targetTime, st,
        st === 'perlu_perbaikan' ? 'Stok ikan kakap tinggal 2 ekor — perlu restok hari ini' : (t.requiresPhoto ? '' : ''));
    }
  });
  // Dewi & Raka today's oversight partially done
  tasks.filter(t => ['u-dewi', 'u-raka'].includes(t.positionKey)).slice(0, 2).forEach(t => {
    todayEntries[t.id] = entry(t.id, byId(t.positionKey), 0, t.targetTime, 'ok', '');
  });
  days.push({ date: today, shift: 'pagi', entries: todayEntries, status: 'menunggu' as const });

  const issues: Issue[] = [
    { id: 'i-1', date: today, time: '06:47', reporterId: 'u-bagus', category: 'bahan_habis', title: 'Ikan kakap segar hampir habis', detail: 'Sisa 2 ekor di chiller, kebutuhan hari ini 8 ekor untuk menu kakap bakar & sup. Estimasi habis sebelum lunch.', severity: 'tinggi', status: 'terbuka', assigneeId: 'u-raka' },
    { id: 'i-2', date: today, time: '07:20', reporterId: 'u-sari', category: 'alat_rusak', title: 'Kompor line 2 api tidak stabil', detail: 'Api kecil & kuning, kemungkinan regulator atau injector tersumbat. Line 2 dipakai untuk tumisan, berisiko menghambat service.', severity: 'kritis', status: 'diproses', assigneeId: 'u-raka' },
    { id: 'i-3', date: daysAgo(1), time: '09:12', reporterId: 'u-maya', category: 'kebersihan', title: 'Genangan air di depan floor drain', detail: 'Lantai area cuci licin, sudah diberi tanda peringatan. Perlu dicek saluran drain-nya.', severity: 'sedang', status: 'selesai', assigneeId: 'u-maya', resolution: 'Drain dibersihkan, aliran kembali lancar. Lantai kering & aman.' },
    { id: 'i-4', date: daysAgo(1), time: '12:40', reporterId: 'u-sari', category: 'keselamatan', title: 'APAR dapur expired', detail: 'Masa berlaku APAR unit dekat freezer berakhir bulan lalu. Perlu servis/refill.', severity: 'tinggi', status: 'selesai', assigneeId: 'u-dewi', resolution: 'APAR sudah ditukar unit baru, masa berlaku s/d 2027-10.' },
    { id: 'i-5', date: daysAgo(2), time: '16:05', reporterId: 'u-dimas', category: 'bahan_habis', title: 'Butter tawar habis', detail: 'Stok butter habis, produksi croissant besok terancam. Perlu purchase request segera.', severity: 'sedang', status: 'selesai', assigneeId: 'u-hendra', resolution: 'PR disetujui & dibeli dari supplier pagi ini, terima barang 05.30.' },
    { id: 'i-6', date: daysAgo(3), time: '10:25', reporterId: 'u-bagus', category: 'lainnya', title: 'Supplier terlambat antar telur', detail: 'Telur datang terlambat 2 jam, prep tertunda. Mohon follow-up ke supplier langganan.', severity: 'rendah', status: 'selesai', resolution: 'Supplier konfirmasi jadwal kirim diperbaiki mulai minggu depan.' },
  ];

  const notifications: Notification[] = [
    { id: 'n-1', date: today, time: '06:00', type: 'reminder', title: 'Reminder: Checklist Pembukaan', body: 'Shift pagi dimulai 06.00 — jangan lupa sanitasi & cek suhu freezer sebelum 06.50.', read: false, targetRoles: ['anggota', 'wakil_koki', 'kepala_koki', 'admin'] },
    { id: 'n-2', date: today, time: '06:47', type: 'bahan_habis', title: 'BAHAN HABIS: Ikan Kakap', body: 'Sisa 2 ekor — Bagus melaporkan kekurangan ikan kakap untuk service hari ini.', read: false, targetRoles: ['kepala_koki', 'wakil_koki', 'admin'] },
    { id: 'n-3', date: today, time: '07:20', type: 'masalah', title: 'KRITIS: Kompor Line 2 Rusak', body: 'Api tidak stabil di line 2. Raka sedang menangani. Mohon waspadai bottleneck service.', read: false, targetRoles: ['kepala_koki', 'wakil_koki', 'admin'] },
    { id: 'n-4', date: today, time: '07:00', type: 'approval', title: '2 Laporan Menunggu Approval', body: 'Laporan shift pagi kemarin & shift siang kemarin menunggu review Kepala Koki.', read: false, targetRoles: ['kepala_koki', 'admin'] },
    { id: 'n-5', date: today, time: '09:30', type: 'terlambat', title: 'Tugas Terlambat: Dimas', body: 'Tugas "Siapkan adonan croissant" melewati jam target 15.30+... menunggu update shift siang.', read: true, targetRoles: ['wakil_koki', 'kepala_koki'] },
    { id: 'n-6', date: daysAgo(1), time: '13:58', type: 'approval', title: 'Laporan Shift Pagi Dikirim', body: 'Sari, Bagus & Maya mengirim laporan harian (14/14 tugas). Menunggu approval.', read: true, targetRoles: ['kepala_koki', 'admin'] },
    { id: 'n-7', date: daysAgo(1), time: '22:30', type: 'sukses', title: 'Laporan Disetujui', body: 'Kepala Koki menyetujui laporan shift siang kemarin dengan catatan "Siap untuk besok."', read: true, targetRoles: ['wakil_koki', 'anggota'] },
    { id: 'n-8', date: daysAgo(2), time: '09:12', type: 'kebersihan', title: 'Temuan Kebersihan', body: 'Genangan air di area cuci dilaporkan Maya — sudah diselesaikan & diverifikasi.', read: true, targetRoles: ['kepala_koki', 'wakil_koki', 'admin'] },
    { id: 'n-9', date: daysAgo(2), time: '07:30', type: 'info', title: 'Jadwal: Maintenance Exhaust Hood', body: 'Pembersihan exhaust hood dijadwalkan Minggu, 26 Oktober 2026 pukul 10.00 bersama vendor.', read: true, targetRoles: ['admin', 'kepala_koki', 'wakil_koki', 'anggota'] },
  ];

  const audit: AuditLog[] = [
    { id: id(), date: today, time: '07:20', userId: 'u-sari', action: 'LAPOR MASALAH', detail: 'Kompor line 2 — api tidak stabil (KRITIS)' },
    { id: id(), date: today, time: '06:47', userId: 'u-bagus', action: 'LAPOR MASALAH', detail: 'Ikan kakap tersisa 2 ekor' },
    { id: id(), date: today, time: '06:35', userId: 'u-sari', action: 'CHECKLIST', detail: 'Menyelesaikan 6 dari 10 tugas shift pagi' },
    { id: id(), date: daysAgo(1), time: '22:30', userId: 'u-dewi', action: 'APPROVAL', detail: 'Menyetujui laporan shift siang (12/12 tugas)' },
    { id: id(), date: daysAgo(1), time: '22:15', userId: 'u-dewi', action: 'APPROVAL', detail: 'Catatan revisi untuk shift pagi: lampirkan foto sanitasi' },
    { id: id(), date: daysAgo(1), time: '13:58', userId: 'u-raka', action: 'LAPORAN DIKIRIM', detail: 'Laporan shift pagi dikirim ke Kepala Koki' },
    { id: id(), date: daysAgo(2), time: '09:15', userId: 'u-maya', action: 'MASALAH SELESAI', detail: 'Floor drain area cuci kembali lancar' },
    { id: id(), date: daysAgo(2), time: '08:02', userId: 'u-admin', action: 'AKUN', detail: 'Reset password akun dimas.nugroho (permintaan sendiri)' },
    { id: id(), date: daysAgo(3), time: '17:45', userId: 'u-admin', action: 'PENGATURAN', detail: 'Email penerima laporan ditambah: owner@nusarasa.co.id' },
    { id: id(), date: daysAgo(4), time: '15:10', userId: 'u-admin', action: 'CHECKLIST', detail: 'Template checklist diperbarui: tambah cek suhu display pastry' },
  ];

  const purchases: PurchaseRequest[] = [
    { id: 'pr-1', date: today, userId: 'u-raka', item: 'Ikan kakap segar', qty: '10 ekor', reason: 'Kebutuhan service hari ini — sisa 2 ekor', status: 'diajukan' },
    { id: 'pr-2', date: daysAgo(2), userId: 'u-raka', item: 'Butter tawar Anchor 1kg', qty: '6 pack', reason: 'Stok habis untuk produksi pastry', status: 'dibeli' },
    { id: 'pr-3', date: daysAgo(5), userId: 'u-hendra', item: 'Sanitizer chlorine tablet', qty: '2 kaleng', reason: 'Stok sanitizer menipis', status: 'dibeli' },
  ];

  const settings: DB['settings'] = {
    restaurantName: 'Restoran Nusa Rasa',
    branch: 'Cabang Kemang — Jl. Kemang Raya No. 88, Jakarta Selatan',
    operationalDateMode: 'today',
    reportRecipients: ['owner@nusarasa.co.id', 'dewi.lestari@nusarasa.co.id', 'raka.saputra@nusarasa.co.id'],
    reminderRules: [
      { id: 'rr-1', label: 'Reminder buka checklist shift pagi', time: '06:00', enabled: true, target: 'Semua anggota shift pagi' },
      { id: 'rr-2', label: 'Reminder buka checklist shift siang', time: '14:00', enabled: true, target: 'Semua anggota shift siang' },
      { id: 'rr-3', label: 'Peringatan tugas belum dicentang (H+30 mnt dari jam target)', time: 'AUTO', enabled: true, target: 'Wakil & Kepala Koki' },
      { id: 'rr-4', label: 'Eskalasi tugas kritis terlambat (H+60 mnt)', time: 'AUTO', enabled: true, target: 'Kepala Koki & Owner' },
      { id: 'rr-5', label: 'Reminder kirim laporan harian', time: '13:30', enabled: true, target: 'Semua shift' },
      { id: 'rr-6', label: 'Ringkasan email laporan harian', time: '22:45', enabled: true, target: 'owner@nusarasa.co.id + Kepala Koki' },
    ],
    weeklyTarget: 95,
  };

  return { users, tasks, days, issues, notifications, audit, settings, purchases };
}

/* photo helper: downscale an uploaded image to a small JPEG dataURL */
export function fileToDataURL(file: File, maxSize = 480, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject; img.src = String(reader.result);
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}
