import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BedDouble, Dumbbell } from 'lucide-react';
import { goBack } from '@/lib/back';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip } from '@/components/trainet/status-chip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Exercise, TrainingDay, TrainingDayExercise } from '@/types';

type Props = {
    program: { name: string; description: string | null };
    version: {
        version_number: number;
        status: string;
        days: (TrainingDay & {
            exercises: (TrainingDayExercise & { exercise: Exercise })[];
        })[];
    };
};

export default function ProgramPreview({ program, version }: Props) {
    return (
        <>
            <Head title={`${program.name} — client view`} />
            <div className="mx-auto max-w-2xl space-y-5">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2"
                        onClick={() => goBack('/pro/programs')}
                    >
                        <ArrowLeft className="mr-1" /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{program.name}</h1>
                        <StatusChip tone="info">v{version.version_number}</StatusChip>
                    </div>
                    <p className="text-muted-foreground">{program.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground italic">
                        Client view — this is what assigned clients see.
                    </p>
                </div>

                {version.days.map((day) => (
                    <SectionCard key={day.id} title={day.title}>
                        {day.is_rest_day ? (
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BedDouble className="size-4" /> Rest day
                            </p>
                        ) : (
                            <div className="divide-y">
                                {(day.exercises ?? [])
                                    .sort((a, b) => a.order - b.order)
                                    .map((de) => (
                                        <div key={de.id} className="flex items-center gap-3 py-2.5">
                                            <Dumbbell className="size-4 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {de.exercise.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {[
                                                        de.sets && de.reps ? `${de.sets}×${de.reps}` : de.sets ? `${de.sets} sets` : null,
                                                        de.target_load ? `${de.target_load} kg` : null,
                                                        de.duration_seconds ? `${de.duration_seconds}s` : null,
                                                        de.rpe ? `RPE ${de.rpe}` : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </SectionCard>
                ))}
            </div>
        </>
    );
}
