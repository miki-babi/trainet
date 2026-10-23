import { Head, Link, router } from '@inertiajs/react';
import { Apple, Camera, Check, ChevronLeft, ChevronRight, Droplets, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import type { FoodDetailData } from '@/components/trainet/food-detail';
import { PlanMealConfirm } from '@/components/trainet/plan-meal-confirm';
import { RingProgress } from '@/components/trainet/ring-progress';
import { mediaUrl } from '@/lib/media';
import { haptics } from '@/lib/telegram';
import { SectionCard } from '@/components/trainet/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { NutritionTargets } from '@/types';

type PlanItem = {
    id: number;
    quantity: number;
    notes: string | null;
    food: FoodDetailData | null;
    recipe: { name: string } | null;
    portion: { label: string; grams: number } | null;
};

type PlanMeal = {
    id: number;
    name: string;
    time_hint: string | null;
    image_url: string | null;
    items: PlanItem[];
    logged_item_ids?: number[];
};

type LogItem = {
    id: number;
    grams: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    food: { id: number; name: string } | null;
    portion: { label: string } | null;
};

type FoodLogEntry = { id: number; meal_name: string | null; photo_path: string | null; notes: string | null; items: LogItem[] };

type Props = {
    date: string;
    targets: NutritionTargets | null;
    totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    logs: FoodLogEntry[];
    planDay: { title: string; meals: PlanMeal[] } | null;
    water: { amount_ml: number; target_ml: number };
};

type Tab = 'meals' | 'log' | 'goals';

const TABS: { value: Tab; label: string }[] = [
    { value: 'meals', label: 'Meals' },
    { value: 'log', label: 'Log' },
    { value: 'goals', label: 'Goals' },
];

export default function NutritionIndex({ date, targets, totals, logs, planDay, water }: Props) {
    const [tab, setTab] = useState<Tab>('meals');
    const [confirmMeal, setConfirmMeal] = useState<PlanMeal | null>(null);
    const isToday = date === new Date().toISOString().slice(0, 10);
    const shift = (days: number) => {
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() + days);
        router.get('/app/nutrition', { date: d.toISOString().slice(0, 10) }, { preserveState: true });
    };

    const macros: { label: string; value: number; target: number | null | undefined }[] = [
        { label: 'Protein', value: totals.protein_g, target: targets?.protein_g },
        { label: 'Carbs', value: totals.carbs_g, target: targets?.carbs_g },
        { label: 'Fat', value: totals.fat_g, target: targets?.fat_g },
    ];
    const calorieTarget = targets?.calories ?? 0;
    const caloriesLeft = calorieTarget - totals.calories;

    const remove = (itemId: number) =>
        router.delete(`/app/nutrition/items/${itemId}`, { preserveScroll: true });

    const removeLog = (logId: number) =>
        router.delete(`/app/nutrition/logs/${logId}`, { preserveScroll: true });

    return (
        <>
            <Head title="Nutrition" />
            <div className="space-y-5 py-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-[1.75rem] font-bold tracking-tight">Nutrition</h1>
                    <Link
                        href="/app/nutrition/plan"
                        className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                        Details
                    </Link>
                </div>

                {/* Primary CTA — one tap to log */}
                <Button size="lg" className="h-14 w-full rounded-2xl text-base font-semibold" asChild>
                    <Link href={`/app/nutrition/log?date=${date}`}>
                        <Camera className="mr-2 size-5" />
                        Log food
                        <span className="ml-2 text-xs font-normal text-primary-foreground/70">
                            snap a photo — 5 seconds
                        </span>
                    </Link>
                </Button>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            {/* Left — title + big ring */}
                            <div className="shrink-0">
                                <p className="text-lg font-bold">Daily calories</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {caloriesLeft >= 0
                                        ? `${caloriesLeft.toLocaleString()} kcal left of ${calorieTarget ? calorieTarget.toLocaleString() : '—'}`
                                        : `${Math.abs(caloriesLeft).toLocaleString()} kcal over ${calorieTarget.toLocaleString()}`}
                                </p>
                                <RingProgress
                                    value={calorieTarget ? (totals.calories / calorieTarget) * 100 : 0}
                                    size={110}
                                    strokeWidth={11}
                                    className="mt-3"
                                >
                                    <p className="text-2xl font-bold tabular-nums">
                                        {totals.calories.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                        kcal
                                    </p>
                                </RingProgress>
                            </div>
                            {/* Right — macro tiles */}
                            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 self-stretch">
                                {macros.map((m) => (
                                    <div
                                        key={m.label}
                                        className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 px-2 py-3 text-center"
                                    >
                                        <p className="text-xs font-medium">{m.label}</p>
                                        <RingProgress
                                            value={m.target ? (m.value / m.target) * 100 : 0}
                                            size={56}
                                            strokeWidth={6}
                                            className="mt-2"
                                        >
                                            <span className="text-xs font-bold tabular-nums">
                                                {Math.round(m.value)}g
                                            </span>
                                        </RingProgress>
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                            / {m.target ?? '—'}g
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>

                    {tab === 'meals' && planDay && (
                        <div className="space-y-3 border-t px-5 py-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    On your plan — {planDay.title}
                                </p>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/app/nutrition/plan">Full plan</Link>
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {planDay.meals.map((meal) => {
                                    const logged = logs.find((l) => l.meal_name === meal.name);
                                    const itemCount = meal.items.length;
                                    const eatenCount = logged
                                        ? (meal.logged_item_ids?.length ?? 0) || itemCount
                                        : 0;
                                    const eatenPct = itemCount
                                        ? (eatenCount / itemCount) * 100
                                        : logged ? 100 : 0;
                                    const kcal = meal.items.reduce(
                                        (s, i) => s + (i.food ? Math.round((i.food.calories * (i.portion ? i.portion.grams * i.quantity : i.quantity * 100)) / 100) : 0),
                                        0,
                                    );
                                    return (
                                        <div key={meal.id} className="flex items-center gap-3">
                                            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                                                {meal.image_url ? (
                                                    <img
                                                        src={mediaUrl(meal.image_url) ?? ''}
                                                        alt={meal.name}
                                                        className="size-12 object-cover"
                                                    />
                                                ) : (
                                                    <UtensilsCrossed className="size-5" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {meal.name}
                                                    {meal.time_hint && (
                                                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                            {meal.time_hint}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {meal.items.length} item{meal.items.length === 1 ? '' : 's'}
                                                    {kcal > 0 && ` · ${kcal} kcal`}
                                                </p>
                                            </div>
                                            {logged ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmMeal(meal)}
                                                    className="shrink-0 transition-transform hover:scale-105"
                                                    aria-label={`Edit ${meal.name}`}
                                                >
                                                    <RingProgress value={eatenPct} size={38} strokeWidth={3.5}>
                                                        {eatenPct >= 100 ? (
                                                            <Check className="size-4 text-primary" strokeWidth={3} />
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-primary">
                                                                {eatenCount}/{itemCount}
                                                            </span>
                                                        )}
                                                    </RingProgress>
                                                </button>
                                            ) : (
                                                <div className="flex shrink-0 gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 rounded-full px-3 text-xs font-semibold"
                                                        onClick={() => setConfirmMeal(meal)}
                                                    >
                                                        <Check className="mr-1 size-3.5" /> Ate it
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Meals / Log / Goals tabs — Telegram segmented control */}
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                                haptics.selection();
                                setTab(t.value);
                            }}
                            className={cn(
                                'flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors',
                                tab === t.value
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'goals' && (
                    <SectionCard label="Daily targets">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Calories</span>
                                <span className="text-muted-foreground">{targets?.calories ?? '—'} kcal</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Protein</span>
                                <span className="text-muted-foreground">{targets?.protein_g ?? '—'} g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Carbs</span>
                                <span className="text-muted-foreground">{targets?.carbs_g ?? '—'} g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Fat</span>
                                <span className="text-muted-foreground">{targets?.fat_g ?? '—'} g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Water</span>
                                <span className="text-muted-foreground">{(water.target_ml / 1000).toFixed(1)} L</span>
                            </div>
                            {!targets && (
                                <p className="text-xs text-muted-foreground">
                                    No targets set yet — your coach can assign them.
                                </p>
                            )}
                        </div>
                    </SectionCard>
                )}

                {tab !== 'goals' && (
                <SectionCard
                    label="Water"
                    action={
                        <Badge
                            variant="secondary"
                            className={water.amount_ml >= water.target_ml ? 'bg-primary/15 text-primary' : undefined}
                        >
                            {(water.amount_ml / 1000).toFixed(2)} / {(water.target_ml / 1000).toFixed(1)} L
                            {water.amount_ml >= water.target_ml && ' · goal hit'}
                        </Badge>
                    }
                >
                    <div className="mb-3 space-y-1.5">
                        <Progress
                            value={Math.min(100, (water.amount_ml / water.target_ml) * 100)}
                        />
                        {water.amount_ml > water.target_ml && (
                            <p className="text-xs text-primary">
                                +{water.amount_ml - water.target_ml} ml over your goal
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {[250, 500].map((ml) => (
                            <Button
                                key={ml}
                                variant="outline"
                                className="flex-1"
                                disabled={!isToday}
                                onClick={() => router.post('/app/water', { amount_ml: ml }, { preserveScroll: true })}
                            >
                                <Droplets className="mr-1 size-4 text-info" /> +{ml} ml
                            </Button>
                        ))}
                    </div>
                </SectionCard>
                )}

                {tab === 'meals' && !planDay && (
                    <SectionCard label="Your plan">
                        <EmptyState
                            icon={UtensilsCrossed}
                            title="No meal plan"
                            description="Your coach hasn't published a meal plan for today."
                        />
                    </SectionCard>
                )}

                {tab === 'log' && (
                <SectionCard
                    label="Food diary"
                    action={
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => shift(-1)}>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="w-24 text-center text-sm font-medium">
                                {isToday ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <Button variant="ghost" size="icon" className="size-7" disabled={isToday} onClick={() => shift(1)}>
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    }
                >
                    {logs.length === 0 || logs.every((l) => l.items.length === 0 && !l.photo_path) ? (
                        <EmptyState
                            icon={Apple}
                            title="Nothing logged"
                            description={isToday ? "Log your first meal of the day." : "No meals logged on this day."}
                        />
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                (log.items.length > 0 || log.photo_path) && (
                                    <div key={log.id}>
                                        <div className="mb-1 flex items-center justify-between">
                                            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                {log.meal_name ?? 'Meal'}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeLog(log.id)}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                        {log.photo_path && (
                                            <div className="mb-2">
                                                <img
                                                    src={`/storage/${log.photo_path}`}
                                                    alt={log.meal_name ?? 'Meal'}
                                                    className="max-h-56 w-full rounded-lg border object-cover"
                                                />
                                                {log.notes && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {log.notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        <div className="divide-y rounded-lg border">
                                            {log.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm">{item.food?.name ?? 'Item'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.grams}g · {item.calories} kcal · P{item.protein_g} C{item.carbs_g} F{item.fat_g}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => remove(item.id)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </SectionCard>
                )}
            </div>

            {/* Floating log-food action */}
            <Link
                href={`/app/nutrition/log?date=${date}`}
                aria-label="Log food"
                className="fixed right-5 bottom-24 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 md:bottom-8"
            >
                <Camera className="size-6" />
            </Link>

            {/* Plan-meal confirm dialog */}
            <PlanMealConfirm
                meal={
                    confirmMeal
                        ? {
                              id: confirmMeal.id,
                              name: confirmMeal.name,
                              items: confirmMeal.items.map((i) => ({
                                  id: i.id,
                                  name: i.food?.name ?? i.recipe?.name ?? 'Item',
                                  portion: `${i.quantity} × ${i.portion?.label ?? '100 g'}`,
                                  kcal: i.food
                                      ? Math.round((i.food.calories * (i.portion ? i.portion.grams * i.quantity : i.quantity * 100)) / 100)
                                      : null,
                                  food: i.food,
                              })),
                              logged_item_ids: confirmMeal.logged_item_ids,
                          }
                        : null
                }
                date={date}
                onClose={() => setConfirmMeal(null)}
            />

        </>
    );
}
