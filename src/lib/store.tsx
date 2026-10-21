/* ── Store: context + reducer + localStorage persistence + RBAC helpers ── */
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { buildSeedDB } from './seed';
import {
  ActivityDay, ChecklistTask, DB, Issue, IssueStatus, Notification,
  PurchaseStatus, ReportStatus, Role, Shift, TaskEntry, User,
  id, nowTime, todayStr,
} from './types';

const LS_DB = 'nr_db_v1';
const LS_SESSION = 'nr_session_v1';

/* ── state ────────────────────────────────────────────────────────────────── */
export interface AppState {
  db: DB;
  currentUserId: string | null;
  toast: { id: string; title: string; body?: string; tone: 'ok' | 'warn' | 'err' | 'info' } | null;
}

const pushAudit = (db: DB, userId: string, action: string, detail: string): DB => ({
  ...db,
  audit: [{ id: id(), date: todayStr(), time: nowTime(), userId, action, detail }, ...db.audit].slice(0, 300),
});
const pushNotif = (db: DB, n: Omit<Notification, 'id' | 'date' | 'time' | 'read'>): DB => ({
  ...db,
  notifications: [{ ...n, id: id(), date: todayStr(), time: nowTime(), read: false }, ...db.notifications],
});

export type Action =
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_TASK'; dayDate: string; shift: Shift; taskId: string; patch: Partial<TaskEntry> }
  | { type: 'SUBMIT_REPORT'; dayDate: string; shift: Shift; userId: string }
  | { type: 'REVIEW_REPORT'; dayDate: string; shift: Shift; reviewerId: string; status: ReportStatus; note: string }
  | { type: 'ADD_ISSUE'; issue: Omit<Issue, 'id' | 'date' | 'time' | 'status'> & { status?: IssueStatus } }
  | { type: 'UPDATE_ISSUE'; issueId: string; patch: Partial<Issue> }
  | { type: 'ADD_NOTIF'; notif: Omit<Notification, 'id' | 'date' | 'time' | 'read'> }
  | { type: 'MARK_NOTIF_READ'; notifId?: string; all?: boolean; userId: string }
  | { type: 'UPSERT_USER'; user: User }
  | { type: 'TOGGLE_USER_ACTIVE'; userId: string }
  | { type: 'RESET_PASSWORD'; userId: string; newPassword: string }
  | { type: 'ADD_TASK'; task: Omit<ChecklistTask, 'id'> }
  | { type: 'UPDATE_TASK'; taskId: string; patch: Partial<ChecklistTask> }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<DB['settings']> }
  | { type: 'TOGGLE_RECIPIENT'; email: string }
  | { type: 'ADD_PURCHASE'; item: string; qty: string; reason: string; userId: string }
  | { type: 'SET_PURCHASE_STATUS'; purchaseId: string; status: PurchaseStatus }
  | { type: 'TOAST'; toast: AppState['toast'] }
  | { type: 'DISMISS_TOAST' }
  | { type: 'RESET_DEMO' };

const getDay = (db: DB, date: string, shift: Shift): ActivityDay | undefined =>
  db.days.find(d => d.date === date && d.shift === shift);

