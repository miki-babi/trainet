import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    className,
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon?: LucideIcon;
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardContent className="flex items-center gap-3">
                {Icon && (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" />
                    </div>
                )}
                <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-muted-foreground">
                        {label}
                    </div>
                    <div className="truncate text-xl font-semibold">{value}</div>
                    {hint && (
                        <div className="truncate text-xs text-muted-foreground">
                            {hint}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
