/* ── App shell: navy header + light-gray canvas + bottom navigation ─────── */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun, History, ClipboardCheck, Bell, LayoutDashboard, MoreHorizontal,
  ShieldCheck, ChevronDown, LogOut, UserRound, BadgeCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, can } from '../lib/store';
import { Avatar, Toast, RestaurantMark } from './ui';
import { fmtDateID, ROLE_LABEL, SHIFT_LABEL, todayStr } from '../lib/types';
import { useState, useRef, useEffect } from 'react';

const NAV = [
  { to: '/', label: 'Hari Ini', icon: Sun },
  { to: '/riwayat', label: 'Riwayat', icon: History },
  { to: '/kunjungan', label: 'Kunjungan', icon: ClipboardCheck },
  { to: '/lainnya', label: 'Lainnya', icon: MoreHorizontal },
];
const ROLE_PILL: Record<string, string> = {
  admin: 'bg-violet-400/20 text-violet-100 ring-violet-300/40',
  kepala_koki: 'bg-gold-400/20 text-gold-400 ring-gold-400/40',
  wakil_koki: 'bg-teal-400/20 text-teal-100 ring-teal-300/40',
  anggota: 'bg-sky-400/20 text-sky-100 ring-sky-300/40',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, unreadCount, state, dayProgress } = useStore();
  const loc = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const today = todayStr();
  const prog = currentUser ? dayProgress(currentUser.id, today, currentUser.shift) : { pct: 0, done: 0, total: 0, na: 0 };
  const isKepala = currentUser?.role === 'kepala_koki' || currentUser?.role === 'admin';
  const sidebarItems = [
    { to: '/', label: 'Checklist Hari Ini', icon: Sun },
    ...(can.viewDashboard(currentUser?.role ?? 'anggota') ? [{ to: '/dashboard', label: currentUser?.role === 'admin' ? 'Dashboard Owner' : 'Dashboard Kepala Koki', icon: LayoutDashboard }] : []),
    { to: '/riwayat', label: 'Riwayat & Laporan', icon: History },
    { to: '/kunjungan', label: 'Kunjungan & Cek', icon: ClipboardCheck },
    { to: '/issues', label: 'Laporan Masalah', icon: ShieldCheck },
    { to: '/lainnya', label: 'Lainnya', icon: MoreHorizontal },
  ];

  const active = (to: string) => to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-dots font-sans text-slate-800">
      <Toast />

      {/* ════════ HEADER — dark navy ════════ */}
      <header className="navy-panel text-white sticky top-0 z-40 shadow-[0_6px_24px_-8px_rgba(4,16,32,.6)] border-b border-white/10 no-print">
        <div className="mx-auto max-w-7xl px-3 sm:px-5">
          <div className="h-16 flex items-center gap-2 sm:gap-4">
            {/* brand */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <RestaurantMark size={38} />
              <div className="leading-tight">
                <p className="font-display font-bold text-[15px] sm:text-[17px] tracking-tight text-white group-hover:text-gold-400 transition-colors">Nusa Rasa</p>
                <p className="text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-[0.22em] text-gold-400/90">Kitchen Operations</p>
              </div>
            </Link>

            {/* operational date — center (desktop) */}
            <div className="hidden md:flex flex-col items-center mx-auto text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.28em] text-sky-200/70">Tanggal Operasional</span>
              <span className="text-[12.5px] font-bold text-white/95 -mt-0.5">{fmtDateID(today)}</span>
            </div>

            {/* right controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto md:ml-0">
              {/* progress pill */}
              <div className="hidden sm:flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-2xl bg-white/8 ring-1 ring-white/15" title="Checklist hari ini">
                <div className="relative w-9 h-9">
                  <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="4.5" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 15}`} strokeDashoffset={`${2 * Math.PI * 15 * (1 - prog.pct / 100)}`}
                      style={{ transition: 'stroke-dashoffset .6s' }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-emerald-300">{prog.pct}%</span>
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-[8px] font-extrabold uppercase tracking-widest text-sky-200/70">Checklist</p>
                  <p className="text-[11px] font-extrabold text-white">{prog.done}/{prog.total} Tugas</p>
                </div>
              </div>

              {/* notifications bell */}
              <button onClick={() => navigate('/notifikasi')} className="relative p-2.5 rounded-2xl hover:bg-white/10 ring-1 ring-transparent hover:ring-white/15 transition-all" aria-label="Notifikasi">
                <Bell size={20} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-red-500 ring-2 ring-navy-900 text-[9px] font-extrabold flex items-center justify-center text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* user chip + dropdown */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(v => !v)} className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-2xl hover:bg-white/10 ring-1 ring-transparent hover:ring-white/15 transition-all">
                  {currentUser && <Avatar initials={currentUser.initials} color={currentUser.color} size={34} name={currentUser.name} />}
                  <span className="hidden lg:block text-left leading-tight max-w-[150px]">
                    <span className="block text-[11px] font-extrabold text-white truncate">{currentUser?.name.split(',')[0]}</span>
                    <span className="block text-[9px] font-bold text-sky-200/80 truncate">{currentUser ? ROLE_LABEL[currentUser.role] : ''}</span>
                  </span>
                  <ChevronDown size={14} className={`text-sky-200/70 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menuOpen && currentUser && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 mt-2 w-80 bg-white text-slate-700 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-50">
                      <div className="navy-panel px-4 py-4 text-white">
                        <div className="flex items-center gap-3">
                          <Avatar initials={currentUser.initials} color={currentUser.color} size={52} name={currentUser.name} />
                          <div className="min-w-0">
                            <p className="font-display font-bold text-[15px] leading-tight truncate">{currentUser.name}</p>
                            <p className="text-[10.5px] text-sky-100/80 font-semibold truncate mt-0.5">{currentUser.position}</p>
                            <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-widest ring-1 ${ROLE_PILL[currentUser.role]}`}>
                              <BadgeCheck size={10} /> {ROLE_LABEL[currentUser.role]}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                          <div className="rounded-xl bg-white/8 ring-1 ring-white/10 px-2.5 py-2">
                            <p className="text-[8px] uppercase tracking-widest text-sky-200/70 font-extrabold">Shift</p>
                            <p className="font-bold text-white mt-0.5">{SHIFT_LABEL[currentUser.shift]}</p>
                          </div>
                          <div className="rounded-xl bg-white/8 ring-1 ring-white/10 px-2.5 py-2">
                            <p className="text-[8px] uppercase tracking-widest text-sky-200/70 font-extrabold">Progress Hari Ini</p>
                            <p className="font-bold text-emerald-300 mt-0.5">{prog.done}/{prog.total} tugas · {prog.pct}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link to="/lainnya" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-[12px] font-bold text-slate-700">
                          <UserRound size={16} className="text-navy-600" /> Profil & Pengaturan
                        </Link>
                        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 text-[12px] font-bold text-red-600">
                          <LogOut size={16} /> Keluar dari Akun
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* mobile operational date strip */}
          <div className="md:hidden flex items-center justify-center gap-2 pb-1.5 -mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-sky-100/85 tracking-wide">{fmtDateID(today)}</span>
          </div>
        </div>
      </header>

      {/* ════════ BODY: sidebar (desktop) + content ════════ */}
      <div className="mx-auto max-w-7xl px-3 sm:px-5 pb-24 md:pb-10 md:pt-5 md:flex md:gap-5">
        {/* sidebar */}
        <aside className="hidden md:block w-60 shrink-0 no-print">
          <div className="card p-3 sticky top-[4.75rem]">
            <p className="px-2 pt-1 pb-2 text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Menu Utama</p>
            <nav className="space-y-0.5">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = active(item.to);
                return (
                  <Link key={item.to + item.label} to={item.to}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                      isActive ? 'bg-navy-900 text-white shadow-md shadow-navy-900/20' : 'text-slate-600 hover:bg-navy-50 hover:text-navy-900'
                    }`}>
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-gold-400' : 'text-navy-600'} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 pt-3 border-t border-slate-100 px-2">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Restoran</p>
              <p className="text-[10.5px] font-bold text-navy-900 leading-snug mt-1">{state.db.settings.restaurantName}</p>
              <p className="text-[9px] font-semibold text-slate-500 leading-snug">{state.db.settings.branch}</p>
            </div>
            {isKepala && (
              <div className="mt-2 mx-2 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-2">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 flex items-center gap-1"><ShieldCheck size={11} /> Hak Akses</p>
                <p className="text-[9px] font-semibold text-amber-900/80 mt-0.5 leading-snug">{currentUser?.role === 'admin' ? 'Kontrol penuh: akun, jadwal, checklist & laporan.' : 'Monitoring tim, approval laporan & catatan evaluasi.'}</p>
              </div>
            )}
          </div>
        </aside>

        {/* page content */}
        <main className="flex-1 min-w-0 pt-3 md:pt-0">{children}</main>
      </div>

      {/* ════════ BOTTOM NAV — mobile ════════ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-6px_24px_-12px_rgba(6,24,43,.4)] no-print" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-4 max-w-lg mx-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const isActive = active(item.to);
            return (
              <button key={item.to} onClick={() => navigate(item.to)}
                className="relative flex flex-col items-center justify-center py-2 gap-0.5 active:scale-95 transition-transform">
                {isActive && (
                  <motion.span layoutId="bottomnav-pill" className="absolute top-0 h-[3px] w-12 rounded-b-full bg-navy-900" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                <Icon size={21} strokeWidth={isActive ? 2.3 : 1.7} className={isActive ? 'text-navy-900' : 'text-slate-400'} />
                <span className={`text-[9px] font-extrabold tracking-wide ${isActive ? 'text-navy-900' : 'text-slate-400'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Convenience guard: wraps a page and shows a lock screen if role not allowed. */
export function RoleGate({ allow, children }: { allow: (r: NonNullable<ReturnType<typeof useStore>['currentUser']>['role']) => boolean; children: React.ReactNode }) {
  const { currentUser } = useStore();
  const ok = currentUser ? allow(currentUser.role) : false;
  if (ok) return <>{children}</>;
  return (
    <div className="card p-10 text-center max-w-md mx-auto mt-10">
      <ShieldCheck size={40} className="mx-auto text-navy-300" strokeWidth={1.5} />
      <h2 className="font-display font-bold text-navy-900 text-xl mt-4">Akses Dibatasi</h2>
      <p className="text-[12px] text-slate-500 font-medium mt-2 leading-relaxed">Peran Anda ({currentUser ? ROLE_LABEL[currentUser.role] : '-'}) tidak memiliki izin untuk membuka halaman ini. Hubungi Admin / Owner bila ini kesalahan.</p>
      <Link to="/" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-navy-900 text-white text-[12px] font-extrabold hover:bg-navy-800 transition-colors">Kembali ke Checklist</Link>
    </div>
  );
}

