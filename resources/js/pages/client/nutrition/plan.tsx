import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import { FoodDetail, type FoodDetailData } from '@/components/trainet/food-detail';
import { SectionCard } from '@/components/trainet/section-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mediaUrl } from '@/lib/media';

type Item = {
    id: number;
    quantity: number;
    notes: string | null;
    food: FoodDetailData | null;
    portion: { label: string; grams: number } | null;
    recipe: { name: string } | null;
};

type Meal = {
    id: number;
    name: string;
    time_hint: string | null;
    notes: string | null;
    image_url: string | null;
    items: Item[];
};

type Props = {
    assignment: {
        assigned_by: {
            id: number;
            name: string;
            avatar: string | null;
            professional_profile: { id: number } | null;
        } | null;
        plan_version: {
            version_number: number;
            plan: { name: string; description: string | null };
            days: { id: number; title: string; meals: Meal[] }[];
        } | null;
    } | null;
};

const MaybeLink = ({
    href,
    className,
    children,
}: {
    href?: string;
    className?: string;
    children: React.ReactNode;
}) =>
    href ? (
        <Link href={href} className={className}>
            {children}
        </Link>
    ) : (
        <span className={className}>{children}</span>
    );

const itemGrams = (i: Item) => (i.portion ? i.portion.grams * i.quantity : i.quantity * 100);
const itemKcal = (i: Item) => (i.food ? Math.round((i.food.calories * itemGrams(i)) / 100) : 0);
const mealKcal = (m: Meal) => m.items.reduce((s, i) => s + itemKcal(i), 0);

export default function NutritionPlan({ assignment }: Props) {
    const version = assignment?.plan_version;
    const [detailFood, setDetailFood] = useState<FoodDetailData | null>(null);

    return (
        <>
            <Head title={version?.plan.name ?? 'Meal plan'} />
            <div className="mx-auto max-w-2xl space-y-5 py-5">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/training">
                        <ArrowLeft className="mr-1" /> Plans
                    </Link>
                </Button>

                {!version ? (
                    <EmptyState
                        icon={UtensilsCrossed}
                        title="No meal plan"
                        description="Your coach hasn't assigned a meal plan yet. Check back soon."
                    />
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{version.plan.name}</h1>
                            <span className="text-xs text-muted-foreground">
                                v{version.version_number}
                            </span>
                            {assignment?.assigned_by && (
                                <MaybeLink
                                    href={
                                        assignment.assigned_by.professional_profile
                                            ? `/app/professionals/${assignment.assigned_by.professional_profile.id}`
                                            : undefined
                                    }
                                    className="ml-auto"
                                >
                                    <Avatar
                                        className="size-12 ring-2 ring-border transition-transform hover:scale-105"
                                        title={assignment.assigned_by.name}
                                    >
                                        <AvatarImage
                                            src={mediaUrl(assignment.assigned_by.avatar) ?? undefined}
                                            alt={assignment.assigned_by.name}
                                        />
                                        <AvatarFallback>
                                            {assignment.assigned_by.name.slice(0, 1)}
                                        </AvatarFallback>
                                    </Avatar>
                                </MaybeLink>
                            )}
                        </div>
                        {version.plan.description && (
                            <p className="text-sm text-muted-foreground">{version.plan.description}</p>
                        )}

                        {version.days.map((day) => (
                            <SectionCard key={day.id} title={day.title}>
                                <div className="space-y-4">
                                    {day.meals.map((meal) => (
                                        <div key={meal.id}>
                                            <div className="mb-1.5 flex items-center gap-2">
                                                {meal.image_url && (
                                                    <img
                                                        src={mediaUrl(meal.image_url) ?? ''}
                                                        alt={meal.name}
                                                        className="size-8 rounded-lg object-cover"
                                                    />
                                                )}
                                                <p className="text-sm font-semibold">{meal.name}</p>
                                                {meal.time_hint && (
                                                    <Badge variant="outline">{meal.time_hint}</Badge>
                                                )}
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    {mealKcal(meal)} kcal
                                                </span>
                                            </div>
                                            {meal.notes && (
                                                <p className="mb-1.5 text-xs text-muted-foreground">
                                                    {meal.notes}
                                                </p>
                                            )}
                                            <div className="divide-y rounded-lg border">
                                                {meal.items.length === 0 ? (
                                                    <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                                                        No items
                                                    </p>
                                                ) : (
                                                    meal.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center gap-2 px-3 py-2"
                                                        >
                                                            <button
                                                                type="button"
                                                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                                                onClick={() => item.food && setDetailFood(item.food)}
                                                            >
                                                                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                                                                    {item.food?.image_url ? (
                                                                        <img
                                                                            src={mediaUrl(item.food.image_url) ?? undefined}
                                                                            alt=""
                                                                            className="size-8 object-cover"
                                                                        />
                                                                    ) : (
                                                                        <UtensilsCrossed className="size-3.5" />
                                                                    )}
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm">
                                                                        {item.food?.name ?? item.recipe?.name ?? 'Item'}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.quantity} × {item.portion?.label ?? '100 g'}
                                                                        {item.notes ? ` · ${item.notes}` : ''}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                            {item.food && (
                                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                                    {itemKcal(item)} kcal
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        ))}
                    </>
                )}
            </div>

            {/* Food detail dialog */}
            <FoodDetail food={detailFood} onClose={() => setDetailFood(null)} />
        </>
    );
}
