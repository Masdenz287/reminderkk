/* ── PANEL ADMIN / OWNER — akun, jadwal, checklist, email, reminder, audit ── */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Settings2, UsersRound, CalendarClock, ListChecks, MailCheck, TimerReset,
  ScrollText, Plus, Pencil, UserX, UserCheck, KeyRound, Search, Trash2, X,
  Save, ShieldCheck, Store, Bell, ChevronRight, Printer, CircleAlert, BadgeCheck,
  ShoppingCart,
} from 'lucide-react';
import { useStore, can } from '../lib/store';
import { Avatar, Modal, SectionHead, EmptyState } from '../components/ui';
import {
  ChecklistTask, Role, Shift, SECTION_META, ROLE_LABEL, SHIFT_LABEL, fmtShort,
  todayStr, id as newId, SectionKey, User,
} from '../lib/types';

type Tab = 'akun' | 'jadwal' | 'checklist' | 'email' | 'reminder' | 'audit' | 'restoran';
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'akun', label: 'Kelola Akun', icon: <UsersRound size={16} /> },
  { key: 'jadwal', label: 'Jadwal & Shift', icon: <CalendarClock size={16} /> },
  { key: 'checklist', label: 'Template Checklist', icon: <ListChecks size={16} /> },
  { key: 'email', label: 'Email Laporan', icon: <MailCheck size={16} /> },
  { key: 'reminder', label: 'Jam Reminder', icon: <TimerReset size={16} /> },
  { key: 'audit', label: 'Riwayat Aktivitas', icon: <ScrollText size={16} /> },
  { key: 'restoran', label: 'Identitas Restoran', icon: <Store size={16} /> },
];

const ROLE_OPTIONS: Role[] = ['admin', 'kepala_koki', 'wakil_koki', 'anggota'];
const blankUser = (): User => ({
  id: '', email: '', username: '', password: '', name: '', initials: '', role: 'anggota',
  position: '', shift: 'pagi', phone: '', joinDate: todayStr(), active: true, color: '#0f766e',
});
const blankTask = (): Omit<ChecklistTask, 'id'> => ({
  positionKey: '', shift: 'pagi', section: 'pembukaan', title: '', targetTime: '07:00', requiresPhoto: false, mandatory: true,
});

