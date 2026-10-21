import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { goBack } from '@/lib/back';
import { cn } from '@/lib/utils';

export function PageHeader({
    title,
    description,
    backHref,
    actions,
    className,
}: {
    title: string;
    description?: string;
    backHref?: string;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-wrap items-start gap-3', className)}>
            {backHref && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0"
                    aria-label="Back"
                    onClick={() => goBack(backHref)}
                >
                    <ArrowLeft className="size-5" />
                </Button>
            )}
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-extrabold tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
