/* ── LAPORAN MASALAH — bahan habis, alat rusak, kebersihan, keselamatan ─── */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, PackageX, Wrench, Sparkles, Siren, MoreHorizontal, Plus, Send,
  Loader2, CheckCircle2, CircleDot, Clock3, Flame, Search, X, Camera,
} from 'lucide-react';
import { useStore, can } from '../lib/store';
import { Avatar, Modal, SeverityBadge, EmptyState, SectionHead } from '../components/ui';
import { fmtShort, todayStr, nowTime, IssueCategory, IssueSeverity, IssueStatus } from '../lib/types';
import { fileToDataURL } from '../lib/seed';

const CATEGORY: Record<IssueCategory, { label: string; icon: React.ReactNode; cls: string }> = {
  bahan_habis: { label: 'Bahan Habis', icon: <PackageX size={14} />, cls: 'bg-orange-50 text-orange-800 border-orange-200' },
  alat_rusak: { label: 'Alat Rusak', icon: <Wrench size={14} />, cls: 'bg-red-50 text-red-800 border-red-200' },
  kebersihan: { label: 'Kebersihan', icon: <Sparkles size={14} />, cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  keselamatan: { label: 'Keselamatan', icon: <Siren size={14} />, cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  lainnya: { label: 'Lainnya', icon: <MoreHorizontal size={14} />, cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};
const ISSUE_STATUS: Record<IssueStatus, { label: string; cls: string }> = {
  terbuka: { label: 'Terbuka', cls: 'bg-red-100 text-red-800' },
  diproses: { label: 'Diproses', cls: 'bg-amber-100 text-amber-800' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800' },
};

export default function Issues() {
  const { state, dispatch, currentUser } = useStore();
  const me = currentUser!;
  const db = state.db;
  const canManage = can.updateIssues(me.role);

  const [tab, setTab] = useState<'daftar' | 'baru'>('daftar');
  const [filter, setFilter] = useState<'semua' | IssueStatus>('semua');
  const [query, setQuery] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();

  // form
  const [category, setCategory] = useState<IssueCategory>('bahan_habis');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('sedang');
  const [assignee, setAssignee] = useState('');
  const [busy, setBusy] = useState(false);

  const issues = useMemo(() => db.issues
    .filter(i => (filter === 'semua' || i.status === filter))
    .filter(i => !query || `${i.title} ${i.detail}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [db.issues, filter, query]);

  const openCount = db.issues.filter(i => i.status !== 'selesai').length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !detail.trim()) return;
    setBusy(true);
    setTimeout(() => {
      dispatch({
        type: 'ADD_ISSUE',
        issue: { reporterId: me.id, category, title: title.trim(), detail: detail.trim(), severity, assigneeId: assignee || undefined, photo },
      });
      setTitle(''); setDetail(''); setSeverity('sedang'); setCategory('bahan_habis'); setAssignee(''); setPhoto(undefined);
      setBusy(false); setTab('daftar');
    }, 600);
  };

  const assignees = db.users.filter(u => u.active && (u.role === 'wakil_koki' || u.role === 'kepala_koki' || u.role === 'anggota'));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display font-extrabold text-navy-900 text-2xl flex items-center gap-2"><ShieldAlert size={22} className="text-navy-700" /> Laporan Masalah</h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Bahan habis · alat rusak · kebersihan · keselamatan — <b className="text-navy-800">{openCount} masalah terbuka</b> yang perlu tindak lanjut.</p>
        </div>
        <div className="sm:ml-auto flex rounded-2xl bg-slate-200/60 p-1 self-start">
          <button onClick={() => setTab('daftar')} className={`px-4 h-10 rounded-xl text-[11.5px] font-extrabold transition-all ${tab === 'daftar' ? 'bg-white shadow text-navy-900' : 'text-slate-500'}`}>Daftar Masalah</button>
          <button onClick={() => setTab('baru')} className={`px-4 h-10 rounded-xl text-[11.5px] font-extrabold transition-all flex items-center gap-1.5 ${tab === 'baru' ? 'bg-navy-900 shadow text-white' : 'text-slate-500'}`}><Plus size={15} /> Lapor Baru</button>
        </div>
      </div>

      {tab === 'baru' ? (
        <form onSubmit={submit} className="card p-5 sm:p-6 max-w-2xl">
          <SectionHead icon={<Flame size={15} />} title="Lapor Masalah ke Atasan" />
          {/* category picker */}
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-1.5">Kategori</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(CATEGORY) as IssueCategory[]).map(c => (
              <button type="button" key={c} onClick={() => setCategory(c)}
                className={`rounded-2xl border-2 px-2 py-3 flex flex-col items-center gap-1.5 transition-all ${category === c ? 'border-navy-900 bg-navy-900 text-gold-400 scale-[1.03] shadow-lg' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-navy-400'}`}>
                {CATEGORY[c].icon}
                <span className={`text-[9px] font-extrabold uppercase tracking-wide ${category === c ? 'text-white' : ''}`}>{CATEGORY[c].label}</span>
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <div className="sm:col-span-2">
              <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400" htmlFor="it">Judul Masalah *</label>
              <input id="it" value={title} onChange={e => setTitle(e.target.value)} required placeholder="mis. Kompor line 2 api tidak stabil" className="mt-1.5 w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-navy-200" />
            </div>
            <div>
              <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400" htmlFor="sev">Tingkat Urgensi</label>
              <select id="sev" value={severity} onChange={e => setSeverity(e.target.value as IssueSeverity)} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-[12.5px] font-bold focus:outline-none">
                <option value="rendah">Rendah</option><option value="sedang">Sedang</option><option value="tinggi">Tinggi</option><option value="kritis">KRITIS</option>
              </select>
            </div>
          </div>
          <label className="block text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mt-3" htmlFor="det">Detail &amp; Dampak *</label>
          <textarea id="det" value={detail} onChange={e => setDetail(e.target.value)} required rows={3} placeholder="Jelaskan kondisi, lokasi, dampak ke operasional, dan apa yang sudah dilakukan…" className="mt-1.5 w-full px-4 py-3 rounded-xl border border-slate-200 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-navy-200 resize-none" />
          <div className="grid sm:grid-cols-2 gap-3 mt-3 items-end">
            <div>
              <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400" htmlFor="asg">Tugaskan Kepada</label>
              <select id="asg" value={assignee} onChange={e => setAssignee(e.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-[12.5px] font-bold focus:outline-none">
                <option value="">— Kepala Koki / Wakil Koki (otomatis) —</option>
                {assignees.map(u => <option key={u.id} value={u.id}>{u.name.split(',')[0]} ({u.role === 'wakil_koki' ? 'Wakil' : u.role === 'kepala_koki' ? 'Kepala' : 'Anggota'})</option>)}
              </select>
            </div>
            <div>
              <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setPhoto(await fileToDataURL(f)); }} />
              <label htmlFor="photo-input" className="h-11 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-navy-500 hover:text-navy-800 cursor-pointer text-[11px] font-extrabold transition-all">
                {photo ? <><img src={photo} alt="" className="h-8 w-8 rounded-lg object-cover" /> Foto terlampir ✓</> : <><Camera size={17} /> Lampirkan Foto</>}
              </label>
            </div>
          </div>
          <button type="submit" disabled={busy} className="mt-4 w-full h-13 py-4 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 transition-all disabled:opacity-60">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Kirim Laporan ke Kepala Koki
          </button>
          <p className="text-[9px] font-semibold text-slate-400 text-center mt-2">Laporan langsung masuk ke notifikasi Kepala Koki, Wakil Koki, dan Owner.</p>
        </form>
      ) : (
        <>
          {/* filter bar */}
          <div className="card p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari masalah…" className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-100 text-[13px] font-medium" aria-label="Cari masalah" />
            </div>
            <div className="flex gap-1.5">
              {(['semua', 'terbuka', 'diproses', 'selesai'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`h-11 px-4 rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all ${filter === f ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {issues.length === 0 && <div className="card"><EmptyState icon={<CheckCircle2 size={30} />} title="Tidak ada masalah pada filter ini" hint="Semua bersih. Pertahankan standar kebersihan & keamanan dapur!" /></div>}
            {issues.map(issue => {
              const reporter = db.users.find(u => u.id === issue.reporterId);
              const assigneeUser = issue.assigneeId ? db.users.find(u => u.id === issue.assigneeId) : undefined;
              const cat = CATEGORY[issue.category];
              return (
                <motion.div layout key={issue.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${cat.cls}`}>{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SeverityBadge severity={issue.severity} />
                      <p className="text-[12.5px] font-extrabold text-navy-900 leading-snug">{issue.title}</p>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 leading-snug line-clamp-2">{issue.detail}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[8.5px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Avatar initials={reporter?.initials ?? '??'} color={reporter?.color ?? '#64748b'} size={14} />{reporter?.name.split(' ')[0]} · {fmtShort(issue.date)} {issue.time}</span>
                      {assigneeUser && <span>→ ditugaskan ke <b className="text-navy-800">{assigneeUser.name.split(' ')[0]}</b></span>}
                      {issue.resolution && <span className="text-emerald-700">✓ {issue.resolution.slice(0, 70)}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex sm:flex-col items-center gap-2">
                    <span className={`text-[8.5px] font-extrabold uppercase tracking-widest rounded-full px-2.5 py-1 ${ISSUE_STATUS[issue.status].cls}`}>{ISSUE_STATUS[issue.status].label}</span>
                    {canManage && issue.status !== 'selesai' && (
                      <div className="flex gap-1">
                        {issue.status === 'terbuka' && <button onClick={() => dispatch({ type: 'UPDATE_ISSUE', issueId: issue.id, patch: { status: 'diproses' } })} className="h-8 px-2.5 rounded-lg bg-amber-500 text-white text-[9px] font-extrabold uppercase">Proses</button>}
                        <button onClick={() => dispatch({ type: 'UPDATE_ISSUE', issueId: issue.id, patch: { status: 'selesai', resolution: 'Ditangani & diverifikasi oleh ' + me.name.split(' ')[0] } })} className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white text-[9px] font-extrabold uppercase">Selesai</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