export function reducer(state: AppState, action: Action): AppState {
  const { db } = state;
  switch (action.type) {
    case 'LOGIN': {
      const u = db.users.find(x => x.id === action.userId)!;
      const next = pushAudit(db, u.id, 'LOGIN', `${u.name} masuk ke sistem (${u.role === 'admin' ? 'Admin' : 'Akses ' + u.role.replace('_', ' ')})`);
      return { ...state, db: next, currentUserId: u.id };
    }
    case 'LOGOUT': return { ...state, currentUserId: null };

    case 'SET_TASK': {
      const day = getDay(db, action.dayDate, action.shift);
      const existing: TaskEntry = day?.entries[action.taskId] ?? { taskId: action.taskId, checked: false, status: 'ok', notes: '' };
      const patch = action.patch;
      const merged: TaskEntry = { ...existing, ...patch };
      // auto completion metadata
      if (patch.checked === true && !existing.checked) {
        merged.completedAt = new Date().toISOString();
        merged.completedBy = state.currentUserId ?? undefined;
      }
      if (patch.checked === false) {
        merged.completedAt = undefined;
        merged.completedBy = undefined;
        if (patch.status === undefined) merged.status = 'ok';
      }
      const entries = { ...(day?.entries ?? {}), [action.taskId]: merged };
      const days = day
        ? db.days.map(d => (d.date === action.dayDate && d.shift === action.shift) ? { ...d, entries } : d)
        : [...db.days, { date: action.dayDate, shift: action.shift, entries, status: 'menunggu' as ReportStatus }];
      const task = db.tasks.find(t => t.id === action.taskId);
      const u = db.users.find(x => x.id === state.currentUserId);
      const detail = patch.checked === true
        ? `Menyelesaikan "${task?.title ?? action.taskId}"`
        : patch.checked === false
          ? `Membatalkan "${task?.title ?? action.taskId}"`
          : `Update "${task?.title ?? action.taskId}"`;
      let next: DB = { ...db, days };
      if (patch.checked === true || patch.checked === false) {
        next = pushAudit(next, u?.id ?? 'system', 'CHECKLIST', detail);
      }
      return { ...state, db: next };
    }

    case 'SUBMIT_REPORT': {
      const day = getDay(db, action.dayDate, action.shift);
      const days = day
        ? db.days.map(d => (d.date === action.dayDate && d.shift === action.shift) ? { ...d, submittedAt: new Date().toISOString(), status: 'menunggu' as ReportStatus } : d)
        : [...db.days, { date: action.dayDate, shift: action.shift, entries: {}, submittedAt: new Date().toISOString(), status: 'menunggu' as ReportStatus }];
      const u = db.users.find(x => x.id === action.userId)!;
      let next: DB = { ...db, days };
      next = pushAudit(next, u.id, 'LAPORAN DIKIRIM', `Laporan ${action.shift} tanggal ${action.dayDate} dikirim ke Kepala Koki`);
      next = pushNotif(next, {
        type: 'approval', title: 'Laporan Menunggu Approval',
        body: `${u.name} mengirim laporan ${action.shift} (${action.dayDate}) untuk diperiksa & disetujui.`,
        targetRoles: ['kepala_koki', 'admin'], link: '/dashboard',
      });
      return { ...state, db: next, toast: { id: id(), title: 'Laporan terkirim', body: 'Kepala Koki akan memeriksa & menyetujui laporan Anda.', tone: 'ok' } };
    }

    case 'REVIEW_REPORT': {
      const days = db.days.map(d => (d.date === action.dayDate && d.shift === action.shift)
        ? { ...d, status: action.status, reviewerNote: action.note, reviewedBy: action.reviewerId, reviewedAt: new Date().toISOString() }
        : d);
      const reviewer = db.users.find(x => x.id === action.reviewerId)!;
      let next: DB = { ...db, days };
      next = pushAudit(next, reviewer.id, 'APPROVAL',
        `${action.status === 'disetujui' ? 'Menyetujui' : action.status === 'ditolak' ? 'Menolak' : 'Meminta revisi'} laporan ${action.shift} ${action.dayDate}${action.note ? ` — "${action.note}"` : ''}`);
      const dayShiftUserIds = db.users.filter(u => u.shift === action.shift && u.role === 'anggota').map(u => u.id);
      next = pushNotif(next, {
        type: action.status === 'disetujui' ? 'sukses' : 'terlambat',
        title: action.status === 'disetujui' ? 'Laporan Disetujui' : action.status === 'ditolak' ? 'Laporan Ditolak' : 'Revisi Diminta',
        body: `Kepala Koki ${action.status === 'disetujui' ? 'menyetujui' : action.status === 'ditolak' ? 'menolak' : 'meminta revisi pada'} laporan ${action.shift} ${action.dayDate}.${action.note ? ` Catatan: ${action.note}` : ''}`,
        targetRoles: ['wakil_koki', 'anggota'],
        targetUserId: undefined,
      });
      void dayShiftUserIds;
      return { ...state, db: next, toast: { id: id(), title: action.status === 'disetujui' ? 'Laporan disetujui' : 'Review tersimpan', body: 'Notifikasi telah dikirim ke tim terkait.', tone: 'ok' } };
    }

    case 'ADD_ISSUE': {
      const reporter = db.users.find(u => u.id === action.issue.reporterId);
      const issue: Issue = { ...action.issue, id: id(), date: todayStr(), time: nowTime(), status: action.issue.status ?? 'terbuka' };
      let next: DB = { ...db, issues: [issue, ...db.issues] };
      next = pushAudit(next, issue.reporterId, 'LAPOR MASALAH', `[${issue.category.replace('_', ' ').toUpperCase()}] ${issue.title} (${issue.severity.toUpperCase()})`);
      const sevLabel = issue.severity === 'kritis' ? 'KRITIS' : issue.severity === 'tinggi' ? 'TINGGI' : issue.severity === 'sedang' ? 'SEDANG' : 'RENDAH';
      next = pushNotif(next, {
        type: issue.category === 'bahan_habis' ? 'bahan_habis' : issue.category === 'kebersihan' ? 'kebersihan' : 'masalah',
        title: `[${sevLabel}] ${issue.category === 'bahan_habis' ? 'Bahan Habis' : issue.category === 'alat_rusak' ? 'Alat Rusak' : issue.category === 'kebersihan' ? 'Kebersihan' : issue.category === 'keselamatan' ? 'Keselamatan' : 'Masalah'}: ${issue.title}`,
        body: `${reporter?.name ?? 'Anggota'} melaporkan: ${issue.detail.slice(0, 140)}`,
        targetRoles: ['kepala_koki', 'wakil_koki', 'admin'], link: '/issues',
      });
      return { ...state, db: next, toast: { id: id(), title: 'Laporan masalah terkirim', body: 'Kepala Koki & Wakil Koki telah menerima notifikasi.', tone: 'warn' } };
    }

    case 'UPDATE_ISSUE': {
      const target = db.issues.find(i => i.id === action.issueId);
      const issues = db.issues.map(i => i.id === action.issueId ? { ...i, ...action.patch } : i);
      let next: DB = { ...db, issues };
      const u = db.users.find(x => x.id === state.currentUserId);
      if (action.patch.status === 'selesai' && target?.status !== 'selesai') {
        next = pushAudit(next, u?.id ?? 'system', 'MASALAH SELESAI', `"${target?.title}" ditandai selesai${action.patch.resolution ? ` — ${action.patch.resolution}` : ''}`);
        next = pushNotif(next, {
          type: 'sukses', title: 'Masalah Selesai',
          body: `"${target?.title}" telah diselesaikan oleh ${u?.name ?? 'tim'}.`,
          targetRoles: ['kepala_koki', 'wakil_koki', 'admin'], link: '/issues',
        });
      } else {
        next = pushAudit(next, u?.id ?? 'system', 'UPDATE MASALAH', `"${target?.title}" → ${action.patch.status ?? 'update'}`);
      }
      return { ...state, db: next };
    }

    case 'ADD_NOTIF': {
      const next = pushNotif(db, action.notif);
      return { ...state, db: next };
    }

    case 'MARK_NOTIF_READ': {
      const uid = action.userId;
      const visible = (n: Notification) => (n.targetUserId ? n.targetUserId === uid : true);
      const notifications = db.notifications.map(n => {
        if (!visible(n)) return n;
        if (action.all) return { ...n, read: true };
        if (action.notifId && n.id === action.notifId) return { ...n, read: true };
        return n;
      });
      return { ...state, db: { ...db, notifications } };
    }

    case 'UPSERT_USER': {
      const exists = db.users.some(u => u.id === action.user.id);
      const users = exists ? db.users.map(u => u.id === action.user.id ? action.user : u) : [...db.users, action.user];
      const u = db.users.find(x => x.id === state.currentUserId);
      let next: DB = { ...db, users };
      next = pushAudit(next, u?.id ?? 'system', exists ? 'AKUN DIUBAH' : 'AKUN DIBUAT', `${action.user.name} (${action.user.email}) — ${action.user.role}${exists ? '' : ' didaftarkan'}`);
      return { ...state, db: next };
    }

    case 'TOGGLE_USER_ACTIVE': {
      const target = db.users.find(u => u.id === action.userId)!;
      const users = db.users.map(u => u.id === action.userId ? { ...u, active: !u.active } : u);
      const u = db.users.find(x => x.id === state.currentUserId);
      let next: DB = { ...db, users };
      next = pushAudit(next, u?.id ?? 'system', target.active ? 'AKUN DINONAKTIFKAN' : 'AKUN DIAKTIFKAN', `${target.name} (${target.email})`);
      return { ...state, db: next, toast: { id: id(), title: target.active ? 'Akun dinonaktifkan' : 'Akun diaktifkan', body: target.name, tone: target.active ? 'warn' : 'ok' } };
    }

    case 'RESET_PASSWORD': {
      const target = db.users.find(u => u.id === action.userId)!;
      const users = db.users.map(u => u.id === action.userId ? { ...u, password: action.newPassword } : u);
      const u = db.users.find(x => x.id === state.currentUserId);
      let next: DB = { ...db, users };
      next = pushAudit(next, u?.id ?? 'system', 'RESET PASSWORD', `Password ${target.name} direset oleh admin`);
      return { ...state, db: next, toast: { id: id(), title: 'Password direset', body: `Password baru untuk ${target.name} telah disimpan.`, tone: 'ok' } };
    }

    case 'ADD_TASK': {
      const t = { ...action.task, id: id() };
      const u = db.users.find(x => x.id === state.currentUserId);
      let next: DB = { ...db, tasks: [...db.tasks, t] };
      next = pushAudit(next, u?.id ?? 'system', 'CHECKLIST', `Tugas baru ditambahkan: "${t.title}" (${t.positionKey})`);
      return { ...state, db: next, toast: { id: id(), title: 'Tugas ditambahkan', body: t.title, tone: 'ok' } };
    }

    case 'UPDATE_TASK': {
      const tasks = db.tasks.map(t => t.id === action.taskId ? { ...t, ...action.patch } : t);
      const u = db.users.find(x => x.id === state.currentUserId);
      const t = tasks.find(x => x.id === action.taskId);
      let next: DB = { ...db, tasks };
      next = pushAudit(next, u?.id ?? 'system', 'CHECKLIST', `Tugas diperbarui: "${t?.title}"`);
      return { ...state, db: next };
    }

    case 'DELETE_TASK': {
      const t = db.tasks.find(x => x.id === action.taskId);
      const u = db.users.find(x => x.id === state.currentUserId);
      let next: DB = { ...db, tasks: db.tasks.filter(x => x.id !== action.taskId) };
      next = pushAudit(next, u?.id ?? 'system', 'CHECKLIST', `Tugas dihapus: "${t?.title}"`);
      return { ...state, db: next };
    }

    case 'UPDATE_SETTINGS': {
      const u = db.users.find(x => x.id === state.currentUserId);
      let next: DB = { ...db, settings: { ...db.settings, ...action.patch } };
      next = pushAudit(next, u?.id ?? 'system', 'PENGATURAN', 'Pengaturan restoran diperbarui');
      return { ...state, db: next, toast: { id: id(), title: 'Pengaturan tersimpan', tone: 'ok' } };
    }

    case 'TOGGLE_RECIPIENT': {
      const cur = db.settings.reportRecipients;
      const reportRecipients = cur.includes(action.email) ? cur.filter(e => e !== action.email) : [...cur, action.email];
      const u = db.users.find(x => x.id === state.currentUserId);
      const next: DB = { ...db, settings: { ...db.settings, reportRecipients } };
      return { ...state, db: pushAudit(next, u?.id ?? 'system', 'PENGATURAN', `Penerima laporan: ${reportRecipients.join(', ')}`) };
    }

    case 'ADD_PURCHASE': {
      const pr = { id: id(), date: todayStr(), userId: action.userId, item: action.item, qty: action.qty, reason: action.reason, status: 'diajukan' as PurchaseStatus };
      const u = db.users.find(x => x.id === action.userId);
      let next: DB = { ...db, purchases: [pr, ...db.purchases] };
      next = pushAudit(next, action.userId, 'PURCHASE REQUEST', `${action.item} — ${action.qty} (${action.reason})`);
      next = pushNotif(next, {
        type: 'info', title: 'Purchase Request Baru',
        body: `${u?.name} mengajukan: ${action.item} (${action.qty})`,
        targetRoles: ['kepala_koki', 'wakil_koki', 'admin'], link: '/issues',
      });
      return { ...state, db: next, toast: { id: id(), title: 'Purchase request terkirim', body: 'Menunggu persetujuan Kepala Koki / Owner.', tone: 'info' } };
    }

    case 'SET_PURCHASE_STATUS': {
      const purchases = db.purchases.map(p => p.id === action.purchaseId ? { ...p, status: action.status } : p);
      const u = db.users.find(x => x.id === state.currentUserId);
      const pr = purchases.find(p => p.id === action.purchaseId);
      let next: DB = { ...db, purchases };
      next = pushAudit(next, u?.id ?? 'system', 'PURCHASE REQUEST', `${pr?.item} → ${action.status}`);
      return { ...state, db: next, toast: { id: id(), title: 'Status PR diperbarui', tone: 'ok' } };
    }

    case 'TOAST': return { ...state, toast: action.toast };
    case 'DISMISS_TOAST': return { ...state, toast: null };
    case 'RESET_DEMO': {
      localStorage.removeItem(LS_DB);
      localStorage.removeItem(LS_SESSION);
      return { db: buildSeedDB(), currentUserId: null, toast: { id: id(), title: 'Demo direset', body: 'Seluruh data dikembalikan ke kondisi awal.', tone: 'info' } };
    }
    default: return state;
  }
}

