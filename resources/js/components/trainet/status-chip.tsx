import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const toneClasses = {
    neutral: 'bg-muted text-muted-foreground border-transparent',
    success: 'bg-success/15 text-success border-transparent',
    warning: 'bg-warning/20 text-warning border-transparent',
    info: 'bg-info/15 text-info border-transparent',
    danger: 'bg-destructive/15 text-destructive border-transparent',
    primary: 'bg-primary/15 text-primary border-transparent',
} as const;

export type StatusTone = keyof typeof toneClasses;

export function StatusChip({
    tone = 'neutral',
    children,
    className,
}: {
    tone?: StatusTone;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Badge variant="outline" className={cn(toneClasses[tone], className)}>
            {children}
        </Badge>
    );
}
