import { Link, router } from '@inertiajs/react';
import { Camera, Dumbbell, Pencil, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Equipment, Exercise, ExerciseCategory, MuscleGroup } from '@/types';

export type ExerciseFilters = {
    search: string;
    category: string;
    equipment: string;
    muscle: string;
};

type Props = {
    exercises: Exercise[];
    categories: ExerciseCategory[];
    muscleGroups: MuscleGroup[];
    equipmentList: Equipment[];
    filters: ExerciseFilters;
    /** Where filter requests go — '/pro/exercises' standalone, '/pro/content' inside the Content tab. */
    baseUrl?: string;
    extraParams?: Record<string, string>;
};

const difficultyTone: Record<string, string> = {
    beginner: 'border-success/50 text-success',
    intermediate: 'border-warning/50 text-warning',
    advanced: 'border-destructive/50 text-destructive',
};

export function ExercisesPanel({
    exercises,
    categories,
    muscleGroups,
    equipmentList,
    filters,
    baseUrl = '/pro/exercises',
    extraParams,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [form, setForm] = useState({
        name: '',
        exercise_category_id: '',
        difficulty: 'beginner',
        movement_pattern: '',
        instructions: '',
        common_mistakes: '',
        safety_notes: '',
        muscle_group_ids: [] as number[],
        equipment_ids: [] as number[],
    });

    const addImages = (files: FileList | null) => {
        if (!files) return;
        setImages((prev) => [...prev, ...Array.from(files)].slice(0, 6));
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const apply = (next: Partial<ExerciseFilters>) => {
        router.get(
            baseUrl,
            { ...filters, search, ...next, ...extraParams },
            { preserveState: true, replace: true },
        );
    };

    const toggle = (list: number[], id: number) =>
        list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

    const create = () => {
        router.post(
            '/pro/exercises',
            { ...form, images } as never,
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setCreateOpen(false);
                    setForm({ ...form, name: '', instructions: '', common_mistakes: '', safety_notes: '' });
                    setImages([]);
                },
            },
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {exercises.length} exercises
                </p>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-1 size-4" /> New exercise
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create custom exercise</DialogTitle>
                            <DialogDescription>
                                Custom exercises are only visible inside your workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ex-name">Name</Label>
                                <Input
                                    id="ex-name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Trap Bar Deadlift"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={form.exercise_category_id}
                                        onValueChange={(v) => setForm({ ...form, exercise_category_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select
                                        value={form.difficulty}
                                        onValueChange={(v) => setForm({ ...form, difficulty: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Muscle groups</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {muscleGroups.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() =>
                                                setForm({ ...form, muscle_group_ids: toggle(form.muscle_group_ids, m.id) })
                                            }
                                            className={cn(
                                                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                                                form.muscle_group_ids.includes(m.id)
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:border-primary/50',
                                            )}
                                        >
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Equipment</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {equipmentList.map((e) => (
                                        <button
                                            key={e.id}
                                            type="button"
                                            onClick={() =>
                                                setForm({ ...form, equipment_ids: toggle(form.equipment_ids, e.id) })
                                            }
                                            className={cn(
                                                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                                                form.equipment_ids.includes(e.id)
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:border-primary/50',
                                            )}
                                        >
                                            {e.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Illustration images</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {images.map((file, i) => (
                                        <div key={i} className="group relative">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt=""
                                                className="aspect-square w-full rounded-lg object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {images.length < 6 && (
                                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-primary/60">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                    addImages(e.target.files);
                                                    e.target.value = '';
                                                }}
                                            />
                                            <Camera className="size-5" />
                                            <span className="text-[10px]">Add</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Instructions</Label>
                                <Textarea
                                    value={form.instructions}
                                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                    placeholder="Setup, execution, cues…"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Common mistakes</Label>
                                <Textarea
                                    value={form.common_mistakes}
                                    onChange={(e) => setForm({ ...form, common_mistakes: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Safety notes</Label>
                                <Textarea
                                    value={form.safety_notes}
                                    onChange={(e) => setForm({ ...form, safety_notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={create} disabled={!form.name || !form.exercise_category_id}>
                                Create exercise
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply({})}
                        onBlur={() => apply({})}
                        placeholder="Search exercises…"
                        className="pl-9"
                    />
                </div>
                <Select
                    value={filters.category || 'all'}
                    onValueChange={(v) => apply({ category: v === 'all' ? '' : v })}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.muscle || 'all'}
                    onValueChange={(v) => apply({ muscle: v === 'all' ? '' : v })}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Muscle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All muscles</SelectItem>
                        {muscleGroups.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {exercises.length === 0 ? (
                <EmptyState
                    icon={Dumbbell}
                    title="No exercises found"
                    description="Try different filters or create a custom exercise."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {exercises.map((exercise) => (
                        <Card key={exercise.id} className="transition-colors hover:border-primary/40">
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3">
                                    {exercise.media_url && (
                                        <img
                                            src={exercise.media_url}
                                            alt={exercise.name}
                                            className="size-12 shrink-0 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{exercise.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {exercise.category?.name}
                                            {exercise.movement_pattern
                                                ? ` · ${exercise.movement_pattern}`
                                                : ''}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="ghost" asChild>
                                        <Link href={`/pro/exercises/${exercise.id}/edit`}>
                                            <Pencil className="size-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge variant="outline" className={difficultyTone[exercise.difficulty]}>
                                        {exercise.difficulty}
                                    </Badge>
                                    {exercise.muscle_groups?.slice(0, 3).map((m) => (
                                        <Badge key={m.id} variant="secondary">
                                            {m.name}
                                        </Badge>
                                    ))}
                                    {exercise.is_custom && <Badge>Custom</Badge>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