function initState(): AppState {
  let db: DB | null = null;
  try {
    const raw = localStorage.getItem(LS_DB);
    if (raw) db = JSON.parse(raw) as DB;
  } catch { db = null; }
  if (!db || !db.users?.length) db = buildSeedDB();
  let currentUserId: string | null = null;
  try {
    const s = localStorage.getItem(LS_SESSION);
    if (s) {
      const parsed = JSON.parse(s) as { userId: string };
      if (db.users.some(u => u.id === parsed.userId && u.active)) currentUserId = parsed.userId;
    }
  } catch { currentUserId = null; }
  return { db, currentUserId, toast: null };
}

/* ── permissions (RBAC) ───────────────────────────────────────────────────── */
export const can = {
  manageTeam: (r: Role) => r === 'admin',
  manageSettings: (r: Role) => r === 'admin',
  manageChecklistTemplate: (r: Role) => r === 'admin',
  viewAllChecklists: (r: Role) => r === 'admin' || r === 'kepala_koki' || r === 'wakil_koki',
  viewReports: (r: Role) => r === 'admin' || r === 'kepala_koki' || r === 'wakil_koki',
  approveReports: (r: Role) => r === 'admin' || r === 'kepala_koki',
  viewDashboard: (r: Role) => r === 'admin' || r === 'kepala_koki' || r === 'wakil_koki',
  viewAudit: (r: Role) => r === 'admin' || r === 'kepala_koki',
  viewIssues: (r: Role) => true, // everyone sees issues relevant to kitchen
  updateIssues: (r: Role) => r === 'admin' || r === 'kepala_koki' || r === 'wakil_koki',
  exportReport: (_r: Role) => true,
  seeActivityOf: (_viewer: Role, _target: User) => true,
};

