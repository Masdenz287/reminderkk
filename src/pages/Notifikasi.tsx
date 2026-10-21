/* ── NOTIFIKASI — pusat reminder & alert operasional ─────────────────────── */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, AlarmClock, Hourglass, PackageX, Sparkles, Stamp, Info, CheckCircle2,
  Siren, CheckCheck, ChevronRight, BellRing,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { EmptyState } from '../components/ui';
import { fmtShort, NotifType } from '../lib/types';

const TYPE_META: Record<NotifType, { label: string; icon: React.ReactNode; accent: string; ring: string }> = {
  reminder: { label: 'Reminder', icon: <AlarmClock size={17} />, accent: 'bg-sky-100 text-sky-800', ring: 'border-l-sky-400' },
  terlambat: { label: 'Terlambat', icon: <Hourglass size={17} />, accent: 'bg-red-100 text-red-800', ring: 'border-l-red-500' },
  bahan_habis: { label: 'Bahan Habis', icon: <PackageX size={17} />, accent: 'bg-orange-100 text-orange-800', ring: 'border-l-orange-500' },
  kebersihan: { label: 'Kebersihan', icon: <Sparkles size={17} />, accent: 'bg-teal-100 text-teal-800', ring: 'border-l-teal-500' },
  approval: { label: 'Approval', icon: <Stamp size={17} />, accent: 'bg-amber-100 text-amber-800', ring: 'border-l-amber-400' },
  info: { label: 'Info', icon: <Info size={17} />, accent: 'bg-slate-100 text-slate-700', ring: 'border-l-slate-400' },
  sukses: { label: 'Sukses', icon: <CheckCircle2 size={17} />, accent: 'bg-emerald-100 text-emerald-800', ring: 'border-l-emerald-500' },
  masalah: { label: 'Masalah', icon: <Siren size={17} />, accent: 'bg-red-100 text-red-800', ring: 'border-l-red-600' },
};

export default function Notifikasi() {
  const { visibleNotifications, dispatch, currentUser, unreadCount } = useStore();
  const me = currentUser!;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'semua' | NotifType>('semua');

  const filtered = useMemo(
    () => visibleNotifications.filter(n => filter === 'semua' || n.type === filter),
    [visibleNotifications, filter]
  );
  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach(n => { (g[n.date] = g[n.date] || []).push(n); });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const typesInUse = [...new Set(visibleNotifications.map(n => n.type))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display font-extrabold text-navy-900 text-2xl flex items-center gap-2"><Bell size={22} className="text-navy-700" /> Notifikasi Operasional
          {unreadCount > 0 && <span className="text-[11px] font-sans font-extrabold bg-red-500 text-white rounded-full px-2 py-0.5 align-middle">{unreadCount} baru</span>}</h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Reminder tugas, keterlambatan, bahan habis, kebersihan &amp; approval laporan — sesuai peran Anda.</p>
        </div>
        <div className="sm:ml-auto flex gap-2 self-start">
          {unreadCount > 0 && (
            <button onClick={() => dispatch({ type: 'MARK_NOTIF_READ', all: true, userId: me.id })} className="inline-flex items-center gap-1.5 h-11 px-4 rounded-2xl bg-navy-900 text-white text-[11px] font-extrabold hover:bg-navy-800 transition-all"><CheckCheck size={16} /> Tandai Semua Dibaca</button>
          )}
        </div>
      </div>

      {/* filter chips */}
      <div className="flex gap-1.5 overflow-x-auto nice-scroll pb-1 -mx-1 px-1">
        <button onClick={() => setFilter('semua')} className={`shrink-0 h-9 px-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all ${filter === 'semua' ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>Semua ({visibleNotifications.length})</button>
        {typesInUse.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`shrink-0 h-9 px-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${filter === t ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>{TYPE_META[t].label} ({visibleNotifications.filter(n => n.type === t).length})</button>
        ))}
      </div>

      {/* list grouped by date */}
      {grouped.length === 0 && <div className="card"><EmptyState icon={<BellRing size={30} />} title="Tidak ada notifikasi" hint="Semua tenang di dapur. Reminder otomatis akan muncul sebelum jadwal tugas Anda." /></div>}
      {grouped.map(([date, items]) => (
        <div key={date}>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-slate-400 px-1 mb-1.5">{fmtShort(date)} · {items.length} notifikasi</p>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map(n => {
                const meta = TYPE_META[n.type];
                return (
                  <motion.button
                    layout key={n.id} exit={{ opacity: 0, x: 60 }}
                    onClick={() => {
                      dispatch({ type: 'MARK_NOTIF_READ', notifId: n.id, userId: me.id });
                      if (n.link) navigate(n.link);
                    }}
                    className={`card w-full text-left flex items-start gap-3 pl-0 pr-4 py-0 overflow-hidden border-l-[5px] ${meta.ring} ${!n.read ? 'bg-white' : 'bg-slate-50/70 opacity-80'} hover:shadow-lg transition-all`}
                  >
                    <span className="py-3.5 pl-4 flex flex-col items-center gap-1 shrink-0">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.accent}`}>{meta.icon}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-red-500" />}
                    </span>
                    <span className="py-3 min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{meta.label}</span>
                        <span className="text-[8.5px] font-bold text-slate-400 tabular-nums">{n.time} WIB</span>
                      </span>
                      <span className={`block text-[12px] leading-snug mt-0.5 ${!n.read ? 'font-extrabold text-navy-900' : 'font-bold text-slate-600'}`}>{n.title}</span>
                      <span className="block text-[10.5px] font-medium text-slate-500 leading-snug mt-0.5">{n.body}</span>
                    </span>
                    {n.link && <ChevronRight size={17} className="self-center text-slate-300 shrink-0" />}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
