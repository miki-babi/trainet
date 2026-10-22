import { Head } from '@inertiajs/react';
import { Banknote, Receipt } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { PageHeader } from '@/components/trainet/page-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Purchase = {
    id: number;
    client: string;
    package: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
};

type Props = {
    purchases: Purchase[];
    monthRevenue: number;
    totalRevenue: number;
};

const statusStyles: Record<string, string> = {
    paid: 'bg-primary/15 text-primary',
    pending: 'bg-highlight/15 text-highlight-foreground',
    refunded: 'bg-destructive/15 text-destructive',
};

export default function PaymentsIndex({ purchases, monthRevenue, totalRevenue }: Props) {
    const money = (cents: number, currency = 'USD') =>
        `${currency === 'USD' ? '$' : `${currency} `}${(cents / 100).toLocaleString()}`;

    return (
        <>
            <Head title="Payments" />
            <div className="space-y-5">
                <PageHeader
                    title="Payments"
                    description="Package purchases and revenue"
                />

                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
                        <Banknote className="size-4 text-primary" />
                        <p className="mt-2 text-2xl font-bold tabular-nums">
                            {money(monthRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
                        <Receipt className="size-4 text-primary" />
                        <p className="mt-2 text-2xl font-bold tabular-nums">
                            {money(totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </div>
                </div>

                {purchases.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        title="No purchases yet"
                        description="Package purchases from your storefront will appear here."
                    />
                ) : (
                    <div className="overflow-hidden rounded-2xl ring-1 ring-border">
                        <div className="divide-y bg-card">
                            {purchases.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 p-3.5">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{p.client}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {p.package} · {p.date}
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold tabular-nums">
                                        {money(p.amount, p.currency)}
                                    </p>
                                    <Badge
                                        variant="secondary"
                                        className={cn('capitalize', statusStyles[p.status] ?? '')}
                                    >
                                        {p.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground">
                    Demo environment — payments are simulated.
                </p>
            </div>
        </>
    );
}
