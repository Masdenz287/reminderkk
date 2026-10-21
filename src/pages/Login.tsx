/* ── Login — split-screen cinematic, role quick-select included ─────────── */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, ChefHat, Users, ArrowRight, Loader2,
  CircleAlert, BadgeCheck, UtensilsCrossed, Flame, LogIn,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { RestaurantMark } from '../components/ui';
import { ROLE_LABEL, Role } from '../lib/types';

const DEMO_ACCOUNTS: { role: Role; name: string; email: string; password: string; note: string; icon: React.ReactNode }[] = [
  { role: 'kepala koki', name: 'komndan mispin', email: '', password: 'admin123', note: 'Owner — akses penuh', icon: <ShieldCheck size={15} /> },
  { role: 'wakil_koki', name: 'wakil Rahmat', email: '', password: 'kkmm123', note: 'Approval laporan & evaluasi', icon: <Flame size={15} /> },
]
export default function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  const submit = (e?: React.FormEvent) => {
  e?.preventDefault();
  if (busy) return;
  setError('');
  if (!identifier.trim() || !password) { 
    setError('Email/username dan password wajib diisi'); 
    return; 
  }

  setBusy(true);

  // === 1 EMAIL UNTUK SEMUA ===
  const EMAIL_BERSAMA = 'dapur@nusarasa.co.id';
  const PASSWORD_BERSAMA = 'nusa123';

  if (identifier === EMAIL_BERSAMA && password === PASSWORD_BERSAMA) {
    login({ role: 'anggota', name: 'Tim Dapur', email: EMAIL_BERSAMA });
    navigate('/dashboard');
  } else {
    setError('Email atau password salah');
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }
  setBusy(false);
}
    }, 650);
  };
  const setShakeNow = () => { setShake(true); window.setTimeout(() => setShake(false), 500); };

  const quickFill = (email: string, pw: string) => { setIdentifier(email); setPassword(pw); setError(''); };

  return (
    <div className="min-h-screen bg-navy-950 flex items-stretch font-sans">
      {/* ── LEFT: cinematic kitchen ── */}
      <div className="relative hidden lg:flex lg:w-[54%] xl:w-[58%] overflow-hidden">
        <img src="/images/kitchen-hero.jpg" alt="Suasana dapur Restoran kampung kecil Mm saat persiapan pagi" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/30 via-navy-950/20 to-navy-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/15 to-navy-950/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <RestaurantMark size={46} />
            <div className="leading-tight">
              <p className="font-display font-bold text-white text-xl tracking-tight">kampung kecil Mm</p>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-gold-400">Rasanya ngeraja Harganya ngerakyat · Est. 2012</p>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gold-400 flex items-center gap-2"><Flame size={13} /> Sistem Checklist Operasional</p>
            <h1 className="font-display font-extrabold text-white text-4xl xl:text-5xl leading-[1.08] mt-4">Disiplin Dapur,<br /><span className="text-gold-400 italic">Rasa yang Terjaga.</span></h1>
            <p className="text-sky-100/85 text-[13.5px] leading-relaxed font-medium mt-5 max-w-md">Setiap tugas, suhu, sanitasi, dan laporan harian — tercatat rapi. Dari pembukaan hingga closing, seluruh tim dapur bekerja dalam satu ritme.</p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {['HACCP Compliant', 'Audit Trail Lengkap', 'Shift Pagi · Siang · Malam'].map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur ring-1 ring-white/20 text-[10px] font-bold text-white/90"><BadgeCheck size={12} className="text-gold-400" />{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: auth panel ── */}
      <div className="flex-1 relative flex flex-col overflow-y-auto bg-[#0d2137] bg-[radial-gradient(900px_500px_at_80%_-10%,rgba(245,184,61,.09),transparent_55%),radial-gradient(700px_600px_at_-10%_110%,rgba(46,111,184,.16),transparent_55%)]">
        {/* top strip */}
        <div className="flex lg:hidden items-center gap-2.5 px-6 pt-6">
          <RestaurantMark size={38} />
          <div className="leading-tight">
            <p className="font-display font-bold text-white text-[16px]">Kampung kecil</p>
            <p className="text-[8px] font-extrabold uppercase tracking-[0.25em] text-gold-400">Kitchen Operations</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 xl:px-14 py-8 w-full max-w-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: 'easeOut' }}>
            <h2 className="font-display font-bold text-white text-3xl tracking-tight">Selamat Datang Di Remind Kkmm.</h2>
            <p className="text-sky-100/70 text-[12.5px] font-medium mt-1.5">Masuk dengan akun dapur Anda untuk membuka checklist hari ini.</p>

            {/* form */}
            <form onSubmit={submit} className={`mt-6 space-y-4 ${shake ? 'animate-shake' : ''}`} noValidate>
              <div>
                <label htmlFor="identifier" className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-sky-200/80">Email / Username</label>
                <div className="mt-1.5 relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-200/50" />
                  <input
                    id="identifier" type="text" autoComplete="username" autoFocus
                    value={identifier} onChange={e => setIdentifier(e.target.value)}
                    placeholder="contoh: muhammadDimas@gmail.com"
                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/7 ring-1 ring-white/15 text-white placeholder-slate-400 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-gold-400 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-sky-200/80">Password</label>
                  <span className="text-[10px] font-bold text-sky-200/50">Lupa password? Hubungi Admin</span>
                </div>
                <div className="mt-1.5 relative">
                  <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-200/50" />
                  <input
                    id="password" type={show ? 'text' : 'password'} autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full h-12 pl-11 pr-12 rounded-2xl bg-white/7 ring-1 ring-white/15 text-white placeholder-slate-400 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-gold-400 focus:bg-white/10 transition-all"
                  />
                  <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-sky-200/60 hover:text-white" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3" role="alert">
                  <CircleAlert size={17} className="text-red-300 shrink-0 mt-0.5" />
                  <p className="text-[12px] font-semibold text-red-200 leading-snug">{error}</p>
                </div>
              )}

              <button type="submit" disabled={busy}
                className="group w-full h-13 py-4 rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-navy-950 font-extrabold text-[14px] tracking-wide flex items-center justify-center gap-2.5 shadow-[0_10px_30px_-8px_rgba(245,184,61,.45)] transition-all disabled:opacity-70 active:scale-[0.98]">
                {busy ? <><Loader2 size={19} className="animate-spin" /> Memverifikasi…</> : <><LogIn size={19} strokeWidth={2.4} /> Masuk ke Sistem <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>}
              </button>
            </form>

            {/* ── demo account quick select ── */}
            <div className="mt-6">
              <button onClick={() => setShowDemo(v => !v)} className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-sky-200/70 hover:text-gold-400 transition-colors">
                <Users size={13} /> Akun Demo — pilih peran <span className="text-gold-500">{showDemo ? '▲' : '▼'}</span>
              </button>
              {showDemo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                  {DEMO_ACCOUNTS.map(a => (
                    <button key={a.email} onClick={() => quickFill(a.email, a.password)}
                      className="text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-gold-400/50 px-3 py-2.5 transition-all group">
                      <span className="flex items-center gap-2 text-gold-400">{a.icon}<span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-sky-100/80 group-hover:text-gold-400 transition-colors">{ROLE_LABEL[a.role]}</span></span>
                      <span className="block text-[11px] font-bold text-white/95 mt-1">{a.name}</span>
                      <span className="block text-[9px] font-semibold text-slate-400 mt-0.5 leading-snug">{a.note}</span>
                      <span className="block text-[8.5px] font-mono text-sky-200/50 mt-1 truncate">{a.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-[9px] font-semibold text-slate-500 leading-relaxed">
              Restoran Kampung Kecil Mm · Sistem Checklist Dapur v2.4 — Data terenkripsi &amp; tersimpan di server.<br />Dilindungi RBAC (Role-Based Access Control). Unauthorized access is prohibited.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
