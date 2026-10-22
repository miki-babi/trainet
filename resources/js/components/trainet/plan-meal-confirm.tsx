import { Link, router } from "@inertiajs/react";
import { Camera, Check, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { type FoodDetailData } from "@/components/trainet/food-detail";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type PlanMealConfirmItem = {
    id: number;
    name: string;
    portion?: string | null;
    kcal?: number | null;
    food?: FoodDetailData | null;
};

export type PlanMealConfirmMeal = {
    id: number;
    name: string;
    kcal?: number;
    items: PlanMealConfirmItem[];
    logged_item_ids?: number[];
};

type Props = {
    meal: PlanMealConfirmMeal | null;
    date?: string;
    onClose: () => void;
};

export function PlanMealConfirm({ meal, date, onClose }: Props) {
    const [checked, setChecked] = useState<number[]>([]);
    const [detail, setDetail] = useState<PlanMealConfirmItem | null>(null);

    useEffect(() => {
        setChecked(
            meal?.logged_item_ids?.length
                ? meal.logged_item_ids
                : (meal?.items.map((i) => i.id) ?? []),
        );
        setDetail(null);
    }, [meal]);

    const toggle = (id: number) =>
        setChecked((cur) =>
            cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        );

    const confirm = () => {
        if (!meal || checked.length === 0) {
            return;
        }
        router.post(
            `/app/nutrition/plan-meals/${meal.id}/confirm`,
            { logged_on: date, item_ids: checked },
            { preserveScroll: true, onSuccess: onClose },
        );
    };

    return (
        <Dialog open={!!meal} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        What did you eat{meal ? ` — ${meal.name}` : ""}?
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Check off the items from your plan that you ate. Tap an item
                    for details.
                </p>
                <div className="space-y-1">
                    {meal?.items.map((item) => {
                        const isChecked = checked.includes(item.id);
                        const isExpanded = detail?.id === item.id;
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "rounded-xl px-2 py-2 transition-colors",
                                    isChecked ? "bg-primary/5" : "hover:bg-muted",
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        aria-label={`View ${item.name}`}
                                        aria-expanded={isExpanded}
                                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        onClick={() =>
                                            item.food &&
                                            setDetail(isExpanded ? null : item)
                                        }
                                    >
                                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                                            {item.food?.image_url ? (
                                                <img
                                                    src={
                                                        mediaUrl(
                                                            item.food.image_url,
                                                        ) ?? undefined
                                                    }
                                                    alt={item.name}
                                                    className="size-11 object-cover"
                                                />
                                            ) : (
                                                <UtensilsCrossed className="size-4" />
                                            )}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium">
                                                {item.name}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.portion}
                                                {item.portion && item.kcal
                                                    ? " · "
                                                    : ""}
                                                {item.kcal
                                                    ? `${item.kcal} kcal`
                                                    : ""}
                                            </span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={isChecked}
                                        aria-label={`Mark ${item.name} as eaten`}
                                        onClick={() => toggle(item.id)}
                                        className={cn(
                                            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                            isChecked
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-muted-foreground/40 bg-transparent text-transparent hover:border-primary/60",
                                        )}
                                    >
                                        <Check
                                            className="size-4"
                                            strokeWidth={3}
                                        />
                                    </button>
                                </div>
                                {isExpanded && item.food && (
                                    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                                        <div className="relative h-28 overflow-hidden rounded-lg bg-muted">
                                            {item.food.image_url ? (
                                                <img
                                                    src={
                                                        mediaUrl(
                                                            item.food.image_url,
                                                        ) ?? undefined
                                                    }
                                                    alt={item.name}
                                                    className="h-28 w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-28 items-center justify-center text-muted-foreground">
                                                    <UtensilsCrossed className="size-7" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {item.food.serving_description ??
                                                "per 100 g"}
                                        </p>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            {[
                                                [
                                                    "kcal",
                                                    Math.round(
                                                        item.food.calories,
                                                    ),
                                                ],
                                                [
                                                    "Protein",
                                                    `${Math.round(item.food.protein_g)}g`,
                                                ],
                                                [
                                                    "Carbs",
                                                    `${Math.round(item.food.carbs_g)}g`,
                                                ],
                                                [
                                                    "Fat",
                                                    `${Math.round(item.food.fat_g)}g`,
                                                ],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="rounded-xl bg-muted px-1 py-2"
                                                >
                                                    <p className="text-sm font-bold">
                                                        {value}
                                                    </p>
                                                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                                        {label}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        {(item.food.fiber_g != null ||
                                            item.food.sodium_mg != null) && (
                                            <div className="flex gap-4 text-xs text-muted-foreground">
                                                {item.food.fiber_g != null && (
                                                    <span>
                                                        Fiber {item.food.fiber_g}{" "}
                                                        g
                                                    </span>
                                                )}
                                                {item.food.sodium_mg !=
                                                    null && (
                                                    <span>
                                                        Sodium{" "}
                                                        {item.food.sodium_mg} mg
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            role="checkbox"
                                            aria-checked={isChecked}
                                            onClick={() => toggle(item.id)}
                                            className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/80"
                                        >
                                            {isChecked ? "Eaten" : "Mark as eaten"}
                                            <span
                                                className={cn(
                                                    "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                                                    isChecked
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-muted-foreground/40 bg-transparent text-transparent",
                                                )}
                                            >
                                                <Check
                                                    className="size-3.5"
                                                    strokeWidth={3}
                                                />
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" className="rounded-xl" asChild>
                        <Link
                            href={`/app/nutrition/log?meal=${encodeURIComponent(meal?.name ?? "")}${date ? `&date=${date}` : ""}`}
                        >
                            <Camera className="mr-1.5 size-4" /> Log something
                            else
                        </Link>
                    </Button>
                    <Button
                        className="rounded-xl font-semibold"
                        disabled={checked.length === 0}
                        onClick={confirm}
                    >
                        Log {checked.length} item
                        {checked.length === 1 ? "" : "s"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
