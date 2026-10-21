import { Head, router } from '@inertiajs/react';
import { Flame, ListChecks } from 'lucide-react';
import { goBack } from '@/lib/back';
import { PageHeader } from '@/components/trainet/page-header';
import { EmptyState } from '@/components/trainet/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type HabitRow = {
    id: number;
    name: string;
    description: string | null;
    today_done: boolean;
    streak: number;
    recent: { date: string; completed: boolean }[];
};

export default function HabitsIndex({ habits }: { habits: HabitRow[] }) {
    const toggle = (id: number) =>
        router.post(`/app/habits/${id}/toggle`, {}, { preserveScroll: true });

    const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
    });

    return (
        <>
            <Head title="Habits" />
            <div className="space-y-5 py-5">
                <PageHeader title="Habits" backHref="/app/today" />
                {habits.length === 0 ? (
                    <EmptyState
                        icon={ListChecks}
                        title="No habits yet"
                        description="Your coach will assign habits to track here."
                    />
                ) : (
                    <div className="space-y-3">
                        {habits.map((habit) => {
                            const recentMap = new Map(habit.recent.map((r) => [r.date, r.completed]));
                            return (
                                <Card key={habit.id}>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggle(habit.id)}
                                                className={cn(
                                                    'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                                    habit.today_done
                                                        ? 'border-success bg-success text-success'
                                                        : 'border-muted-foreground/40',
                                                )}
                                            >
                                                {habit.today_done && (
                                                    <svg className="size-4" viewBox="0 0 12 12" fill="none">
                                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                )}
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        'font-medium',
                                                        habit.today_done && 'text-muted-foreground line-through',
                                                    )}
                                                >
                                                    {habit.name}
                                                </p>
                                                {habit.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {habit.description}
                                                    </p>
                                                )}
                                            </div>
                                            {habit.streak > 0 && (
                                                <span className="flex items-center gap-1 text-sm font-semibold text-warning">
                                                    <Flame className="size-4" />
                                                    {habit.streak}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {last14.map((date) => {
                                                const done = recentMap.get(date);
                                                return (
                                                    <div
                                                        key={date}
                                                        title={date}
                                                        className={cn(
                                                            'h-2 flex-1 rounded-full',
                                                            done
                                                                ? 'bg-success'
                                                                : date === new Date().toISOString().slice(0, 10)
                                                                  ? 'bg-muted-foreground/30'
                                                                  : 'bg-muted',
                                                        )}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
