import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Settings2, X } from 'lucide-react';
import { StatusChip } from '@/components/trainet/status-chip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { goBack } from '@/lib/back';
import { cn } from '@/lib/utils';

type Appt = {
    id: number;
    client: string;
    professional: string;
    type: string;
    color: string | null;
    status: string;
    start: string;
    end: string;
};

type Props = {
    weekStart: string;
    days: { date: string; label: string; isToday: boolean }[];
    appointments: Record<string, Appt[]>;
    pending: { id: number; client: string; type: string; starts: string }[];
};

export default function CalendarIndex({ weekStart, days, appointments, pending }: Props) {
    const shift = (weeks: number) => {
        const d = new Date(weekStart + 'T00:00:00');
        d.setDate(d.getDate() + weeks * 7);
        router.get('/pro/calendar', { week: d.toISOString().slice(0, 10) }, { preserveState: true });
    };

    const close = () => goBack('/pro/today');

    const weekLabel = `${new Date(weekStart + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(days.at(-1)!.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

    return (
        <>
            <Head title="Calendar" />
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 animate-in fade-in duration-200"
                onClick={close}
            />

            {/* Sheet */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 top-8 z-50 sm:top-14">
                <div className="pointer-events-auto mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border-t bg-background animate-in slide-in-from-bottom-full duration-300">
                    {/* Drag handle */}
                    <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />

                    <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-8 pt-3">
                        {/* Header */}
                        <div className="flex items-center gap-2">
                            <h1 className="flex-1 text-xl font-extrabold tracking-tight">
                                Calendar
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    {weekLabel}
                                </span>
                            </h1>
                            <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => shift(1)}>
                                <ChevronRight className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={close}>
                                <X className="size-5" />
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/pro/appointment-types">
                                    <Settings2 className="mr-1 size-4" /> Session types
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/pro/availability">Availability</Link>
                            </Button>
                        </div>

                        {pending.length > 0 && (
                            <Card className="border-warning/50 bg-warning/5">
                                <CardContent className="space-y-2 py-3">
                                    <p className="text-sm font-semibold">
                                        {pending.length} booking{pending.length > 1 ? 's' : ''} awaiting confirmation
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {pending.map((p) => (
                                            <Link
                                                key={p.id}
                                                href={`/pro/appointments/${p.id}`}
                                                className="shrink-0 rounded-lg border bg-background px-3 py-1.5 text-sm whitespace-nowrap hover:border-primary"
                                            >
                                                {p.client} · {p.type} · {p.starts}
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Agenda list on mobile, week grid on lg */}
                        <div className="grid gap-3 lg:grid-cols-7">
                            {days.map((day) => {
                                const appts = appointments[day.date] ?? [];
                                return (
                                    <div
                                        key={day.date}
                                        className={cn(
                                            'rounded-xl border p-3 lg:min-h-40 lg:p-2',
                                            day.isToday && 'border-primary bg-primary/5',
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                'mb-2 text-sm font-medium',
                                                day.isToday && 'text-primary',
                                            )}
                                        >
                                            {day.label}
                                            {day.isToday && ' · today'}
                                        </p>
                                        <div className="space-y-1.5">
                                            {appts.map((a) => (
                                                <Link
                                                    key={a.id}
                                                    href={`/pro/appointments/${a.id}`}
                                                    className={cn(
                                                        'block rounded-lg border-l-4 bg-card px-2 py-1.5 text-xs shadow-sm transition-shadow hover:shadow',
                                                        a.status === 'cancelled' && 'opacity-50 line-through',
                                                    )}
                                                    style={{ borderLeftColor: a.color ?? '#0e8a63' }}
                                                >
                                                    <p className="font-medium">
                                                        {a.start} {a.client}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {a.type}
                                                        {a.status === 'pending' && ' · pending'}
                                                    </p>
                                                </Link>
                                            ))}
                                            {appts.length === 0 && (
                                                <p className="hidden text-xs text-muted-foreground/60 lg:block">
                                                    <CalendarDays className="mx-auto mt-4 size-4" />
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
