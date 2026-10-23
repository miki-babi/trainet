import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

type Pro = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    avatar: string | null;
    user_status: string;
    type: string;
    business_name: string | null;
    bio: string | null;
    credentials: string | null;
    certifications: { name: string; issuer: string; year: number | null }[];
    specialties: string[];
    coaching_mode: string | null;
    approval_status: string;
    approved_at: string | null;
    approved_by: string | null;
    rejection_reason: string | null;
    joined: string;
    packages: { id: number; name: string; kind: string; price: number; is_hidden: boolean }[];
    assignment_counts: Record<string, number>;
};

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-destructive/15 text-destructive',
};

export default function AdminProfessionalShow({ professional: p }: { professional: Pro }) {
    const [reason, setReason] = useState('');

    return (
        <AdminLayout>
            <Head title={`Admin — ${p.name}`} />

            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">{p.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {p.business_name ? `${p.business_name} · ` : ''}{p.email} · joined {p.joined}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[p.approval_status])}>
                        {p.approval_status}
                    </span>
                    {p.user_status !== 'active' && (
                        <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs text-destructive">
                            account {p.user_status}
                        </span>
                    )}
                </div>
            </div>

            {(p.approval_status === 'pending' || p.approval_status === 'rejected') && (
                <section className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
                    <h2 className="mb-2 text-sm font-semibold">Approval decision</h2>
                    {p.rejection_reason && (
                        <p className="mb-2 text-xs text-muted-foreground">
                            Previous rejection reason: {p.rejection_reason}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.post(`/admin/professionals/${p.id}/approve`)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                            Approve
                        </button>
                        <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Rejection reason (optional)"
                            className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => router.post(`/admin/professionals/${p.id}/reject`, { reason })}
                            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90"
                        >
                            Reject
                        </button>
                    </div>
                </section>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border bg-card p-4">
                    <h2 className="mb-3 text-sm font-semibold">Profile</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd>{p.type}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Coaching mode</dt><dd>{p.coaching_mode ?? '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Credentials</dt><dd>{p.credentials ?? '—'}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Approved</dt><dd>{p.approved_at ? `${p.approved_at} by ${p.approved_by}` : '—'}</dd></div>
                    </dl>
                    {p.bio && <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{p.bio}</p>}
                    {p.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {p.specialties.map((s) => (
                                <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">{s}</span>
                            ))}
                        </div>
                    )}
                    {p.certifications.length > 0 && (
                        <div className="mt-3 border-t pt-3">
                            <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Certifications</p>
                            <ul className="space-y-1 text-sm">
                                {p.certifications.map((c) => (
                                    <li key={c.name}>{c.name} <span className="text-muted-foreground">· {c.issuer}{c.year ? ` ${c.year}` : ''}</span></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <div className="space-y-4">
                    <section className="rounded-2xl border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold">Client assignments</h2>
                        <div className="flex gap-3 text-sm">
                            <span>Active: <strong>{p.assignment_counts?.active ?? 0}</strong></span>
                            <span>Pending: <strong>{p.assignment_counts?.pending ?? 0}</strong></span>
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold">Offers ({p.packages.length})</h2>
                        {p.packages.length === 0 && (
                            <p className="text-sm text-muted-foreground">No offers yet.</p>
                        )}
                        <ul className="space-y-1.5 text-sm">
                            {p.packages.map((pkg) => (
                                <li key={pkg.id} className="flex items-center justify-between">
                                    <span>
                                        {pkg.name}
                                        <span className="ml-1.5 text-xs text-muted-foreground">{pkg.kind}</span>
                                        {pkg.is_hidden && (
                                            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">hidden</span>
                                        )}
                                    </span>
                                    <span className="text-muted-foreground">${(pkg.price / 100).toFixed(0)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
