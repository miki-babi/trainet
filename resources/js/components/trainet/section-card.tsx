import type { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function SectionCard({
    title,
    description,
    action,
    label,
    children,
    className,
    contentClassName,
}: {
    title?: ReactNode;
    description?: string;
    action?: ReactNode;
    /** Telegram-style group label rendered above the card (client .tg areas). */
    label?: ReactNode;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
}) {
    return (
        <section>
            {label && (
                <p className="hidden px-4 pb-1.5 text-[13px] tracking-wide text-muted-foreground uppercase [.tg_&]:block">
                    {label}
                </p>
            )}
            <Card className={cn('gap-4', className)}>
                {(title || action) && (
                    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                        <div className="min-w-0">
                            {title && <CardTitle className="text-base">{title}</CardTitle>}
                            {description && (
                                <CardDescription>{description}</CardDescription>
                            )}
                        </div>
                        {action && <div className="shrink-0">{action}</div>}
                    </CardHeader>
                )}
                <CardContent className={contentClassName}>{children}</CardContent>
            </Card>
        </section>
    );
}
