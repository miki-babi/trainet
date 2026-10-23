import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

type Account = {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    is_admin: boolean;
    status: string;
    joined: string;
    email_verified: boolean;
    client_profile: {
        onboarding_status: string;
        experience_level: string | null;
        goals_summary: string | null;
        purchases: number;
    } | null;
    professional_profile: {
        id: number;
        type: string;
        business_name: string | null;
        approval_status: string;
    } | null;
    workspace: { name: string; role: string } | null;
};

export default function AdminUserShow({ account: u }: { account: Account }) {
    const [reason, setReason] = useState('');

    return (
        <AdminLayout>
            <Head title={`Admin — ${u.name}`} />

            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">{u.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {u.email} · joined {u.joined}
                        {!u.email_verified && ' · email not verified'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {u.is_admin && (
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">admin</span>
                    )}
                    <span
                        className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            u.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-destructive/15 text-destructive',
                        )}
                    >
                        {u.status}
                    </span>
                </div>
            </div>

            {!u.is_admin && u.status !== 'deleted' && (
                <section className="mb-4 rounded-2xl border bg-card p-4">
                    <h2 className="mb-2 text-sm font-semibold">Account actions</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {u.status === 'active' ? (
                            <>
                                <input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Suspension reason (optional)"
                                    className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => router.post(`/admin/users/${u.id}/suspend`, { reason })}
                                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                                >
                                    Suspend
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => router.post(`/admin/users/${u.id}/activate`)}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                            >
                                Reactivate
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm(`Delete ${u.name}? Their data is kept but they can no longer log in.`)) {
                                    router.delete(`/admin/users/${u.id}`);
                                }
                            }}
                            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90"
                        >
                            Delete
                        </button>
                    </div>
                </section>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {u.client_profile && (
                    <section className="rounded-2xl border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold">Client profile</h2>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Onboarding</dt><dd>{u.client_profile.onboarding_status}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Experience</dt><dd>{u.client_profile.experience_level ?? '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Purchases</dt><dd>{u.client_profile.purchases}</dd></div>
                        </dl>
                        {u.client_profile.goals_summary && (
                            <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{u.client_profile.goals_summary}</p>
                        )}
                    </section>
                )}

                {u.professional_profile && (
                    <section className="rounded-2xl border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold">Professional profile</h2>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd>{u.professional_profile.type}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Business</dt><dd>{u.professional_profile.business_name ?? '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Approval</dt><dd>{u.professional_profile.approval_status}</dd></div>
                        </dl>
                        <Link
                            href={`/admin/professionals/${u.professional_profile.id}`}
                            className="mt-3 inline-block text-sm text-primary hover:underline"
                        >
                            Open professional profile →
                        </Link>
                    </section>
                )}

                {u.workspace && (
                    <section className="rounded-2xl border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold">Workspace</h2>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd>{u.workspace.name}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Role</dt><dd>{u.workspace.role}</dd></div>
                        </dl>
                    </section>
                )}

                {!u.client_profile && !u.professional_profile && !u.workspace && (
                    <section className="rounded-2xl border bg-card p-4 md:col-span-2">
                        <p className="text-sm text-muted-foreground">No profile records — bare user account.</p>
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
