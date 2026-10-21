/* ── KUNJUNGAN — inspeksi & kunjungan operasional dapur ──────────────────── */
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardCheck, ShieldCheck, Thermometer, Droplets, Trash2, Zap, Flame,
  Snowflake, CalendarClock, CheckCircle2, AlertTriangle, XCircle, Plus,
  ArrowRightCircle, Siren, PackageX, ShoppingCart, BadgeCheck, CircleDot,
  ClipboardList, Send, Loader2,
} from 'lucide-react';
import { useStore, can } from '../lib/store';
import { Avatar, Modal, SeverityBadge, SectionHead, ProgressBar } from '../components/ui';
import { fmtShort, todayStr, fmtDateID, ROLE_LABEL } from '../lib/types';
import type { IssueCategory, IssueSeverity } from '../lib/types';

type PointStatus = 'pass' | 'warn' | 'fail';
interface InspectPoint { id: string; label: string; detail: string; icon: React.ReactNode; }
interface StationZone { id: string; name: string; icon: React.ReactNode; points: InspectPoint[]; }

const ZONES: StationZone[] = [
  { id: 'receiving', name: 'Receiving & Storage', icon: <Snowflake size={16} />, points: [
    { id: 'rec-1', label: 'Suhu chiller 0–4°C', detail: 'Catat suhu di log HACCP pagi hari', icon: <Thermometer size={14} /> },
    { id: 'rec-2', label: 'Suhu freezer ≤ −18°C', detail: 'Bekukan total, food packaging rapi & berlabel', icon: <Snowflake size={14} /> },
    { id: 'rec-3', label: 'Tanggal kedaluwarsa (FEFO)', detail: 'Tidak ada bahan kedaluwarsa di stok', icon: <CalendarClock size={14} /> },
    { id: 'rec-4', label: 'Kondisi bahan dari supplier', detail: 'Kesegaran, suhu, dan surat jalan sesuai', icon: <PackageX size={14} /> },
  ]},
  { id: 'prep', name: 'Prep Area', icon: <ClipboardList size={16} />, points: [
    { id: 'prep-1', label: 'Talenan & pisau tersanitisasi', detail: 'Warna talenan sesuai jenis bahan', icon: <Droplets size={14} /> },
    { id: 'prep-2', label: 'Permukaan kerja bersih', detail: 'Larutan chlorine 100ppm tersedia', icon: <Droplets size={14} /> },
    { id: 'prep-3', label: 'Label & FIFO pada wadah', detail: 'Nama, tanggal, jam produksi tercantum', icon: <ClipboardList size={14} /> },
  ]},
  { id: 'line', name: 'Hot Line / Cooking', icon: <Flame size={16} />, points: [
    { id: 'line-1', label: 'Kompor & api stabil', detail: 'Semua burner menyala normal, tidak bocor gas', icon: <Flame size={14} /> },
    { id: 'line-2', label: 'Suhu penyajian ≥ 65°C', detail: 'Makanan panas diukur sebelum keluar', icon: <Thermometer size={14} /> },
    { id: 'line-3', label: 'Gas & regulator aman', detail: 'Tidak ada kebocoran, selang layak pakai', icon: <Siren size={14} /> },
  ]},
  { id: 'sanitation', name: 'Sanitasi & Limbah', icon: <Trash2 size={16} />, points: [
    { id: 'san-1', label: 'Tempat sampah tertutup & bersih', detail: 'Sampah dibuang sebelum penuh, bak dicuci', icon: <Trash2 size={14} /> },
    { id: 'san-2', label: 'Floor drain tidak tersumbat', detail: 'Lantai kering, tidak ada genangan', icon: <Droplets size={14} /> },
    { id: 'san-3', label: 'Toilet staf layak', detail: 'Sabun, air mengalir, ventilasi baik', icon: <Droplets size={14} /> },
  ]},
  { id: 'safety', name: 'Keselamatan & Keamanan', icon: <Zap size={16} />, points: [
    { id: 'saf-1', label: 'APAR tidak kedaluwarsa', detail: 'Pin tersegel, tekanan normal', icon: <ShieldCheck size={14} /> },
    { id: 'saf-2', label: 'Jalur evakuasi bebas hambatan', detail: 'Tidak ada barang menumpuk di jalur', icon: <Zap size={14} /> },
    { id: 'saf-3', label: 'First aid kit lengkap', detail: 'Kotak P3K tersegel & mudah dijangkau', icon: <BadgeCheck size={14} /> },
  ]},
];

