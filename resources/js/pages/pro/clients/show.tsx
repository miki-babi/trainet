import { Head, Link, router } from '@inertiajs/react';
import {
    Apple,
    CalendarDays,
    ClipboardCheck,
    Dumbbell,
    Lock,
    Send,
    TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { ListRow } from '@/components/trainet/list-row';
import { MetricChart } from '@/components/trainet/metric-chart';
import { PageHeader } from '@/components/trainet/page-header';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip, type StatusTone } from '@/components/trainet/status-chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';

type Props = {
    client: {
        id: number;
        goals_summary: string | null;
        experience_level: string | null;
        equipment: string[] | null;
        training_days: number[] | null;
        dietary_preferences: string[] | null;
        allergies: string | null;
        height_cm: number | null;
        onboarding_status: string;
        user: { id: number; name: string; email: string };
        tags: { id: number; name: string; color: string | null }[];
        professional_assignments: {
            id: number;
            relationship_type: string;
            status: string;
            professional: { id: number; name: string };
        }[];
        program_assignments: {
            id: number;
            starts_on: string;
            status: string;
            program_version: {
                version_number: number;
                program: { name: string };
                days: { id: number; title: string; is_rest_day: boolean }[];
            } | null;
        }[];
        notes: {
            id: number;
            body: string;
            created_at: string;
            author: { name: string };
        }[];
    };
    sessions: {
        id: number;
        scheduled_for: string;
        status: string;
        training_day: { title: string } | null;
    }[];
    metrics: Record<string, { date: string; value: number; unit: string }[]>;
    checkIns: {
        id: number;
        due_on: string;
        status: string;
        submitted_at: string | null;
    }[];
    appointments: {
        id: number;
        starts_at: string;
        status: string;
        type: { name: string };
        professional: { name: string };
    }[];
    nutritionTargets: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        water_ml: number | null;
    } | null;
    nutritionAssignment: {
        id: number;
        plan_version: {
            version_number: number;
            plan: { name: string };
            days: {
                id: number;
                meals: { id: number; name: string; time_hint: string | null }[];
            }[];
        } | null;
    } | null;
    photos: { id: number; url: string; taken_on: string; label: string | null }[];
    allTags: { id: number; name: string }[];
    workspace: { id: number; name: string };
};

const sessionTone: Record<string, StatusTone> = {
    completed: 'success',
    scheduled: 'neutral',
    skipped: 'danger',
    in_progress: 'info',
    paused: 'warning',
};

