/* ── DASHBOARD — command center Kepala Koki / Owner ───────────────────────── */
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, UsersRound, ListChecks, ListX, UserX, PackageX, Sparkles,
  TrendingUp, ChevronRight, Flame, Snowflake, AlertTriangle, ShieldAlert,
  CheckCircle2, Clock3, ArrowUpRight, UtensilsCrossed, Trophy, Star,
  ClipboardCheck, CircleDot,
} from 'lucide-react';
import { useStore, can, progressOf } from '../lib/store';
import { Avatar, ProgressBar, SectionHead, SeverityBadge, ReportStatusBadge } from '../components/ui';
import { fmtShort, todayStr, ROLE_LABEL, SHIFT_LABEL } from '../lib/types';

export default function Dashboard() {
  const { state, currentUser } = useStore();
  const me = currentUser!;
  const db = state.db;
  const today = todayStr();
  const navigate = useNavigate();

  const kitchenTeam = db.users.filter(u => u.role === 'anggota' || u.role === 'wakil_koki');
  const activeToday = kitchenTeam.filter(u => u.active);

  // Per-member progress for today (their shift)
  const members = activeToday.map(u => {
    const { pct, done, total, na } = progressOf(db, u, today, u.shift);
    const day = db.days.find(d => d.date === today && d.shift === u.shift);
    const late = day?.submittedAt ? false : isShiftLate(u.shift) && pct < 100;
    return { u, pct, done, total, na, submitted: !!day?.submittedAt, late };
  }).sort((a, b) => a.pct - b.pct);

  const totalTasks = members.reduce((s, m) => s + m.total, 0);
  const doneTasks = members.reduce((s, m) => s + m.done, 0);
  const overallPct = totalTasks ? Math.round((doneTasks / Math.max(1, totalTasks - members.reduce((s, m) => s + m.na, 0))) * 100) : 0;
  const lateMembers = members.filter(m => m.late);
  const pendingApprovals = db.days.filter(d => d.status === 'menunggu' && d.submittedAt);
  const openIssues = db.issues.filter(i => i.status !== 'selesai');
  const bahanIssues = openIssues.filter(i => i.category === 'bahan_habis');
  const kebersihanIssues = openIssues.filter(i => i.category === 'kebersihan');
  const criticalIssues = openIssues.filter(i => i.severity === 'kritis' || i.severity === 'tinggi');

  // 7-day completion trend (pagi shift aggregate)
  const trend = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const p = (n: number) => String(n).padStart(2, '0');
      const iso = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      const dayRecords = db.days.filter(x => x.date === iso);
      let total = 0, done = 0, na = 0;
      dayRecords.forEach(dr => {
        const t = db.tasks.filter(tk => tk.shift === 'semua' || tk.shift === dr.shift);
        total += t.length;
        t.forEach(tk => { const e = dr.entries[tk.id]; if (e?.status === 'tidak_berlaku') na++; if (e?.checked) done++; });
      });
      out.push({ label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }), pct: total ? Math.round((done / Math.max(1, total - na)) * 100) : 0 });
    }
    return out;
  }, [db.days, db.tasks]);
  const trendMax = Math.max(100, ...trend.map(t => t.pct));

  // top performers (by % today, then name)
  const leaderboard = [...members].sort((a, b) => b.pct - a.pct || a.u.name.localeCompare(b.u.name)).slice(0, 4);

  const statCards = [
    { label: 'Total Anggota Tim', value: activeToday.length, icon: <UsersRound size={20} />, tone: 'bg-navy-50 text-navy-800', sub: `${db.users.filter(u => !u.active).length} akun nonaktif` },
    { label: 'Checklist Selesai', value: doneTasks, icon: <ListChecks size={20} />, tone: 'bg-emerald-50 text-emerald-700', sub: `dari ${totalTasks} tugas hari ini` },
    { label: 'Belum Selesai', value: totalTasks - doneTasks, icon: <ListX size={20} />, tone: 'bg-amber-50 text-amber-700', sub: `${lateMembers.length} anggota terlambat` },
    { label: 'Anggota Terlambat', value: lateMembers.length, icon: <UserX size={20} />, tone: 'bg-red-50 text-red-700', sub: 'melewati jam target tugas' },
    { label: 'Masalah Bahan Baku', value: bahanIssues.length, icon: <PackageX size={20} />, tone: 'bg-orange-50 text-orange-700', sub: 'bahan habis / menipis' },
    { label: 'Temuan Kebersihan', value: kebersihanIssues.length, icon: <Sparkles size={20} />, tone: 'bg-teal-50 text-teal-700', sub: 'menunggu tindak lanjut' },
  ];

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display font-extrabold text-navy-900 text-2xl flex items-center gap-2"><LayoutDashboard size={22} className="text-navy-700" /> Dashboard {me.role === 'admin' ? 'Owner' : 'Kepala Koki'}</h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Ringkasan operasional dapur — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} · diperbarui langsung</p>
        </div>
        <Link to="/issues" className="sm:ml-auto inline-flex items-center gap-2 px-4 h-11 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white text-[11.5px] font-extrabold transition-all self-start">
          <ShieldAlert size={16} /> {openIssues.length} Masalah Terbuka <ChevronRight size={15} />
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card px-3 py-3.5 flex flex-col justify-between min-h-[104px]">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.tone}`}>{s.icon}</span>
            <span className="mt-2"><span className="font-display font-extrabold text-[26px] leading-none text-navy-900 tabular-nums">{s.value}</span>
              <span className="block text-[8px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mt-1 leading-tight">{s.label}</span>
              <span className="block text-[8px] font-semibold text-slate-400 mt-0.5">{s.sub}</span></span>
          </motion.div>
        ))}
      </div>

      {/* overall completion banner */}
      <div className="navy-panel rounded-3xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center gap-4 border border-white/10 shadow-xl">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="w-14 h-14 rounded-2xl bg-gold-400 text-navy-950 flex items-center justify-center shrink-0 shadow-lg"><Flame size={28} strokeWidth={2.1} /></span>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-gold-400">Penyelesaian Tim Hari Ini</p>
            <p className="font-display font-extrabold text-2xl sm:text-3xl mt-0.5">{overallPct}<span className="text-gold-400">%</span> <span className="text-sm font-sans font-bold text-sky-100/75">· {doneTasks}/{totalTasks} tugas tuntas</span></p>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-[8.5px] font-extrabold uppercase tracking-widest text-sky-200/70 mb-1.5"><span>Target Mingguan {db.settings.weeklyTarget}%</span><span className={overallPct >= db.settings.weeklyTarget ? 'text-emerald-300' : 'text-amber-300'}>{overallPct >= db.settings.weeklyTarget ? 'Di atas target' : 'Di bawah target'}</span></div>
          <ProgressBar pct={overallPct} height={11} />
        </div>
      </div>

      <div className="grid xl:grid-cols-5 gap-4">
        {/* ── live team board ── */}
        <section className="card xl:col-span-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
            <h2 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-navy-800"><UtensilsCrossed size={15} /> Progress Per Anggota — Hari Ini</h2>
            <button onClick={() => navigate('/')} className="text-[9.5px] font-extrabold uppercase tracking-widest text-navy-700 hover:text-navy-900 flex items-center gap-1">Checklist <ArrowUpRight size={12} /></button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[430px] overflow-y-auto nice-scroll">
            {members.map(({ u, pct, done, total, submitted, late }) => (
              <button key={u.id} onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-navy-50/50 transition-colors text-left">
                <Avatar initials={u.initials} color={u.color} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[11.5px] font-extrabold text-slate-800 truncate">{u.name}</p>
                    {submitted
                      ? <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 shrink-0">Dikirim</span>
                      : late
                        ? <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5 shrink-0 flex items-center gap-0.5"><Clock3 size={8} /> Terlambat</span>
                        : <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-1.5 py-0.5 shrink-0">Berjalan</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <ProgressBar pct={pct} height={6} striped={false} />
                    <span className="text-[9px] font-extrabold text-slate-500 tabular-nums w-14 text-right">{done}/{total} · {pct}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── approvals queue + leaderboard ── */}
        <div className="xl:col-span-2 space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <h2 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-navy-800"><ClipboardCheck size={15} /> Laporan Menunggu Approval</h2>
              <span className="min-w-6 h-6 px-1.5 rounded-full bg-amber-400 text-navy-950 text-[10px] font-extrabold flex items-center justify-center">{pendingApprovals.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingApprovals.slice(0, 4).map(d => (
                <Link key={d.date + d.shift} to="/riwayat" className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/60 transition-colors">
                  <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><Clock3 size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold text-slate-800">Shift {d.shift === 'pagi' ? 'Pagi' : d.shift === 'siang' ? 'Siang' : 'Malam'} · {fmtShort(d.date)}</span>
                    <span className="block text-[9px] font-semibold text-slate-500">{Object.values(d.entries).filter(e => e.checked).length} tugas selesai{d.submittedAt ? ` · dikirim ${new Date(d.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                  </span>
                  <ReportStatusBadge status={d.status} />
                </Link>
              ))}
              {pendingApprovals.length === 0 && <div className="px-5 py-6 text-center"><CheckCircle2 size={26} className="mx-auto text-emerald-500" /><p className="text-[11px] font-bold text-slate-500 mt-2">Semua laporan sudah direview. Mantap!</p></div>}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <SectionHead icon={<Trophy size={15} />} title="Top Performer Hari Ini" />
            <div className="space-y-2.5">
              {leaderboard.map(({ u, pct }, i) => (
                <div key={u.id} className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center shrink-0 ${i === 0 ? 'bg-gold-400 text-navy-950' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-amber-700/80 text-amber-50' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                  <Avatar initials={u.initials} color={u.color} size={30} />
                  <span className="text-[11px] font-bold text-slate-700 truncate flex-1">{u.name.split(',')[0]}</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 tabular-nums flex items-center gap-1"><Star size={10} fill="currentColor" />{pct}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid xl:grid-cols-5 gap-4">
        {/* ── 7-day trend ── */}
        <section className="card p-4 sm:p-5 xl:col-span-3">
          <SectionHead icon={<TrendingUp size={15} />} title="Tren Penyelesaian 7 Hari Terakhir" right={<span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Snowflake size={11} /> Semua Shift</span>} />
          <div className="flex items-end gap-2 sm:gap-3 h-40 pt-2">
            {trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <span className="text-[9px] font-extrabold text-navy-800 tabular-nums">{t.pct}%</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(t.pct / trendMax) * 100}%` }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 160, damping: 22 }}
                  className={`w-full rounded-t-lg ${t.pct >= db.settings.weeklyTarget ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : t.pct >= 60 ? 'bg-gradient-to-t from-amber-500 to-amber-300' : 'bg-gradient-to-t from-red-500 to-orange-400'} min-h-[6px]`} />
                <span className="text-[8.5px] font-bold text-slate-500 uppercase">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── critical issues ── */}
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <h2 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-navy-800"><AlertTriangle size={15} /> Masalah Kritis &amp; Tinggi</h2>
            <Link to="/issues" className="text-[9.5px] font-extrabold uppercase tracking-widest text-navy-700 flex items-center gap-1">Semua <ArrowUpRight size={12} /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {criticalIssues.slice(0, 3).map(i => (
              <div key={i.id} className="px-5 py-3">
                <div className="flex items-start gap-2.5">
                  <SeverityBadge severity={i.severity} />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-bold text-slate-800 leading-snug">{i.title}</p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{i.reporterId ? db.users.find(u => u.id === i.reporterId)?.name.split(' ')[0] : ''} · {fmtShort(i.date)} · <span className="uppercase">{i.status}</span></p>
                  </div>
                </div>
              </div>
            ))}
            {criticalIssues.length === 0 && <div className="px-5 py-6 text-center"><CheckCircle2 size={26} className="mx-auto text-emerald-500" /><p className="text-[11px] font-bold text-slate-500 mt-2">Tidak ada masalah kritis. Dapur aman!</p></div>}
          </div>
        </section>
      </div>

      {/* ── shift status row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(['pagi', 'siang', 'malam'] as const).map(sh => {
          const day = db.days.find(d => d.date === today && d.shift === sh);
          const team = db.users.filter(u => u.shift === sh && u.role === 'anggota');
          const st = day?.status ?? 'menunggu';
          return (
            <div key={sh} className="card px-4 py-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center font-display font-extrabold text-[15px]">{sh === 'pagi' ? 'P' : sh === 'siang' ? 'S' : 'M'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold text-navy-900">Shift {sh === 'pagi' ? 'Pagi' : sh === 'siang' ? 'Siang' : 'Malam'} <span className="text-slate-400 font-bold">· {team.length} anggota</span></p>
                <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{SHIFT_LABEL[sh]}</p>
                <div className="mt-1"><ReportStatusBadge status={st} /></div>
              </div>
              <CircleDot size={16} className={day?.submittedAt ? 'text-emerald-500' : 'text-slate-300'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isShiftLate(shift: 'pagi' | 'siang' | 'malam'): boolean {
  const now = new Date(); const h = now.getHours() + now.getMinutes() / 60;
  if (shift === 'pagi') return h >= 13.5;
  if (shift === 'siang') return h >= 22;
  return h >= 6;
}
