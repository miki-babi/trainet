import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';

type AuditRow = {
    id: number;
    actor: string;
    action: string;
    resource: string | null;
    reason: string | null;
    meta: Record<string, unknown> | null;
    created_at: string;
};

export default function AdminAudit({ events, filters }: { events: AuditRow[]; filters: { q: string } }) {
    const [q, setQ] = useState(filters.q);

    return (
        <AdminLayout>
            <Head title="Admin — Audit log" />
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">Audit log</h1>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/admin/audit', { q }, { preserveState: true });
                    }}
                >
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Filter by action…"
                        className="h-8 w-52 rounded-lg border bg-background px-3 text-sm"
                    />
                </form>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2.5 font-medium">Time</th>
                            <th className="px-4 py-2.5 font-medium">Actor</th>
                            <th className="px-4 py-2.5 font-medium">Action</th>
                            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Resource</th>
                            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((e) => (
                            <tr key={e.id} className="border-b last:border-0">
                                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{e.created_at}</td>
                                <td className="px-4 py-2.5">{e.actor}</td>
                                <td className="px-4 py-2.5 font-medium">{e.action}</td>
                                <td className="hidden px-4 py-2.5 md:table-cell text-muted-foreground">{e.resource ?? '—'}</td>
                                <td className="hidden px-4 py-2.5 lg:table-cell text-muted-foreground">{e.reason ?? '—'}</td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No audit events yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