export default function Admin() {
  const { state, dispatch, currentUser } = useStore();
  const me = currentUser!;
  const db = state.db;
  const [params, setParams] = useSearchParams();
  const isAdminRole = me.role === 'admin';
  const requestedTab = (params.get('tab') as Tab) || 'akun';
  const tab: Tab = isAdminRole ? requestedTab : 'audit';
  const setTab = (t: Tab) => setParams(t === 'akun' ? {} : { tab: t });

  /* ── user form state ── */
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<User>(blankUser());
  const [userQuery, setUserQuery] = useState('');
  const [pwReset, setPwReset] = useState<User | null>(null);
  const [pwValue, setPwValue] = useState('');

  const openUserForm = (u?: User) => {
    setEditUser(u ?? null);
    setUserForm(u ? { ...u } : blankUser());
    setUserModal(true);
  };
  const saveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = userForm.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
    const payload: User = {
      ...userForm,
      id: userForm.id || newId(),
      initials: initials || 'NN',
      email: userForm.email.trim().toLowerCase(),
      username: userForm.username.trim().toLowerCase(),
      password: userForm.password || 'nusarasa123',
    };
    dispatch({ type: 'UPSERT_USER', user: payload });
    setUserModal(false);
  };

  /* ── task form state ── */
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<ChecklistTask | null>(null);
  const [taskForm, setTaskForm] = useState<Omit<ChecklistTask, 'id'>>(blankTask());
  const [taskOwner, setTaskOwner] = useState<string>('all');
  const openTaskForm = (t?: ChecklistTask) => {
    setEditTask(t ?? null);
    setTaskForm(t ? { ...t } : blankTask());
    setTaskModal(true);
  };
  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.positionKey || !taskForm.title.trim()) return;
    if (editTask) dispatch({ type: 'UPDATE_TASK', taskId: editTask.id, patch: taskForm });
    else dispatch({ type: 'ADD_TASK', task: taskForm });
    setTaskModal(false);
  };

  /* ── reminder toggles & restaurant ── */
  const [emailInput, setEmailInput] = useState('');
  const [settingsForm, setSettingsForm] = useState(db.settings);
  React.useEffect(() => { setSettingsForm(db.settings); }, [db.settings]);

  /* ── derived ── */
  const filteredUsers = useMemo(() => db.users.filter(u =>
    !userQuery || `${u.name} ${u.email} ${u.username} ${u.position}`.toLowerCase().includes(userQuery.toLowerCase())
  ), [db.users, userQuery]);

  const tasksForOwner = useMemo(() => db.tasks
    .filter(t => taskOwner === 'all' || t.positionKey === taskOwner)
    .sort((a, b) => a.positionKey.localeCompare(b.positionKey) || a.targetTime.localeCompare(b.targetTime)),
    [db.tasks, taskOwner]);

  const usersById = useMemo(() => Object.fromEntries(db.users.map(u => [u.id, u])), [db.users]);

  const saveReminder = (id: string, patch: Partial<(typeof db.settings.reminderRules)[number]>) => {
    const reminderRules = db.settings.reminderRules.map(r => r.id === id ? { ...r, ...patch } : r);
    dispatch({ type: 'UPDATE_SETTINGS', patch: { reminderRules } });
  };
  const addEmail = () => {
    const e = emailInput.trim().toLowerCase();
    if (!e || !e.includes('@')) return;
    if (!db.settings.reportRecipients.includes(e)) dispatch({ type: 'UPDATE_SETTINGS', patch: { reportRecipients: [...db.settings.reportRecipients, e] } });
    setEmailInput('');
  };

  const inputCls = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[12.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-navy-200';
  const labelCls = 'text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400 block mb-1';

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display font-extrabold text-navy-900 text-2xl flex items-center gap-2">
            {isAdminRole ? <Settings2 size={22} className="text-navy-700" /> : <ScrollText size={22} className="text-navy-700" />}
            {isAdminRole ? 'Panel Admin & Owner' : 'Riwayat Aktivitas (Kepala Koki)'}
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{isAdminRole ? 'Kelola akun, jadwal, template checklist, penerima laporan, reminder & audit — tersimpan aman di server.' : 'Jejak audit seluruh tindakan pengguna — mode baca untuk Kepala Koki.'}</p>
        </div>
        <button onClick={() => window.print()} className="sm:ml-auto inline-flex items-center gap-2 px-4 h-11 rounded-2xl border border-slate-300 text-slate-600 hover:border-navy-700 hover:text-navy-800 text-[11px] font-extrabold transition-all"><Printer size={15} /> Cetak Ringkasan</button>
      </div>

      {/* tab bar */}
      <div className="flex gap-1.5 overflow-x-auto nice-scroll pb-1 -mx-1 px-1">
        {(isAdminRole ? TABS : TABS.filter(t => t.key === 'audit')).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-[10.5px] font-extrabold whitespace-nowrap transition-all ${tab === t.key ? 'bg-navy-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-navy-800'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>

          {/* ════════ TAB: AKUN ════════ */}
          {tab === 'akun' && (
            <div className="space-y-3">
              <div className="card p-3 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Cari nama, email, username, jabatan…" className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-100 text-[13px] font-medium" aria-label="Cari akun" />
                </div>
                <button onClick={() => openUserForm()} className="h-11 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 transition-all"><Plus size={16} /> Tambah Akun</button>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {filteredUsers.map(u => (
                  <div key={u.id} className={`card p-4 flex items-start gap-3 ${!u.active ? 'opacity-60 saturate-50' : ''}`}>
                    <Avatar initials={u.initials} color={u.color} size={46} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-extrabold text-navy-900 leading-tight">{u.name} {!u.active && <span className="text-[8px] font-extrabold uppercase text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 align-middle ml-1">Nonaktif</span>}</p>
                      <p className="text-[9.5px] font-semibold text-slate-500 truncate mt-0.5">{u.email}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">{u.position} · {ROLE_LABEL[u.role]} · {SHIFT_LABEL[u.shift]}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button onClick={() => openUserForm(u)} className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-navy-50 text-slate-600 hover:text-navy-800 text-[9px] font-extrabold inline-flex items-center gap-1 transition-all"><Pencil size={11} /> Ubah</button>
                        <button onClick={() => setPwReset(u)} className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 text-[9px] font-extrabold inline-flex items-center gap-1 transition-all"><KeyRound size={11} /> Reset PW</button>
                        <button onClick={() => dispatch({ type: 'TOGGLE_USER_ACTIVE', userId: u.id })} disabled={u.id === me.id} className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-[9px] font-extrabold inline-flex items-center gap-1 transition-all disabled:opacity-40" title={u.id === me.id ? 'Tidak bisa menonaktifkan akun sendiri' : ''}>
                          {u.active ? <><UserX size={11} /> Nonaktifkan</> : <><UserCheck size={11} /> Aktifkan</>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <div className="card col-span-full"><EmptyState icon={<Search size={28} />} title="Akun tidak ditemukan" hint="Ubah kata pencarian di atas." /></div>}
              </div>
            </div>
          )}

          {/* ════════ TAB: JADWAL & SHIFT ════════ */}
          {tab === 'jadwal' && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-3 gap-2">
                {(['pagi', 'siang', 'malam'] as Shift[]).map(shift => {
                  const team = db.users.filter(u => u.shift === shift);
                  return (
                    <div key={shift} className="card overflow-hidden">
                      <div className="navy-panel text-white px-4 py-3 flex items-center justify-between">
                        <div><p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-gold-400">Shift {shift === 'pagi' ? 'Pagi' : shift === 'siang' ? 'Siang' : 'Malam'}</p><p className="text-[10px] font-bold text-sky-100/85">{SHIFT_LABEL[shift]}</p></div>
                        <span className="font-display font-extrabold text-2xl">{team.length}</span>
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        {team.map(u => (
                          <div key={u.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
                            <Avatar initials={u.initials} color={u.color} size={28} />
                            <div className="min-w-0 flex-1"><p className="text-[10.5px] font-extrabold text-slate-800 truncate">{u.name.split(',')[0]}</p><p className="text-[8px] font-bold text-slate-400 truncate">{u.position}</p></div>
                            <select value={u.shift} onChange={e => dispatch({ type: 'UPSERT_USER', user: { ...u, shift: e.target.value as Shift } })} className="text-[9px] font-bold border border-slate-200 rounded-lg px-1.5 h-8 bg-white" aria-label="Ubah shift">
                              <option value="pagi">Pagi</option><option value="siang">Siang</option><option value="malam">Malam</option>
                            </select>
                          </div>
                        ))}
                        {team.length === 0 && <p className="text-[10px] font-semibold text-slate-400 text-center py-3">Belum ada personel</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card p-4 text-[10.5px] font-semibold text-slate-500 leading-relaxed flex items-start gap-2"><CircleAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />Perubahan shift berlaku langsung untuk hari berikutnya. Anggota akan melihat checklist sesuai shift yang baru. Catat perubahan besar di papan pengumuman dapur.</div>
            </div>
          )}

          {/* ════════ TAB: CHECKLIST TEMPLATE ════════ */}
          {tab === 'checklist' && (
            <div className="space-y-3">
              <div className="card p-3 flex flex-col sm:flex-row gap-2">
                <select value={taskOwner} onChange={e => setTaskOwner(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[12px] font-bold flex-1" aria-label="Filter pemilik tugas">
                  <option value="all">Semua Personel ({db.tasks.length} tugas)</option>
                  {[...db.users].sort((a, b) => a.name.localeCompare(b.name)).map(u => <option key={u.id} value={u.id}>{u.name.split(',')[0]} — {u.position} ({db.tasks.filter(t => t.positionKey === u.id).length} tugas)</option>)}
                </select>
                <button onClick={() => openTaskForm()} className="h-11 px-4 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-extrabold inline-flex items-center gap-1.5"><Plus size={16} /> Tambah Tugas</button>
              </div>
              <div className="card overflow-hidden">
                <div className="divide-y divide-slate-100 max-h-[62vh] overflow-y-auto nice-scroll">
                  {tasksForOwner.map(t => {
                    const owner = usersById[t.positionKey];
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                        <span className="hidden sm:flex w-10 flex-col items-center"><span className="text-[10px] font-extrabold text-navy-800 tabular-nums">{t.targetTime}</span><span className="text-[7px] font-bold text-slate-400 uppercase">{t.shift === 'semua' ? 'Semua' : t.shift}</span></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 leading-snug">{t.title}</p>
                          <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{SECTION_META[t.section].label} · {owner?.name.split(' ')[0]}{t.requiresPhoto ? ' · 📷 foto' : ''}{t.mandatory ? ' · wajib' : ''}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openTaskForm(t)} className="p-2 rounded-lg hover:bg-navy-50 text-slate-400 hover:text-navy-800" aria-label="Ubah tugas"><Pencil size={14} /></button>
                          <button onClick={() => dispatch({ type: 'DELETE_TASK', taskId: t.id })} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" aria-label="Hapus tugas"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                  {tasksForOwner.length === 0 && <EmptyState icon={<ListChecks size={26} />} title="Belum ada tugas" hint="Klik Tambah Tugas untuk membuat checklist baru." />}
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB: EMAIL LAPORAN ════════ */}
          {tab === 'email' && (
            <div className="grid lg:grid-cols-2 gap-3">
              <div className="card p-5">
                <SectionHead icon={<MailCheck size={15} />} title="Penerima Laporan Harian" />
                <p className="text-[10px] font-semibold text-slate-500 mb-2">Setiap malam 22.45, ringkasan operasional (progress, masalah, approval) dikirim otomatis ke alamat berikut:</p>
                <div className="flex gap-2">
                  <input value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEmail()} type="email" placeholder="nama@email.com" className={inputCls} aria-label="Tambah email" />
                  <button onClick={addEmail} className="h-11 px-4 rounded-xl bg-navy-900 text-white text-[11px] font-extrabold">Tambah</button>
                </div>
                <div className="space-y-1.5 mt-3">
                  {db.settings.reportRecipients.map(email => (
                    <div key={email} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <span className="w-8 h-8 rounded-lg bg-navy-900 text-gold-400 flex items-center justify-center shrink-0"><MailCheck size={15} /></span>
                      <span className="text-[11.5px] font-bold text-slate-700 truncate flex-1">{email}</span>
                      <button onClick={() => dispatch({ type: 'TOGGLE_RECIPIENT', email })} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" aria-label="Hapus penerima"><X size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <SectionHead icon={<ShoppingCart size={15} />} title="Preview Email Ringkasan" />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[10.5px] font-medium text-slate-600 leading-relaxed">
                  <p className="font-extrabold text-navy-900 text-[11px]">Restoran Nusa Rasa — Laporan Harian {fmtShort(todayStr())}</p>
                  <p className="mt-1.5">Halo Tim Owner &amp; Kepala Koki,</p>
                  <p className="mt-1">Ringkasan operasional hari ini: checklist tim pagi <b>14/16 tugas (88%)</b>, 1 laporan menunggu approval, <b>2 masalah terbuka</b> (1 bahan habis, 1 alat rusak kritis). Temuan kebersihan kemarin telah diselesaikan.</p>
                  <p className="mt-1">Detail lengkap terlampir. Mohon segera review laporan yang menunggu approval sebelum buka besok pagi.</p>
                  <p className="mt-1.5 text-slate-400">Sistem Kitchen Nusa Rasa · Dikirim otomatis pukul 22.45 WIB</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2">* Email dikirim melalui gateway SMTP restoran. Konfigurasi server ada di pengaturan hosting — kredensial tidak disimpan di frontend.</p>
              </div>
            </div>
          )}

          {/* ════════ TAB: REMINDER ════════ */}
          {tab === 'reminder' && (
            <div className="card overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-navy-800"><TimerReset size={15} /> Jadwal Reminder Otomatis</h2>
                <span className="text-[9px] font-bold text-slate-400">Perubahan tersimpan seketika</span>
              </div>
              <div className="divide-y divide-slate-100">
                {db.settings.reminderRules.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                    <button onClick={() => saveReminder(r.id, { enabled: !r.enabled })} role="switch" aria-checked={r.enabled} aria-label={`Aktifkan ${r.label}`}
                      className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${r.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-bold text-slate-800 leading-snug">{r.label}</p>
                      <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Target: {r.target}</p>
                    </div>
                    {r.time !== 'AUTO' ? (
                      <input type="time" value={r.time} onChange={e => saveReminder(r.id, { time: e.target.value })} className="h-10 px-2 rounded-xl border border-slate-200 text-[12px] font-extrabold tabular-nums w-24" aria-label="Jam reminder" />
                    ) : (
                      <span className="h-10 px-3 rounded-xl bg-violet-50 text-violet-700 text-[10px] font-extrabold flex items-center uppercase tracking-widest">Otomatis</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════ TAB: AUDIT ════════ */}
          {tab === 'audit' && (
            <div className="card overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-navy-800"><ScrollText size={15} /> Riwayat Aktivitas (Audit Trail)</h2>
                <button onClick={() => window.print()} className="text-[9px] font-extrabold uppercase tracking-widest text-navy-700 flex items-center gap-1 hover:text-navy-900"><Printer size={12} /> Export</button>
              </div>
              <div className="divide-y divide-slate-100 max-h-[64vh] overflow-y-auto nice-scroll">
                {db.audit.map(log => {
                  const u = usersById[log.userId];
                  const tone = log.action.includes('LOGIN') ? 'text-sky-700 bg-sky-50' : log.action.includes('APPROVAL') ? 'text-emerald-700 bg-emerald-50' : log.action.includes('MASALAH') ? 'text-red-700 bg-red-50' : log.action.includes('AKUN') ? 'text-violet-700 bg-violet-50' : 'text-slate-600 bg-slate-100';
                  return (
                    <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                      <Avatar initials={u?.initials ?? 'SY'} color={u?.color ?? '#64748b'} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[8px] font-extrabold uppercase tracking-[0.18em] rounded-md px-1.5 py-0.5 ${tone}`}>{log.action}</span>
                          <span className="text-[9px] font-bold text-slate-400 tabular-nums">{fmtShort(log.date)} · {log.time} WIB</span>
                          <span className="text-[9px] font-bold text-slate-500">· {u?.name.split(',')[0] ?? 'Sistem'}</span>
                        </div>
                        <p className="text-[10.5px] font-semibold text-slate-600 leading-snug mt-1">{log.detail}</p>
                      </div>
                    </div>
                  );
                })}
                {db.audit.length === 0 && <EmptyState icon={<ScrollText size={26} />} title="Belum ada aktivitas" hint="Aktivitas pengguna akan tercatat otomatis." />}
              </div>
            </div>
          )}

          {/* ════════ TAB: RESTORAN ════════ */}
          {tab === 'restoran' && (
            <div className="grid lg:grid-cols-2 gap-3">
              <form className="card p-5 space-y-3" onSubmit={e => { e.preventDefault(); dispatch({ type: 'UPDATE_SETTINGS', patch: settingsForm }); }}>
                <SectionHead icon={<Store size={15} />} title="Identitas & Target Restoran" />
                <div><label className={labelCls} htmlFor="rn">Nama Restoran</label><input id="rn" className={inputCls} value={settingsForm.restaurantName} onChange={e => setSettingsForm(s => ({ ...s, restaurantName: e.target.value }))} /></div>
                <div><label className={labelCls} htmlFor="rb">Cabang / Alamat</label><input id="rb" className={inputCls} value={settingsForm.branch} onChange={e => setSettingsForm(s => ({ ...s, branch: e.target.value }))} /></div>
                <div><label className={labelCls} htmlFor="wt">Target Penyelesaian Mingguan (%)</label>
                  <div className="flex items-center gap-3"><input id="wt" type="range" min={50} max={100} step={5} value={settingsForm.weeklyTarget} onChange={e => setSettingsForm(s => ({ ...s, weeklyTarget: Number(e.target.value) }))} className="flex-1 accent-navy-900" /><span className="font-display font-extrabold text-2xl text-navy-900 w-14 text-right tabular-nums">{settingsForm.weeklyTarget}%</span></div>
                </div>
                <button type="submit" className="w-full h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-[12px] flex items-center justify-center gap-2"><Save size={16} /> Simpan Perubahan</button>
              </form>
              <div className="card p-5">
                <SectionHead icon={<ShieldCheck size={15} />} title="Catatan Keamanan Sistem" />
                <ul className="space-y-2 text-[10.5px] font-semibold text-slate-600 leading-relaxed">
                  <li className="flex gap-2"><BadgeCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />Autentikasi berbasis sesi; kata sandi tidak pernah dikirim ke analytics pihak ketiga.</li>
                  <li className="flex gap-2"><BadgeCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />Hak akses berbasis peran (RBAC): anggota hanya melihat &amp; mengubah checklist miliknya.</li>
                  <li className="flex gap-2"><BadgeCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />Seluruh tindakan tercatat di Audit Trail — tidak ada aksi yang tersembunyi.</li>
                  <li className="flex gap-2"><BadgeCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />Mode produksi: password di-hash (bcrypt), database PostgreSQL/Supabase, komunikasi TLS — (lihat dokumentasi teknis di halaman README proyek).</li>
                  <li className="flex gap-2"><BadgeCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />Reset password hanya oleh Admin; kredensial server tidak disimpan di frontend.</li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ════════ USER MODAL ════════ */}
      <Modal open={userModal} onClose={() => setUserModal(false)} wide title={editUser ? 'Ubah Akun' : 'Tambah Akun Baru'} subtitle={editUser ? editUser.email : 'Formulir pendaftaran anggota dapur'}>
        <form onSubmit={saveUser} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className={labelCls} htmlFor="nm">Nama Lengkap *</label><input id="nm" required className={inputCls} value={userForm.name} onChange={e => setUserForm(s => ({ ...s, name: e.target.value }))} placeholder="mis. Sari Wulandari" /></div>
          <div><label className={labelCls} htmlFor="em">Email *</label><input id="em" required type="email" className={inputCls} value={userForm.email} onChange={e => setUserForm(s => ({ ...s, email: e.target.value }))} placeholder="nama@nusarasa.co.id" /></div>
          <div><label className={labelCls} htmlFor="un">Username *</label><input id="un" required className={inputCls} value={userForm.username} onChange={e => setUserForm(s => ({ ...s, username: e.target.value }))} placeholder="sari" /></div>
          {!editUser && <div className="sm:col-span-2"><label className={labelCls} htmlFor="pw">Password Awal</label><input id="pw" className={inputCls} value={userForm.password} onChange={e => setUserForm(s => ({ ...s, password: e.target.value }))} placeholder="Kosongkan untuk default: nusarasa123" /></div>}
          <div><label className={labelCls} htmlFor="rl">Peran / Role *</label><select id="rl" className={inputCls} value={userForm.role} onChange={e => setUserForm(s => ({ ...s, role: e.target.value as Role }))}>{ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
          <div><label className={labelCls} htmlFor="ps">Jabatan *</label><input id="ps" required className={inputCls} value={userForm.position} onChange={e => setUserForm(s => ({ ...s, position: e.target.value }))} placeholder="Line Cook" /></div>
          <div><label className={labelCls} htmlFor="sh">Shift</label><select id="sh" className={inputCls} value={userForm.shift} onChange={e => setUserForm(s => ({ ...s, shift: e.target.value as Shift }))}><option value="pagi">Pagi (06–14)</option><option value="siang">Siang (14–22)</option><option value="malam">Malam (22–06)</option></select></div>
          <div><label className={labelCls} htmlFor="ph">No. HP</label><input id="ph" className={inputCls} value={userForm.phone} onChange={e => setUserForm(s => ({ ...s, phone: e.target.value }))} placeholder="08xx-xxxx-xxxx" /></div>
          <div className="sm:col-span-2 flex gap-2 pt-1">
            <button type="button" onClick={() => setUserModal(false)} className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-extrabold text-[12px]">Batal</button>
            <button type="submit" className="flex-1 h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-[12px] inline-flex items-center justify-center gap-2"><Save size={16} /> Simpan Akun</button>
          </div>
        </form>
      </Modal>

      {/* ════════ RESET PASSWORD MODAL ════════ */}
      <Modal open={!!pwReset} onClose={() => setPwReset(null)} title="Reset Password" subtitle={pwReset?.name}>
        <div className="space-y-3">
          <input type="text" value={pwValue} onChange={e => setPwValue(e.target.value)} placeholder="Password baru (min. 6 karakter)" className={inputCls} autoFocus />
          <div className="flex gap-2">
            <button onClick={() => setPwReset(null)} className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-extrabold text-[12px]">Batal</button>
            <button onClick={() => { if (pwValue.trim().length >= 6) { dispatch({ type: 'RESET_PASSWORD', userId: pwReset!.id, newPassword: pwValue.trim() }); setPwReset(null); setPwValue(''); } }} className="flex-1 h-12 rounded-2xl bg-amber-500 text-navy-950 font-extrabold text-[12px] inline-flex items-center justify-center gap-2"><KeyRound size={15} /> Reset Sekarang</button>
          </div>
        </div>
      </Modal>

      {/* ════════ TASK MODAL ════════ */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} wide title={editTask ? 'Ubah Tugas Checklist' : 'Tambah Tugas Baru'} subtitle="Atur posisi, shift, seksi, jam target & kewajiban foto">
        <form onSubmit={saveTask} className="grid sm:grid-cols-2 gap-3">
          <div><label className={labelCls} htmlFor="own">Personel (Posisi) *</label>
            <select id="own" required className={inputCls} value={taskForm.positionKey} onChange={e => setTaskForm(s => ({ ...s, positionKey: e.target.value }))}>
              <option value="">— Pilih personel —</option>
              {db.users.filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id}>{u.name.split(',')[0]} — {u.position}</option>)}
            </select></div>
          <div><label className={labelCls} htmlFor="tsft">Shift *</label>
            <select id="tsft" className={inputCls} value={taskForm.shift} onChange={e => setTaskForm(s => ({ ...s, shift: e.target.value as Shift | 'semua' }))}><option value="pagi">Pagi</option><option value="siang">Siang</option><option value="malam">Malam</option><option value="semua">Semua Shift</option></select></div>
          <div className="sm:col-span-2"><label className={labelCls} htmlFor="ttl">Nama Tugas *</label><input id="ttl" required className={inputCls} value={taskForm.title} onChange={e => setTaskForm(s => ({ ...s, title: e.target.value }))} placeholder="mis. Cek suhu freezer & chiller" /></div>
          <div><label className={labelCls} htmlFor="sec">Seksi *</label>
            <select id="sec" className={inputCls} value={taskForm.section} onChange={e => setTaskForm(s => ({ ...s, section: e.target.value as SectionKey }))}>{(Object.keys(SECTION_META) as SectionKey[]).map(k => <option key={k} value={k}>{SECTION_META[k].label}</option>)}</select></div>
          <div><label className={labelCls} htmlFor="tt">Jam Target *</label><input id="tt" type="time" required className={inputCls} value={taskForm.targetTime} onChange={e => setTaskForm(s => ({ ...s, targetTime: e.target.value }))} /></div>
          <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-navy-900" checked={taskForm.requiresPhoto} onChange={e => setTaskForm(s => ({ ...s, requiresPhoto: e.target.checked }))} /><span className="text-[11px] font-bold text-slate-700">Wajib lampirkan foto</span></label>
          <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-navy-900" checked={taskForm.mandatory} onChange={e => setTaskForm(s => ({ ...s, mandatory: e.target.checked }))} /><span className="text-[11px] font-bold text-slate-700">Tugas wajib (bertanda *)</span></label>
          <div className="sm:col-span-2 flex gap-2 pt-1">
            <button type="button" onClick={() => setTaskModal(false)} className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-extrabold text-[12px]">Batal</button>
            <button type="submit" className="flex-1 h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-[12px] inline-flex items-center justify-center gap-2"><Save size={16} /> Simpan Tugas</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
