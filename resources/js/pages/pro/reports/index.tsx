import { Head } from '@inertiajs/react';
import {
    Activity,
    Banknote,
    BarChart3,
    CheckCircle2,
    ClipboardCheck,
    HeartPulse,
    Repeat,
    UtensilsCrossed,
    Users,
} from 'lucide-react';
import {
    BarChart,
    DoughnutChart,
    LineChart,
    StackedBarChart,
} from '@/components/trainet/charts';
import { PageHeader } from '@/components/trainet/page-header';
import { SectionCard } from '@/components/trainet/section-card';
import { StatCard } from '@/components/trainet/stat-card';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type ClientRow = {
    name: string;
    workouts: string;
    adherence: number | null;
    nutrition_logs: number;
    check_ins: { submitted: number; total: number };
};

type Props = {
    weekLabels: string[];
    sessionWeeks: { label: string; completed: number; missed: number; skipped: number }[];
    checkInWeeks: { label: string; due: number; submitted: number }[];
    nutritionWeeks: { label: string; logs: number }[];
    sessionTotals: { completed: number; missed: number; skipped: number; upcoming: number };
    clients: ClientRow[];
    totals: {
        active_clients: number;
        sessions_done: number;
        check_in_rate: number | null;
        avg_adherence: number | null;
        pending_checkins: number;
        nutrition_logs: number;
    };
    analytics: {
        total_clients: number;
        retention: number | null;
        avg_progress: number | null;
        revenue: number;
        revenue_delta: number | null;
    };
    clientProgress: { label: string; weight: number | null; body_fat: number | null }[];
};

export default function ReportsIndex({
    weekLabels,
    sessionWeeks,
    checkInWeeks,
    nutritionWeeks,
    sessionTotals,
    clients,
    totals,
    analytics,
    clientProgress,
}: Props) {
    const adherenceClients = clients.filter((c) => c.adherence !== null);
    const sessionTotal = sessionTotals.completed + sessionTotals.missed + sessionTotals.skipped;
    const completionRate = sessionTotal
        ? Math.round((sessionTotals.completed / sessionTotal) * 100)
        : 0;

    return (
        <>
            <Head title="Reports" />
            <div className="space-y-6">
                <PageHeader
                    title="Reports"
                    description="Adherence and activity across your roster — last 4 weeks."
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <StatCard label="Active clients" value={totals.active_clients} icon={Users} />
                    <StatCard label="Workouts done" value={totals.sessions_done} icon={BarChart3} />
                    <StatCard
                        label="Avg adherence"
                        value={totals.avg_adherence !== null ? `${totals.avg_adherence}%` : '—'}
                        icon={Activity}
                    />
                    <StatCard
                        label="Check-in rate"
                        value={totals.check_in_rate !== null ? `${totals.check_in_rate}%` : '—'}
                        icon={CheckCircle2}
                    />
                    <StatCard
                        label="Pending check-ins"
                        value={totals.pending_checkins}
                        icon={ClipboardCheck}
                    />
                    <StatCard label="Nutrition logs" value={totals.nutrition_logs} icon={UtensilsCrossed} />
                </div>

                {/* Business analytics */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Business
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <StatCard
                            label="Revenue this month"
                            value={`$${(analytics.revenue / 100).toLocaleString()}`}
                            hint={
                                analytics.revenue_delta !== null
                                    ? `${analytics.revenue_delta >= 0 ? '+' : ''}${analytics.revenue_delta}% vs last month`
                                    : undefined
                            }
                            icon={Banknote}
                        />
                        <StatCard
                            label="Retention"
                            value={analytics.retention !== null ? `${analytics.retention}%` : '—'}
                            icon={Repeat}
                        />
                        <StatCard
                            label="Avg. client weight change"
                            value={analytics.avg_progress !== null ? `${analytics.avg_progress}%` : '—'}
                            icon={HeartPulse}
                        />
                    </div>
                </section>

                {(clientProgress.some((w) => w.weight !== null) ||
                    clientProgress.some((w) => w.body_fat !== null)) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SectionCard
                            title="Avg. client weight"
                            description="Weekly average across all clients."
                        >
                            <LineChart
                                labels={clientProgress.map((w) => w.label)}
                                data={clientProgress.map((w) => w.weight) as number[]}
                                color="primary"
                            />
                        </SectionCard>
                        <SectionCard
                            title="Avg. client body fat"
                            description="Weekly average across all clients."
                        >
                            <LineChart
                                labels={clientProgress.map((w) => w.label)}
                                data={clientProgress.map((w) => w.body_fat) as number[]}
                                color="accent"
                            />
                        </SectionCard>
                    </div>
                )}

                <SectionCard
                    title="Sessions per week"
                    description="Completed, missed and skipped workouts."
                >
                    <StackedBarChart
                        labels={weekLabels}
                        series={[
                            { label: 'Completed', data: sessionWeeks.map((w) => w.completed), color: 'primary' },
                            { label: 'Skipped', data: sessionWeeks.map((w) => w.skipped), color: 'info' },
                            { label: 'Missed', data: sessionWeeks.map((w) => w.missed), color: 'accent' },
                        ]}
                    />
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--chart-1)]" />Completed</span>
                        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--chart-2)]" />Skipped</span>
                        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--chart-3)]" />Missed</span>
                    </div>
                </SectionCard>

                <div className="grid gap-4 sm:grid-cols-2">
                    <SectionCard title="Session outcomes">
                        <DoughnutChart
                            labels={['Completed', 'Skipped', 'Missed']}
                            data={[sessionTotals.completed, sessionTotals.skipped, sessionTotals.missed]}
                            colors={['primary', 'info', 'accent']}
                            centerLabel={`${completionRate}%`}
                        />
                    </SectionCard>

                    <SectionCard
                        title="Check-ins"
                        description="Submitted vs due, per week."
                    >
                        <StackedBarChart
                            labels={weekLabels}
                            series={[
                                { label: 'Submitted', data: checkInWeeks.map((w) => w.submitted), color: 'primary' },
                                { label: 'Pending', data: checkInWeeks.map((w) => w.due - w.submitted), color: 'accent' },
                            ]}
                        />
                    </SectionCard>
                </div>

                <SectionCard
                    title="Nutrition logging"
                    description="Food logs per week across all clients."
                >
                    <LineChart
                        labels={weekLabels}
                        data={nutritionWeeks.map((w) => w.logs)}
                        color="primary"
                    />
                </SectionCard>

                <SectionCard title="Adherence by client">
                    <BarChart
                        horizontal
                        labels={adherenceClients.map((c) => c.name.split(' ')[0])}
                        data={adherenceClients.map((c) => c.adherence ?? 0)}
                        color="info"
                        className="h-40"
                    />
                </SectionCard>

                <SectionCard title="Client detail" className="overflow-x-auto">
                    <Table className="min-w-[560px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Workouts</TableHead>
                                <TableHead className="w-40">Adherence</TableHead>
                                <TableHead className="text-right">Nutrition logs</TableHead>
                                <TableHead className="text-right">Check-ins</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((c) => (
                                <TableRow key={c.name}>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell>{c.workouts}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={c.adherence ?? 0} className="w-20" />
                                            <span className="text-xs text-muted-foreground">
                                                {c.adherence !== null ? `${c.adherence}%` : '—'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{c.nutrition_logs}</TableCell>
                                    <TableCell className="text-right">
                                        {c.check_ins.submitted}/{c.check_ins.total}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>
            </div>
        </>
    );
}
