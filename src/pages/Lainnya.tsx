/* ── LAINNYA — hub menu: profil, peran, modul admin, keamanan, demo ─────── */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Bell, History, ShieldAlert, Settings2,
  ChevronRight, BadgeCheck, KeyRound, UsersRound,
  ScanFace, LogOut, FlaskConical, ScrollText, UtensilsCrossed,
  ChefHat, Smartphone, Store, CircleHelp, Lock,
} from 'lucide-react';
import { useStore, can } from '../lib/store';
import { Avatar, Modal, SectionHead, ProgressBar } from '../components/ui';
import { ROLE_LABEL, SHIFT_LABEL, fmtDateID, todayStr } from '../lib/types';
import { JOINT_PERMISSIONS } from '../lib/permissions';

export default function Lainnya() {
  const { currentUser, state, dispatch, dayProgress } = useStore();
  const me = currentUser!;
  const navigate = useNavigate();
  const db = state.db;
  const today = todayStr();
  const [pwModal, setPwModal] = useState(false);
  const [newPw, setNewPw] = useState(''); const [confirmPw, setConfirmPw] = useState(''); const [pwMsg, setPwMsg] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);

  const prog = dayProgress(me.id, today, me.shift);
  const isAdmin = me.role === 'admin';

  const menu = [
    ...(can.viewDashboard(me.role) ? [{ to: '/dashboard', label: me.role === 'admin' ? 'Dashboard Owner' : 'Dashboard Kepala Koki', desc: 'Ringkasan tim, KPI, approval & tren 7 hari', icon: <LayoutDashboard size={21} />, tone: 'bg-navy-900 text-gold-400' }] : []),
    { to: '/riwayat', label: 'Riwayat & Laporan', desc: 'Arsip harian, approval Kepala Koki, cetak', icon: <History size={21} />, tone: 'bg-sky-800 text-sky-100' },
    { to: '/notifikasi', label: 'Notifikasi', desc: 'Reminder, keterlambatan, bahan habis, approval', icon: <Bell size={21} />, tone: 'bg-amber-400 text-amber-950' },
    { to: '/issues', label: 'Laporan Masalah', desc: 'Bahan habis, alat rusak, kebersihan, keselamatan', icon: <ShieldAlert size={21} />, tone: 'bg-red-600 text-red-50' },
    { to: '/kunjungan', label: 'Kunjungan & Inspeksi', desc: 'Audit 5 zona dapur & purchase request', icon: <ScanFace size={21} />, tone: 'bg-teal-700 text-teal-50' },
    ...(isAdmin ? [{ to: '/admin', label: 'Panel Admin', desc: 'Kelola akun, jadwal, checklist, email laporan & audit', icon: <Settings2 size={21} />, tone: 'bg-violet-700 text-violet-100' }] : []),
    ...(can.viewAudit(me.role) ? [{ to: '/admin?tab=audit', label: 'Riwayat Aktivitas', desc: me.role === 'admin' ? 'Jejak audit seluruh tindakan pengguna di sistem' : 'Jejak audit — baca saja untuk Kepala Koki', icon: <ScrollText size={21} />, tone: 'bg-slate-700 text-slate-100' }] : []),
  ];

  const pwSave = () => {
    setPwMsg('');
    if (newPw.length < 6) { setPwMsg('Password minimal 6 karakter.'); return; }
    if (newPw !== confirmPw) { setPwMsg('Konfirmasi password tidak cocok.'); return; }
    dispatch({ type: 'RESET_PASSWORD', userId: me.id, newPassword: newPw });
    setPwModal(false); setNewPw(''); setConfirmPw('');
  };

  return (
    <div className="space-y-4">
      {/* ── profile card ── */}
      <section className="navy-panel rounded-3xl text-white p-5 sm:p-6 relative overflow-hidden border border-white/10 shadow-xl">
        <ChefHat size={150} strokeWidth={1} className="absolute -right-6 -bottom-8 text-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar initials={me.initials} color={me.color} size={72} className="ring-4 ring-white/20" />
          <div className="min-w-0 flex-1">
            <p className="text-[8.5px] font-extrabold uppercase tracking-[0.28em] text-gold-400 flex items-center gap-1.5"><BadgeCheck size={11} /> {ROLE_LABEL[me.role]}</p>
            <h1 className="font-display font-extrabold text-2xl leading-tight mt-1">{me.name}</h1>
            <p className="text-[11px] font-semibold text-sky-100/85 mt-0.5">{me.position} · {me.email}</p>
            <p className="text-[10px] font-semibold text-sky-100/65 mt-0.5">{SHIFT_LABEL[me.shift]} · Bergabung {new Date(me.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <button onClick={() => setPwModal(true)} className="mt-2.5 inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-widest text-gold-400 hover:text-gold-500 transition-colors"><KeyRound size={12} /> Ganti Password Saya</button>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[8.5px] font-extrabold uppercase tracking-widest text-sky-200/70">Checklist Hari Ini</p>
            <p className="font-display font-extrabold text-3xl text-emerald-300 leading-none mt-1">{prog.pct}%</p>
            <p className="text-[9px] font-bold text-sky-100/70 mt-1">{prog.done}/{prog.total} tugas · {fmtDateID(today).split(',')[0]}</p>
            <div className="w-36 mt-2 ml-auto"><ProgressBar pct={prog.pct} height={7} striped={false} /></div>
          </div>
        </div>
      </section>

      {/* ── menu grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {menu.map((item, i) => (
          <motion.button key={item.label + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => navigate(item.to)}
            className="card flex items-center gap-3.5 px-4 py-4 text-left hover:border-navy-400 hover:shadow-lg transition-all group">
            <span className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 p-3.5 ${item.tone} shadow-md group-hover:scale-105 transition-transform`}>{item.icon}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-extrabold text-navy-900 group-hover:text-navy-700">{item.label}</span>
              <span className="block text-[9.5px] font-semibold text-slate-500 leading-snug mt-0.5">{item.desc}</span>
            </span>
            <ChevronRight size={18} className="ml-auto text-slate-300 group-hover:text-navy-700 group-hover:translate-x-1 transition-all shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* ── your permission matrix ── */}
      <section className="card p-5">
        <SectionHead icon={<Lock size={15} />} title="Hak Akses Anda (Role-Based)" right={<span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{ROLE_LABEL[me.role]}</span>} />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {JOINT_PERMISSIONS.map(p => {
            const allowed = p.roles.includes(me.role);
            return (
              <div key={p.label} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border text-[11px] font-bold ${allowed ? 'border-emerald-100 bg-emerald-50/50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                {allowed ? <BadgeCheck size={15} className="text-emerald-600 shrink-0" /> : <Lock size={13} className="text-slate-300 shrink-0" />}
                <span className="leading-snug">{p.label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[9.5px] font-semibold text-slate-400 mt-3 flex items-center gap-1.5"><CircleHelp size={12} /> Hak akses ditentukan oleh Admin / Owner. Hubungi Baskara Wira untuk perubahan peran.</p>
      </section>

      {/* ── restaurant info + session ── */}
      <div className="grid sm:grid-cols-2 gap-2.5">
        <div className="card p-5">
          <SectionHead icon={<Store size={15} />} title="Identitas Restoran" />
          <div className="space-y-2 text-[11.5px] font-semibold text-slate-600">
            <p className="flex items-start gap-2"><UtensilsCrossed size={14} className="text-navy-700 mt-0.5 shrink-0" />{db.settings.restaurantName} — Fine Indonesian Cuisine</p>
            <p className="flex items-start gap-2"><Smartphone size={14} className="text-navy-700 mt-0.5 shrink-0" />{db.settings.branch}</p>
            <p className="flex items-start gap-2"><UsersRound size={14} className="text-navy-700 mt-0.5 shrink-0" />{db.users.filter(u => u.active).length} anggota aktif · 3 shift operasional</p>
          </div>
        </div>
        <div className="card p-5 flex flex-col">
          <SectionHead icon={<FlaskConical size={15} />} title="Sesi & Demo" />
          <p className="text-[10.5px] font-medium text-slate-500 leading-relaxed">Data demo tersimpan aman di browser ini. Keluar lalu masuk sebagai peran lain untuk merasakan hak akses berbeda.</p>
          <div className="flex gap-2 mt-auto pt-3">
            <button onClick={() => dispatch({ type: 'LOGOUT' })} className="flex-1 h-11 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all"><LogOut size={15} /> Keluar</button>
            <button onClick={() => setResetConfirm(true)} className="flex-1 h-11 rounded-xl border-2 border-slate-200 text-slate-500 hover:bg-slate-50 text-[11px] font-extrabold transition-all">Reset Data Demo</button>
          </div>
        </div>
      </div>

      {/* ganti password modal */}
      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Ganti Password" subtitle={`Akun ${me.email}`}>
        <div className="space-y-3">
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Password baru (min. 6 karakter)" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-navy-200" autoComplete="new-password" />
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Ulangi password baru" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-navy-200" autoComplete="new-password" onKeyDown={e => e.key === 'Enter' && pwSave()} />
          {pwMsg && <p className="text-[11px] font-bold text-red-600">{pwMsg}</p>}
          <button onClick={pwSave} className="w-full h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-[12px] flex items-center justify-center gap-2"><KeyRound size={16} /> Simpan Password Baru</button>
        </div>
      </Modal>

      {/* reset confirm */}
      <Modal open={resetConfirm} onClose={() => setResetConfirm(false)} title="Reset Data Demo?" subtitle="Seluruh checklist, laporan, dan masalah akan dikembalikan ke data awal.">
        <div className="flex gap-2">
          <button onClick={() => setResetConfirm(false)} className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-extrabold text-[12px]">Batal</button>
          <button onClick={() => { dispatch({ type: 'RESET_DEMO' }); setResetConfirm(false); navigate('/'); }} className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-extrabold text-[12px]">Ya, Reset Semua</button>
        </div>
      </Modal>
    </div>
  );
}
