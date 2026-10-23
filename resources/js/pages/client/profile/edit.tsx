import { Head, Link, router } from '@inertiajs/react';
import {
    Apple,
    CalendarDays,
    ClipboardCheck,
    History,
    MessagesSquare,
    Save,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip } from '@/components/trainet/status-chip';
import { ListRow } from '@/components/trainet/list-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { WorkoutSession } from '@/types';

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
    recent: WorkoutSession[];
};

export default function ProfileEdit({ profile, recent }: Props) {
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
                    <h1 className="text-[1.75rem] font-bold tracking-tight">Profile</h1>
                    <div className="flex items-center gap-3">
                        <SaveIndicator state={saveState} />
                        <Button onClick={save} size="sm">
                            <Save className="mr-1 size-4" /> Save
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { title: 'Nutrition', href: '/app/nutrition', icon: Apple },
                        { title: 'Messages', href: '/app/messages', icon: MessagesSquare },
                        { title: 'Check-ins', href: '/app/check-ins', icon: ClipboardCheck },
                        { title: 'Appointments', href: '/app/appointments', icon: CalendarDays },
                        { title: 'Habits', href: '/app/habits', icon: Sparkles },
                        { title: 'History', href: '/app/history', icon: History },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1.5 rounded-2xl bg-card py-3.5 text-xs font-medium ring-1 ring-border transition-colors hover:ring-primary/50"
                        >
                            <item.icon className="size-5 text-primary" />
                            {item.title}
                        </Link>
                    ))}
                </div>

                <SectionCard
                    title="Recent sessions"
                    action={
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/app/history">All history</Link>
                        </Button>
                    }
                >
                    {recent.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No completed sessions yet — your first one is coming.
                        </p>
                    ) : (
                        <div >
                            {recent.map((s) => (
                                <ListRow
                                    key={s.id}
                                    title={s.training_day?.title ?? 'Workout'}
                                    subtitle={new Date(s.scheduled_for + 'T00:00:00').toLocaleDateString('en-GB', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                    })}
                                    trailing={<StatusChip tone="success">Done</StatusChip>}
                                    href={`/app/workouts/${s.id}`}
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard label="Account">
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

                <SectionCard label="Body & training">
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

                <SectionCard label="Goals & health">
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
