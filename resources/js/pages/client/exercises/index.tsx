import { Head, Link, router } from '@inertiajs/react';
import { Dumbbell, Search } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Exercise } from '@/types';

export default function ClientExercises({
    exercises,
    filters,
}: {
    exercises: Exercise[];
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);

    return (
        <>
            <Head title="Exercise library" />
            <div className="space-y-5 py-5">
                <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
                <div className="relative">
                    <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            router.get('/app/exercises', { search }, { preserveState: true })
                        }
                        onBlur={() =>
                            router.get('/app/exercises', { search }, { preserveState: true, replace: true })
                        }
                        placeholder="Search exercises…"
                        className="pl-9"
                    />
                </div>
                {exercises.length === 0 ? (
                    <EmptyState icon={Dumbbell} title="No exercises found" />
                ) : (
                    <div className="space-y-2">
                        {exercises.map((exercise) => (
                            <Link key={exercise.id} href={`/app/exercises/${exercise.id}`}>
                                <Card className="transition-colors hover:border-primary/40">
                                    <CardContent className="flex items-center gap-3 py-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <Dumbbell className="size-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {exercise.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {exercise.muscle_groups?.map((m) => m.name).join(', ')}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="capitalize">
                                            {exercise.difficulty}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
