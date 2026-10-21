import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    actionHref,
    className,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    actionHref?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-10 text-center',
                className,
            )}
        >
            {Icon && (
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-6" />
                </div>
            )}
            <div className="space-y-1">
                <p className="font-medium">{title}</p>
                {description && (
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
            {actionHref && (
                <Button asChild size="sm">
                    <a href={actionHref}>Get started</a>
                </Button>
            )}
        </div>
    );
}
