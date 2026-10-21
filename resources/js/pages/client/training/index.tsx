import { Head, Link, router } from '@inertiajs/react';
import { BedDouble, CalendarDays, Dumbbell, Play } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip, type StatusTone } from '@/components/trainet/status-chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ProgramAssignment, WorkoutSession } from '@/types';

type Props = {
    assignment: (ProgramAssignment & {
        program_version: {
            version_number: number;
            program: { name: string; description: string | null };
            days: {
                id: number;
                title: string;
                is_rest_day: boolean;
                exercises: { id: number }[];
            }[];
        };
    }) | null;
    upcoming: WorkoutSession[];
    recent: WorkoutSession[];
};

const sessionTone: Record<string, StatusTone> = {
    completed: 'success',
    skipped: 'danger',
    scheduled: 'neutral',
    in_progress: 'info',
    paused: 'warning',
};

export default function TrainingIndex({ assignment, upcoming, recent }: Props) {
    const version = assignment?.program_version;
    const nextUp = upcoming[0];

    return (
        <>
            <Head title="Training" />
            <div className="space-y-5 py-5">
                <h1 className="text-2xl font-bold tracking-tight">Training</h1>

                {!assignment ? (
                    <EmptyState
                        icon={Dumbbell}
                        title="No program yet"
                        description="Your coach hasn't assigned a training program. Check back soon."
                    />
                ) : (
                    <>
                        {nextUp && (
                            <Card className="border-primary/30">
                                <CardContent className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {new Date(nextUp.scheduled_for + 'T00:00:00').toDateString() ===
                                            new Date().toDateString()
                                                ? 'Up next — today'
                                                : `Up next — ${new Date(nextUp.scheduled_for + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })}`}
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {nextUp.training_day?.title ?? 'Workout'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() =>
                                            nextUp.status === 'scheduled'
                                                ? router.post(`/app/workouts/${nextUp.id}/start`)
                                                : router.visit(`/app/workouts/${nextUp.id}`)
                                        }
                                    >
                                        <Play className="mr-1" />
                                        {nextUp.status === 'scheduled' ? 'Start' : 'Resume'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <SectionCard
                            title={version?.program.name ?? 'Program'}
                            description={version?.program.description ?? undefined}
                            action={<StatusChip tone="info">v{version?.version_number}</StatusChip>}
                        >
                            <div className="divide-y">
                                {version?.days.map((day) => (
                                    <ListRow
                                        key={day.id}
                                        leading={
                                            day.is_rest_day ? (
                                                <BedDouble className="size-4 text-muted-foreground" />
                                            ) : (
                                                <Dumbbell className="size-4 text-primary" />
                                            )
                                        }
                                        title={day.title}
                                        subtitle={
                                            day.is_rest_day
                                                ? 'Rest & recovery'
                                                : `${day.exercises?.length ?? 0} exercises`
                                        }
                                        href={day.is_rest_day ? undefined : `/app/training/days/${day.id}`}
                                    />
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Schedule">
                            <div className="divide-y">
                                {upcoming.map((s) => (
                                    <ListRow
                                        key={s.id}
                                        leading={<CalendarDays className="size-4 text-muted-foreground" />}
                                        title={s.training_day?.title ?? 'Workout'}
                                        subtitle={new Date(s.scheduled_for + 'T00:00:00').toLocaleDateString('en-GB', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                        trailing={
                                            <StatusChip tone={sessionTone[s.status] ?? 'neutral'}>
                                                {s.status.replace('_', ' ')}
                                            </StatusChip>
                                        }
                                        href={`/app/workouts/${s.id}`}
                                    />
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Recent sessions"
                            action={
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/app/history">All history</Link>
                                </Button>
                            }
                        >
                            {recent.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No completed sessions yet — your first one is coming.
                                </p>
                            ) : (
                                <div className="divide-y">
                                    {recent.map((s) => (
                                        <ListRow
                                            key={s.id}
                                            title={s.training_day?.title ?? 'Workout'}
                                            subtitle={new Date(s.scheduled_for + 'T00:00:00').toLocaleDateString('en-GB', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                            trailing={<StatusChip tone="success">Done</StatusChip>}
                                            href={`/app/workouts/${s.id}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </>
                )}
            </div>
        </>
    );
}
