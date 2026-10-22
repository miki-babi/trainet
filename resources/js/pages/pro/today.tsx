import { Head, Link, router } from '@inertiajs/react';
import {
    Banknote,
    CalendarDays,
    ClipboardCheck,
    Dumbbell,
    MoonStar,
    TrendingDown,
    TrendingUp,
    UserPlus,
    Users,
} from 'lucide-react';
import { ActivityTile } from '@/components/trainet/activity-tile';
import { DayStrip, type DayStripDay } from '@/components/trainet/day-strip';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import type { StatusTone } from '@/components/trainet/status-chip';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

type CheckIn = {
    id: number;
    client: string;
    template: string;
    status: string;
    submitted_at: string | null;
    due_on: string;
    answers: number;
};

type AttentionItem = {
    kind: 'missed_workout' | 'stalled';
    id: number;
    title: string;
    detail: string;
    href: string;
};

type RecentClient = {
    id: number;
    name: string;
    avatar: string | null;
    program: string | null;
    last_active: string;
    status: 'on_track' | 'needs_attention';
};

type Stats = {
    total_clients: number;
    new_this_week: number;
    active_this_week: number;
    pending_checkins: number;
    month_revenue: number;
    revenue_delta: number | null;
};

type UpcomingAppointment = {
    id: number;
    client: string;
    type: string;
    at: string;
    status: string;
    href: string;
};

type Props = {
    professionalName: string;
    week: DayStripDay[];
    checkIns: CheckIn[];
    attention: AttentionItem[];
    activity: { id: string; text: string; at: string; href: string }[];
    stats: Stats;
    recentClients: RecentClient[];
    appointments: UpcomingAppointment[];
};

const attentionMeta: Record<
    AttentionItem['kind'],
    { icon: typeof ClipboardCheck; tone: StatusTone; label: string }
> = {
    missed_workout: { icon: Dumbbell, tone: 'danger', label: 'Missed' },
    stalled: { icon: TrendingDown, tone: 'warning', label: 'Stalled' },
};

