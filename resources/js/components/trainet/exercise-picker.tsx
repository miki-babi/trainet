import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

interface ExercisePickerProps {
    exercises: Exercise[];
    onSelect: (exercise: Exercise) => void;
    excludeIds?: number[];
}

export function ExercisePicker({ exercises, onSelect, excludeIds = [] }: ExercisePickerProps) {
    const [query, setQuery] = useState('');
    const [muscle, setMuscle] = useState<string | null>(null);

    const muscles = useMemo(
        () =>
            [...new Set(exercises.flatMap((e) => e.muscle_groups?.map((m) => m.name) ?? []))].sort(),
        [exercises],
    );

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return exercises.filter((e) => {
            if (excludeIds.includes(e.id)) {
                return false;
            }
            if (muscle && !e.muscle_groups?.some((m) => m.name === muscle)) {
                return false;
            }
            return e.name.toLowerCase().includes(q);
        });
    }, [exercises, query, muscle, excludeIds]);

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search exercises…"
                    className="pl-9"
                />
            </div>
            <div className="flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={() => setMuscle(null)}
                    className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                        !muscle
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                >
                    All
                </button>
                {muscles.slice(0, 8).map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMuscle(m === muscle ? null : m)}
                        className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                            muscle === m
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                    >
                        {m}
                    </button>
                ))}
            </div>
            <ScrollArea className="h-72">
                <div className="space-y-0.5 pr-3">
                    {filtered.map((exercise) => (
                        <button
                            key={exercise.id}
                            type="button"
                            onClick={() => onSelect(exercise)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{exercise.name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {exercise.category?.name}
                                    {exercise.muscle_groups?.length
                                        ? ` · ${exercise.muscle_groups.map((m) => m.name).slice(0, 3).join(', ')}`
                                        : ''}
                                </p>
                            </div>
                            {exercise.is_custom && (
                                <Badge variant="outline" className="shrink-0 text-xs">
                                    Custom
                                </Badge>
                            )}
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No exercises match.
                        </p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
