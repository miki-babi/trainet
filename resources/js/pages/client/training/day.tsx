import { Head } from '@inertiajs/react';
import { ArrowLeft, Dumbbell, Repeat } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { goBack } from '@/lib/back';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import type { Exercise, TrainingDay, TrainingDayExercise } from '@/types';

type Props = {
    day: TrainingDay & {
        exercises: (TrainingDayExercise & {
            exercise: Exercise & { alternatives?: Exercise[] };
        })[];
    };
};

export default function TrainingDayDetail({ day }: Props) {
    return (
        <>
            <Head title={day.title} />
            <div className="space-y-5 py-5">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => goBack('/app/training')}>
                        <ArrowLeft className="mr-1" /> Back
                    </Button>
                    <h1 className="mt-1 text-2xl font-bold">{day.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {day.exercises.length} exercises · tap one for technique notes
                    </p>
                </div>

                <Accordion type="multiple" className="space-y-3">
                    {day.exercises
                        .sort((a, b) => a.order - b.order)
                        .map((de) => (
                            <AccordionItem key={de.id} value={String(de.id)} className="rounded-xl border">
                                <AccordionTrigger className="px-4 hover:no-underline">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <Dumbbell className="size-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{de.exercise.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {[
                                                    de.sets && de.reps ? `${de.sets} × ${de.reps}` : null,
                                                    de.target_load ? `${de.target_load} kg` : null,
                                                    de.rpe ? `RPE ${de.rpe}` : null,
                                                    de.rest_seconds ? `rest ${de.rest_seconds}s` : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4">
                                    <div className="space-y-3 border-t pt-3 text-sm">
                                        {de.notes && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Coach note
                                                </p>
                                                <p>{de.notes}</p>
                                            </div>
                                        )}
                                        {de.exercise.instructions && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    How to
                                                </p>
                                                <p>{de.exercise.instructions}</p>
                                            </div>
                                        )}
                                        {de.exercise.common_mistakes && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Watch for
                                                </p>
                                                <p>{de.exercise.common_mistakes}</p>
                                            </div>
                                        )}
                                        {de.exercise.muscle_groups && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {de.exercise.muscle_groups.map((m) => (
                                                    <Badge key={m.id} variant="secondary">
                                                        {m.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {de.exercise.alternatives && de.exercise.alternatives.length > 0 && (
                                            <div>
                                                <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase">
                                                    <Repeat className="size-3" /> Alternatives
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {de.exercise.alternatives.map((a) => a.name).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                </Accordion>
            </div>
        </>
    );
}