export default function ProToday({
    professionalName,
    week,
    checkIns,
    attention,
    activity,
    stats,
    recentClients,
    appointments,
}: Props) {
    const getInitials = useInitials();

    const cards = [
        {
            label: 'Active clients',
            value: stats.total_clients,
            sub: `+${stats.new_this_week} this week`,
            icon: Users,
            href: '/pro/clients',
        },
        {
            label: 'Trained this week',
            value: stats.active_this_week,
            sub: 'completed a workout',
            icon: Dumbbell,
            href: '/pro/reports',
        },
        {
            label: 'Upcoming',
            value: appointments.length,
            sub: 'sessions this week',
            icon: CalendarDays,
            href: '/pro/calendar',
        },
        {
            label: 'Pending reviews',
            value: stats.pending_checkins,
            sub: 'check-ins awaiting feedback',
            icon: ClipboardCheck,
            href: '/pro/check-in-submissions',
        },
        {
            label: 'Revenue',
            value: `$${(stats.month_revenue / 100).toLocaleString()}`,
            sub:
                stats.revenue_delta === null
                    ? 'this month'
                    : `${stats.revenue_delta >= 0 ? '+' : ''}${stats.revenue_delta}% vs last month`,
            icon: Banknote,
            delta: stats.revenue_delta,
            href: '/pro/payments',
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </p>
                    <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">
                        Good day, {professionalName.split(' ')[0]}
                    </h1>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    {cards.map((card) => (
                        <Link
                            key={card.label}
                            href={card.href}
                            className="rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:ring-primary/50"
                        >
                            <div className="flex items-center justify-between">
                                <card.icon className="size-4 text-primary" />
                                {card.delta !== undefined && card.delta !== null && (
                                    <span
                                        className={cn(
                                            'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                            card.delta >= 0
                                                ? 'bg-primary/15 text-primary'
                                                : 'bg-destructive/15 text-destructive',
                                        )}
                                    >
                                        {card.delta >= 0 ? (
                                            <TrendingUp className="size-3" />
                                        ) : (
                                            <TrendingDown className="size-3" />
                                        )}
                                        {card.delta >= 0 ? '+' : ''}
                                        {card.delta}%
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-2xl font-bold tabular-nums">{card.value}</p>
                            <p className="text-xs font-medium">{card.label}</p>
                            <p className="text-[11px] text-muted-foreground">{card.sub}</p>
                        </Link>
                    ))}
                </div>

                <DayStrip
                    days={week}
                    onSelect={(date) =>
                        router.visit('/pro/calendar', { data: { week: date } })
                    }
                />

                {/* Today's check-ins */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Today's check-ins
                        </h2>
                        <Link
                            href="/pro/check-in-submissions"
                            className="text-sm text-primary hover:underline"
                        >
                            All submissions
                        </Link>
                    </div>
                    {checkIns.length === 0 ? (
                        <EmptyState
                            icon={ClipboardCheck}
                            title="No check-ins due today"
                            description="Client check-ins due today will show up here."
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {checkIns.map((ci) => (
                                <ActivityTile
                                    key={ci.id}
                                    avatars={[ci.client.charAt(0)]}
                                    title={ci.client}
                                    subtitle={
                                        ci.status === 'pending'
                                            ? `${ci.template} · waiting`
                                            : `${ci.template} · ${ci.submitted_at ?? ''}`
                                    }
                                    href={`/pro/check-in-submissions/${ci.id}`}
                                    variant={
                                        ci.status === 'submitted'
                                            ? 'blue'
                                            : ci.status === 'reviewed'
                                              ? 'dark'
                                              : 'ghost'
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Needs attention */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Needs attention
                    </h2>
                    {attention.length === 0 ? (
                        <EmptyState
                            icon={MoonStar}
                            title="All clear"
                            description="Nothing needs your attention right now."
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {attention.map((item) => {
                                const meta = attentionMeta[item.kind];
                                return (
                                    <ActivityTile
                                        key={`${item.kind}-${item.id}`}
                                        icon={meta.icon}
                                        title={item.title}
                                        subtitle={`${meta.label} · ${item.detail}`}
                                        href={item.href}
                                        variant={
                                            item.kind === 'missed_workout'
                                                ? 'dark'
                                                : 'ghost'
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Upcoming appointments */}
                {appointments.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Upcoming this week
                            </h2>
                            <Link href="/pro/calendar" className="text-sm text-primary hover:underline">
                                Calendar
                            </Link>
                        </div>
                        <div className="divide-y overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                            {appointments.map((a) => (
                                <Link
                                    key={a.id}
                                    href={a.href}
                                    className="flex items-center gap-3 p-3.5 transition-colors hover:bg-muted/50"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                        <CalendarDays className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">
                                            {a.client} · {a.type}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">{a.at}</span>
                                    </span>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                                            a.status === 'confirmed'
                                                ? 'bg-primary/15 text-primary'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {a.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recent clients */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Recent clients
                        </h2>
                        <Link href="/pro/clients" className="text-sm text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                    {recentClients.length === 0 ? (
                        <EmptyState
                            icon={UserPlus}
                            title="No clients yet"
                            description="Clients who purchase a package or send a request appear here."
                        />
                    ) : (
                        <div className="space-y-2">
                            {recentClients.map((client) => (
                                <Link
                                    key={client.id}
                                    href={`/pro/clients/${client.id}`}
                                    className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border transition-colors hover:ring-primary/50"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-semibold text-primary">
                                        {client.avatar ? (
                                            <img
                                                src={client.avatar}
                                                alt={client.name}
                                                className="size-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            getInitials(client.name)
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">
                                            {client.name}
                                        </span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {client.program ?? 'No program'} · {client.last_active}
                                        </span>
                                    </span>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase',
                                            client.status === 'on_track'
                                                ? 'bg-primary/15 text-primary'
                                                : 'bg-destructive/15 text-destructive',
                                        )}
                                    >
                                        {client.status === 'on_track' ? 'On track' : 'Attention'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <SectionCard title="Recent activity">
                    {activity.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No recent client activity.
                        </p>
                    ) : (
                        <div className="divide-y">
                            {activity.map((item) => (
                                <ListRow
                                    key={item.id}
                                    title={item.text}
                                    subtitle={item.at}
                                    href={item.href}
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </>
    );
}
