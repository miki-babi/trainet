import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Camera,
    ClipboardCheck,
    Dumbbell,
    Droplets,
    Flame,
    ListChecks,
    MessageSquare,
    Pause,
    Plus,
    Scale,
    UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import { ActivityTile } from '@/components/trainet/activity-tile';
import { DayStrip, type DayStripDay } from '@/components/trainet/day-strip';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip } from '@/components/trainet/status-chip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { Auth, CheckInSubmission, NutritionTargets, WorkoutSession } from '@/types';

type Props = {
    clientName: string;
    onboardingComplete: boolean;
    session: (WorkoutSession & { training_day?: { title: string } }) | null;
    nextSession:
        | (WorkoutSession & { training_day?: { title: string } })
        | null;
    week: (DayStripDay & { sessionId: number | null })[];
    nutrition: {
        targets: NutritionTargets | null;
        totals: {
            calories: number;
            protein_g: number;
            carbs_g: number;
            fat_g: number;
        };
        planMeals: { id: number; name: string; time_hint: string | null }[] | null;
    };
    habits: { id: number; name: string; done: boolean }[];
    water: { amount_ml: number; target_ml: number | null };
    checkIn: CheckInSubmission | null;
    latestMessage: {
        conversation_id: number;
        sender: string | null;
        body: string | null;
        unread: number;
    } | null;
};

type Filter = 'all' | 'training' | 'nutrition' | 'habits';

const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'training', label: 'Training' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'habits', label: 'Habits' },
];

