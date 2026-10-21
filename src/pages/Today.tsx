/* ── HARI INI — checklist harian dapur (per user / per tim untuk atasan) ── */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sunrise, ChefHat, UtensilsCrossed, MoonStar, Sparkles, Camera, Check, X,
  Clock, AlertTriangle, Send, ChevronDown, ChevronUp, BadgeCheck, ImagePlus,
  CalendarDays, UsersRound, CheckCircle2, Store, Loader2, ClipboardCheck,
} from 'lucide-react';
import { useStore, can, progressOf } from '../lib/store';
import { Avatar, ProgressBar, ProgressRing, SectionHead, STATUS_META } from '../components/ui';
import {
  fmtDateID, nowTime, SECTION_META, SectionKey, Shift, SHIFT_LABEL, todayStr,
  ROLE_LABEL, TaskEntry, TaskStatus, User,
} from '../lib/types';
import { fileToDataURL } from '../lib/seed';

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  pembukaan: <Sunrise size={15} />, persiapan: <ChefHat size={15} />,
  pelayanan: <UtensilsCrossed size={15} />, closing: <MoonStar size={15} />, kebersihan: <Sparkles size={15} />,
};

const STATUS_CYCLE: TaskStatus[] = ['ok', 'perlu_perbaikan', 'tidak_berlaku'];

function isLate(time: string): boolean {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
}

