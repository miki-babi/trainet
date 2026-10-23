import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

type Pro = {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    user_status: string;
    type: string;
    business_name: string | null;
    approval_status: string;
    approved_at: string | null;
    packages_count: number;
    created_at: string;
};

type Props = {
    professionals: Pro[];
    counts: { pending: number; approved: number; rejected: number };
    filters: { status: string; q: string };
};

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-destructive/15 text-destructive',
};

export default function AdminProfessionals({ professionals, counts, filters }: Props) {
    const [q, setQ] = useState(filters.q);

    const apply = (params: Record<string, string>) =>
        router.get('/admin/professionals', { status: filters.status, q, ...params }, { preserveState: true });

    const tabs = [
        { key: '', label: `All`, },
        { key: 'pending', label: `Pending (${counts.pending})` },
        { key: 'approved', label: `Approved (${counts.approved})` },
        { key: 'rejected', label: `Rejected (${counts.rejected})` },
    ];

    return (
        <AdminLayout>
            <Head title="Admin — Professionals" />
            <h1 className="mb-4 text-xl font-bold">Professionals</h1>

            <div className="mb-3 flex flex-wrap items-center gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => apply({ status: t.key })}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            filters.status === t.key ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground hover:border-primary/50',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
                <form
                    className="ml-auto"
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply({});
                    }}
                >
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name, email, business…"
                        className="h-8 w-56 rounded-lg border bg-background px-3 text-sm"
                    />
                </form>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2.5 font-medium">Professional</th>
                            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Type</th>
                            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Offers</th>
                            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Joined</th>
                            <th className="px-4 py-2.5 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {professionals.map((p) => (
                            <tr key={p.id} className="border-b last:border-0">
                                <td className="px-4 py-2.5">
                                    <Link href={`/admin/professionals/${p.id}`} className="font-medium hover:text-primary">
                                        {p.name}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                        {p.business_name ?? p.email}
                                    </p>
                                </td>
                                <td className="hidden px-4 py-2.5 md:table-cell">{p.type}</td>
                                <td className="hidden px-4 py-2.5 md:table-cell">{p.packages_count}</td>
                                <td className="hidden px-4 py-2.5 lg:table-cell">{p.created_at}</td>
                                <td className="px-4 py-2.5">
                                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', statusStyles[p.approval_status])}>
                                        {p.approval_status}
                                    </span>
                                    {p.user_status !== 'active' && (
                                        <span className="ml-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] text-destructive">
                                            {p.user_status}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {professionals.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No professionals match this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
