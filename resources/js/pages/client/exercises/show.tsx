import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Dumbbell, Repeat, TriangleAlert } from 'lucide-react';
import { goBack } from '@/lib/back';
import { SectionCard } from '@/components/trainet/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Exercise } from '@/types';

type Props = {
    exercise: Exercise & { alternatives: Exercise[] };
};

export default function ExerciseShow({ exercise }: Props) {
    return (
        <>
            <Head title={exercise.name} />
            <div className="space-y-5 py-5">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => goBack('/app/exercises')}>
                        <ArrowLeft className="mr-1" /> Back
                    </Button>
                    <h1 className="mt-1 text-2xl font-bold">{exercise.name}</h1>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="capitalize">
                            {exercise.difficulty}
                        </Badge>
                        {exercise.muscle_groups?.map((m) => (
                            <Badge key={m.id} variant="outline">
                                {m.name}
                            </Badge>
                        ))}
                        {exercise.equipment?.map((e) => (
                            <Badge key={e.id} variant="outline">
                                {e.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                {(exercise.media_urls?.length ?? 0) > 0 ? (
                    <div
                        className={
                            exercise.media_urls!.length > 1
                                ? 'grid grid-cols-2 gap-2'
                                : ''
                        }
                    >
                        {exercise.media_urls!.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`${exercise.name} ${i + 1}`}
                                className="aspect-video w-full rounded-xl object-cover"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                        <Dumbbell className="size-10 text-muted-foreground/40" />
                    </div>
                )}

                {exercise.instructions && (
                    <SectionCard title="How to perform">
                        <p className="text-sm leading-relaxed">{exercise.instructions}</p>
                    </SectionCard>
                )}
                {exercise.common_mistakes && (
                    <SectionCard title="Common mistakes">
                        <p className="text-sm leading-relaxed">{exercise.common_mistakes}</p>
                    </SectionCard>
                )}
                {exercise.safety_notes && (
                    <SectionCard title="Safety">
                        <p className="flex gap-2 text-sm leading-relaxed">
                            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                            {exercise.safety_notes}
                        </p>
                    </SectionCard>
                )}
                {exercise.alternatives.length > 0 && (
                    <SectionCard title="Alternatives">
                        <div className="divide-y">
                            {exercise.alternatives.map((alt) => (
                                <button
                                    key={alt.id}
                                    type="button"
                                    onClick={() => router.visit(`/app/exercises/${alt.id}`)}
                                    className="flex w-full items-center gap-2 py-2.5 text-left text-sm hover:text-primary"
                                >
                                    <Repeat className="size-4 text-muted-foreground" />
                                    {alt.name}
                                </button>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </>
    );
}
