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
    kind: string;
    approval_status: string | null;
    created_at: string;
};

type Props = {
    users: Account[];
    filters: { kind: string; status: string; q: string };
};

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    suspended: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    deleted: 'bg-destructive/15 text-destructive',
};

export default function AdminUsers({ users, filters }: Props) {
    const [q, setQ] = useState(filters.q);

    const apply = (params: Record<string, string>) =>
        router.get('/admin/users', { ...filters, q, ...params }, { preserveState: true });

    const kinds = [
        { key: '', label: 'All' },
        { key: 'client', label: 'Clients' },
        { key: 'professional', label: 'Professionals' },
        { key: 'admin', label: 'Admins' },
    ];

    const statuses = [
        { key: '', label: 'Any status' },
        { key: 'active', label: 'Active' },
        { key: 'suspended', label: 'Suspended' },
        { key: 'deleted', label: 'Deleted' },
    ];

    return (
        <AdminLayout>
            <Head title="Admin — Users" />
            <h1 className="mb-4 text-xl font-bold">Users</h1>

            <div className="mb-3 flex flex-wrap items-center gap-2">
                {kinds.map((k) => (
                    <button
                        key={k.key}
                        type="button"
                        onClick={() => apply({ kind: k.key })}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            filters.kind === k.key ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground hover:border-primary/50',
                        )}
                    >
                        {k.label}
                    </button>
                ))}
                <span className="mx-1 h-4 w-px bg-border" />
                {statuses.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => apply({ status: s.key })}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs transition-colors',
                            filters.status === s.key ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/60',
                        )}
                    >
                        {s.label}
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
                        placeholder="Search name or email…"
                        className="h-8 w-52 rounded-lg border bg-background px-3 text-sm"
                    />
                </form>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2.5 font-medium">User</th>
                            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Kind</th>
                            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Joined</th>
                            <th className="px-4 py-2.5 font-medium">Status</th>
                            <th className="px-4 py-2.5" />
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b last:border-0">
                                <td className="px-4 py-2.5">
                                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-primary">
                                        {u.name}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                </td>
                                <td className="hidden px-4 py-2.5 md:table-cell">
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{u.kind}</span>
                                    {u.is_admin && (
                                        <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">admin</span>
                                    )}
                                </td>
                                <td className="hidden px-4 py-2.5 lg:table-cell">{u.created_at}</td>
                                <td className="px-4 py-2.5">
                                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', statusStyles[u.status])}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    {!u.is_admin && u.status !== 'deleted' && (
                                        u.status === 'active' ? (
                                            <button
                                                type="button"
                                                onClick={() => router.post(`/admin/users/${u.id}/suspend`, {}, { preserveScroll: true })}
                                                className="text-xs text-destructive hover:underline"
                                            >
                                                Suspend
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => router.post(`/admin/users/${u.id}/activate`, {}, { preserveScroll: true })}
                                                className="text-xs text-emerald-600 hover:underline"
                                            >
                                                Activate
                                            </button>
                                        )
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No users match this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
