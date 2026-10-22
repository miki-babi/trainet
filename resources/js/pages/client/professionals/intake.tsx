import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ClipboardList, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { mediaUrl } from '@/lib/media';

type Professional = {
    id: number;
    name: string;
    avatar: string | null;
    type: string;
    business_name: string | null;
};

type Package = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
};

type Props = {
    professional: Professional;
    package: Package;
};

const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'High protein',
    'Halal',
    'Gluten-free',
    'Dairy-free',
    'Low carb',
    'No restrictions',
];

export default function MealPlanIntake({ professional: pro, package: pkg }: Props) {
    const getInitials = useInitials();
    const [goal, setGoal] = useState('');
    const [weight, setWeight] = useState('');
    const [prefs, setPrefs] = useState<string[]>([]);
    const [allergies, setAllergies] = useState('');
    const [avoid, setAvoid] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const toggle = (opt: string) =>
        setPrefs((cur) =>
            cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt],
        );

    const submit = () => {
        setProcessing(true);
        router.post(`/app/professionals/${pro.id}/packages/${pkg.id}`, {
            intake: {
                goal,
                current_weight_kg: weight || null,
                dietary_preferences: prefs,
                allergies: allergies || null,
                avoid: avoid || null,
                notes: notes || null,
            },
        });
    };

    return (
        <>
            <Head title={`${pkg.name} — intake`} />
            <div className="space-y-6 py-5">
                <Link
                    href={`/app/professionals/${pro.id}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="size-4" /> {pro.name}
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tell us about you</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {pro.name} uses this to build your personalized meal plan.
                    </p>
                </div>

                {/* Order summary */}
                <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                    {pkg.image_url ? (
                        <img
                            src={mediaUrl(pkg.image_url) ?? undefined}
                            alt={pkg.name}
                            className="size-14 shrink-0 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-semibold text-primary">
                            {pro.avatar ? (
                                <img
                                    src={mediaUrl(pro.avatar) ?? undefined}
                                    alt={pro.name}
                                    className="size-14 rounded-xl object-cover"
                                />
                            ) : (
                                getInitials(pro.name)
                            )}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Personalized meal plan · ${(pkg.price / 100).toLocaleString()} one-time
                        </p>
                    </div>
                </div>

                <div className="space-y-5 rounded-2xl bg-card p-4 ring-1 ring-border">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="size-4 text-primary" />
                        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Intake form
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            What's your goal? <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g. Lose 5kg by summer while keeping energy for evening workouts…"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Current weight (kg)</label>
                        <Input
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            inputMode="decimal"
                            placeholder="e.g. 78"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Dietary preferences</label>
                        <div className="flex flex-wrap gap-2">
                            {dietaryOptions.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggle(opt)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                                        prefs.includes(opt)
                                            ? 'bg-primary text-primary-foreground ring-primary'
                                            : 'bg-card text-muted-foreground ring-border hover:text-foreground'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Allergies / intolerances</label>
                        <Input
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="e.g. Peanuts, shellfish…"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Foods you'd rather avoid</label>
                        <Input
                            value={avoid}
                            onChange={(e) => setAvoid(e.target.value)}
                            placeholder="e.g. Mushrooms, cilantro…"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Anything else?</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Schedule, household size, cooking time…"
                            rows={2}
                        />
                    </div>
                </div>

                <Button
                    className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/30"
                    disabled={!goal.trim() || processing}
                    onClick={submit}
                >
                    <Send className="mr-2 size-4" /> Send & order — ${(pkg.price / 100).toLocaleString()}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    Demo checkout — {pro.name} will be notified once your order is in.
                </p>
            </div>
        </>
    );
}