export default function Today() {
  const { state, dispatch, currentUser, visibleNotifications } = useStore();
  const me = currentUser!;
  const today = todayStr();
  const db = state.db;

  const isAtasan = can.viewAllChecklists(me.role);
  const [viewUserId, setViewUserId] = useState<string>(me.id);
  useEffect(() => { if (!isAtasan) setViewUserId(me.id); }, [isAtasan, me.id]);

  const viewUser: User = db.users.find(u => u.id === viewUserId) ?? me;
  const shift: Shift = viewUser.shift;
  const isSelf = viewUser.id === me.id;
  const canCheck = isSelf; // checklists only editable by owner
  const canVerify = !isSelf && (me.role === 'admin' || me.role === 'kepala_koki' || me.role === 'wakil_koki');

  const { tasks, pct, done, na, total } = progressOf(db, viewUser, today, shift);
  const day = db.days.find(d => d.date === today && d.shift === shift);
  const entries = day?.entries ?? {};
  const effective = Math.max(1, total - na);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [photoTask, setPhotoTask] = useState<{ taskId: string; src: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sections = useMemo(() => {
    const keys = Object.keys(SECTION_META) as SectionKey[];
    return keys.map(k => ({ key: k, tasks: tasks.filter(t => t.section === k) })).filter(s => s.tasks.length > 0);
  }, [tasks]);

  // team roster for atasan
  const team = useMemo(() => db.users.filter(u => u.role === 'anggota' || (u.role === 'wakil_koki')), [db.users]);
  const teamProgress = team.map(u => ({ u, ...progressOf(db, u, today, u.shift) }));

  const setEntry = (taskId: string, patch: Partial<TaskEntry>) =>
    dispatch({ type: 'SET_TASK', dayDate: today, shift, taskId, patch });

  const toggleTask = (taskId: string) => {
    if (!canCheck) return;
    const cur = entries[taskId];
    setEntry(taskId, { checked: !cur?.checked });
  };
  const cycleStatus = (taskId: string) => {
    if (!canCheck && !canVerify) return;
    const cur = entries[taskId]?.status ?? 'ok';
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
    setEntry(taskId, { status: next });
  };
  const onPhoto = async (taskId: string, file?: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    setEntry(taskId, { photo: dataUrl, checked: true });
  };

  const allDone = done >= effective && effective > 0;
  const submitReport = () => {
    setSubmitting(true);
    setTimeout(() => {
      dispatch({ type: 'SUBMIT_REPORT', dayDate: today, shift, userId: me.id });
      setSubmitting(false);
    }, 700);
  };

  const lateCount = tasks.filter(t => isLate(t.targetTime) && !entries[t.id]?.checked).length;
  const attention = tasks.filter(t => entries[t.id]?.status === 'perlu_perbaikan').length;

  return (
    <div className="space-y-4">

      {/* ════════ HERO STATUS CARD ════════ */}
      <section className="navy-panel rounded-3xl text-white p-4 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-10 opacity-[0.14] pointer-events-none select-none"><ChefHat size={190} strokeWidth={1.1} /></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.24em] text-gold-400">
              <Store size={12} /> {db.settings.restaurantName}
              <span className="text-white/30">•</span>
              <span className="text-sky-100/80 normal-case tracking-normal font-bold">{db.settings.branch}</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-1.5 leading-tight">Checklist <span className="text-gold-400">Hari Ini</span></h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] font-semibold text-sky-100/85">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{fmtDateID(today)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={13} />{SHIFT_LABEL[shift]}</span>
            </div>
            {/* operator line */}
            <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
              <Avatar initials={viewUser.initials} color={viewUser.color} size={40} />
              <div className="leading-tight">
                <p className="text-[12px] font-extrabold text-white flex items-center gap-1.5">{viewUser.name}{isSelf && <span className="text-[8px] bg-gold-400 text-navy-950 rounded-full px-1.5 py-0.5 uppercase tracking-widest">Anda</span>}</p>
                <p className="text-[9.5px] font-bold text-sky-100/75">{viewUser.position} · {ROLE_LABEL[viewUser.role]}</p>
              </div>
            </div>
          </div>

          {/* progress dial */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="relative">
              <ProgressRing pct={pct} size={104} stroke={11} track="rgba(255,255,255,.14)" color={pct >= 100 ? '#34d399' : '#f5b83d'}>
                <span className="font-display font-extrabold text-[19px] text-white leading-none">{pct}<span className="text-[11px]">%</span></span>
                <span className="text-[7px] font-extrabold uppercase tracking-[0.18em] text-sky-200/70 mt-0.5">Selesai</span>
              </ProgressRing>
              {pct >= 100 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-emerald-400 rounded-full p-1.5 ring-4 ring-navy-900"><Check size={13} strokeWidth={4} color="#052e1b" /></motion.span>}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold">
              <div><p className="text-emerald-300 font-display text-lg leading-none">{done}</p><p className="text-sky-100/75 text-[8.5px] uppercase tracking-wider font-extrabold mt-0.5">Selesai</p></div>
              <div><p className="text-amber-300 font-display text-lg leading-none">{effective - done}</p><p className="text-sky-100/75 text-[8.5px] uppercase tracking-wider font-extrabold mt-0.5">Tersisa</p></div>
              <div><p className="text-white/90 font-display text-lg leading-none">{total}</p><p className="text-sky-100/75 text-[8.5px] uppercase tracking-wider font-extrabold mt-0.5">Total Tugas</p></div>
              <div><p className={`font-display text-lg leading-none ${attention > 0 ? 'text-orange-300' : 'text-white/90'}`}>{attention}</p><p className="text-sky-100/75 text-[8.5px] uppercase tracking-wider font-extrabold mt-0.5">Perbaikan</p></div>
            </div>
          </div>
        </div>
        {/* progress bar across */}
        <div className="relative mt-4">
          <div className="flex items-center justify-between text-[8.5px] font-extrabold uppercase tracking-[0.22em] text-sky-200/70 mb-1.5"><span>Progress Penyelesaian</span><span>{done} dari {effective} tugas efektif</span></div>
          <ProgressBar pct={pct} height={12} />
        </div>
      </section>

      {/* ════════ TEAM SWITCHER (atasan) ════════ */}
      {isAtasan && (
        <section className="card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400 flex items-center gap-1.5"><UsersRound size={13} /> Monitoring Tim — {fmtDateID(today).split(',')[0]}</p>
            <span className="text-[9px] font-bold text-slate-400">{teamProgress.filter(t => t.pct >= 100).length}/{teamProgress.length} anggota tuntas</span>
          </div>
          <div className="flex gap-2 overflow-x-auto nice-scroll pt-2 pb-1 -mx-1 px-1">
            {teamProgress.map(({ u, pct: p, done: d, total: t }) => (
              <button key={u.id} onClick={() => setViewUserId(u.id)}
                className={`shrink-0 w-[104px] rounded-2xl border px-2 py-2 text-center transition-all ${viewUserId === u.id ? 'border-navy-900 bg-navy-900 text-white shadow-lg scale-[1.03]' : 'border-slate-200 bg-slate-50 hover:border-navy-400 hover:bg-navy-50'}`}>
                <Avatar initials={u.initials} color={u.color} size={34} className="mx-auto" />
                <p className={`text-[9.5px] font-extrabold mt-1.5 truncate ${viewUserId === u.id ? 'text-white' : 'text-navy-900'}`}>{u.name.split(' ')[0]} {u.name.split(' ')[1]?.[0]}.</p>
                <p className={`text-[7.5px] font-bold uppercase tracking-wider ${viewUserId === u.id ? 'text-sky-200/80' : 'text-slate-400'}`}>{u.shift}</p>
                <div className={`mt-1 h-1.5 rounded-full overflow-hidden ${viewUserId === u.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${p}%` }} />
                </div>
                <p className={`text-[8px] font-extrabold mt-0.5 ${viewUserId === u.id ? 'text-emerald-300' : 'text-slate-500'}`}>{d}/{t} · {p}%</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ════════ LATE WARNING ════════ */}
      {lateCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5">
          <span className="relative flex h-3 w-3"><span className="ping-dot absolute inline-flex h-full w-full rounded-full bg-red-400" /><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" /></span>
          <p className="text-[11px] font-bold text-red-700"><span className="font-extrabold">{lateCount} tugas terlambat</span> melewati jam target dan belum dicentang{isSelf ? '. Segera selesaikan atau laporkan kendala.' : ` oleh ${viewUser.name.split(' ')[0]}.`}</p>
        </div>
      )}

      {/* ════════ TASK SECTIONS ════════ */}
      {sections.map(sec => {
        const secDone = sec.tasks.filter(t => entries[t.id]?.checked).length;
        const isCollapsed = collapsed[sec.key];
        const meta = SECTION_META[sec.key];
        return (
          <section key={sec.key} className="card overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-100 hover:bg-slate-100/70 transition-colors" onClick={() => setCollapsed(c => ({ ...c, [sec.key]: !c[sec.key] }))} aria-expanded={!isCollapsed}>
              <span className="w-8 h-8 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center shrink-0">{SECTION_ICONS[sec.key]}</span>
              <span className="text-left min-w-0">
                <span className="block text-[12px] font-extrabold text-navy-900 uppercase tracking-wide leading-tight">{meta.label}</span>
                <span className="block text-[9px] font-bold text-slate-400 mt-0.5">{secDone}/{sec.tasks.length} selesai</span>
              </span>
              <span className="ml-auto flex items-center gap-2 shrink-0">
                <div className="hidden sm:block w-20"><ProgressBar pct={sec.tasks.length ? (secDone / sec.tasks.length) * 100 : 0} height={6} striped={false} /></div>
                {isCollapsed ? <ChevronDown size={17} className="text-slate-400" /> : <ChevronUp size={17} className="text-slate-400" />}
              </span>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-slate-100">
                {sec.tasks.map(task => {
                  const e: TaskEntry = entries[task.id] ?? { taskId: task.id, checked: false, status: 'ok', notes: '' };
                  const late = isLate(task.targetTime) && !e.checked;
                  const statusMeta = STATUS_META[e.status];
                  return (
                    <motion.div layout key={task.id} className={`px-4 sm:px-5 py-3.5 transition-colors ${e.checked ? 'bg-emerald-50/40' : late ? 'bg-red-50/50' : ''}`}>
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* ── BIG CHECKBOX ── */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          disabled={!canCheck}
                          aria-checked={e.checked} role="checkbox" aria-label={`Tandai selesai: ${task.title}`}
                          className={`shrink-0 mt-0.5 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-[2.5px] flex items-center justify-center transition-all duration-200 ${
                            e.checked
                              ? 'bg-emerald-500 border-emerald-600 shadow-[0_4px_14px_-2px_rgba(16,185,129,.5)] scale-100'
                              : canCheck
                                ? 'bg-white border-slate-300 hover:border-emerald-500 hover:shadow-[0_4px_14px_-4px_rgba(16,185,129,.4)] active:scale-90'
                                : 'bg-slate-100 border-slate-200 cursor-not-allowed'
                          }`}>
                          <AnimatePresence>
                            {e.checked && <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}><Check size={26} strokeWidth={3.4} color="#fff" /></motion.span>}
                          </AnimatePresence>
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* task line: name + time + status */}
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[13px] font-bold leading-snug ${e.checked ? 'text-emerald-900' : 'text-slate-800'}`}>{task.title}{task.mandatory && <span className="text-red-500" title="Wajib"> *</span>}</p>
                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-extrabold tabular-nums ${late ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : 'bg-slate-100 text-slate-500'}`}>
                              <Clock size={10} />{task.targetTime}{late && ' LATE'}
                            </span>
                          </div>

                          {/* meta row: status chip (cycle) + completion + photo */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <button onClick={() => cycleStatus(task.id)} disabled={!canCheck && !canVerify}
                              title={canCheck || canVerify ? 'Ketuk untuk ubah status' : undefined}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-extrabold uppercase tracking-wide transition-all ${statusMeta.cls} ${(canCheck || canVerify) ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />{statusMeta.label}
                            </button>

                            {e.checked && e.completedAt && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-extrabold text-emerald-800">
                                <BadgeCheck size={10} /> Selesai {new Date(e.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                {e.completedBy && e.completedBy !== viewUser.id && <> · oleh {db.users.find(u => u.id === e.completedBy)?.name.split(' ')[0]}</>}
                              </span>
                            )}
                            {task.requiresPhoto && !e.photo && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 border border-violet-200 text-[9px] font-extrabold text-violet-700"><Camera size={10} /> Foto wajib</span>}

                            {/* photo attach / view */}
                            <input ref={el => { fileRefs.current[task.id] = el; }} type="file" accept="image/*" capture="environment" className="hidden" onChange={ev => onPhoto(task.id, ev.target.files?.[0])} />
                            {e.photo ? (
                              <button onClick={() => setPhotoTask({ taskId: task.id, src: e.photo! })} className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-slate-100 border border-slate-200 hover:border-navy-400 transition-all">
                                <img src={e.photo} alt="Bukti" className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300" />
                                <span className="text-[9px] font-extrabold text-navy-800">Lihat Bukti</span>
                              </button>
                            ) : canCheck && (
                              <button onClick={() => fileRefs.current[task.id]?.click()} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-slate-300 text-[9px] font-extrabold text-slate-500 hover:border-navy-500 hover:text-navy-800 transition-all">
                                <ImagePlus size={11} /> Lampirkan Foto
                              </button>
                            )}
                          </div>

                          {/* ── KETERANGAN — always visible ── */}
                          <div className="mt-2">
                            <textarea
                              value={e.notes}
                              disabled={!canCheck}
                              onChange={ev => setEntry(task.id, { notes: ev.target.value })}
                              placeholder={canCheck ? 'Keterangan… (suhu, kendala, bahan yang kurang, dll.)' : 'Belum ada keterangan'}
                              rows={1}
                              className="w-full resize-none text-[11.5px] font-medium text-slate-700 placeholder-slate-400 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-navy-500 rounded-xl px-3 py-2 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-navy-100 transition-all disabled:opacity-70"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* ════════ SUBMIT BAR ════════ */}
      <section className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 sticky bottom-[4.5rem] md:bottom-4 z-30 shadow-2xl border-navy-100">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {allDone
            ? <span className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={24} /></span>
            : <span className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><AlertTriangle size={22} /></span>}
          <div className="min-w-0">
            <p className="text-[12.5px] font-extrabold text-navy-900 leading-snug">{allDone ? 'Semua tugas efektif selesai!' : `${effective - done} tugas belum dicentang`}</p>
            <p className="text-[10px] font-semibold text-slate-500">{day?.submittedAt ? `Laporan dikirim ${new Date(day.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB · status: ${day.status === 'disetujui' ? 'DISETUJUI Kepala Koki' : day.status === 'menunggu' ? 'menunggu approval' : day.status}` : 'Kirim laporan harian ke Kepala Koki setelah selesai.'}</p>
          </div>
        </div>
        {isSelf && (
          day?.submittedAt && day.status !== 'revisi'
            ? <span className="inline-flex items-center gap-2 px-5 h-12 rounded-2xl bg-emerald-600 text-white text-[12px] font-extrabold shrink-0 justify-center"><BadgeCheck size={18} /> Laporan Terkirim</span>
            : <button onClick={submitReport} disabled={submitting} className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white text-[12px] font-extrabold tracking-wide shadow-lg shadow-navy-900/25 transition-all active:scale-[0.97] disabled:opacity-70 shrink-0 justify-center">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Kirim Laporan ke Kepala Koki
              </button>
        )}
        {!isSelf && canVerify && (
          <span className="inline-flex items-center gap-2 px-5 h-12 rounded-2xl bg-teal-700 text-white text-[11px] font-extrabold shrink-0 justify-center"><ClipboardCheck size={18} /> Mode Verifikasi — {viewUser.name.split(' ')[0]}</span>
        )}
      </section>

      {/* ════════ PHOTO VIEWER MODAL ════════ */}
      <AnimatePresence>
        {photoTask && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={() => setPhotoTask(null)} />
            <motion.div initial={{ scale: .85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .9, opacity: 0 }} className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full">
              <img src={photoTask.src} alt="Bukti pekerjaan" className="w-full max-h-[62vh] object-contain bg-slate-100" />
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Bukti Pekerjaan</p>
                  <p className="text-[10.5px] font-semibold text-slate-600 mt-0.5">Terlampir otomatis pada laporan harian — {fmtDateID(today)}</p>
                </div>
                <button onClick={() => setPhotoTask(null)} className="p-2.5 rounded-xl bg-navy-900 text-white"><X size={18} /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
