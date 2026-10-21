import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Pause,
    Play,
    Plus,
    Repeat,
    SkipForward,
    StickyNote,
    Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { ExercisePicker } from '@/components/trainet/exercise-picker';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { goBack } from '@/lib/back';
import { StatusChip } from '@/components/trainet/status-chip';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
    Exercise,
    PersonalRecord,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet,
} from '@/types';

type SessionExercise = WorkoutSessionExercise & {
    exercise: Exercise & { alternatives?: Exercise[] };
    sets: WorkoutSet[];
};

type Props = {
    session: Omit<WorkoutSession, 'exercises'> & { exercises: SessionExercise[] };
    personalRecords: Record<number, PersonalRecord>;
};

export default function WorkoutRun({ session, personalRecords }: Props) {
    const inProgress = session.status === 'in_progress' || session.status === 'paused';
    const completed = session.status === 'completed';
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();
    const [swapTarget, setSwapTarget] = useState<SessionExercise | null>(null);
    const [notes, setNotes] = useState(session.notes ?? '');

    const patch = (url: string, data: Parameters<typeof router.put>[1] & object) => {
        markSaving();
        router.put(url, data, {
            preserveScroll: true,
            onSuccess: () => markSaved(),
            onError: () => markError(),
        });
    };

    const allSets = session.exercises.flatMap((e) => e.sets ?? []);
    const doneSets = allSets.filter((s) => s.status === 'done').length;
    const totalSets = allSets.length;
    const volume = allSets
        .filter((s) => s.status === 'done')
        .reduce((sum, s) => sum + (s.actual_load ?? 0) * (s.actual_reps ?? 0), 0);

    return (
        <>
            <Head title={session.training_day?.title ?? 'Workout'} />
            <div className="space-y-4 py-4 pb-24">
                {/* Sticky header */}
                <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
                    <div className="mx-auto flex max-w-2xl items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => goBack('/app/today')}>
                            <ArrowLeft className="size-5" />
                        </Button>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                                {session.training_day?.title ?? 'Workout'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {doneSets}/{totalSets} sets
                                {completed && ` · ${Math.round(volume)} kg volume`}
                            </p>
                        </div>
                        <SaveIndicator state={saveState} />
                        {inProgress && session.status === 'in_progress' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.post(`/app/workouts/${session.id}/pause`)}
                            >
                                <Pause className="mr-1 size-3.5" /> Pause
                            </Button>
                        )}
                        {session.status === 'paused' && (
                            <Button
                                size="sm"
                                onClick={() => router.post(`/app/workouts/${session.id}/resume`)}
                            >
                                <Play className="mr-1 size-3.5" /> Resume
                            </Button>
                        )}
                    </div>
                </div>

                {session.status === 'paused' && (
                    <Card className="border-warning/50 bg-warning/5">
                        <CardContent className="py-3 text-sm">
                            Paused — your progress is saved. Resume anytime.
                        </CardContent>
                    </Card>
                )}

                {/* Exercises */}
                <div className="space-y-4">
                    {session.exercises
                        .sort((a, b) => a.order - b.order)
                        .map((se) => (
                            <ExerciseCard
                                key={se.id}
                                sessionExercise={se}
                                pr={personalRecords[se.exercise_id]}
                                editable={inProgress}
                                onPatchSet={(set, data) =>
                                    patch(`/app/session-exercises/${se.id}/sets/${set.id}`, data)
                                }
                                onAddSet={() =>
                                    router.post(`/app/session-exercises/${se.id}/sets`, {}, { preserveScroll: true })
                                }
                                onSkip={(reason) =>
                                    router.post(`/app/session-exercises/${se.id}/skip`, { reason }, { preserveScroll: true })
                                }
                                onSwap={() => setSwapTarget(se)}
                            />
                        ))}
                </div>

                {/* Notes + complete */}
                <Card>
                    <CardContent className="space-y-3">
                        <label className="flex items-center gap-1.5 text-sm font-medium">
                            <StickyNote className="size-4" /> Session notes
                        </label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={() => notes !== session.notes &&
                                router.put(`/app/workouts/${session.id}`, { notes }, { preserveScroll: true })}
                            placeholder="How did it feel? Anything to flag to your coach…"
                            disabled={completed}
                        />
                    </CardContent>
                </Card>

                {inProgress && (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                if (confirm('Skip this workout? It will be marked as skipped.')) {
                                    router.post(`/app/workouts/${session.id}/skip`);
                                }
                            }}
                        >
                            <SkipForward className="mr-1" /> Skip
                        </Button>
                        <Button
                            className="h-12 flex-[2] text-base"
                            onClick={() => router.post(`/app/workouts/${session.id}/complete`)}
                        >
                            <CheckCircle2 className="mr-1" /> Finish workout
                        </Button>
                    </div>
                )}

                {completed && (
                    <Card className="border-success/50 bg-success/5">
                        <CardContent className="flex items-center gap-3">
                            <Trophy className="size-6 text-success" />
                            <div>
                                <p className="font-semibold">Workout complete</p>
                                <p className="text-sm text-muted-foreground">
                                    {doneSets} sets · {Math.round(volume)} kg total volume
                                    {session.duration_seconds
                                        ? ` · ${Math.round(session.duration_seconds / 60)} min`
                                        : ''}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Swap dialog */}
            <Dialog open={!!swapTarget} onOpenChange={(o) => !o && setSwapTarget(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Replace {swapTarget?.exercise.name}</DialogTitle>
                    </DialogHeader>
                    {swapTarget && (
                        <ExercisePicker
                            exercises={
                                swapTarget.exercise.alternatives?.length
                                    ? swapTarget.exercise.alternatives
                                    : [swapTarget.exercise]
                            }
                            excludeIds={[swapTarget.exercise_id]}
                            onSelect={(exercise) => {
                                patch(`/app/session-exercises/${swapTarget.id}/replace`, {
                                    exercise_id: exercise.id,
                                });
                                setSwapTarget(null);
                            }}
                        />
                    )}
                    {swapTarget && !swapTarget.exercise.alternatives?.length && (
                        <p className="text-sm text-muted-foreground">
                            No coach-approved alternatives for this exercise.
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function ExerciseCard({
    sessionExercise: se,
    pr,
    editable,
    onPatchSet,
    onAddSet,
    onSkip,
    onSwap,
}: {
    sessionExercise: SessionExercise;
    pr?: PersonalRecord;
    editable: boolean;
    onPatchSet: (set: WorkoutSet, data: Parameters<typeof router.put>[1] & object) => void;
    onAddSet: () => void;
    onSkip: (reason: string | null) => void;
    onSwap: () => void;
}) {
    const skipped = se.status === 'skipped';
    const done = se.status === 'done';
    const target = [
        se.target_sets && se.target_reps ? `${se.target_sets}×${se.target_reps}` : null,
        se.target_load ? `${se.target_load} kg` : null,
        se.target_rpe ? `RPE ${se.target_rpe}` : null,
        se.rest_seconds ? `rest ${se.rest_seconds}s` : null,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <Card className={cn(skipped && 'opacity-60')}>
            <CardContent className="space-y-3">
                <Accordion type="multiple">
                    <AccordionItem value="ex" className="border-none">
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <AccordionTrigger className="p-0 hover:no-underline">
                                        <span className="font-semibold">{se.exercise.name}</span>
                                    </AccordionTrigger>
                                    {se.replaced_exercise_id && (
                                        <Badge variant="outline" className="text-xs">
                                            swapped
                                        </Badge>
                                    )}
                                    {skipped && (
                                        <StatusChip tone="danger">Skipped</StatusChip>
                                    )}
                                    {done && <StatusChip tone="success">Done</StatusChip>}
                                    {pr && (
                                        <Badge variant="secondary" className="gap-1 text-xs">
                                            <Trophy className="size-3" /> PR {pr.value} kg
                                        </Badge>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Target: {target || 'free'}
                                </p>
                            </div>
                            {editable && !skipped && (
                                <div className="flex gap-1">
                                    {se.exercise.alternatives && se.exercise.alternatives.length > 0 && (
                                        <Button variant="ghost" size="icon" onClick={onSwap} title="Swap exercise">
                                            <Repeat className="size-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Skip exercise"
                                        onClick={() => {
                                            const reason = prompt('Skip this exercise? (optional reason)') ?? null;
                                            onSkip(reason || null);
                                        }}
                                    >
                                        <SkipForward className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <AccordionContent>
                            <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                                {se.exercise.instructions && <p>{se.exercise.instructions}</p>}
                                {se.exercise.common_mistakes && (
                                    <p className="text-xs">Watch for: {se.exercise.common_mistakes}</p>
                                )}
                                {se.notes && <p className="text-xs italic">Coach: {se.notes}</p>}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Sets table */}
                {!skipped && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-[24px_1fr_1fr_64px_40px] items-center gap-2 px-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                            <span>#</span>
                            <span>Reps</span>
                            <span>Load (kg)</span>
                            <span>RPE</span>
                            <span />
                        </div>
                        {se.sets
                            .sort((a, b) => a.set_order - b.set_order)
                            .map((set) => (
                                <SetRow
                                    key={set.id}
                                    set={set}
                                    editable={editable}
                                    onPatch={(data) => onPatchSet(set, data)}
                                />
                            ))}
                        {editable && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground"
                                onClick={onAddSet}
                            >
                                <Plus className="mr-1 size-3.5" /> Add set
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SetRow({
    set,
    editable,
    onPatch,
}: {
    set: WorkoutSet;
    editable: boolean;
    onPatch: (data: Parameters<typeof router.put>[1] & object) => void;
}) {
    const done = set.status === 'done';
    const skipped = set.status === 'skipped';

    const field = (
        name: 'actual_reps' | 'actual_load' | 'actual_rpe',
        planned: number | string | null,
    ) => (
        <Input
            type="number"
            inputMode="decimal"
            defaultValue={set[name] ?? ''}
            placeholder={planned != null ? String(planned) : '—'}
            disabled={!editable || skipped}
            className={cn('h-10 text-center', done && 'border-success/50 bg-success/5')}
            onBlur={(e) => {
                const raw = e.target.value;
                if (String(set[name] ?? '') !== raw) {
                    onPatch({ [name]: raw === '' ? null : Number(raw) });
                }
            }}
        />
    );

    return (
        <div className="grid grid-cols-[24px_1fr_1fr_64px_40px] items-center gap-2 px-1">
            <span className="text-center text-sm text-muted-foreground">{set.set_order}</span>
            {field('actual_reps', set.planned_reps)}
            {field('actual_load', set.planned_load)}
            {field('actual_rpe', null)}
            <button
                type="button"
                disabled={!editable}
                onClick={() =>
                    onPatch({ status: done ? 'pending' : 'done' })
                }
                className={cn(
                    'flex size-9 items-center justify-center rounded-full border-2 transition-colors',
                    done
                        ? 'border-success bg-success text-success'
                        : skipped
                          ? 'border-muted-foreground/30 bg-muted text-muted-foreground'
                          : 'border-muted-foreground/40 text-transparent hover:border-success/60',
                )}
            >
                {skipped ? '—' : <Check className="size-4" />}
            </button>
        </div>
    );
}
