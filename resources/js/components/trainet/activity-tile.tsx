import { Link } from '@inertiajs/react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActivityTile({
    icon: Icon,
    title,
    subtitle,
    href,
    onClick,
    variant = 'dark',
    avatars,
    action,
    className,
}: {
    icon?: LucideIcon;
    title: string;
    subtitle: string;
    href?: string;
    onClick?: () => void;
    variant?: 'lime' | 'blue' | 'dark' | 'ghost';
    avatars?: string[];
    action?: { icon: LucideIcon; label: string; onClick: () => void };
    className?: string;
}) {
    const styles = {
        lime: 'bg-primary text-primary-foreground',
        blue: 'bg-highlight text-highlight-foreground',
        dark: 'border bg-card text-card-foreground',
        ghost: 'border-2 border-dashed border-border text-muted-foreground',
    }[variant];
    const sub = {
        lime: 'text-primary-foreground/70',
        blue: 'text-highlight-foreground/70',
        dark: 'text-muted-foreground',
        ghost: 'text-muted-foreground',
    }[variant];

    const inner = (
        <div
            className={cn(
                'flex h-36 flex-col justify-between rounded-3xl p-4 transition-transform active:scale-[0.98]',
                styles,
                className,
            )}
        >
            <div className="flex items-start justify-between">
                {avatars ? (
                    <div className="flex -space-x-2">
                        {avatars.map((initial, i) => (
                            <span
                                key={i}
                                className="flex size-7 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold backdrop-blur"
                            >
                                {initial}
                            </span>
                        ))}
                    </div>
                ) : (
                    Icon && <Icon className="size-5 opacity-80" />
                )}
                <div className="flex items-center gap-1.5">
                    {action && (
                        <button
                            type="button"
                            aria-label={action.label}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                action.onClick();
                            }}
                            className="flex size-7 items-center justify-center rounded-full bg-foreground/10 backdrop-blur transition-transform active:scale-90"
                        >
                            <action.icon className="size-3.5" />
                        </button>
                    )}
                    <ArrowUpRight className="size-4 opacity-70" />
                </div>
            </div>
            <div>
                <p className="text-sm leading-tight font-semibold">{title}</p>
                <p className={cn('text-xs', sub)}>{subtitle}</p>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{inner}</Link>;
    }
    return (
        <button type="button" className="w-full text-left" onClick={onClick}>
            {inner}
        </button>
    );
}
