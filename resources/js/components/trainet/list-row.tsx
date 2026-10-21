import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ListRow({
    leading,
    title,
    subtitle,
    trailing,
    href,
    onClick,
    className,
}: {
    leading?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    trailing?: ReactNode;
    href?: string;
    onClick?: () => void;
    className?: string;
}) {
    const content = (
        <>
            {leading && <div className="shrink-0">{leading}</div>}
            <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{title}</div>
                {subtitle && (
                    <div className="truncate text-sm text-muted-foreground">
                        {subtitle}
                    </div>
                )}
            </div>
            {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
            {(href || onClick) && (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
        </>
    );

    const classes = cn(
        'flex w-full items-center gap-3 px-1 py-3 text-left transition-colors',
        (href || onClick) && 'hover:bg-accent/50 -mx-2 rounded-lg px-2 active:bg-accent active:scale-[0.99]',
        className,
    );

    if (href) {
        return (
            <a href={href} className={classes}>
                {content}
            </a>
        );
    }
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={classes}>
                {content}
            </button>
        );
    }
    return <div className={classes}>{content}</div>;
}
