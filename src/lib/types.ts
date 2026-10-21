/* ────────────────────────────────────────────────────────────────────────────
   DAPUR NUSA RASA — Domain Model & Persistent Store
   Demo persistence via localStorage, seeded on first run (acts as the database).
   In production this layer maps 1:1 onto PostgreSQL tables (documented in README).
   ──────────────────────────────────────────────────────────────────────────── */

export type Role = 'admin' | 'kepala_koki' | 'wakil_koki' | 'anggota';
export type Shift = 'pagi' | 'siang' | 'malam';
export type TaskStatus = 'ok' | 'perlu_perbaikan' | 'tidak_berlaku';
export type SectionKey = 'pembukaan' | 'persiapan' | 'pelayanan' | 'closing' | 'kebersihan';
export type NotifType = 'reminder' | 'terlambat' | 'bahan_habis' | 'kebersihan' | 'approval' | 'info' | 'sukses' | 'masalah';
export type ReportStatus = 'menunggu' | 'disetujui' | 'ditolak' | 'revisi';
export type PurchaseStatus = 'diajukan' | 'disetujui' | 'dibeli';

export interface User {
  id: string;
  email: string;
  username: string;
  password: string; // plain demo only — never ship real secrets to client (see README)
  name: string;
  initials: string;
  role: Role;
  position: string; // jabatan
  shift: Shift;
  phone: string;
  joinDate: string;
  active: boolean;
  color: string; // avatar color
}

export interface ChecklistTask {
  id: string;
  positionKey: string; // role/position this task belongs to
  shift: Shift | 'semua';
  section: SectionKey;
  title: string;
  targetTime: string; // HH:MM
  requiresPhoto: boolean;
  mandatory: boolean;
}

export interface TaskEntry {
  taskId: string;
  checked: boolean;
  status: TaskStatus;
  notes: string;
  completedBy?: string;
  completedAt?: string; // ISO
  photo?: string; // dataURL thumbnail
  naReason?: string;
}

export type IssueCategory = 'bahan_habis' | 'alat_rusak' | 'kebersihan' | 'keselamatan' | 'lainnya';
export type IssueSeverity = 'rendah' | 'sedang' | 'tinggi' | 'kritis';
export type IssueStatus = 'terbuka' | 'diproses' | 'selesai';

export interface Issue {
  id: string;
  date: string;
  time: string;
  reporterId: string;
  category: IssueCategory;
  title: string;
  detail: string;
  severity: IssueSeverity;
  status: IssueStatus;
  photo?: string;
  assigneeId?: string;
  resolution?: string;
}

export interface Notification {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  targetRoles: Role[]; // visible to these roles
  targetUserId?: string; // or a specific user
  link?: string;
}

export interface AuditLog {
  id: string;
  date: string;
  time: string;
  userId: string;
  action: string;
  detail: string;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  shift: Shift;
  entries: Record<string, TaskEntry>; // taskId -> entry
  submittedAt?: string;
  status: ReportStatus;
  reviewerNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AppSettings {
  restaurantName: string;
  branch: string;
  operationalDateMode: 'today';
  reportRecipients: string[]; // emails
  reminderRules: { id: string; label: string; time: string; enabled: boolean; target: string }[];
  weeklyTarget: number; // %
}

export interface PurchaseRequest {
  id: string;
  date: string;
  userId: string;
  item: string;
  qty: string;
  reason: string;
  status: PurchaseStatus;
}

export interface DB {
  users: User[];
  tasks: ChecklistTask[];
  days: ActivityDay[]; // history of activity days
  issues: Issue[];
  notifications: Notification[];
  audit: AuditLog[];
  settings: AppSettings;
  purchases: PurchaseRequest[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
export const id = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const todayStr = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const nowTime = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fmtDateID = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
export const fmtShort = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const SHIFT_LABEL: Record<Shift, string> = { pagi: 'Pagi (06.00–14.00)', siang: 'Siang (14.00–22.00)', malam: 'Malam (22.00–06.00)' };
export const ROLE_LABEL: Record<Role, string> = { admin: 'Admin / Owner', kepala_koki: 'Kepala Koki', wakil_koki: 'Wakil Koki', anggota: 'Anggota Dapur' };
export const SECTION_META: Record<SectionKey, { label: string; icon: string; order: number }> = {
  pembukaan: { label: 'Pembukaan & Sanitasi', icon: 'Sunrise', order: 1 },
  persiapan: { label: 'Persiapan Bahan & Produksi', icon: 'ChefHat', order: 2 },
  pelayanan: { label: 'Pelayanan & Kontrol Kualitas', icon: 'UtensilsCrossed', order: 3 },
  closing: { label: 'Closing & Pembersihan', icon: 'MoonStar', order: 4 },
  kebersihan: { label: 'Kebersihan Area & Keamanan', icon: 'Sparkles', order: 5 },
};
