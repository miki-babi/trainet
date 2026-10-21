import { Head, Link, router } from '@inertiajs/react';
import { Apple, Camera, ChevronLeft, ChevronRight, Droplets, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Meal, NutritionTargets } from '@/types';

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

type Props = {
    date: string;
    targets: NutritionTargets | null;
    totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    logs: { id: number; meal_name: string | null; photo_path: string | null; notes: string | null; items: LogItem[] }[];
    planDay: { title: string; meals: Meal[] } | null;
    water: { amount_ml: number; target_ml: number };
};

export default function NutritionIndex({ date, targets, totals, logs, planDay, water }: Props) {
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

    return (
        <>
            <Head title="Nutrition" />
            <div className="space-y-5 py-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="w-28 text-center text-sm font-medium">
                            {isToday ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <Button variant="ghost" size="icon" disabled={isToday} onClick={() => shift(1)}>
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
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

                <SectionCard title="Today vs targets">
                    <div className="space-y-4">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl font-bold">{totals.calories}</span>
                            <span className="text-muted-foreground">/ {targets?.calories ?? '—'} kcal</span>
                        </div>
                        <Progress value={targets?.calories ? Math.min(100, (totals.calories / targets.calories) * 100) : 0} />
                        <div className="grid gap-3">
                            {macro('Protein', totals.protein_g, targets?.protein_g)}
                            {macro('Carbs', totals.carbs_g, targets?.carbs_g)}
                            {macro('Fat', totals.fat_g, targets?.fat_g)}
                        </div>
                    </div>
                </SectionCard>

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

                {planDay && (
                    <SectionCard title={`Your plan — ${planDay.title}`}>
                        <div className="divide-y">
                            {planDay.meals.map((meal) => {
                                const logged = logs.find((l) => l.meal_name === meal.name);
                                return (
                                    <div key={meal.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <UtensilsCrossed className="size-4 text-primary" />
                                                <span className="text-sm font-medium">{meal.name}</span>
                                                {meal.time_hint && (
                                                    <span className="text-xs text-muted-foreground">{meal.time_hint}</span>
                                                )}
                                                {logged && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {logged.photo_path ? 'Photo' : 'Logged'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/app/nutrition/log?meal=${meal.name}&date=${date}`}>
                                                    <Plus className="size-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                        <p className="pl-6 text-xs text-muted-foreground">
                                            {meal.items?.map((i) => i.food?.name).filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                )}

                <SectionCard
                    title="Food diary"
                    action={
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/app/nutrition/log?date=${date}`}>
                                <Plus className="mr-1" /> Log food
                            </Link>
                        </Button>
                    }
                >
                    {logs.length === 0 || logs.every((l) => l.items.length === 0 && !l.photo_path) ? (
                        <EmptyState
                            icon={Apple}
                            title="Nothing logged"
                            description="Log your first meal of the day."
                        />
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                (log.items.length > 0 || log.photo_path) && (
                                    <div key={log.id}>
                                        <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            {log.meal_name ?? 'Meal'}
                                        </p>
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
            </div>
        </>
    );
}
