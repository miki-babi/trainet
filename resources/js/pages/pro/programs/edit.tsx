import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BedDouble,
    CheckCircle2,
    Eye,
    Plus,
    Send,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { ExercisePicker } from '@/components/trainet/exercise-picker';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { StatusChip } from '@/components/trainet/status-chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Exercise, TrainingDay, TrainingDayExercise } from '@/types';

type ProgramVersion = {
    id: number;
    version_number: number;
    status: string;
    published_at: string | null;
    change_summary: string | null;
};

type VersionWithDays = ProgramVersion & {
    days: (TrainingDay & { exercises: (TrainingDayExercise & { exercise: Exercise })[] })[];
};

type Props = {
    program: { id: number; name: string; description: string | null; status: string };
    version: VersionWithDays;
    versions: ProgramVersion[];
    exerciseLibrary: Exercise[];
    clients: { id: number; name: string }[];
};

const WEEKDAYS = [
    { n: 1, label: 'Mon' },
    { n: 2, label: 'Tue' },
    { n: 3, label: 'Wed' },
    { n: 4, label: 'Thu' },
    { n: 5, label: 'Fri' },
    { n: 6, label: 'Sat' },
    { n: 7, label: 'Sun' },
];

export default function ProgramBuilder({
    program,
    version,
    versions,
    exerciseLibrary,
    clients,
}: Props) {
    const isDraft = version.status === 'draft';
    const [selectedDayId, setSelectedDayId] = useState<number | null>(
        version.days?.[0]?.id ?? null,
    );
    const [pickerOpen, setPickerOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({
        client_id: '',
        starts_on: new Date().toISOString().slice(0, 10),
        ends_on: '',
        schedule: {} as Record<number, string>,
    });
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();

    const day = version.days?.find((d) => d.id === selectedDayId) ?? version.days?.[0];

    const patch = (url: string, data: Parameters<typeof router.put>[1] & object, method: 'put' | 'post' | 'delete' = 'put') => {
        markSaving();
        const callbacks = {
            preserveScroll: true,
            onSuccess: () => markSaved(),
            onError: () => markError(),
        };
        if (method === 'delete') {
            router.delete(url, { data, ...callbacks });
        } else {
            router[method](url, data, callbacks);
        }
    };

    const published = versions.find((v) => v.status === 'published');

    const assign = () => {
        const targetVersion = published ?? (isDraft ? null : version);
        if (!targetVersion) {
            return;
        }
        router.post(`/pro/program-versions/${targetVersion.id}/assign`, {
            client_id: Number(assignForm.client_id),
            starts_on: assignForm.starts_on,
            ends_on: assignForm.ends_on || null,
            schedule_days: assignForm.schedule,
        });
        setAssignOpen(false);
    };

    return (
        <>
            <Head title={`${program.name} — builder`} />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/pro/programs">
                            <ArrowLeft className="mr-1" /> Programs
                        </Link>
                    </Button>
                    <SaveIndicator state={saveState} />
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/pro/programs/${program.id}/preview`}>
                                <Eye className="mr-1 size-4" /> Preview
                            </Link>
                        </Button>
                        {isDraft && (
                            <Button
                                size="sm"
                                onClick={() => patch(`/pro/programs/${program.id}/publish`, {}, 'post')}
                            >
                                <CheckCircle2 className="mr-1 size-4" /> Publish
                            </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
                            <Send className="mr-1 size-4" /> Assign
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        defaultValue={program.name}
                        className="max-w-sm border-transparent text-xl font-bold hover:border-input focus:border-input"
                        onBlur={(e) =>
                            e.target.value !== program.name &&
                            patch(`/pro/programs/${program.id}`, {
                                name: e.target.value,
                                description: program.description ?? '',
                            })
                        }
                    />
                    {versions.map((v) => (
                        <Badge
                            key={v.id}
                            variant={v.id === version.id ? 'default' : 'outline'}
                            className="capitalize"
                        >
                            v{v.version_number} · {v.status}
                        </Badge>
                    ))}
                </div>
                {!isDraft && (
                    <p className="text-sm text-muted-foreground">
                        Published versions are read-only. This view shows v
                        {version.version_number}.
                    </p>
                )}

                <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
                    {/* Days: horizontal chips on mobile, sidebar on lg */}
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:space-y-2 lg:overflow-visible lg:px-0 lg:pb-0">
                        {version.days?.map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => setSelectedDayId(d.id)}
                                className={cn(
                                    'flex shrink-0 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors lg:w-full lg:whitespace-normal',
                                    day?.id === d.id
                                        ? 'border-primary bg-primary/5'
                                        : 'hover:bg-accent',
                                )}
                            >
                                <span className="truncate font-medium">{d.title}</span>
                                {d.is_rest_day && (
                                    <BedDouble className="size-4 shrink-0 text-muted-foreground" />
                                )}
                            </button>
                        ))}
                        {isDraft && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => patch(`/pro/programs/${program.id}/days`, {}, 'post')}
                            >
                                <Plus className="mr-1 size-4" /> Add day
                            </Button>
                        )}
                    </div>

                    {/* Day detail */}
                    {day && (
                        <Card>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <Input
                                        defaultValue={day.title}
                                        disabled={!isDraft}
                                        className="max-w-xs font-semibold"
                                        onBlur={(e) =>
                                            e.target.value !== day.title &&
                                            patch(`/pro/days/${day.id}`, {
                                                title: e.target.value,
                                                is_rest_day: day.is_rest_day,
                                            })
                                        }
                                    />
                                    {isDraft && (
                                        <>
                                            <label className="flex items-center gap-2 text-sm">
                                                <Switch
                                                    checked={day.is_rest_day}
                                                    onCheckedChange={(checked) =>
                                                        patch(`/pro/days/${day.id}`, {
                                                            title: day.title,
                                                            is_rest_day: checked,
                                                        })
                                                    }
                                                />
                                                Rest day
                                            </label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-auto text-destructive"
                                                onClick={() => {
                                                    if (confirm('Delete this day?')) {
                                                        patch(`/pro/days/${day.id}`, {}, 'delete');
                                                    }
                                                }}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {!day.is_rest_day && (
                                    <div className="space-y-3">
                                        {(day.exercises ?? [])
                                            .sort((a, b) => a.order - b.order)
                                            .map((de) => (
                                                <DayExerciseRow
                                                    key={de.id}
                                                    item={de}
                                                    editable={isDraft}
                                                    onPatch={(data) =>
                                                        patch(`/pro/day-exercises/${de.id}`, data)
                                                    }
                                                    onDelete={() =>
                                                        patch(`/pro/day-exercises/${de.id}`, {}, 'delete')
                                                    }
                                                />
                                            ))}
                                        {isDraft && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-dashed"
                                                onClick={() => setPickerOpen(true)}
                                            >
                                                <Plus className="mr-1" /> Add exercise
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {day.is_rest_day && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Rest day — no exercises.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Exercise picker */}
                <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add exercise to {day?.title}</DialogTitle>
                        </DialogHeader>
                        <ExercisePicker
                            exercises={exerciseLibrary}
                            onSelect={(exercise) => {
                                patch(`/pro/days/${day.id}/exercises`, { exercise_id: exercise.id }, 'post');
                                setPickerOpen(false);
                            }}
                        />
                    </DialogContent>
                </Dialog>

                {/* Assign dialog */}
                <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Assign program</DialogTitle>
                        </DialogHeader>
                        {!published && isDraft ? (
                            <p className="text-sm text-muted-foreground">
                                Publish a version first — only published versions can be assigned.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Client</Label>
                                    <Select
                                        value={assignForm.client_id}
                                        onValueChange={(v) => setAssignForm({ ...assignForm, client_id: v })}
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
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Starts</Label>
                                        <Input
                                            type="date"
                                            value={assignForm.starts_on}
                                            onChange={(e) =>
                                                setAssignForm({ ...assignForm, starts_on: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ends (optional)</Label>
                                        <Input
                                            type="date"
                                            value={assignForm.ends_on}
                                            onChange={(e) =>
                                                setAssignForm({ ...assignForm, ends_on: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Weekly schedule — which day runs on each weekday</Label>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {WEEKDAYS.map(({ n, label }) => (
                                            <div key={n} className="space-y-1 text-center">
                                                <p className="text-xs text-muted-foreground">{label}</p>
                                                <Select
                                                    value={assignForm.schedule[n] ?? ''}
                                                    onValueChange={(v) => {
                                                        const schedule = { ...assignForm.schedule };
                                                        if (v === 'none') {
                                                            delete schedule[n];
                                                        } else {
                                                            schedule[n] = v;
                                                        }
                                                        setAssignForm({ ...assignForm, schedule });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 px-1.5 text-xs">
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">—</SelectItem>
                                                        {version.days
                                                            ?.filter((d) => !d.is_rest_day)
                                                            .map((d) => (
                                                                <SelectItem key={d.id} value={String(d.order)}>
                                                                    {d.title}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={assign} disabled={!assignForm.client_id || (!published && isDraft)}>
                                Assign {(published ?? version) && `v${(published ?? version).version_number}`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

function DayExerciseRow({
    item,
    editable,
    onPatch,
    onDelete,
}: {
    item: TrainingDayExercise & { exercise: Exercise };
    editable: boolean;
    onPatch: (data: Parameters<typeof router.put>[1] & object) => void;
    onDelete: () => void;
}) {
    const cell = (
        field: 'sets' | 'reps' | 'target_load' | 'rpe' | 'rest_seconds' | 'duration_seconds',
        placeholder: string,
        className = 'w-16',
    ) => (
        <Input
            defaultValue={item[field] ?? ''}
            disabled={!editable}
            placeholder={placeholder}
            className={cn('h-8 text-center text-sm', className)}
            onBlur={(e) => {
                const raw = e.target.value;
                const value = field === 'reps' ? raw : raw === '' ? null : Number(raw);
                if (String(item[field] ?? '') !== raw) {
                    onPatch({ [field]: value });
                }
            }}
        />
    );

    return (
        <div className="rounded-lg border p-3">
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.exercise.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {item.exercise.muscle_groups?.map((m) => m.name).join(', ')}
                        {item.group_label && (
                            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-medium">
                                {item.group_label}
                            </span>
                        )}
                    </p>
                </div>
                {editable && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                    <p className="text-center text-[10px] font-medium text-muted-foreground uppercase">Sets</p>
                    {cell('sets', '3')}
                </div>
                <div className="space-y-1">
                    <p className="text-center text-[10px] font-medium text-muted-foreground uppercase">Reps</p>
                    {cell('reps', '8-10')}
                </div>
                <div className="space-y-1">
                    <p className="text-center text-[10px] font-medium text-muted-foreground uppercase">Load kg</p>
                    {cell('target_load', '—')}
                </div>
                <div className="space-y-1">
                    <p className="text-center text-[10px] font-medium text-muted-foreground uppercase">RPE</p>
                    {cell('rpe', '—')}
                </div>
                <div className="space-y-1">
                    <p className="text-center text-[10px] font-medium text-muted-foreground uppercase">Rest s</p>
                    {cell('rest_seconds', '90')}
                </div>
                <div className="space-y-1">
                    <p className="text-center text-[10px] font-medium text-muted-foreground uppercase">Group</p>
                    <Input
                        defaultValue={item.group_label ?? ''}
                        disabled={!editable}
                        placeholder="A1"
                        className="h-8 w-14 text-center text-sm"
                        onBlur={(e) => {
                            if ((item.group_label ?? '') !== e.target.value) {
                                onPatch({ group_label: e.target.value || null });
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
