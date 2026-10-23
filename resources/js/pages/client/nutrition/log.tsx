import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Camera, Check, Plus, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { goBack } from '@/lib/back';
import { useTelegramMainButton } from '@/hooks/use-telegram';
import { cn } from '@/lib/utils';

type FoodPortion = { id: number; label: string; grams: number };
type Food = {
    id: number;
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    category: { name: string } | null;
    portions: FoodPortion[];
};

type CartItem = { food: Food; grams: number };

type Props = {
    mealName: string;
    date: string;
    foods: Food[];
};

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

function defaultMeal(): string {
    const h = new Date().getHours();
    if (h < 11) {
        return 'Breakfast';
    }
    if (h < 15) {
        return 'Lunch';
    }
    if (h < 21) {
        return 'Dinner';
    }
    return 'Snack';
}

export default function NutritionLog({ mealName, date, foods }: Props) {
    const [meal, setMeal] = useState(MEAL_OPTIONS.includes(mealName) ? mealName : defaultMeal());
    const [mode, setMode] = useState<'photo' | 'search'>('photo');
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const pick = (file: File | undefined) => {
        if (!file) {
            return;
        }
        setPhoto(file);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const submitPhoto = () => {
        router.post(
            '/app/nutrition/log',
            { meal_name: meal, logged_on: date, photo, notes: notes || null } as never,
            { forceFormData: true },
        );
    };

    const submitSearch = () => {
        router.post('/app/nutrition/log', {
            meal_name: meal,
            logged_on: date,
            items: cart.map((c) => ({ food_id: c.food.id, grams: c.grams })),
        });
    };

    useTelegramMainButton({
        text: mode === 'photo' ? `LOG ${meal.toUpperCase()}` : `LOG ${cart.length} ITEM${cart.length === 1 ? '' : 'S'}`,
        onClick: mode === 'photo' ? submitPhoto : submitSearch,
        disabled: mode === 'photo' ? !photo : cart.length === 0,
    });

    const results = useMemo(() => {
        const q = query.toLowerCase();
        return q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods;
    }, [foods, query]);

    const cartTotals = cart.reduce(
        (acc, c) => ({
            calories: acc.calories + (c.food.calories * c.grams) / 100,
            protein: acc.protein + (c.food.protein_g * c.grams) / 100,
        }),
        { calories: 0, protein: 0 },
    );

    return (
        <>
            <Head title="Log a meal" />
            <div className="space-y-4 py-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => goBack('/app/nutrition')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">Log a meal</h1>
                        <p className="text-xs text-muted-foreground">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                {/* Meal selector */}
                <div className="flex gap-2">
                    {MEAL_OPTIONS.map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMeal(m)}
                            className={cn(
                                'flex-1 rounded-full border py-2 text-sm font-medium transition-colors',
                                meal === m
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:border-primary/50',
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Mode toggle */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                    <button
                        type="button"
                        onClick={() => setMode('photo')}
                        className={cn(
                            'flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors',
                            mode === 'photo' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                        )}
                    >
                        <Camera className="size-4" /> Photo
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('search')}
                        className={cn(
                            'flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors',
                            mode === 'search' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                        )}
                    >
                        <Search className="size-4" /> Search
                    </button>
                </div>

                {mode === 'photo' && (
                    <div className="space-y-4">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => pick(e.target.files?.[0])}
                        />
                        {preview ? (
                            <div className="relative">
                                <img
                                    src={preview}
                                    alt="Meal"
                                    className="max-h-80 w-full rounded-xl border object-cover"
                                />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setPhoto(null);
                                        setPreview(null);
                                        if (fileRef.current) {
                                            fileRef.current.value = '';
                                        }
                                    }}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                            >
                                <Camera className="size-10" />
                                <span className="font-medium">Tap to photograph your meal</span>
                                <span className="text-xs">or pick a photo from your gallery</span>
                            </button>
                        )}

                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional — what is it? (e.g. 'poke bowl with extra salmon')"
                        />

                        <Button
                            className="h-13 w-full text-base"
                            disabled={!photo}
                            onClick={submitPhoto}
                        >
                            <Check className="mr-1" /> Log {meal}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            Just a pic and a tap — your coach reviews photos against your plan.
                        </p>
                    </div>
                )}

                {mode === 'search' && (
                    <div className="space-y-4">
                        {cart.length > 0 && (
                            <Card className="border-primary/30">
                                <CardContent className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                        Adding to {meal}
                                    </p>
                                    {cart.map((item, i) => (
                                        <div key={`${item.food.id}-${i}`} className="flex items-center gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{item.food.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {Math.round((item.food.calories * item.grams) / 100)} kcal
                                                </p>
                                            </div>
                                            <Input
                                                type="number"
                                                value={item.grams}
                                                onChange={(e) => {
                                                    const next = [...cart];
                                                    next[i].grams = Number(e.target.value);
                                                    setCart(next);
                                                }}
                                                className="h-9 w-20 text-center"
                                            />
                                            <span className="text-xs text-muted-foreground">g</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                onClick={() => setCart(cart.filter((_, j) => j !== i))}
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between border-t pt-2 text-sm">
                                        <span className="text-muted-foreground">
                                            {Math.round(cartTotals.calories)} kcal · P{Math.round(cartTotals.protein)}g
                                        </span>
                                        <Button size="sm" onClick={submitSearch}>
                                            <Check className="mr-1 size-4" /> Log {cart.length} item{cart.length > 1 ? 's' : ''}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="relative">
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search foods…"
                                className="pl-9"
                            />
                        </div>

                        <ScrollArea className="h-[50vh]">
                            <div className="space-y-0.5 pr-2">
                                {results.map((food) => (
                                    <button
                                        key={food.id}
                                        type="button"
                                        onClick={() =>
                                            setCart([...cart, { food, grams: food.portions[0]?.grams ?? 100 }])
                                        }
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{food.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {food.calories} kcal/100g
                                                {food.category ? ` · ${food.category.name}` : ''}
                                            </p>
                                        </div>
                                        {food.portions.length > 0 && (
                                            <Badge variant="outline" className="shrink-0 text-xs">
                                                {food.portions[0].label}
                                            </Badge>
                                        )}
                                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                                    </button>
                                ))}
                                {results.length === 0 && (
                                    <p className="py-10 text-center text-sm text-muted-foreground">
                                        No foods match “{query}”.
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </>
    );
}
