import { Head } from '@inertiajs/react';
import { NutritionPanel, type NutritionPlanItem } from '@/components/pro/nutrition-panel';
import { PageHeader } from '@/components/trainet/page-header';

export default function NutritionIndex({ plans }: { plans: NutritionPlanItem[] }) {
    return (
        <>
            <Head title="Nutrition" />
            <div className="space-y-5">
                <PageHeader
                    title="Nutrition plans"
                    description="Meal-plan templates and the food database."
                />
                <NutritionPanel plans={plans} />
            </div>
        </>
    );
}
