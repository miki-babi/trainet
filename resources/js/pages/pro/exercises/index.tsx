import { Head } from '@inertiajs/react';
import { ExercisesPanel, type ExerciseFilters } from '@/components/pro/exercises-panel';
import { PageHeader } from '@/components/trainet/page-header';
import type { Equipment, Exercise, ExerciseCategory, MuscleGroup } from '@/types';

type Props = {
    exercises: Exercise[];
    categories: ExerciseCategory[];
    muscleGroups: MuscleGroup[];
    equipmentList: Equipment[];
    filters: ExerciseFilters;
};

export default function ExerciseLibrary({
    exercises,
    categories,
    muscleGroups,
    equipmentList,
    filters,
}: Props) {
    return (
        <>
            <Head title="Exercise library" />
            <div className="space-y-5">
                <PageHeader
                    title="Exercise library"
                    description={`${exercises.length} exercises — shared library plus your custom ones`}
                />
                <ExercisesPanel
                    exercises={exercises}
                    categories={categories}
                    muscleGroups={muscleGroups}
                    equipmentList={equipmentList}
                    filters={filters}
                />
            </div>
        </>
    );
}
