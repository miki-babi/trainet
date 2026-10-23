import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

type Pkg = {
    id: number;
    name: string;
    kind: string;
    price: number;
    is_hidden: boolean;
    professional: string | null;
    professional_status: string | null;
};

type Profile = {
    id: number;
    name: string | null;
    business_name: string | null;
    type: string;
    approval_status: string;
};

export default function AdminModeration({
    packages,
    profiles,
    filters,
}: {
    packages: Pkg[];
    profiles: Profile[];
    filters: { q: string };
}) {
    const [q, setQ] = useState(filters.q);

    return (
        <AdminLayout>
            <Head title="Admin — Moderation" />
            <h1 className="mb-4 text-xl font-bold">Content moderation</h1>

            <section className="mb-6 rounded-2xl border bg-card">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">Marketplace offers</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get('/admin/moderation', { q }, { preserveState: true });
                        }}
                    >
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search offers…"
                            className="h-8 w-48 rounded-lg border bg-background px-3 text-sm"
                        />
                    </form>
                </div>
                <table className="w-full text-sm">
                    <tbody>
                        {packages.map((p) => (
                            <tr key={p.id} className="border-b last:border-0">
                                <td className="px-4 py-2.5">
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {p.kind} · ${(p.price / 100).toFixed(0)} · by {p.professional}
                                    </p>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <button
                                        type="button"
                                        onClick={() => router.post(`/admin/packages/${p.id}/toggle`, {}, { preserveScroll: true })}
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                                            p.is_hidden
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/70',
                                        )}
                                    >
                                        {p.is_hidden ? 'Unhide' : 'Hide'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {packages.length === 0 && (
                            <tr>
                                <td className="px-4 py-8 text-center text-muted-foreground">No offers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <section className="rounded-2xl border bg-card">
                <div className="border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">Professional profile visibility</h2>
                    <p className="text-xs text-muted-foreground">Approval status controls marketplace visibility.</p>
                </div>
                <table className="w-full text-sm">
                    <tbody>
                        {profiles.map((p) => (
                            <tr key={p.id} className="border-b last:border-0">
                                <td className="px-4 py-2.5">
                                    <Link href={`/admin/professionals/${p.id}`} className="font-medium hover:text-primary">
                                        {p.name}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">{p.business_name ?? p.type}</p>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                                            p.approval_status === 'approved'
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                : p.approval_status === 'pending'
                                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                                  : 'bg-destructive/15 text-destructive',
                                        )}
                                    >
                                        {p.approval_status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </AdminLayout>
    );
}