const STATUS_CFG: Record<PointStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pass: { label: 'Lolos', cls: 'bg-emerald-500 text-white border-emerald-600', icon: <CheckCircle2 size={13} /> },
  warn: { label: 'Perlu Cek', cls: 'bg-amber-400 text-amber-950 border-amber-500', icon: <AlertTriangle size={13} /> },
  fail: { label: 'Gagal', cls: 'bg-red-600 text-white border-red-700', icon: <XCircle size={13} /> },
};

interface Visit {
  id: string; date: string; visitorId: string; zoneScores: Record<string, PointStatus>;
  summary: string; followUp: boolean; createdAt: string;
}

export default function Kunjungan() {
  const { state, dispatch, currentUser } = useStore();
  const me = currentUser!;
  const db = state.db;
  const today = todayStr();
  const canInspect = me.role === 'admin' || me.role === 'kepala_koki' || me.role === 'wakil_koki';

  const [zone, setZone] = useState(ZONES[0].id);
  const [marks, setMarks] = useState<Record<string, PointStatus>>(() => seedTodayMarks());
  const [summary, setSummary] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prModal, setPrModal] = useState(false);
  const [prItem, setPrItem] = useState(''); const [prQty, setPrQty] = useState(''); const [prReason, setPrReason] = useState('');

  function seedTodayMarks(): Record<string, PointStatus> {
    // demo: a couple of points already assessed this morning
    const m: Record<string, PointStatus> = {};
    ZONES.flatMap(z => z.points).slice(0, 4).forEach((p, i) => { m[p.id] = i === 3 ? 'warn' : 'pass'; });
    return m;
  }

  const activeZone = ZONES.find(z => z.id === zone)!;
  const allPoints = ZONES.flatMap(z => z.points.map(p => ({ ...p, zone: z.name })));
  const marked = allPoints.filter(p => marks[p.id]);
  const passCount = allPoints.filter(p => marks[p.id] === 'pass').length;
  const warnCount = allPoints.filter(p => marks[p.id] === 'warn').length;
  const failCount = allPoints.filter(p => marks[p.id] === 'fail').length;
  const pctDone = Math.round((marked.length / allPoints.length) * 100);

  const zoneStats = (z: StationZone) => {
    const m = z.points.map(p => marks[p.id]);
    const done = m.filter(Boolean).length;
    const fail = m.filter(x => x === 'fail').length;
    const warn = m.filter(x => x === 'warn').length;
    const score = z.points.length ? Math.round((m.filter(x => x === 'pass').length / z.points.length) * 100) : 0;
    return { done, fail, warn, score, total: z.points.length };
  };

  const cycle = (id: string) => setMarks(m => {
    const order: PointStatus[] = ['pass', 'warn', 'fail'];
    const cur = m[id];
    const next = cur ? order[(order.indexOf(cur) + 1) % 3] : 'pass';
    return { ...m, [id]: next };
  });

  const submitInspection = () => {
    setSaving(true);
    setTimeout(() => {
      const res = failCount > 0 ? 'KRITIS' : warnCount > 0 ? 'PERLU TINDAK LANJUT' : 'LULUS';
      dispatch({
        type: 'ADD_NOTIF',
        notif: {
          type: failCount > 0 ? 'masalah' : 'sukses',
          title: `Inspeksi Kunjungan: ${res}`,
          body: `${me.name} menyelesaikan inspeksi 5 zona — ${passCount} lolos, ${warnCount} perlu cek, ${failCount} gagal. ${summary ? `Catatan: ${summary.slice(0, 120)}` : ''}`,
          targetRoles: ['kepala_koki', 'wakil_koki', 'admin'], link: '/kunjungan',
        },
      });
      if (followUp && (failCount > 0 || warnCount > 0)) {
        const bad = allPoints.filter(p => marks[p.id] === 'fail' || marks[p.id] === 'warn').map(p => p.label).join('; ');
        dispatch({
          type: 'ADD_ISSUE',
          issue: {
            reporterId: me.id, category: 'kebersihan' as IssueCategory,
            title: 'Temuan dari Inspeksi Kunjungan',
            detail: `Item bermasalah: ${bad}.${summary ? ` Catatan: ${summary}` : ''}`,
            severity: failCount > 0 ? 'tinggi' as IssueSeverity : 'sedang' as IssueSeverity,
            assigneeId: undefined,
          },
        });
      }
      setSummary(''); setFollowUp(false); setSaving(false);
    }, 800);
  };

  const submitPR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prItem.trim() || !prQty.trim()) return;
    dispatch({ type: 'ADD_PURCHASE', item: prItem.trim(), qty: prQty.trim(), reason: prReason.trim() || 'Pengadaan bahan operasional', userId: me.id });
    setPrItem(''); setPrQty(''); setPrReason(''); setPrModal(false);
  };

  const pendingPRs = db.purchases.filter(p => p.status !== 'dibeli');

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display font-extrabold text-navy-900 text-2xl flex items-center gap-2"><ClipboardCheck size={22} className="text-navy-700" /> Kunjungan &amp; Inspeksi</h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Audit walk-through 5 zona kritis dapur — {fmtDateID(today).split(',')[0]} · {canInspect ? 'Anda dapat menilai & menyimpan hasil inspeksi.' : 'Tampilan hasil — penilaian dilakukan atasan.'}</p>
        </div>
        <button onClick={() => setPrModal(true)} className="sm:ml-auto inline-flex items-center gap-2 px-4 h-11 rounded-2xl border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white text-[11.5px] font-extrabold transition-all self-start">
          <ShoppingCart size={16} /> Ajukan Purchase Request
        </button>
      </div>

      {/* progress overview */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Kelengkapan Inspeksi Hari Ini</p>
            <p className="font-display font-extrabold text-2xl text-navy-900 mt-0.5">{marked.length}<span className="text-slate-300 text-lg">/{allPoints.length}</span> <span className="text-sm font-sans font-bold text-slate-500">titik diperiksa</span></p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-extrabold">
            <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={15} /> {passCount} Lolos</span>
            <span className="flex items-center gap-1.5 text-amber-700"><AlertTriangle size={15} /> {warnCount} Cek</span>
            <span className="flex items-center gap-1.5 text-red-700"><XCircle size={15} /> {failCount} Gagal</span>
          </div>
        </div>
        <div className="mt-2.5"><ProgressBar pct={pctDone} height={9} striped={false} /></div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* zone tabs */}
        <div className="lg:col-span-2 space-y-2">
          {ZONES.map(z => {
            const s = zoneStats(z);
            const isActive = zone === z.id;
            return (
              <button key={z.id} onClick={() => setZone(z.id)}
                className={`card w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all group ${isActive ? 'ring-2 ring-navy-900 border-navy-900 shadow-lg' : 'hover:border-navy-300'}`}>
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-navy-900 text-gold-400' : 'bg-navy-50 text-navy-800 group-hover:bg-navy-100'}`}>{z.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-extrabold text-navy-900">{z.name}</span>
                    <span className={`text-[9px] font-extrabold tabular-nums ${s.fail > 0 ? 'text-red-600' : s.warn > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.done}/{s.total}</span>
                  </span>
                  <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.fail > 0 ? `${s.fail} GAGAL` : s.warn > 0 ? `${s.warn} perlu cek` : s.done === s.total ? 'LULUS LENGKAP' : 'Belum lengkap'}</span>
                  <span className="block mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden"><span className="block h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(s.done / s.total) * 100}%` }} /></span>
                </span>
                <ArrowRightCircle size={17} className={`shrink-0 transition-all ${isActive ? 'text-navy-900 translate-x-0.5' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* active zone checklist */}
        <div className="lg:col-span-3 card overflow-hidden self-start">
          <div className="px-5 py-4 bg-navy-50/70 border-b border-navy-100 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center">{activeZone.icon}</span>
            <div><p className="font-display font-bold text-navy-900">{activeZone.name}</p><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ketuk kartu untuk menilai: Lolos → Perlu Cek → Gagal</p></div>
          </div>
          <div className="divide-y divide-slate-100">
            {activeZone.points.map(p => {
              const st = marks[p.id];
              const cfg = st ? STATUS_CFG[st] : null;
              return (
                <button key={p.id} disabled={!canInspect} onClick={() => cycle(p.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors disabled:cursor-default">
                  <span className="w-9 h-9 rounded-xl bg-slate-100 text-navy-800 flex items-center justify-center shrink-0">{p.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold text-slate-800 leading-snug">{p.label}</span>
                    <span className="block text-[10px] font-medium text-slate-400 mt-0.5">{p.detail}</span>
                  </span>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-[9.5px] font-extrabold uppercase tracking-wider min-w-[86px] justify-center transition-all ${cfg ? cfg.cls : 'border-dashed border-slate-300 text-slate-400 bg-white'}`}>{cfg ? <>{cfg.icon}{cfg.label}</> : 'Menilai…'}</span>
                </button>
              );
            })}
          </div>
          {/* summary + submit */}
          {canInspect && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60">
              <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder="Catatan inspeksi… (temuan, rekomendasi, orang yang dihubungi)"
                className="w-full text-[12px] font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy-200 resize-none" />
              <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)} className="w-5 h-5 rounded accent-navy-900" />
                <span className="text-[11px] font-bold text-slate-600">Buat tindak lanjut otomatis sebagai Laporan Masalah bila ada titik gagal/perlu cek</span>
              </label>
              <button onClick={submitInspection} disabled={saving || marked.length === 0}
                className="mt-3 w-full h-12 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white text-[12px] font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Simpan &amp; Kirim Hasil Inspeksi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* pending purchase requests */}
      <div className="card p-4 sm:p-5">
        <SectionHead icon={<ShoppingCart size={15} />} title="Purchase Request Berjalan" right={<span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{pendingPRs.length} aktif</span>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {pendingPRs.map(pr => {
            const u = db.users.find(x => x.id === pr.userId);
            return (
              <div key={pr.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-extrabold text-navy-900 leading-snug">{pr.item}</span>
                  <span className={`text-[8.5px] font-extrabold uppercase tracking-widest rounded-full px-2 py-1 shrink-0 ${pr.status === 'diajukan' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{pr.status}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-1">{pr.qty} · oleh {u?.name.split(' ')[0]} · {fmtShort(pr.date)}</p>
                <p className="text-[9.5px] font-medium text-slate-500 mt-1 leading-snug flex-1">{pr.reason}</p>
                {(me.role === 'admin' || me.role === 'kepala_koki') && (
                  <div className="flex gap-1.5 mt-2">
                    {pr.status === 'diajukan' && <button onClick={() => dispatch({ type: 'SET_PURCHASE_STATUS', purchaseId: pr.id, status: 'disetujui' })} className="flex-1 h-8 rounded-lg bg-emerald-600 text-white text-[9.5px] font-extrabold uppercase tracking-wider">Setujui</button>}
                    {pr.status === 'disetujui' && <button onClick={() => dispatch({ type: 'SET_PURCHASE_STATUS', purchaseId: pr.id, status: 'dibeli' })} className="flex-1 h-8 rounded-lg bg-navy-900 text-white text-[9.5px] font-extrabold uppercase tracking-wider">Sudah Dibeli</button>}
                  </div>
                )}
              </div>
            );
          })}
          {pendingPRs.length === 0 && <p className="text-[11px] font-semibold text-slate-400 py-4 col-span-full text-center">Tidak ada purchase request aktif. Ajukan di tombol kanan atas.</p>}
        </div>
      </div>

      {/* PR modal */}
      <Modal open={prModal} onClose={() => setPrModal(false)} title="Ajukan Purchase Request" subtitle="Pengadaan bahan / peralatan yang kurang di dapur">
        <form onSubmit={submitPR} className="space-y-3">
          <input value={prItem} onChange={e => setPrItem(e.target.value)} placeholder="Nama barang (mis. Ikan kakap segar)" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-navy-200" required />
          <input value={prQty} onChange={e => setPrQty(e.target.value)} placeholder="Jumlah (mis. 10 ekor / 5 kg)" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-navy-200" required />
          <textarea value={prReason} onChange={e => setPrReason(e.target.value)} rows={2} placeholder="Alasan / kebutuhan (opsional)" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-navy-200 resize-none" />
          <button type="submit" className="w-full h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-[12.5px] flex items-center justify-center gap-2"><Send size={17} /> Kirim ke Kepala Koki / Owner</button>
        </form>
      </Modal>
    </div>
  );
}
