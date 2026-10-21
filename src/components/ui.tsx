/* ── Shared UI primitives ─────────────────────────────────────────────────── */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChefHat } from 'lucide-react';
import type { TaskStatus } from '../lib/types';
import { useStore } from '../lib/store';

/* Avatar with deterministic color */
export function Avatar({ name, initials, color, size = 40, className = '' }: { name?: string; initials: string; color: string; size?: number; className?: string }) {
  return (
    <div
      title={name}
      className={`rounded-full flex items-center justify-center text-white font-bold select-none shrink-0 ring-2 ring-white/70 shadow-sm ${className}`}
      style={{ width: size, height: size, background: `linear-gradient(150deg, ${color}, ${shade(color, -28)})`, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
function shade(hex: string, amt: number) {
  const n = hex.replace('#', '');
  const num = parseInt(n.length === 3 ? n.split('').map(c => c + c).join('') : n, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/* Status badges */
export const STATUS_META: Record<TaskStatus, { label: string; cls: string; dot: string }> = {
  ok: { label: 'OK', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  perlu_perbaikan: { label: 'Perlu Perbaikan', cls: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  tidak_berlaku: { label: 'Tidak Berlaku', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};
export function StatusBadge({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wide ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  );
}
export function ReportStatusBadge({ status }: { status: 'menunggu' | 'disetujui' | 'ditolak' | 'revisi' }) {
  const m = {
    menunggu: { label: 'Menunggu Approval', cls: 'bg-amber-50 text-amber-800 border-amber-300' },
    disetujui: { label: 'Disetujui', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    ditolak: { label: 'Ditolak', cls: 'bg-red-50 text-red-700 border-red-300' },
    revisi: { label: 'Perlu Revisi', cls: 'bg-orange-50 text-orange-800 border-orange-300' },
  }[status];
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${m.cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{m.label}</span>;
}
export function SeverityBadge({ severity }: { severity: 'rendah' | 'sedang' | 'tinggi' | 'kritis' }) {
  const m = {
    rendah: 'bg-slate-100 text-slate-600 border-slate-200',
    sedang: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    tinggi: 'bg-orange-50 text-orange-800 border-orange-300',
    kritis: 'bg-red-600 text-white border-red-600',
  }[severity];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9.5px] font-extrabold uppercase tracking-widest ${m}`}>{severity === 'kritis' ? 'Kritis' : severity}</span>;
}

/* Progress bar (green) */
export function ProgressBar({ pct, height = 10, showLabel = false, striped = true }: { pct: number; height?: number; showLabel?: boolean; striped?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = clamped >= 100 ? 'from-emerald-500 to-green-600' : clamped >= 70 ? 'from-green-500 to-emerald-600' : clamped >= 40 ? 'from-lime-500 to-green-600' : 'from-amber-400 to-orange-500';
  return (
    <div className="w-full">
      <div className="w-full bg-slate-200/80 rounded-full overflow-hidden" style={{ height }} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} relative transition-all duration-700 ease-out ${striped && clamped < 100 ? 'progress-stripes' : ''}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <div className="mt-1 text-[10px] font-bold text-slate-500 tracking-wide">{clamped}% selesai</div>}
    </div>
  );
}

/* Circular progress ring */
export function ProgressRing({ pct, size = 84, stroke = 9, track = '#e2e8f0', color = '#16a34a', children }: { pct: number; size?: number; stroke?: number; track?: string; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* Modal */
export function Modal({ open, onClose, title, subtitle, children, wide }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[3px]" onClick={onClose} />
          <motion.div
            initial={{ y: 80, opacity: 0, scale: .96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative bg-white w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto nice-scroll`}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur px-5 sm:px-6 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-4 z-10 rounded-t-3xl">
              <div>
                <h3 className="font-display font-bold text-navy-900 text-lg leading-tight">{title}</h3>
                {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-2 -mr-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" aria-label="Tutup">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Toast */
export function Toast() {
  const { state, dispatch } = useStore();
  const t = state.toast;
  const tone = { ok: 'border-emerald-400 bg-emerald-600', warn: 'border-amber-400 bg-amber-500', err: 'border-red-400 bg-red-600', info: 'border-sky-400 bg-sky-600' } as const;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[min(94vw,480px)] pointer-events-none no-print">
      <AnimatePresence>
        {t && (
          <motion.div key={t.id} initial={{ y: -50, opacity: 0, scale: .95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -40, opacity: 0 }}
            className={`pointer-events-auto flex items-start gap-3 text-white px-4 py-3 rounded-2xl shadow-2xl border-l-4 ${tone[t.tone]}`}>
            <span className="mt-0.5 shrink-0 bg-white/25 rounded-full p-1"><Check size={14} strokeWidth={3} /></span>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold leading-snug">{t.title}</p>
              {t.body && <p className="text-[11px] text-white/85 font-medium leading-snug mt-0.5">{t.body}</p>}
            </div>
            <button onClick={() => dispatch({ type: 'DISMISS_TOAST' })} className="ml-auto p-1 rounded-lg hover:bg-white/20" aria-label="Tutup notifikasi"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Empty state */
export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="py-12 px-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-600">{icon}</div>
      <p className="mt-4 font-extrabold text-navy-900 text-sm">{title}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500 font-medium max-w-xs mx-auto">{hint}</p>}
    </div>
  );
}

/* Section heading inside pages */
export function SectionHead({ icon, title, right }: { icon?: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.14em] text-navy-800">
        {icon && <span className="text-navy-600">{icon}</span>}{title}
      </h2>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function RestaurantMark({ size = 40 }: { size?: number }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-[0_2px_10px_rgba(245,184,61,.4)] ring-1 ring-black/10" style={{ width: size, height: size }}>
      <ChefHat size={size * 0.56} color="#231303" strokeWidth={2.2} />
    </div>
  );
}
