import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    ClipboardCheck,
    Droplets,
    Dumbbell,
    MessageSquare,
    Plus,
    UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import type { FoodDetailData } from '@/components/trainet/food-detail';
import { PlanMealConfirm } from '@/components/trainet/plan-meal-confirm';
import { RingProgress } from '@/components/trainet/ring-progress';
import { SectionCard } from '@/components/trainet/section-card';
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
import { mediaUrl } from '@/lib/media';
import type { CheckInSubmission, NutritionTargets, WorkoutSession } from '@/types';

type Props = {
    clientName: string;
    clientAvatar: string | null;
    onboardingComplete: boolean;
    session: (WorkoutSession & { training_day?: { title: string } }) | null;
    nextSession:
        | (WorkoutSession & { training_day?: { title: string } })
        | null;
    week: unknown;
    nutrition: {
        targets: NutritionTargets | null;
        totals: {
            calories: number;
            protein_g: number;
            carbs_g: number;
            fat_g: number;
        };
        planTitle: string | null;
        planMeals:
            | {
                  id: number;
                  name: string;
                  time_hint: string | null;
                  image_url: string | null;
                  items: {
                      id: number;
                      name: string;
                      portion: string | null;
                      kcal: number | null;
                      food: FoodDetailData | null;
                  }[];
                  kcal: number;
                  logged: boolean;
                  logged_item_ids?: number[];
              }[]
            | null;
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
    workoutMeta: {
        exercise_count: number;
        est_minutes: number | null;
        image: string | null;
    };
};

export default function ClientToday({
    clientName,
    clientAvatar,
    onboardingComplete,
    session,
    nextSession,
    nutrition,
    water,
    checkIn,
    latestMessage,
    workoutMeta,
}: Props) {
    const getInitials = useInitials();

    const activeSession = session ?? nextSession;
    const isPaused = session?.status === 'paused';
    const inProgress =
        session?.status === 'in_progress' || session?.status === 'paused';
    const completed = session?.status === 'completed';

    const calPct = nutrition.targets?.calories
        ? Math.min(100, (nutrition.totals.calories / nutrition.targets.calories) * 100)
        : 0;

    const waterTarget = water.target_ml ?? 2500;
    const waterPct = Math.min(100, (water.amount_ml / waterTarget) * 100);

    const [waterOpen, setWaterOpen] = useState(false);
    const [customWater, setCustomWater] = useState('');
    const [confirmMeal, setConfirmMeal] = useState<
        NonNullable<Props['nutrition']['planMeals']>[number] | null
    >(null);

    const logWater = (ml: number) => {
        router.post(
            '/app/water',
            { amount_ml: ml },
            { preserveScroll: true, onSuccess: () => setWaterOpen(false) },
        );
    };

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

    return (
        <>
            <Head title="Home" />
            <div className="space-y-6 py-5">
                {/* Greeting */}
                <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary">
                        {clientAvatar ? (
                            <img src={clientAvatar} alt={clientName} className="size-11 rounded-full object-cover" />
                        ) : (
                            getInitials(clientName)
                        )}
                    </div>
                    <div>
                        <p className="text-lg leading-tight font-bold">
                            Good morning, {clientName.split(' ')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Your fitness journey, one day at a time.
                        </p>
                    </div>
                    <div className="flex-1" />
                    <Link
                        href="/app/messages"
                        aria-label="Messages"
                        className="relative flex size-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
                    >
                        <Bell className="size-4.5" />
                        {unreadMessages > 0 && (
                            <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-primary" />
                        )}
                    </Link>
                </div>

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

                {checkIn && checkIn.status === 'pending' && (
                    <Card className="border-primary/40 bg-primary/10">
                        <CardContent className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <ClipboardCheck className="size-5 text-primary" />
                                <div>
                                    <p className="font-medium">Check-in due</p>
                                    <p className="text-sm text-muted-foreground">
                                        Takes about 2 minutes.
                                    </p>
                                </div>
                            </div>
                            <Button asChild size="sm">
                                <Link href={`/app/check-ins/${checkIn.id}/edit`}>Start</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Today's Plan */}
                <section className="space-y-3">
                    <h2 className="font-semibold">Today&apos;s Plan</h2>
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={startOrOpen}
                            className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-border transition-colors hover:ring-primary/50"
                        >
                            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/15 text-primary">
                                {workoutMeta.image ? (
                                    <img src={workoutMeta.image} alt="" className="size-14 object-cover" />
                                ) : (
                                    <Dumbbell className="size-6" />
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">
                                    {activeSession?.training_day?.title ?? 'Rest day'}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {completed
                                        ? 'Done — view summary'
                                        : isPaused
                                          ? 'Paused — resume'
                                          : activeSession
                                            ? `${workoutMeta.est_minutes ?? '—'} min · ${workoutMeta.exercise_count} exercises`
                                            : 'No workout scheduled'}
                                </span>
                            </span>
                            {activeSession && !completed && (
                                <Button size="sm" className="h-9 shrink-0 rounded-full px-4">
                                    {inProgress ? 'Resume' : 'Start'}
                                </Button>
                            )}
                        </button>
                    </div>
                </section>

                {/* Coach message */}
                {latestMessage?.body && (
                    <SectionCard title="Message from your coach">
                        <Link
                            href={`/app/messages/${latestMessage.conversation_id}`}
                            className="flex items-start gap-3"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <MessageSquare className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium">{latestMessage.sender ?? 'Coach'}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {latestMessage.body}
                                </p>
                            </div>
                        </Link>
                    </SectionCard>
                )}

                {/* Nutrition */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Nutrition</h2>
                        <Link href="/app/nutrition" className="text-sm text-primary hover:underline">
                            Details
                        </Link>
                    </div>
                    <div className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-border">
                        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-2 gap-y-2">
                            {/* Labels row — all vertically aligned */}
                            <div className="self-end space-y-1">
                                <p className="text-xl leading-tight font-bold">
                                    Daily calories
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {nutrition.targets?.calories
                                        ? `${Math.max(0, nutrition.targets.calories - nutrition.totals.calories).toLocaleString()} kcal left of ${nutrition.targets.calories.toLocaleString()}`
                                        : 'No daily target set'}
                                </p>
                            </div>
                            {['Protein', 'Carbs', 'Fat'].map((label) => (
                                <p
                                    key={label}
                                    className="self-end text-center text-sm font-semibold"
                                >
                                    {label}
                                </p>
                            ))}
                            {/* Rings row */}
                            <RingProgress
                                value={calPct}
                                size={120}
                                strokeWidth={9}
                                className="justify-self-center"
                            >
                                <span className="text-base font-bold">
                                    {nutrition.totals.calories.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                    kcal
                                </span>
                            </RingProgress>
                            {(
                                [
                                    ['Protein', nutrition.totals.protein_g, nutrition.targets?.protein_g],
                                    ['Carbs', nutrition.totals.carbs_g, nutrition.targets?.carbs_g],
                                    ['Fat', nutrition.totals.fat_g, nutrition.targets?.fat_g],
                                ] as const
                            ).map(([label, total, target]) => (
                                <div
                                    key={label}
                                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-muted/50 py-3"
                                >
                                    <RingProgress
                                        value={target ? Math.min(100, (total / target) * 100) : 0}
                                        size={68}
                                        strokeWidth={5}
                                    >
                                        <span className="text-xs font-bold">
                                            {Math.round(total)}g
                                        </span>
                                    </RingProgress>
                                    <p className="text-[11px] text-muted-foreground">
                                        / {target ?? '—'}g
                                    </p>
                                </div>
                            ))}
                        </div>
                        {/* Today's planned meals */}
                        {nutrition.planMeals && nutrition.planMeals.length > 0 && (
                            <div className="space-y-1 border-t border-border pt-3">
                                <p className="pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                    On your plan{nutrition.planTitle ? ` — ${nutrition.planTitle}` : ''}
                                </p>
                                {nutrition.planMeals.map((meal) => (
                                    <button
                                        key={meal.id}
                                        type="button"
                                        onClick={() => setConfirmMeal(meal)}
                                        className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-muted"
                                    >
                                        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                                            {meal.image_url ? (
                                                <img src={mediaUrl(meal.image_url) ?? undefined} alt={meal.name} className="size-9 object-cover" />
                                            ) : (
                                                <UtensilsCrossed className="size-4" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">
                                                {meal.name}
                                                {meal.time_hint && (
                                                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                        {meal.time_hint}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {meal.items.map((i) => i.name).join(', ') || 'Meal'}
                                                {meal.kcal > 0 && ` · ${meal.kcal} kcal`}
                                            </span>
                                        </span>
                                        {(() => {
                                            const total = meal.items.length;
                                            const eaten = meal.logged
                                                ? (meal.logged_item_ids?.length ?? 0) || total
                                                : 0;
                                            const pct = total ? (eaten / total) * 100 : meal.logged ? 100 : 0;
                                            return (
                                                <RingProgress
                                                    value={pct}
                                                    size={34}
                                                    strokeWidth={3}
                                                    className="shrink-0"
                                                >
                                                    {pct >= 100 ? (
                                                        <Check className="size-3.5 text-primary" strokeWidth={3} />
                                                    ) : pct > 0 ? (
                                                        <span className="text-[9px] font-bold text-primary">
                                                            {eaten}/{total}
                                                        </span>
                                                    ) : (
                                                        <Plus className="size-3.5 text-muted-foreground" />
                                                    )}
                                                </RingProgress>
                                            );
                                        })()}
                                    </button>
                                ))}
                            </div>
                        )}

                        <Button asChild className="h-11 w-full rounded-xl font-semibold">
                            <Link href="/app/nutrition/log">
                                <Plus className="mr-1.5 size-4" /> Log food
                            </Link>
                        </Button>

                        {/* Water */}
                        <div className="flex items-center gap-3 border-t border-border pt-4">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-500">
                                <Droplets className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between text-sm">
                                    <span className="font-medium">Water</span>
                                    <span className="text-muted-foreground">
                                        {(water.amount_ml / 1000).toFixed(1)} / {(waterTarget / 1000).toFixed(1)} L
                                    </span>
                                </div>
                                <Progress value={waterPct} className="mt-1.5 h-1.5 [&>div]:bg-sky-500" />
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold"
                                onClick={() => setWaterOpen(true)}
                            >
                                + Add
                            </Button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Water log dialog */}
            <Dialog open={waterOpen} onOpenChange={setWaterOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log water</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-2">
                        {[250, 500, 750].map((ml) => (
                            <Button
                                key={ml}
                                variant="outline"
                                className="h-12 rounded-xl font-semibold"
                                onClick={() => logWater(ml)}
                            >
                                {ml} ml
                            </Button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="custom-water">Custom amount (ml)</Label>
                        <Input
                            id="custom-water"
                            inputMode="numeric"
                            placeholder="e.g. 330"
                            value={customWater}
                            onChange={(e) => setCustomWater(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full sm:w-auto"
                            disabled={!customWater || Number(customWater) < 50}
                            onClick={() => logWater(Number(customWater))}
                        >
                            Add {customWater ? `${customWater} ml` : 'water'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Plan-meal confirm dialog */}
            <PlanMealConfirm meal={confirmMeal} onClose={() => setConfirmMeal(null)} />
        </>
    );
}
