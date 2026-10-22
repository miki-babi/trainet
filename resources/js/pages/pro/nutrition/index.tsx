import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { NutritionPanel, type NutritionPlanItem } from '@/components/pro/nutrition-panel';
import { PageHeader } from '@/components/trainet/page-header';
import { SectionCard } from '@/components/trainet/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type MealPlanRequest = {
    id: number;
    client: string | null;
    package: string | null;
    intake: {
        goal?: string;
        current_weight_kg?: number | null;
        dietary_preferences?: string[];
        allergies?: string | null;
        avoid?: string | null;
        notes?: string | null;
    } | null;
    purchased_at: string | null;
};

type Props = {
    plans: NutritionPlanItem[];
    requests: MealPlanRequest[];
};

export default function NutritionIndex({ plans, requests }: Props) {
    const firstPlan = plans[0];

    return (
        <>
            <Head title="Nutrition" />
            <div className="space-y-5">
                <PageHeader
                    title="Nutrition plans"
                    description="Meal-plan templates and the food database."
                />

                {requests.length > 0 && (
                    <SectionCard
                        title="Meal plan requests"
                        description="Clients waiting on a personalized plan."
                    >
                        <div className="space-y-3">
                            {requests.map((r) => (
                                <div
                                    key={r.id}
                                    className="space-y-2 rounded-xl border p-3 text-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold">
                                                {r.client ?? 'Client'}{' '}
                                                <span className="font-normal text-muted-foreground">
                                                    · {r.package}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Ordered {r.purchased_at ?? 'recently'}
                                            </p>
                                        </div>
                                        {firstPlan ? (
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/pro/nutrition-plans/${firstPlan.id}/edit`}>
                                                    <Pencil className="mr-1 size-3.5" /> Prepare plan
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Badge variant="outline">Create a plan first</Badge>
                                        )}
                                    </div>
                                    {r.intake?.goal && (
                                        <p className="text-muted-foreground">
                                            <span className="font-medium text-foreground">Goal:</span>{' '}
                                            {r.intake.goal}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5">
                                        {r.intake?.current_weight_kg && (
                                            <Badge variant="secondary">
                                                {r.intake.current_weight_kg} kg
                                            </Badge>
                                        )}
                                        {(r.intake?.dietary_preferences ?? []).map((p) => (
                                            <Badge key={p} variant="secondary">
                                                {p}
                                            </Badge>
                                        ))}
                                        {r.intake?.allergies && (
                                            <Badge variant="secondary">
                                                Allergies: {r.intake.allergies}
                                            </Badge>
                                        )}
                                        {r.intake?.avoid && (
                                            <Badge variant="secondary">
                                                Avoids: {r.intake.avoid}
                                            </Badge>
                                        )}
                                    </div>
                                    {r.intake?.notes && (
                                        <p className="text-xs text-muted-foreground">
                                            “{r.intake.notes}”
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                <NutritionPanel plans={plans} />
            </div>
        </>
    );
}
