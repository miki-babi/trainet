import { Head, router } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/trainet/page-header';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { SectionCard } from '@/components/trainet/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
        user: { name: string; email: string; timezone: string | null };
    };
};

export default function ProfileEdit({ profile }: Props) {
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();
    const [form, setForm] = useState({
        name: profile.user.name,
        timezone: profile.user.timezone ?? 'Europe/Berlin',
        height_cm: profile.height_cm ?? '',
        birth_year: profile.birth_year ?? '',
        training_days: profile.training_days ?? [],
        goals_summary: profile.goals_summary ?? '',
        allergies: profile.allergies ?? '',
        injuries: profile.injuries ?? '',
    });

    const toggleDay = (d: number) => {
        const days = form.training_days;
        setForm({ ...form, training_days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d] });
    };

    const save = () => {
        markSaving();
        router.put('/app/profile', form, {
            preserveScroll: true,
            onSuccess: markSaved,
            onError: markError,
        });
    };

    return (
        <>
            <Head title="Profile" />
            <div className="mx-auto max-w-2xl space-y-5 py-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                    <div className="flex items-center gap-3">
                        <SaveIndicator state={saveState} />
                        <Button onClick={save} size="sm">
                            <Save className="mr-1 size-4" /> Save
                        </Button>
                    </div>
                </div>

                <SectionCard title="Account">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={profile.user.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Input
                                value={form.timezone}
                                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                            />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Body & training">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Height (cm)</Label>
                            <Input
                                type="number"
                                value={form.height_cm}
                                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Birth year</Label>
                            <Input
                                type="number"
                                value={form.birth_year}
                                onChange={(e) => setForm({ ...form, birth_year: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Training days</Label>
                            <div className="flex gap-2">
                                {WEEKDAYS.map((d, i) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => toggleDay(i + 1)}
                                        className={cn(
                                            'flex-1 rounded-lg border py-2 text-sm transition-colors',
                                            form.training_days.includes(i + 1)
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Goals & health">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Goals</Label>
                            <Textarea
                                value={form.goals_summary}
                                onChange={(e) => setForm({ ...form, goals_summary: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Allergies</Label>
                                <Input
                                    value={form.allergies}
                                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Injuries</Label>
                                <Input
                                    value={form.injuries}
                                    onChange={(e) => setForm({ ...form, injuries: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
