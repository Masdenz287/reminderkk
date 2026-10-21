/* ── RIWAYAT — arsip laporan harian + approval Kepala Koki + cetak/export ── */
import React, { useEffect, useMemo, useState } from 'react';
import {
  History, Search, Printer, ChevronRight, BadgeCheck, Clock, CheckCircle2,
  XCircle, FileEdit, Filter, FileText, Sun, MoonStar, CloudSun,
  Stamp, NotebookPen,
} from 'lucide-react';
import { useStore, can } from '../lib/store';
import { Modal, ReportStatusBadge, StatusBadge, EmptyState } from '../components/ui';
import { fmtDateID, fmtShort, SECTION_META, SectionKey, Shift, SHIFT_LABEL, todayStr } from '../lib/types';

const SHIFT_ICON: Record<Shift, React.ReactNode> = {
  pagi: <Sun size={15} />, siang: <CloudSun size={15} />, malam: <MoonStar size={15} />,
};

interface DayRow {
  date: string; shift: Shift;
  entries: Record<string, import('../lib/types').TaskEntry>;
  submittedAt?: string; status: import('../lib/types').ReportStatus;
  reviewerNote?: string; reviewedBy?: string; reviewedAt?: string;
}

export default function Riwayat() {
  const { state, dispatch, currentUser } = useStore();
  const me = currentUser!;
  const db = state.db;
  const isPrivileged = can.viewReports(me.role);
  const canApprove = can.approveReports(me.role);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'menunggu' | 'disetujui' | 'revisi' | 'ditolak'>('semua');
  const [shiftFilter, setShiftFilter] = useState<'semua' | Shift>('semua');
  const [selected, setSelected] = useState<DayRow | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // visible days: own always; privileged see all
  const allDays = useMemo(() => {
    let rows = [...db.days];
    if (!isPrivileged) rows = rows.filter(d => d.shift === me.shift && db.users.some(u => u.shift === d.shift));
    // role anggota only own shift
    return rows.sort((a, b) => (b.date + b.shift).localeCompare(a.date + a.shift));
  }, [db.days, isPrivileged, me.shift]);

  const filtered = allDays.filter(d => {
    if (statusFilter !== 'semua' && d.status !== statusFilter) return false;
    if (shiftFilter !== 'semua' && d.shift !== shiftFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      const dayTasks = db.tasks.filter(t => t.shift === 'semua' || t.shift === d.shift);
      const hitTask = dayTasks.some(t => t.title.toLowerCase().includes(q));
      const hitNote = Object.values(d.entries).some(e => (e.notes || '').toLowerCase().includes(q));
      if (!hitTask && !hitNote) return false;
    }
    return true;
  });

  const stats = {
    total: allDays.length,
    menunggu: allDays.filter(d => d.status === 'menunggu').length,
    disetujui: allDays.filter(d => d.status === 'disetujui').length,
    avgPct: (() => {
      if (!allDays.length) return 0;
      const pcts = allDays.map(d => dayPct(db, d));
      return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    })(),
  };

  function approve(status: 'disetujui' | 'revisi' | 'ditolak') {
    if (!selected) return;
    if (status !== 'disetujui' && !reviewNote.trim()) { setReviewNote(''); dispatch({ type: 'TOAST', toast: { id: 'tmp', title: 'Catatan wajib diisi', body: 'Tuliskan alasan / poin yang perlu diperbaiki tim.', tone: 'err' } }); return; }
    dispatch({ type: 'REVIEW_REPORT', dayDate: selected.date, shift: selected.shift, reviewerId: me.id, status, note: reviewNote.trim() });
    setSelected(null); setReviewNote('');
  }

  useEffect(() => { setReviewNote(selected?.reviewerNote ?? ''); }, [selected?.date, selected?.shift]); // eslint-disable-line

  return (
    <div className="space-y-4 print-page">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 no-print">
        <div>
          <h1 className="font-display font-extrabold text-navy-900 text-2xl flex items-center gap-2"><History size={22} className="text-navy-700" /> Riwayat &amp; Laporan</h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{isPrivileged ? 'Seluruh laporan harian seluruh shift — periksa, beri catatan, dan setujui.' : 'Arsip laporan harian shift Anda.'}</p>
        </div>
        <button onClick={() => window.print()} className="sm:ml-auto inline-flex items-center gap-2 px-4 h-11 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white text-[11.5px] font-extrabold transition-all self-start sm:self-auto">
          <Printer size={16} /> Cetak / PDF
        </button>
      </div>

      {/* stat chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 no-print">
        {[
          { label: 'Total Laporan', value: stats.total, cls: 'text-navy-900', icon: <FileText size={16} /> },
          { label: 'Menunggu Approval', value: stats.menunggu, cls: 'text-amber-600', icon: <Clock size={16} /> },
          { label: 'Disetujui', value: stats.disetujui, cls: 'text-emerald-600', icon: <BadgeCheck size={16} /> },
          { label: 'Rata-rata Penyelesaian', value: `${stats.avgPct}%`, cls: 'text-sky-700', icon: <CheckCircle2 size={16} /> },
        ].map((s, i) => (
          <div key={i} className="card px-3.5 py-3 flex items-center gap-3">
            <span className={`w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 ${s.cls}`}>{s.icon}</span>
            <span><p className={`font-display font-extrabold text-lg leading-none ${s.cls}`}>{s.value}</p><p className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">{s.label}</p></span>
          </div>
        ))}
      </div>

      {/* search + filters */}
      <div className="card p-3 flex flex-col md:flex-row gap-2 no-print">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari tugas atau keterangan di laporan…" className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100 text-[13px] font-medium transition-all" aria-label="Cari di laporan" />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700 focus:outline-none" aria-label="Filter status">
              <option value="semua">Semua Status</option><option value="menunggu">Menunggu</option><option value="disetujui">Disetujui</option><option value="revisi">Revisi</option><option value="ditolak">Ditolak</option>
            </select>
          </div>
          <select value={shiftFilter} onChange={e => setShiftFilter(e.target.value as typeof shiftFilter)} className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700 focus:outline-none" aria-label="Filter shift">
            <option value="semua">Semua Shift</option><option value="pagi">Shift Pagi</option><option value="siang">Shift Siang</option><option value="malam">Shift Malam</option>
          </select>
        </div>
      </div>

      {/* ══ PRINT HEADER (only visible when printing) ══ */}
      <div className="hidden print:block mb-4">
        <h1 className="font-display font-extrabold text-2xl text-navy-900">Restoran Nusa Rasa — Rekap Laporan Dapur</h1>
        <p className="text-xs font-semibold text-slate-600">Cabang Kemang · Dicetak {fmtDateID(todayStr())} oleh {me.name} ({SHIFT_LABEL[me.shift]})</p>
      </div>

      {/* list */}
      <div className="space-y-2">
        {filtered.length === 0 && <div className="card"><EmptyState icon={<History size={30} />} title="Tidak ada laporan ditemukan" hint="Ubah kata pencarian atau filter status/shift di atas." /></div>}
        {filtered.map(d => {
          const pct = dayPct(db, d);
          const totalTasks = tasksForShift(db.tasks, d.shift).length;
          const doneTasks = Object.values(d.entries).filter(e => e.checked).length;
          const noted = Object.values(d.entries).filter(e => e.status === 'perlu_perbaikan').length;
          return (
            <button key={d.date + d.shift} onClick={() => setSelected(d)} className="card w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-3 sm:gap-4 hover:border-navy-400 hover:shadow-lg transition-all group print:break-inside-avoid">
              <span className="w-11 h-11 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center shrink-0">{SHIFT_ICON[d.shift]}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] font-extrabold text-navy-900">{fmtShort(d.date)} · {d.shift === 'pagi' ? 'Shift Pagi' : d.shift === 'siang' ? 'Shift Siang' : 'Shift Malam'}</span>
                  <ReportStatusBadge status={d.status} />
                  {noted > 0 && <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">{noted} perbaikan</span>}
                </span>
                <span className="block text-[9.5px] font-semibold text-slate-500 mt-1">{doneTasks}/{totalTasks} tugas · {d.submittedAt ? `Dikirim ${new Date(d.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Belum dikirim'}{d.reviewerNote ? ` · "${d.reviewerNote.slice(0, 80)}${d.reviewerNote.length > 80 ? '…' : ''}"` : ''}</span>
                <span className="block mt-1.5 h-1.5 w-full max-w-[260px] bg-slate-100 rounded-full overflow-hidden"><span className="block h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} /></span>
              </span>
              <span className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-display font-extrabold text-lg text-navy-900 tabular-nums">{pct}<span className="text-[11px]">%</span></span>
                <ChevronRight size={17} className="text-slate-300 group-hover:text-navy-700 group-hover:translate-x-0.5 transition-all" />
              </span>
            </button>
          );
        })}
      </div>

      {/* ════════ DETAIL / APPROVAL MODAL ════════ */}
      <Modal open={!!selected} onClose={() => setSelected(null)} wide
        title={selected ? `Laporan — ${fmtDateID(selected.date)}` : ''}
        subtitle={selected ? `${SHIFT_LABEL[selected.shift]} · Restoran Nusa Rasa Cabang Kemang` : ''}>
        {selected && (
          <div>
            {/* summary strip */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <ReportStatusBadge status={selected.status} />
              <span className="text-[10.5px] font-bold text-slate-500">Penyelesaian: <b className="text-navy-900">{dayPct(db, selected)}%</b> ({Object.values(selected.entries).filter(e => e.checked).length}/{tasksForShift(db.tasks, selected.shift).length} tugas)</span>
              {selected.reviewedBy && <span className="text-[10.5px] font-bold text-slate-500">· Diperiksa oleh <b className="text-navy-900">{db.users.find(u => u.id === selected.reviewedBy)?.name.split(',')[0]}</b></span>}
            </div>

            {/* task breakdown */}
            <div className="space-y-3 max-h-[38vh] overflow-y-auto nice-scroll pr-1">
              {(Object.keys(SECTION_META) as SectionKey[]).map(secKey => {
                const secTasks = tasksForShift(db.tasks, selected.shift).filter(t => t.section === secKey);
                if (!secTasks.length) return null;
                const secDone = secTasks.filter(t => selected.entries[t.id]?.checked).length;
                return (
                  <div key={secKey}>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-1.5">{SECTION_META[secKey].label} · {secDone}/{secTasks.length}</p>
                    <div className="space-y-1">
                      {secTasks.map(t => {
                        const e = selected.entries[t.id];
                        const owner = db.users.find(u => u.id === t.positionKey);
                        return (
                          <div key={t.id} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 ${e?.checked ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-slate-50'}`}>
                            {e?.checked ? <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-[11.5px] font-bold text-slate-800 leading-snug">{t.title}</p>
                              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Target {t.targetTime} · PIC {owner?.name.split(' ')[0]}{e?.completedAt ? ` · ✓ ${new Date(e.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                              {e?.notes && <p className="text-[10px] font-medium text-slate-600 mt-1 italic border-l-2 border-slate-200 pl-2">“{e.notes}”</p>}
                              {e?.photo && <img src={e.photo} alt="Lampiran" className="mt-1.5 h-20 rounded-lg object-cover ring-1 ring-slate-200" />}
                            </div>
                            {e && <StatusBadge status={e.status} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* reviewer note display */}
            {selected.reviewerNote && !canApprove && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-2.5">
                <NotebookPen size={17} className="text-amber-700 shrink-0 mt-0.5" />
                <div><p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800">Catatan Kepala Koki</p><p className="text-[11.5px] font-semibold text-amber-900 mt-0.5">{selected.reviewerNote}</p></div>
              </div>
            )}

            {/* approval box */}
            {canApprove && (
              <div className="mt-4 rounded-2xl border border-navy-100 bg-navy-50/60 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-navy-800 flex items-center gap-1.5 mb-2"><Stamp size={13} /> Keputusan Kepala Koki</p>
                <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={2} placeholder="Catatan evaluasi untuk tim… (wajib bila meminta revisi / menolak)"
                  className="w-full text-[12px] font-medium bg-white border border-navy-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy-200 resize-none" />
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <button onClick={() => approve('disetujui')} className="flex-1 min-w-[130px] h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11.5px] font-extrabold transition-all active:scale-[0.98]"><CheckCircle2 size={16} /> Setujui</button>
                  <button onClick={() => approve('revisi')} className="flex-1 min-w-[130px] h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-[11.5px] font-extrabold transition-all active:scale-[0.98]"><FileEdit size={16} /> Minta Revisi</button>
                  <button onClick={() => approve('ditolak')} className="flex-1 min-w-[130px] h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11.5px] font-extrabold transition-all active:scale-[0.98]"><XCircle size={16} /> Tolak</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* print footer */}
      <div className="hidden print:block mt-6 pt-4 border-t text-[10px] text-slate-500 font-semibold">Dokumen resmi Dapur Nusa Rasa — ditandatangani oleh Kepala Koki. Dicetak {new Date().toLocaleString('id-ID')} WIB.</div>

      {/* print CSS */}
      <style>{`@media print { body * { visibility: visible; } .no-print { display: none !important; } body { background: #fff; } .card { box-shadow: none; border: 1px solid #ddd; } @page { margin: 14mm; } }`}</style>
    </div>
  );
}

function tasksForShift(dbTasks: import('../lib/types').ChecklistTask[], shift: Shift) {
  return dbTasks.filter(t => t.shift === 'semua' || t.shift === shift);
}
function dayPct(db: import('../lib/types').DB, d: DayRow): number {
  const tasks = tasksForShift(db.tasks, d.shift);
  if (!tasks.length) return 0;
  const na = tasks.filter(t => d.entries[t.id]?.status === 'tidak_berlaku').length;
  const done = tasks.filter(t => d.entries[t.id]?.checked).length;
  return Math.round((done / Math.max(1, tasks.length - na)) * 100);
}
