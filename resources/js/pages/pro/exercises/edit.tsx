import { Head, router } from '@inertiajs/react';
import { Camera, Save, X } from 'lucide-react';
import { useState } from 'react';
import { goBack } from '@/lib/back';
import { PageHeader } from '@/components/trainet/page-header';
import { SectionCard } from '@/components/trainet/section-card';
import { Button } from '@/components/ui/button';
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

type Props = {
    exercise: Exercise & { alternatives: Exercise[] };
    categories: ExerciseCategory[];
    muscleGroups: MuscleGroup[];
    equipmentList: Equipment[];
    allExercises: { id: number; name: string }[];
};

export default function ExerciseEdit({
    exercise,
    categories,
    muscleGroups,
    equipmentList,
    allExercises,
}: Props) {
    const [images, setImages] = useState<File[]>([]);
    const [removedMediaIds, setRemovedMediaIds] = useState<number[]>([]);
    const [form, setForm] = useState({
        name: exercise.name,
        exercise_category_id: String(exercise.exercise_category_id),
        difficulty: exercise.difficulty,
        movement_pattern: exercise.movement_pattern ?? '',
        instructions: exercise.instructions ?? '',
        common_mistakes: exercise.common_mistakes ?? '',
        safety_notes: exercise.safety_notes ?? '',
        video_url: exercise.video_url ?? '',
        muscle_group_ids: exercise.muscle_groups?.map((m) => m.id) ?? [],
        equipment_ids: exercise.equipment?.map((e) => e.id) ?? [],
        alternative_ids: exercise.alternatives?.map((a) => a.id) ?? [],
    });

    const toggle = (key: 'muscle_group_ids' | 'equipment_ids' | 'alternative_ids', id: number) => {
        const list = form[key];
        setForm({
            ...form,
            [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
        });
    };

    const save = () => {
        router.post(
            `/pro/exercises/${exercise.id}`,
            { ...form, images, remove_media_ids: removedMediaIds, _method: 'put' } as never,
            { preserveScroll: true, forceFormData: true },
        );
    };

    const existingMedia = (exercise.media ?? []).filter(
        (m) => !removedMediaIds.includes(m.id),
    );

    return (
        <>
            <Head title={`Edit ${exercise.name}`} />
            <div className="mx-auto max-w-3xl space-y-5">
                <PageHeader
                    title={exercise.name}
                    description="Custom exercise — only visible in your workspace"
                    backHref="/pro/exercises"
                    actions={
                        <Button onClick={save}>
                            <Save className="mr-1" /> Save
                        </Button>
                    }
                />

                <SectionCard title="Basics">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={form.exercise_category_id}
                                onValueChange={(v) => setForm({ ...form, exercise_category_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
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
                        <div className="space-y-2">
                            <Label>Movement pattern</Label>
                            <Input
                                value={form.movement_pattern}
                                onChange={(e) => setForm({ ...form, movement_pattern: e.target.value })}
                                placeholder="e.g. hinge, squat, push"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                                value={form.video_url}
                                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                                placeholder="https://…"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Illustration images</Label>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {existingMedia.map((m) => (
                                    <div key={m.id} className="relative">
                                        <img
                                            src={`/storage/${m.path}`}
                                            alt={exercise.name}
                                            className="aspect-square w-full rounded-lg object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setRemovedMediaIds([...removedMediaIds, m.id])
                                            }
                                            className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                                {images.map((file, i) => (
                                    <div key={`new-${i}`} className="relative">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt=""
                                            className="aspect-square w-full rounded-lg object-cover ring-2 ring-primary/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setImages(images.filter((_, j) => j !== i))
                                            }
                                            className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                                {existingMedia.length + images.length < 6 && (
                                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-primary/60">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                setImages([
                                                    ...images,
                                                    ...Array.from(e.target.files ?? []),
                                                ].slice(0, 6 - existingMedia.length));
                                                e.target.value = '';
                                            }}
                                        />
                                        <Camera className="size-5" />
                                        <span className="text-[10px]">Add</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Muscle groups & equipment">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Muscle groups</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {muscleGroups.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => toggle('muscle_group_ids', m.id)}
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
                                        onClick={() => toggle('equipment_ids', e.id)}
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
                            <Label>Alternatives (offered when client swaps)</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {allExercises.map((e) => (
                                    <button
                                        key={e.id}
                                        type="button"
                                        onClick={() => toggle('alternative_ids', e.id)}
                                        className={cn(
                                            'rounded-full border px-2.5 py-1 text-xs transition-colors',
                                            form.alternative_ids.includes(e.id)
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:border-primary/50',
                                        )}
                                    >
                                        {e.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Guidance">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Textarea
                                className="min-h-28"
                                value={form.instructions}
                                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
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
                </SectionCard>
            </div>
        </>
    );
}
