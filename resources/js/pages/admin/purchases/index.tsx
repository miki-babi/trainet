import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

type Purchase = {
    id: number;
    client: string | null;
    professional: string | null;
    package: string | null;
    kind: string | null;
    amount_cents: number;
    status: string;
    delivered: boolean;
    purchased_at: string | null;
};

type Props = {
    purchases: Purchase[];
    summary: { paid: number; refunded: number; gmvCents: number };
    filters: { status: string; q: string };
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AdminPurchases({ purchases, summary, filters }: Props) {
    const [q, setQ] = useState(filters.q);

    const apply = (params: Record<string, string>) =>
        router.get('/admin/purchases', { ...filters, q, ...params }, { preserveState: true });

    return (
        <AdminLayout>
            <Head title="Admin — Purchases" />
            <h1 className="mb-4 text-xl font-bold">Purchases</h1>

            <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border bg-card p-4">
                    <p className="text-xl font-bold">{summary.paid}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                    <p className="text-xl font-bold">{summary.refunded}</p>
                    <p className="text-xs text-muted-foreground">Refunded</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                    <p className="text-xl font-bold">{money(summary.gmvCents)}</p>
                    <p className="text-xs text-muted-foreground">Gross volume</p>
                </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
                {[
                    { key: '', label: 'All' },
                    { key: 'paid', label: 'Paid' },
                    { key: 'refunded', label: 'Refunded' },
                ].map((t) => (
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
                        placeholder="Search client, pro, package…"
                        className="h-8 w-56 rounded-lg border bg-background px-3 text-sm"
                    />
                </form>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2.5 font-medium">Package</th>
                            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Client</th>
                            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Professional</th>
                            <th className="px-4 py-2.5 font-medium">Amount</th>
                            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Date</th>
                            <th className="px-4 py-2.5" />
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map((p) => (
                            <tr key={p.id} className="border-b last:border-0">
                                <td className="px-4 py-2.5">
                                    <p className="font-medium">{p.package}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {p.kind}
                                        {p.delivered && ' · delivered'}
                                    </p>
                                </td>
                                <td className="hidden px-4 py-2.5 md:table-cell">{p.client}</td>
                                <td className="hidden px-4 py-2.5 md:table-cell">{p.professional}</td>
                                <td className="px-4 py-2.5">{money(p.amount_cents)}</td>
                                <td className="hidden px-4 py-2.5 lg:table-cell">{p.purchased_at}</td>
                                <td className="px-4 py-2.5 text-right">
                                    {p.status === 'paid' ? (
                                        <button
                                            type="button"
                                            onClick={() => router.post(`/admin/purchases/${p.id}/refund`, {}, { preserveScroll: true })}
                                            className="text-xs text-destructive hover:underline"
                                        >
                                            Refund
                                        </button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">refunded</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {purchases.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                    No purchases match this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
