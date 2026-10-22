import { Head, Link, router } from '@inertiajs/react';
import { BedDouble, CalendarDays, Dumbbell, Play, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip, type StatusTone } from '@/components/trainet/status-chip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import type { ProgramAssignment, WorkoutSession } from '@/types';

type Coach = {
    id: number;
    name: string;
    avatar: string | null;
    professional_profile: { id: number } | null;
};

const CoachAvatar = ({ coach }: { coach: Coach | null | undefined }) => {
    if (!coach) {
        return null;
    }

    const avatar = (
        <Avatar className="size-11 ring-2 ring-border transition-transform hover:scale-105" title={coach.name}>
            <AvatarImage src={mediaUrl(coach.avatar) ?? undefined} alt={coach.name} />
            <AvatarFallback className="text-sm">{coach.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
    );

    return coach.professional_profile ? (
        <Link href={`/app/professionals/${coach.professional_profile.id}`}>{avatar}</Link>
    ) : (
        avatar
    );
};

const TypeBadge = ({
    icon: Icon,
    children,
    className,
}: {
    icon: LucideIcon;
    children: string;
    className?: string;
}) => (
    <Badge
        variant="secondary"
        className={cn(
            'gap-1 px-1.5 py-0 text-[10px] font-semibold tracking-wide uppercase',
            className,
        )}
    >
        <Icon className="size-3" />
        {children}
    </Badge>
);

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
        assigned_by: Coach | null;
    }) | null;
    upcoming: WorkoutSession[];
    mealPlan: {
        assigned_by: Coach | null;
        plan_version: {
            version_number: number;
            plan: { name: string; description: string | null };
            days: { id: number; title: string; meals: { id: number }[] }[];
        } | null;
    } | null;
};

const sessionTone: Record<string, StatusTone> = {
    completed: 'success',
    skipped: 'danger',
    scheduled: 'neutral',
    in_progress: 'info',
    paused: 'warning',
};

export default function TrainingIndex({ assignment, upcoming, mealPlan }: Props) {
    const version = assignment?.program_version;
    const mealPlanVersion = mealPlan?.plan_version;
    const nextUp = upcoming[0];

    return (
        <>
            <Head title="Plans" />
            <div className="space-y-5 py-5">
                <h1 className="text-2xl font-bold tracking-tight">Plans</h1>

                {!assignment && !mealPlanVersion ? (
                    <EmptyState
                        icon={Dumbbell}
                        title="No plan yet"
                        description="Your coach hasn't assigned a program or meal plan. Check back soon."
                    />
                ) : (
                    <>
                        {assignment && (
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
                            title={
                                <span className="flex flex-wrap items-center gap-2">
                                    {version?.program.name ?? 'Program'}
                                    <TypeBadge
                                        icon={Dumbbell}
                                        className="bg-primary/10 text-primary"
                                    >
                                        Training program
                                    </TypeBadge>
                                </span>
                            }
                            description={version?.program.description ?? undefined}
                            action={<CoachAvatar coach={assignment?.assigned_by} />}
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
                            </>
                        )}

                        {mealPlanVersion && (
                            <SectionCard
                                title={
                                    <span className="flex flex-wrap items-center gap-2">
                                        {mealPlanVersion.plan.name}
                                        <TypeBadge
                                            icon={UtensilsCrossed}
                                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        >
                                            Meal plan
                                        </TypeBadge>
                                    </span>
                                }
                                description={mealPlanVersion.plan.description ?? undefined}
                                action={<CoachAvatar coach={mealPlan?.assigned_by} />}
                            >
                                <div className="divide-y">
                                    {mealPlanVersion.days.map((day) => (
                                        <ListRow
                                            key={day.id}
                                            leading={<UtensilsCrossed className="size-4 text-amber-500" />}
                                            title={day.title}
                                            subtitle={`${day.meals.length} meals`}
                                            href="/app/nutrition/plan"
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
