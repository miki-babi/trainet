import { ArrowLeft, Check, UtensilsCrossed } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type FoodDetailData = {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number | null;
    sodium_mg?: number | null;
    serving_description?: string | null;
    image_url?: string | null;
};

export function FoodDetailBody({
    food,
    checked,
    onToggle,
    onBack,
    backLabel,
}: {
    food: FoodDetailData;
    checked?: boolean;
    onToggle?: () => void;
    onBack?: () => void;
    backLabel?: string;
}) {
    return (
        <>
            <div className="relative h-36 bg-muted">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 py-1.5 pr-3 pl-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/60"
                    >
                        <ArrowLeft className="size-3.5" />
                        {backLabel ?? "Back"}
                    </button>
                )}
                {onToggle && (
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`Mark ${food.name} as eaten`}
                        onClick={onToggle}
                        className={cn(
                            "absolute top-3 right-3 flex size-8 items-center justify-center rounded-full border-2 shadow-sm transition-colors",
                            checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-white/80 bg-black/30 text-transparent backdrop-blur hover:border-white",
                        )}
                    >
                        <Check className="size-4" strokeWidth={3} />
                    </button>
                )}
                {food.image_url ? (
                    <img
                        src={mediaUrl(food.image_url) ?? undefined}
                        alt={food.name}
                        className="h-36 w-full object-cover"
                    />
                ) : (
                    <div className="flex h-36 items-center justify-center text-muted-foreground">
                        <UtensilsCrossed className="size-8" />
                    </div>
                )}
            </div>
            <div className="space-y-4 p-5">
                <DialogHeader className="space-y-1">
                    <DialogTitle>{food.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        {food.serving_description ?? "per 100 g"}
                    </p>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                        ["kcal", Math.round(food.calories)],
                        ["Protein", `${Math.round(food.protein_g)}g`],
                        ["Carbs", `${Math.round(food.carbs_g)}g`],
                        ["Fat", `${Math.round(food.fat_g)}g`],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-xl bg-muted px-1 py-2"
                        >
                            <p className="text-sm font-bold">{value}</p>
                            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>
                {(food.fiber_g != null || food.sodium_mg != null) && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        {food.fiber_g != null && (
                            <span>Fiber {food.fiber_g} g</span>
                        )}
                        {food.sodium_mg != null && (
                            <span>Sodium {food.sodium_mg} mg</span>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

export function FoodDetail({
    food,
    onClose,
}: {
    food: FoodDetailData | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={!!food} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="overflow-hidden p-0">
                {food && <FoodDetailBody food={food} />}
            </DialogContent>
        </Dialog>
    );
}