export default function ClientShow({
    client,
    sessions,
    metrics,
    checkIns,
    appointments,
    nutritionTargets,
    nutritionAssignment,
    photos,
    allTags,
}: Props) {
    const getInitials = useInitials();
    const [note, setNote] = useState('');
    const activeAssignment = client.program_assignments.find(
        (a) => a.status === 'active',
    );
    const meals =
        nutritionAssignment?.plan_version?.days?.[0]?.meals ?? [];

    const saveNote = () => {
        if (!note.trim()) {
            return;
        }
        router.post(
            `/pro/clients/${client.id}/notes`,
            { body: note },
            { preserveScroll: true, onSuccess: () => setNote('') },
        );
    };

    const setTag = (tagId: number) => {
        const current = client.tags.map((t) => t.id);
        const next = current.includes(tagId)
            ? current.filter((id) => id !== tagId)
            : [...current, tagId];
        router.post(
            `/pro/clients/${client.id}/tags`,
            { tag_ids: next },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={client.user.name} />
            <div className="space-y-6">
                <PageHeader
                    title={client.user.name}
                    description={client.user.email}
                    backHref="/pro/clients"
                    actions={
                        <Button variant="outline" asChild>
                            <Link href="/pro/messages">Message</Link>
                        </Button>
                    }
                />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {getInitials(client.user.name)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {client.tags.map((tag) => (
                            <Badge key={tag.id} variant="secondary">
                                {tag.name}
                            </Badge>
                        ))}
                        {allTags.map((tag) => (
                            <Button
                                key={tag.id}
                                variant="ghost"
                                size="sm"
                                className="h-7 border border-dashed"
                                onClick={() => setTag(tag.id)}
                            >
                                {client.tags.some((t) => t.id === tag.id)
                                    ? `− ${tag.name}`
                                    : `+ ${tag.name}`}
                            </Button>
                        ))}
                    </div>
                    <div className="ml-auto">
                        <Select
                            defaultValue={
                                client.professional_assignments[0]?.status ??
                                'active'
                            }
                            onValueChange={(status) =>
                                router.post(
                                    `/pro/clients/${client.id}/status`,
                                    { status },
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="ended">Ended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {client.allergies && (
                    <div className="flex items-center gap-2 rounded-lg border border-warning/50 bg-warning/10 px-4 py-2.5 text-sm">
                        <TriangleAlert className="size-4 text-warning" />
                        <span>
                            <strong>Allergy:</strong> {client.allergies}
                        </span>
                    </div>
                )}

                <Tabs defaultValue="overview">
                    <div className="-mx-4 overflow-x-auto px-4">
                        <TabsList className="w-max">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="training">Training</TabsTrigger>
                            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                            <TabsTrigger value="progress">Progress</TabsTrigger>
                            <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
                            <TabsTrigger value="appointments">
                                Appointments
                            </TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-4">
                        <div className="grid gap-5 md:grid-cols-2">
                            <SectionCard title="Profile">
                                <dl className="space-y-2.5 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Goals</dt>
                                        <dd className="max-w-60 text-right">
                                            {client.goals_summary ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Experience</dt>
                                        <dd className="capitalize">
                                            {client.experience_level ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Height</dt>
                                        <dd>{client.height_cm ? `${client.height_cm} cm` : '—'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Equipment</dt>
                                        <dd className="max-w-60 text-right capitalize">
                                            {client.equipment?.join(', ') ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Diet</dt>
                                        <dd className="max-w-60 text-right">
                                            {client.dietary_preferences?.join(', ') || '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </SectionCard>
                            <SectionCard title="Coaching team">
                                <div className="divide-y">
                                    {client.professional_assignments.map((a) => (
                                        <ListRow
                                            key={a.id}
                                            title={a.professional.name}
                                            subtitle={a.relationship_type}
                                            trailing={
                                                <StatusChip
                                                    tone={
                                                        a.status === 'active'
                                                            ? 'success'
                                                            : 'neutral'
                                                    }
                                                >
                                                    {a.status}
                                                </StatusChip>
                                            }
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                        </div>
                    </TabsContent>

                    <TabsContent value="training" className="mt-4">
                        <div className="grid gap-5 md:grid-cols-2">
                            <SectionCard
                                title="Current program"
                                action={
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href="/pro/programs">
                                            Assign program
                                        </Link>
                                    </Button>
                                }
                            >
                                {activeAssignment?.program_version ? (
                                    <div className="space-y-2">
                                        <p className="font-medium">
                                            {activeAssignment.program_version.program.name}
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                v{activeAssignment.program_version.version_number}
                                            </span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Since {new Date(activeAssignment.starts_on + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeAssignment.program_version.days.map((d) => (
                                                <Badge
                                                    key={d.id}
                                                    variant={d.is_rest_day ? 'outline' : 'secondary'}
                                                >
                                                    {d.title}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No active program assignment.
                                    </p>
                                )}
                            </SectionCard>
                            <SectionCard title="Recent sessions">
                                {sessions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No sessions yet.</p>
                                ) : (
                                    <div className="divide-y">
                                        {sessions.map((s) => (
                                            <ListRow
                                                key={s.id}
                                                leading={<Dumbbell className="size-4 text-muted-foreground" />}
                                                title={s.training_day?.title ?? 'Workout'}
                                                subtitle={new Date(s.scheduled_for + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                trailing={
                                                    <StatusChip tone={sessionTone[s.status] ?? 'neutral'}>
                                                        {s.status.replace('_', ' ')}
                                                    </StatusChip>
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    </TabsContent>

                    <TabsContent value="nutrition" className="mt-4">
                        <div className="grid gap-5 md:grid-cols-2">
                            <SectionCard title="Daily targets">
                                {nutritionTargets ? (
                                    <dl className="space-y-2.5 text-sm">
                                        {[
                                            ['Calories', `${nutritionTargets.calories} kcal`],
                                            ['Protein', `${nutritionTargets.protein_g} g`],
                                            ['Carbs', `${nutritionTargets.carbs_g} g`],
                                            ['Fat', `${nutritionTargets.fat_g} g`],
                                            ['Water', nutritionTargets.water_ml ? `${nutritionTargets.water_ml} ml` : '—'],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex justify-between">
                                                <dt className="text-muted-foreground">{k}</dt>
                                                <dd>{v}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No targets set.</p>
                                )}
                            </SectionCard>
                            <SectionCard
                                title="Nutrition plan"
                                action={
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href="/pro/nutrition">
                                            Assign plan
                                        </Link>
                                    </Button>
                                }
                            >
                                {nutritionAssignment?.plan_version ? (
                                    <div className="space-y-2">
                                        <p className="font-medium">
                                            {nutritionAssignment.plan_version.plan.name}
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                v{nutritionAssignment.plan_version.version_number}
                                            </span>
                                        </p>
                                        <div className="divide-y">
                                            {meals.map((meal) => (
                                                <ListRow
                                                    key={meal.id}
                                                    leading={<Apple className="size-4 text-muted-foreground" />}
                                                    title={meal.name}
                                                    subtitle={meal.time_hint ?? ''}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No active nutrition plan.</p>
                                )}
                            </SectionCard>
                        </div>
                    </TabsContent>

                    <TabsContent value="progress" className="mt-4">
                        <div className="grid gap-5 md:grid-cols-2">
                            {Object.entries(metrics).map(([name, points]) => (
                                <SectionCard key={name} title={name}>
                                    <MetricChart
                                        points={points.map((p) => ({
                                            date: p.date,
                                            value: p.value,
                                        }))}
                                        unit={points[0]?.unit}
                                    />
                                </SectionCard>
                            ))}
                            <SectionCard title="Progress photos">
                                {photos.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No photos yet.</p>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {photos.map((photo) => (
                                            <figure key={photo.id}>
                                                <img
                                                    src={photo.url}
                                                    alt={photo.label ?? 'Progress photo'}
                                                    className="aspect-[2/3] w-full rounded-lg border object-cover"
                                                />
                                                <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                                                    {new Date(photo.taken_on + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    </TabsContent>

                    <TabsContent value="check-ins" className="mt-4">
                        <SectionCard
                            title="Submissions"
                            action={
                                <Button size="sm" variant="outline" asChild>
                                    <Link href="/pro/check-in-submissions">Inbox</Link>
                                </Button>
                            }
                        >
                            {checkIns.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No check-ins yet.</p>
                            ) : (
                                <div className="divide-y">
                                    {checkIns.map((ci) => (
                                        <ListRow
                                            key={ci.id}
                                            leading={<ClipboardCheck className="size-4 text-muted-foreground" />}
                                            title={`Check-in due ${new Date(ci.due_on + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                                            subtitle={ci.submitted_at ? 'Submitted' : 'Awaiting submission'}
                                            trailing={
                                                <StatusChip
                                                    tone={
                                                        ci.status === 'reviewed'
                                                            ? 'success'
                                                            : ci.status === 'submitted'
                                                              ? 'info'
                                                              : 'neutral'
                                                    }
                                                >
                                                    {ci.status}
                                                </StatusChip>
                                            }
                                            href={`/pro/check-in-submissions/${ci.id}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </TabsContent>

                    <TabsContent value="appointments" className="mt-4">
                        <SectionCard title="Appointments">
                            {appointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No appointments.</p>
                            ) : (
                                <div className="divide-y">
                                    {appointments.map((a) => (
                                        <ListRow
                                            key={a.id}
                                            leading={<CalendarDays className="size-4 text-muted-foreground" />}
                                            title={a.type.name}
                                            subtitle={`${new Date(a.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${new Date(a.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · ${a.professional.name}`}
                                            trailing={<StatusChip tone="neutral">{a.status}</StatusChip>}
                                            href={`/pro/appointments/${a.id}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4">
                        <SectionCard
                            title="Private coach notes"
                            description="Only visible to your coaching team — never to the client."
                        >
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Add a private note…"
                                        className="min-h-20"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Lock className="size-3" /> Coach-only
                                    </span>
                                    <Button size="sm" onClick={saveNote}>
                                        <Send className="mr-1 size-3.5" /> Save note
                                    </Button>
                                </div>
                                <div className="space-y-3 divide-y-0">
                                    {client.notes.map((n) => (
                                        <div key={n.id} className="rounded-lg bg-muted/50 p-3">
                                            <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                {n.author.name} · {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    ))}
                                    {client.notes.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No notes yet.</p>
                                    )}
                                </div>
                            </div>
                        </SectionCard>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