export default function ClientToday({
    clientName,
    onboardingComplete,
    session,
    nextSession,
    week,
    nutrition,
    habits,
    water,
    checkIn,
    latestMessage,
}: Props) {
    const { props } = usePage<{ auth: Auth }>();
    const getInitials = useInitials();
    const [filter, setFilter] = useState<Filter>('all');
    const [progressOpen, setProgressOpen] = useState(false);
    const [progressPhoto, setProgressPhoto] = useState<File | null>(null);
    const [progressWeight, setProgressWeight] = useState('');
    const [progressDate, setProgressDate] = useState(
        () => new Date().toISOString().slice(0, 10),
    );
    const [progressSaving, setProgressSaving] = useState(false);
    const [waterOpen, setWaterOpen] = useState(false);
    const [waterAmount, setWaterAmount] = useState(250);
    const [waterCustom, setWaterCustom] = useState('');

    const activeSession = session ?? nextSession;
    const isPaused = session?.status === 'paused';
    const inProgress =
        session?.status === 'in_progress' || session?.status === 'paused';
    const completed = session?.status === 'completed';
    const habitsDone = habits.filter((h) => h.done).length;

    const addWater = (amount: number) => {
        router.post(
            '/app/water',
            { amount_ml: amount },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setWaterOpen(false);
                    setWaterCustom('');
                    setWaterAmount(250);
                },
            },
        );
    };

    const toggleHabit = (id: number) => {
        router.post(`/app/habits/${id}/toggle`, {}, { preserveScroll: true });
    };

    const calPct = nutrition.targets?.calories
        ? Math.min(100, (nutrition.totals.calories / nutrition.targets.calories) * 100)
        : 0;

    const startOrOpen = () => {
        if (!activeSession) {
            return;
        }
        if (session && inProgress) {
            router.visit(`/app/workouts/${session.id}`);
        } else if (session?.status === 'scheduled' || nextSession) {
            router.post(`/app/workouts/${activeSession.id}/start`);
        } else {
            router.visit(`/app/workouts/${activeSession.id}`);
        }
    };

    const unreadMessages = latestMessage?.unread ?? 0;

    const waterGoal = water.target_ml ?? 2500;
    const waterDone = water.amount_ml >= waterGoal;
    const waterPct = Math.min(100, (water.amount_ml / waterGoal) * 100);
    const waterNewAmount = waterCustom
        ? Math.min(5000, parseInt(waterCustom) || 0)
        : waterAmount;
    const waterAfter = water.amount_ml + waterNewAmount;
    const waterAfterPct = Math.min(100, (waterAfter / waterGoal) * 100);

    return (
        <>
            <Head title="Today" />
            <div className="space-y-5 py-5">
                {/* Greeting */}
                <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                        {getInitials(clientName)}
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Hello</p>
                        <p className="font-semibold">{clientName.split(' ')[0]}</p>
                    </div>
                    <div className="flex-1" />
                    <Link
                        href="/app/messages"
                        className="relative flex size-10 items-center justify-center rounded-full border border-border bg-card"
                    >
                        <Bell className="size-4.5" />
                        {unreadMessages > 0 && (
                            <span className="absolute top-0 right-0 size-2.5 rounded-full bg-primary" />
                        )}
                    </Link>
                </div>

                <h1 className="text-3xl leading-tight font-extrabold tracking-tight">
                    Ready for today&apos;s challenges?
                </h1>

                {!onboardingComplete && (
                    <Card className="border-primary/40 bg-primary/10">
                        <CardContent className="flex items-center justify-between gap-3">
                            <div>
                                <p className="font-medium">Finish setting up</p>
                                <p className="text-sm text-muted-foreground">
                                    A few details so your coach can build your plan.
                                </p>
                            </div>
                            <Button asChild size="sm">
                                <Link href="/app/onboarding">Continue</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <DayStrip
                    days={week}
                    onSelect={(date) => {
                        const day = week.find((d) => d.date === date);
                        if (day?.sessionId) {
                            router.visit(`/app/workouts/${day.sessionId}`);
                        }
                    }}
                />

                {/* Filter chips */}
                <div className="flex gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            type="button"
                            onClick={() => setFilter(f.value)}
                            className={cn(
                                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                filter === f.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Activity tiles */}
                <div className="grid grid-cols-2 gap-3">
                    {(filter === 'all' || filter === 'training') &&
                        (activeSession ? (
                            <ActivityTile
                                icon={Dumbbell}
                                title={activeSession.training_day?.title ?? 'Workout'}
                                subtitle={
                                    completed
                                        ? 'Done — view summary'
                                        : isPaused
                                          ? 'Paused — resume'
                                          : session
                                            ? "Today's workout"
                                            : `Next · ${activeSession.scheduled_for ? new Date(activeSession.scheduled_for + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' }) : ''}`
                                }
                                onClick={startOrOpen}
                                variant={completed ? 'dark' : 'lime'}
                            />
                        ) : (
                            <ActivityTile
                                icon={Dumbbell}
                                title="Rest day"
                                subtitle="No workout scheduled"
                                href="/app/training"
                                variant="dark"
                            />
                        ))}

                    {(filter === 'all' || filter === 'habits') && checkIn && checkIn.status === 'pending' && (
                        <ActivityTile
                            icon={ClipboardCheck}
                            title="Check-in due"
                            subtitle="Takes ~2 minutes"
                            href={`/app/check-ins/${checkIn.id}/edit`}
                            variant="blue"
                        />
                    )}

                    {(filter === 'all' || filter === 'nutrition') && (
                        <>
                            <ActivityTile
                                icon={Flame}
                                title={`${nutrition.totals.calories} kcal`}
                                subtitle={`of ${nutrition.targets?.calories ?? '—'} target`}
                                href="/app/nutrition"
                                variant="dark"
                            />
                            <ActivityTile
                                icon={Droplets}
                                title={`${(water.amount_ml / 1000).toFixed(2)} L water`}
                                subtitle={
                                    waterDone
                                        ? `Goal hit +${Math.round(((water.amount_ml - waterGoal) / waterGoal) * 100)}%`
                                        : `${Math.round(waterPct)}% of ${(waterGoal / 1000).toFixed(1)} L goal`
                                }
                                onClick={() => setWaterOpen(true)}
                                variant={waterDone ? 'lime' : 'dark'}
                            />
                        </>
                    )}

                    {(filter === 'all' || filter === 'habits') && habits.length > 0 && (
                        <ActivityTile
                            icon={ListChecks}
                            title={`${habitsDone}/${habits.length} habits`}
                            subtitle={habits.find((h) => !h.done)?.name ?? 'All done'}
                            href="/app/habits"
                            variant={habitsDone === habits.length ? 'dark' : 'dark'}
                        />
                    )}

                    <ActivityTile
                        icon={Plus}
                        title="Log a meal"
                        subtitle="Snap a photo"
                        href="/app/nutrition/log"
                        variant="ghost"
                    />
                    <ActivityTile
                        icon={Scale}
                        title="Log progress"
                        subtitle="Photo + weight"
                        onClick={() => setProgressOpen(true)}
                        variant="ghost"
                    />
                </div>

                {/* Quick progress log sheet */}
                <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Log progress</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <label className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-xl border border-dashed text-muted-foreground hover:border-primary/60">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) =>
                                        setProgressPhoto(e.target.files?.[0] ?? null)
                                    }
                                />
                                {progressPhoto ? (
                                    <img
                                        src={URL.createObjectURL(progressPhoto)}
                                        alt="Progress"
                                        className="h-full w-full rounded-xl object-cover"
                                    />
                                ) : (
                                    <span className="flex flex-col items-center gap-1">
                                        <Camera className="size-7" />
                                        <span className="text-xs">Add a photo</span>
                                    </span>
                                )}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="q-weight">Weight (kg)</Label>
                                    <Input
                                        id="q-weight"
                                        type="number"
                                        step="0.1"
                                        inputMode="decimal"
                                        value={progressWeight}
                                        onChange={(e) => setProgressWeight(e.target.value)}
                                        placeholder="e.g. 71.5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="q-date">Date</Label>
                                    <Input
                                        id="q-date"
                                        type="date"
                                        max={new Date().toISOString().slice(0, 10)}
                                        value={progressDate}
                                        onChange={(e) => setProgressDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                className="w-full"
                                disabled={(!progressPhoto && !progressWeight) || progressSaving}
                                onClick={() => {
                                    setProgressSaving(true);
                                    router.post(
                                        '/app/progress/quick',
                                        {
                                            photo: progressPhoto,
                                            weight: progressWeight || null,
                                            taken_on: progressDate,
                                        } as never,
                                        {
                                            forceFormData: true,
                                            onFinish: () => {
                                                setProgressSaving(false);
                                            },
                                            onSuccess: () => {
                                                setProgressOpen(false);
                                                setProgressPhoto(null);
                                                setProgressWeight('');
                                            },
                                        },
                                    );
                                }}
                            >
                                Save progress
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Water confirm sheet */}
                <Dialog open={waterOpen} onOpenChange={setWaterOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Log water</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Droplets className="size-4 text-info" />
                                        {(water.amount_ml / 1000).toFixed(2)} /{' '}
                                        {(waterGoal / 1000).toFixed(1)} L goal
                                    </span>
                                    <span
                                        className={cn(
                                            'text-xs font-medium',
                                            waterDone ? 'text-primary' : 'text-muted-foreground',
                                        )}
                                    >
                                        {waterDone
                                            ? `Goal hit +${water.amount_ml - waterGoal} ml`
                                            : `${waterGoal - water.amount_ml} ml to go`}
                                    </span>
                                </div>
                                <Progress value={waterPct} />
                                <Progress
                                    value={waterAfterPct}
                                    className="h-1.5 [&>div]:bg-info/60"
                                />
                                <p className="text-xs text-muted-foreground">
                                    After this: {(waterAfter / 1000).toFixed(2)} L
                                    {waterAfter > waterGoal
                                        ? ` — ${waterAfter - waterGoal} ml over your goal`
                                        : ''}
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[150, 250, 330, 500, 750, 1000].map((ml) => (
                                    <button
                                        key={ml}
                                        type="button"
                                        onClick={() => {
                                            setWaterAmount(ml);
                                            setWaterCustom('');
                                        }}
                                        className={cn(
                                            'rounded-xl border py-3 text-sm font-medium transition-colors',
                                            waterAmount === ml && !waterCustom
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {ml} ml
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="water-custom">Custom amount (ml)</Label>
                                <Input
                                    id="water-custom"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={5000}
                                    value={waterCustom}
                                    onChange={(e) => setWaterCustom(e.target.value)}
                                    placeholder="e.g. 400"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                className="w-full"
                                onClick={() => addWater(waterNewAmount)}
                                disabled={waterCustom !== '' && !(parseInt(waterCustom) > 0)}
                            >
                                <Droplets className="mr-1 size-4" />
                                Add {waterNewAmount} ml
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Hero action for in-progress workout */}
                {session && inProgress && (
                    <Button
                        size="lg"
                        className="h-13 w-full rounded-2xl text-base"
                        onClick={() => router.visit(`/app/workouts/${session.id}`)}
                    >
                        <Pause className="mr-1" /> Resume workout — sets saved
                    </Button>
                )}

                {/* Nutrition detail */}
                {(filter === 'all' || filter === 'nutrition') && (
                    <SectionCard
                        title="Nutrition"
                        action={
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/app/nutrition">View all</Link>
                            </Button>
                        }
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5">
                                    <UtensilsCrossed className="size-4 text-primary" />
                                    {nutrition.totals.calories} /{' '}
                                    {nutrition.targets?.calories ?? '—'} kcal
                                </span>
                                <span className="text-muted-foreground">
                                    P {Math.round(nutrition.totals.protein_g)}g · C{' '}
                                    {Math.round(nutrition.totals.carbs_g)}g · F{' '}
                                    {Math.round(nutrition.totals.fat_g)}g
                                </span>
                            </div>
                            <Progress value={calPct} />
                            {nutrition.planMeals && (
                                <div className="divide-y">
                                    {nutrition.planMeals.slice(0, 3).map((meal) => (
                                        <ListRow
                                            key={meal.id}
                                            title={meal.name}
                                            subtitle={meal.time_hint ?? ''}
                                            href="/app/nutrition"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </SectionCard>
                )}

                {/* Habits detail */}
                {(filter === 'all' || filter === 'habits') && (
                    <SectionCard title="Habits">
                        <div className="space-y-1">
                            {habits.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No habits assigned yet.
                                </p>
                            )}
                            {habits.map((habit) => (
                                <button
                                    key={habit.id}
                                    type="button"
                                    onClick={() => toggleHabit(habit.id)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-1 py-2 text-left text-sm transition-colors hover:bg-accent"
                                >
                                    <span
                                        className={`flex size-5 items-center justify-center rounded-full border-2 transition-colors ${
                                            habit.done
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-muted-foreground/40'
                                        }`}
                                    >
                                        {habit.done && (
                                            <svg
                                                className="size-3"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                            >
                                                <path
                                                    d="M2 6l3 3 5-5"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        )}
                                    </span>
                                    <span
                                        className={
                                            habit.done
                                                ? 'text-muted-foreground line-through'
                                                : ''
                                        }
                                    >
                                        {habit.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Latest message */}
                {latestMessage && filter === 'all' && (
                    <SectionCard
                        title="Messages"
                        action={
                            latestMessage.unread > 0 ? (
                                <StatusChip tone="primary">
                                    {latestMessage.unread} new
                                </StatusChip>
                            ) : undefined
                        }
                    >
                        <ListRow
                            leading={
                                <div className="flex size-9 items-center justify-center rounded-full bg-primary/15">
                                    <MessageSquare className="size-4 text-primary" />
                                </div>
                            }
                            title={latestMessage.sender ?? 'Coach'}
                            subtitle={latestMessage.body}
                            href={`/app/messages/${latestMessage.conversation_id}`}
                        />
                    </SectionCard>
                )}
            </div>
        </>
    );
}
