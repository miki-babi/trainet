import { Head, router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const STEPS = ['About you', 'Training', 'Nutrition & health', 'Goals & consent'];

const EQUIPMENT = ['barbell', 'dumbbell', 'kettlebell', 'bands', 'bench', 'rack', 'machines', 'cardio'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DIET = ['vegetarian', 'vegan', 'high-protein', 'low-carb', 'halal', 'kosher', 'gluten-free'];

type Props = {
    profile: {
        height_cm: number | null;
        birth_year: number | null;
        experience_level: string | null;
        equipment: string[] | null;
        training_days: number[] | null;
        dietary_preferences: string[] | null;
        allergies: string | null;
        injuries: string | null;
        goals_summary: string | null;
    };
};

export default function Onboarding({ profile }: Props) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        height_cm: profile.height_cm ?? '',
        birth_year: profile.birth_year ?? '',
        experience_level: profile.experience_level ?? 'beginner',
        equipment: profile.equipment ?? [],
        training_days: profile.training_days ?? [1, 3, 5],
        dietary_preferences: profile.dietary_preferences ?? [],
        allergies: profile.allergies ?? '',
        injuries: profile.injuries ?? '',
        goals_summary: profile.goals_summary ?? '',
        consent: false,
    });

    const toggle = (key: 'equipment' | 'training_days' | 'dietary_preferences', value: string | number) => {
        const list = form[key] as (string | number)[];
        setForm({
            ...form,
            [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
        });
    };

    const chip = (active: boolean) =>
        cn(
            'rounded-full border px-3 py-1.5 text-sm transition-colors capitalize',
            active
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted-foreground hover:border-primary/50',
        );

    const save = (finish: boolean) => {
        router.put('/app/onboarding', { ...form, consent: form.consent, finish });
    };

    return (
        <>
            <Head title="Get started" />
            <div className="mx-auto max-w-lg space-y-6 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Welcome to Trainet</h1>
                    <p className="text-sm text-muted-foreground">
                        A few details so your coach can build your plan.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                                    i < step
                                        ? 'bg-success text-success'
                                        : i === step
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {i < step ? <Check className="size-3.5" /> : i + 1}
                            </span>
                            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
                        </div>
                    ))}
                </div>

                <Card>
                    <CardContent className="space-y-5">
                        <h2 className="font-semibold">{STEPS[step]}</h2>

                        {step === 0 && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Height (cm)</Label>
                                        <Input
                                            type="number"
                                            value={form.height_cm}
                                            onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                                            placeholder="170"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Birth year</Label>
                                        <Input
                                            type="number"
                                            value={form.birth_year}
                                            onChange={(e) => setForm({ ...form, birth_year: e.target.value })}
                                            placeholder="1990"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Training experience</Label>
                                    <div className="flex gap-2">
                                        {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                                            <button
                                                key={l}
                                                type="button"
                                                className={chip(form.experience_level === l)}
                                                onClick={() => setForm({ ...form, experience_level: l })}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <div className="space-y-2">
                                    <Label>Equipment you can access</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {EQUIPMENT.map((e) => (
                                            <button
                                                key={e}
                                                type="button"
                                                className={chip(form.equipment.includes(e))}
                                                onClick={() => toggle('equipment', e)}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Days you can train</Label>
                                    <div className="flex gap-2">
                                        {WEEKDAYS.map((d, i) => (
                                            <button
                                                key={d}
                                                type="button"
                                                className={chip(form.training_days.includes(i + 1))}
                                                onClick={() => toggle('training_days', i + 1)}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="space-y-2">
                                    <Label>Dietary preferences</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DIET.map((d) => (
                                            <button
                                                key={d}
                                                type="button"
                                                className={chip(form.dietary_preferences.includes(d))}
                                                onClick={() => toggle('dietary_preferences', d)}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Allergies</Label>
                                    <Input
                                        value={form.allergies}
                                        onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                                        placeholder="e.g. peanuts, lactose"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Injuries / movement limitations</Label>
                                    <Input
                                        value={form.injuries}
                                        onChange={(e) => setForm({ ...form, injuries: e.target.value })}
                                        placeholder="e.g. left knee, lower back"
                                    />
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div className="space-y-2">
                                    <Label>What do you want to achieve?</Label>
                                    <Textarea
                                        value={form.goals_summary}
                                        onChange={(e) => setForm({ ...form, goals_summary: e.target.value })}
                                        placeholder="e.g. Lose 5 kg by summer, get stronger for climbing…"
                                        className="min-h-24"
                                    />
                                </div>
                                <label className="flex items-start gap-3 rounded-lg border p-3">
                                    <Checkbox
                                        checked={form.consent}
                                        onCheckedChange={(c) => setForm({ ...form, consent: !!c })}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        I consent to sharing my health and training data with my coach
                                        so they can build and adjust my plan.
                                    </span>
                                </label>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    {step > 0 && (
                        <Button variant="outline" onClick={() => setStep(step - 1)}>
                            Back
                        </Button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <Button className="flex-1" onClick={() => { save(false); setStep(step + 1); }}>
                            Continue
                        </Button>
                    ) : (
                        <Button className="flex-1" disabled={!form.consent} onClick={() => save(true)}>
                            Finish setup
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
