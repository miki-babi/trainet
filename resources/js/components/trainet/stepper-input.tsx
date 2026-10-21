import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function StepperInput({
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix,
    disabled,
    className,
}: {
    value: number | null;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    disabled?: boolean;
    className?: string;
}) {
    const current = value ?? 0;
    const bump = (delta: number) => {
        let next = current + delta * step;
        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        onChange(Number(next.toFixed(2)));
    };

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                disabled={disabled || (min !== undefined && current <= min)}
                onClick={() => bump(-1)}
                aria-label="Decrease"
            >
                <Minus className="size-4" />
            </Button>
            <div className="flex min-w-16 flex-col items-center">
                <input
                    type="number"
                    inputMode="decimal"
                    value={value ?? ''}
                    disabled={disabled}
                    onChange={(e) =>
                        e.target.value === ''
                            ? onChange(0)
                            : onChange(Number(e.target.value))
                    }
                    className="w-full bg-transparent text-center text-lg font-semibold outline-none"
                />
                {suffix && (
                    <span className="text-[10px] text-muted-foreground">
                        {suffix}
                    </span>
                )}
            </div>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                disabled={disabled || (max !== undefined && current >= max)}
                onClick={() => bump(1)}
                aria-label="Increase"
            >
                <Plus className="size-4" />
            </Button>
        </div>
    );
}
