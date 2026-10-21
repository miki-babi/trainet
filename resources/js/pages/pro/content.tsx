import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ExercisesPanel, type ExerciseFilters } from '@/components/pro/exercises-panel';
import { NutritionPanel, type NutritionPlanItem } from '@/components/pro/nutrition-panel';
import { ProgramsPanel, type ProgramItem } from '@/components/pro/programs-panel';
import { PageHeader } from '@/components/trainet/page-header';
import { cn } from '@/lib/utils';
import type { Equipment, Exercise, ExerciseCategory, MuscleGroup } from '@/types';

type Tab = 'programs' | 'exercises' | 'nutrition';

const TABS: { value: Tab; label: string }[] = [
    { value: 'programs', label: 'Programs' },
    { value: 'exercises', label: 'Exercises' },
    { value: 'nutrition', label: 'Nutrition plans' },
];

type Props = {
    tab: string;
    programs: ProgramItem[];
    exercises: Exercise[];
    categories: ExerciseCategory[];
    muscleGroups: MuscleGroup[];
    equipmentList: Equipment[];
    plans: NutritionPlanItem[];
    filters: ExerciseFilters;
};

export default function ProContent({
    tab: initialTab,
    programs,
    exercises,
    categories,
    muscleGroups,
    equipmentList,
    plans,
    filters,
}: Props) {
    const [tab, setTab] = useState<Tab>(
        (TABS.some((t) => t.value === initialTab) ? initialTab : 'programs') as Tab,
    );

    return (
        <>
            <Head title="Content" />
            <div className="space-y-5">
                <PageHeader
                    title="Content"
                    description="Programs, exercises and nutrition plans."
                />

                <div className="flex gap-1 rounded-full bg-muted p-1">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setTab(t.value)}
                            className={cn(
                                'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                tab === t.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'programs' && <ProgramsPanel programs={programs} />}
                {tab === 'exercises' && (
                    <ExercisesPanel
                        exercises={exercises}
                        categories={categories}
                        muscleGroups={muscleGroups}
                        equipmentList={equipmentList}
                        filters={filters}
                        baseUrl="/pro/content"
                        extraParams={{ tab: 'exercises' }}
                    />
                )}
                {tab === 'nutrition' && <NutritionPanel plans={plans} />}
            </div>
        </>
    );
}
