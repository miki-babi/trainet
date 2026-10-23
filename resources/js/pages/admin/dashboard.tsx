import { Head, Link } from '@inertiajs/react';
import {
    BadgeDollarSign,
    ShieldCheck,
    UserRound,
    Users,
} from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

type Stats = {
    users: number;
    clients: number;
    professionals: number;
    pendingPros: number;
    suspendedUsers: number;
    purchases: number;
    monthPurchases: number;
    monthGmvCents: number;
};

type PendingPro = {
    id: number;
    name: string;
    business_name: string | null;
    type: string;
    created_at: string;
};

type RecentUser = {
    id: number;
    name: string;
    email: string;
    kind: string;
    status: string;
    created_at: string;
};

type RecentPurchase = {
    id: number;
    client: string | null;
    professional: string | null;
    package: string | null;
    amount_cents: number;
    status: string;
    purchased_at: string | null;
};

type Props = {
    stats: Stats;
    pendingProfessionals: PendingPro[];
    recentUsers: RecentUser[];
    recentPurchases: RecentPurchase[];
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function Stat({ label, value, icon: Icon, href }: { label: string; value: number | string; icon: typeof Users; href?: string }) {
    const inner = (
        <div className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <Icon className="size-5 text-muted-foreground/60" />
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard({ stats, pendingProfessionals, recentUsers, recentPurchases }: Props) {
    return (
        <AdminLayout>
            <Head title="Admin — Dashboard" />
            <h1 className="mb-4 text-xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Total users" value={stats.users} icon={Users} href="/admin/users" />
                <Stat label="Clients" value={stats.clients} icon={UserRound} href="/admin/users?kind=client" />
                <Stat label="Professionals" value={stats.professionals} icon={ShieldCheck} href="/admin/professionals" />
                <Stat label="Pending approval" value={stats.pendingPros} icon={ShieldCheck} href="/admin/professionals?status=pending" />
                <Stat label="Purchases (total)" value={stats.purchases} icon={BadgeDollarSign} href="/admin/purchases" />
                <Stat label="Purchases (this month)" value={stats.monthPurchases} icon={BadgeDollarSign} href="/admin/purchases" />
                <Stat label="Revenue (this month)" value={money(stats.monthGmvCents)} icon={BadgeDollarSign} />
                <Stat label="Suspended users" value={stats.suspendedUsers} icon={Users} href="/admin/users?status=suspended" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Pending approvals</h2>
                        <Link href="/admin/professionals?status=pending" className="text-xs text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                    {pendingProfessionals.length === 0 && (
                        <p className="text-sm text-muted-foreground">No professionals waiting for approval.</p>
                    )}
                    <ul className="space-y-2">
                        {pendingProfessionals.map((p) => (
                            <li key={p.id}>
                                <Link
                                    href={`/admin/professionals/${p.id}`}
                                    className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors hover:border-primary/50"
                                >
                                    <div>
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {p.business_name ?? p.type} · applied {p.created_at}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                        pending
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-2xl border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Recent signups</h2>
                        <Link href="/admin/users" className="text-xs text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                    <ul className="space-y-2">
                        {recentUsers.map((u) => (
                            <li key={u.id}>
                                <Link
                                    href={`/admin/users/${u.id}`}
                                    className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors hover:border-primary/50"
                                >
                                    <div>
                                        <p className="font-medium">{u.name}</p>
                                        <p className="text-xs text-muted-foreground">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{u.kind}</span>
                                        {u.status !== 'active' && (
                                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] text-destructive">
                                                {u.status}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section className="mt-4 rounded-2xl border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Recent purchases</h2>
                    <Link href="/admin/purchases" className="text-xs text-primary hover:underline">
                        View all
                    </Link>
                </div>
                {recentPurchases.length === 0 && (
                    <p className="text-sm text-muted-foreground">No purchases yet.</p>
                )}
                <ul className="space-y-2">
                    {recentPurchases.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                            <div>
                                <p className="font-medium">{p.package}</p>
                                <p className="text-xs text-muted-foreground">
                                    {p.client} → {p.professional}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">{money(p.amount_cents)}</p>
                                <p className="text-xs text-muted-foreground">{p.purchased_at}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </AdminLayout>
    );
}
