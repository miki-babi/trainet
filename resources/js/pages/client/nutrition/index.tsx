import { Head, Link, router } from '@inertiajs/react';
import { Apple, Camera, Check, ChevronLeft, ChevronRight, Droplets, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import { FoodDetail, type FoodDetailData } from '@/components/trainet/food-detail';
import { PlanMealConfirm } from '@/components/trainet/plan-meal-confirm';
import { RingProgress } from '@/components/trainet/ring-progress';
import { mediaUrl } from '@/lib/media';
import { SectionCard } from '@/components/trainet/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    const [detailFood, setDetailFood] = useState<FoodDetailData | null>(null);
    const isToday = date === new Date().toISOString().slice(0, 10);
    const shift = (days: number) => {
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() + days);
        router.get('/app/nutrition', { date: d.toISOString().slice(0, 10) }, { preserveState: true });
    };

    const macro = (label: string, value: number, target: number | null | undefined, unit = 'g') => (
        <div className="space-y-1.5" key={label}>
            <div className="flex justify-between text-xs">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                    {Math.round(value)}{unit} / {target ?? '—'}{unit}
                </span>
            </div>
            <Progress value={target ? Math.min(100, (value / target) * 100) : 0} />
        </div>
    );

    const remove = (itemId: number) =>
        router.delete(`/app/nutrition/items/${itemId}`, { preserveScroll: true });

    const removeLog = (logId: number) =>
        router.delete(`/app/nutrition/logs/${logId}`, { preserveScroll: true });

    return (
        <>
            <Head title="Nutrition" />
            <div className="space-y-5 py-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
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

                <SectionCard title="Today's energy">
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <RingProgress
                                value={
                                    targets?.calories
                                        ? Math.min(100, (totals.calories / targets.calories) * 100)
                                        : 0
                                }
                                size={170}
                                strokeWidth={12}
                            >
                                <div className="text-center">
                                    <p className="text-3xl font-bold tabular-nums">
                                        {Math.max(0, (targets?.calories ?? 0) - totals.calories).toLocaleString()}
                                    </p>
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        kcal left
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {totals.calories.toLocaleString()} / {targets?.calories ?? '—'} kcal
                                    </p>
                                </div>
                            </RingProgress>
                        </div>
                        <div className="grid gap-3">
                            {macro('Protein', totals.protein_g, targets?.protein_g)}
                            {macro('Carbs', totals.carbs_g, targets?.carbs_g)}
                            {macro('Fat', totals.fat_g, targets?.fat_g)}
                        </div>
                    </div>
                </SectionCard>

                {/* Meals / Log / Goals tabs */}
                <div className="grid grid-cols-3 gap-2">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setTab(t.value)}
                            className={cn(
                                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                tab === t.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'goals' && (
                    <SectionCard title="Daily targets">
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
                    title="Water"
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

                {tab === 'meals' && planDay && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">
                                {isToday ? "Today's meals" : 'Planned meals'} — {planDay.title}
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
                                    <div key={meal.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                                        <div className="flex items-center gap-3 p-3">
                                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                                                {meal.image_url ? (
                                                    <img
                                                        src={mediaUrl(meal.image_url) ?? ''}
                                                        alt={meal.name}
                                                        className="size-14 object-cover"
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
                                                    <RingProgress
                                                        value={eatenPct}
                                                        size={38}
                                                        strokeWidth={3.5}
                                                    >
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
                                                    <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs font-semibold" asChild>
                                                        <Link href={`/app/nutrition/log?meal=${encodeURIComponent(meal.name)}&date=${date}`}>
                                                            <Camera className="mr-1 size-3.5" /> Log
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {meal.items.length > 0 && (
                                            <div className="divide-y border-t">
                                                {meal.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                                                        <button
                                                            type="button"
                                                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                                            onClick={() => item.food && setDetailFood(item.food)}
                                                        >
                                                            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                                                                {item.food?.image_url ? (
                                                                    <img
                                                                        src={mediaUrl(item.food.image_url) ?? undefined}
                                                                        alt=""
                                                                        className="size-8 object-cover"
                                                                    />
                                                                ) : (
                                                                    <UtensilsCrossed className="size-3.5" />
                                                                )}
                                                            </span>
                                                            <span className="min-w-0 truncate">
                                                                {item.food?.name ?? item.recipe?.name ?? 'Item'}
                                                                <span className="text-xs text-muted-foreground">
                                                                    {' '}· {item.quantity} × {item.portion?.label ?? '100 g'}
                                                                </span>
                                                            </span>
                                                        </button>
                                                        <span className="shrink-0 text-xs text-muted-foreground">
                                                            {item.food
                                                                ? `${Math.round((item.food.calories * (item.portion ? item.portion.grams * item.quantity : item.quantity * 100)) / 100)} kcal`
                                                                : '—'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {tab === 'meals' && !planDay && (
                    <SectionCard title="Your plan">
                        <EmptyState
                            icon={UtensilsCrossed}
                            title="No meal plan"
                            description="Your coach hasn't published a meal plan for today."
                        />
                    </SectionCard>
                )}

                {tab === 'log' && (
                <SectionCard
                    title="Food diary"
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

            {/* Food detail dialog */}
            <FoodDetail food={detailFood} onClose={() => setDetailFood(null)} />
        </>
    );
}