/** Tasks that a user is assigned to (used for their own checklist). */
export function tasksForUser(db: DB, user: User, date?: string, shift?: Shift): ChecklistTask[] {
  const sh = shift ?? user.shift;
  return db.tasks.filter(t =>
    t.positionKey === user.id &&
    (t.shift === 'semua' || t.shift === sh)
  );
}

/** Progress of a user on a given day/shift. */
export function progressOf(db: DB, user: User, date: string, shift?: Shift) {
  const tasks = tasksForUser(db, user, date, shift);
  const day = getDay(db, date, shift ?? user.shift);
  const done = tasks.filter(t => day?.entries[t.id]?.checked).length;
  const na = tasks.filter(t => day?.entries[t.id]?.status === 'tidak_berlaku').length;
  const total = tasks.length;
  const effective = Math.max(1, total - na);
  const pct = Math.round((done / effective) * 100);
  return { tasks, done, na, total, pct, day };
}

/* ── context ──────────────────────────────────────────────────────────────── */
interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentUser: User | null;
  login: (identifier: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  dayProgress: (userId: string, date: string, shift: Shift) => { pct: number; done: number; total: number; na: number };
  visibleNotifications: Notification[];
  unreadCount: number;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, initState);

  useEffect(() => {
    try { localStorage.setItem(LS_DB, JSON.stringify(state.db)); } catch { /* quota */ }
  }, [state.db]);
  useEffect(() => {
    try {
      if (state.currentUserId) localStorage.setItem(LS_SESSION, JSON.stringify({ userId: state.currentUserId }));
      else localStorage.removeItem(LS_SESSION);
    } catch { /* noop */ }
  }, [state.currentUserId]);

  // auto-dismiss toast
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 4200);
    return () => clearTimeout(t);
  }, [state.toast]);

  const currentUser = state.db.users.find(u => u.id === state.currentUserId) ?? null;

  const login: Ctx['login'] = (identifier, password) => {
    const q = identifier.trim().toLowerCase();
    const u = state.db.users.find(x => x.email.toLowerCase() === q || x.username.toLowerCase() === q);
    if (!u) return { ok: false, error: 'Akun tidak ditemukan. Periksa email / username Anda.' };
    if (!u.active) return { ok: false, error: 'Akun ini telah dinonaktifkan. Hubungi Admin / Owner.' };
    if (u.password !== password) return { ok: false, error: 'Password salah. Periksa kembali lalu coba lagi.' };
    dispatch({ type: 'LOGIN', userId: u.id });
    return { ok: true };
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  const dayProgress: Ctx['dayProgress'] = (userId, date, shift) => {
    const u = state.db.users.find(x => x.id === userId);
    if (!u) return { pct: 0, done: 0, total: 0, na: 0 };
    const { done, total, pct, na } = progressOf(state.db, u, date, shift);
    return { pct, done, total, na };
  };

  const visibleNotifications = useMemo(() => {
    if (!currentUser) return [];
    return state.db.notifications.filter(n =>
      n.targetUserId ? n.targetUserId === currentUser.id : n.targetRoles.includes(currentUser.role)
    );
  }, [state.db.notifications, currentUser]);

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const value: Ctx = { state, dispatch, currentUser, login, logout, dayProgress, visibleNotifications, unreadCount };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

