import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Plus, Send, Trash2, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { StatusChip } from '@/components/trainet/status-chip';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Portion = { id: number; label: string; grams: number };
type Food = {
    id: number;
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    portions: Portion[];
};
type Item = {
    id: number;
    quantity: number;
    notes: string | null;
    food: Food;
    portion: Portion | null;
};
type Meal = { id: number; name: string; time_hint: string | null; items: Item[] };
type Version = {
    id: number;
    version_number: number;
    status: string;
    published_at: string | null;
    days: { id: number; title: string; meals: Meal[] }[];
};

type Props = {
    plan: { id: number; name: string; description: string | null };
    version: Version;
    versions: { id: number; version_number: number; status: string }[];
    foods: Food[];
    clients: { id: number; name: string }[];
};

export default function NutritionPlanEdit({ plan, version, versions, foods, clients }: Props) {
    const isDraft = version.status === 'draft';
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();
    const [mealDialogDay, setMealDialogDay] = useState<number | null>(null);
    const [itemMeal, setItemMeal] = useState<Meal | null>(null);
    const [assignOpen, setAssignOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [mealName, setMealName] = useState('');
    const [mealTime, setMealTime] = useState('');
    const [assign, setAssign] = useState({
        client_id: '',
        starts_on: new Date().toISOString().slice(0, 10),
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        water_ml: '',
    });

    const published = versions.find((v) => v.status === 'published');

    const act = (method: 'post' | 'put' | 'delete', url: string, data: Parameters<typeof router.post>[1] & object = {}) => {
        markSaving();
        if (method === 'delete') {
            router.delete(url, { preserveScroll: true, onSuccess: markSaved, onError: markError });
        } else {
            router[method](url, data, { preserveScroll: true, onSuccess: markSaved, onError: markError });
        }
    };

    const filteredFoods = useMemo(
        () => foods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
        [foods, query],
    );

    const day = version.days?.[0];
    const mealKcal = (meal: Meal) =>
        Math.round(
            meal.items.reduce((sum, i) => {
                const grams = i.portion ? i.portion.grams * i.quantity : i.quantity * 100;
                return sum + (i.food.calories * grams) / 100;
            }, 0),
        );
    const totalKcal = day?.meals.reduce((s, m) => s + mealKcal(m), 0) ?? 0;

    return (
        <>
            <Head title={`${plan.name} — nutrition builder`} />
            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/pro/nutrition">
                            <ArrowLeft className="mr-1" /> Plans
                        </Link>
                    </Button>
                    <SaveIndicator state={saveState} />
                    <div className="ml-auto flex items-center gap-2">
                        {isDraft && (
                            <Button size="sm" onClick={() => act('post', `/pro/nutrition-plans/${plan.id}/publish`)}>
                                <CheckCircle2 className="mr-1 size-4" /> Publish
                            </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
                            <Send className="mr-1 size-4" /> Assign
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{plan.name}</h1>
                    <StatusChip tone={isDraft ? 'warning' : 'success'}>
                        v{version.version_number} · {version.status}
                    </StatusChip>
                    <span className="ml-auto text-sm text-muted-foreground">
                        ≈ {totalKcal} kcal/day
                    </span>
                </div>

                {day?.meals.map((meal) => (
                    <Card key={meal.id}>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UtensilsCrossed className="size-4 text-primary" />
                                    <span className="font-medium">{meal.name}</span>
                                    {meal.time_hint && (
                                        <Badge variant="outline">{meal.time_hint}</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {mealKcal(meal)} kcal
                                    </span>
                                </div>
                                {isDraft && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setItemMeal(meal);
                                            setQuery('');
                                        }}
                                    >
                                        <Plus className="mr-1 size-3.5" /> Add food
                                    </Button>
                                )}
                            </div>
                            <div className="divide-y rounded-lg border">
                                {meal.items.length === 0 && (
                                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                        No items yet.
                                    </p>
                                )}
                                {meal.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm">{item.food.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} × {item.portion?.label ?? '100 g'}
                                                {item.notes ? ` · ${item.notes}` : ''}
                                            </p>
                                        </div>
                                        {isDraft && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-muted-foreground hover:text-destructive"
                                                onClick={() => act('delete', `/pro/meal-items/${item.id}`)}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {isDraft && day && (
                    <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() => setMealDialogDay(day.id)}
                    >
                        <Plus className="mr-1" /> Add meal
                    </Button>
                )}

                {/* Add meal */}
                <Dialog open={!!mealDialogDay} onOpenChange={(o) => !o && setMealDialogDay(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add meal</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Post-workout" />
                            </div>
                            <div className="space-y-2">
                                <Label>Time hint</Label>
                                <Input value={mealTime} onChange={(e) => setMealTime(e.target.value)} placeholder="16:00" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => {
                                    act('post', `/pro/plan-days/${mealDialogDay}/meals`, { name: mealName, time_hint: mealTime });
                                    setMealDialogDay(null);
                                    setMealName('');
                                    setMealTime('');
                                }}
                                disabled={!mealName.trim()}
                            >
                                Add
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add food item */}
                <Dialog open={!!itemMeal} onOpenChange={(o) => !o && setItemMeal(null)}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add food to {itemMeal?.name}</DialogTitle>
                        </DialogHeader>
                        <Input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search foods…"
                        />
                        <ScrollArea className="h-64">
                            <div className="space-y-0.5 pr-2">
                                {filteredFoods.map((food) => (
                                    <button
                                        key={food.id}
                                        type="button"
                                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-accent"
                                        onClick={() => {
                                            act('post', `/pro/meals/${itemMeal!.id}/items`, {
                                                food_id: food.id,
                                                quantity: 1,
                                                food_portion_id: food.portions[0]?.id ?? null,
                                            });
                                        }}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{food.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {food.calories} kcal/100g
                                                {food.portions[0] ? ` · ${food.portions[0].label}` : ''}
                                            </p>
                                        </div>
                                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                {/* Assign */}
                <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Assign plan + set targets</DialogTitle>
                        </DialogHeader>
                        {!published ? (
                            <p className="text-sm text-muted-foreground">
                                Publish a version first — only published plans can be assigned.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Client</Label>
                                        <Select
                                            value={assign.client_id}
                                            onValueChange={(v) => setAssign({ ...assign, client_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select client" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Starts</Label>
                                        <Input
                                            type="date"
                                            value={assign.starts_on}
                                            onChange={(e) => setAssign({ ...assign, starts_on: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                    {([
                                        ['calories', 'kcal'],
                                        ['protein_g', 'Protein g'],
                                        ['carbs_g', 'Carbs g'],
                                        ['fat_g', 'Fat g'],
                                        ['water_ml', 'Water ml'],
                                    ] as const).map(([key, label]) => (
                                        <div key={key} className="space-y-1">
                                            <Label className="text-xs">{label}</Label>
                                            <Input
                                                type="number"
                                                value={assign[key]}
                                                onChange={(e) => setAssign({ ...assign, [key]: e.target.value })}
                                                className="h-9"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                disabled={!assign.client_id || !published}
                                onClick={() => {
                                    act('post', `/pro/nutrition-versions/${published!.id}/assign`, {
                                        client_id: Number(assign.client_id),
                                        starts_on: assign.starts_on,
                                        calories: assign.calories || null,
                                        protein_g: assign.protein_g || null,
                                        carbs_g: assign.carbs_g || null,
                                        fat_g: assign.fat_g || null,
                                        water_ml: assign.water_ml || null,
                                    });
                                    setAssignOpen(false);
                                }}
                            >
                                Assign v{published?.version_number}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
