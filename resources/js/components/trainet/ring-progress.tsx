import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
    /** 0–100 */
    value: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    trackClassName?: string;
    barClassName?: string;
    children?: ReactNode;
};

export function RingProgress({
    value,
    size = 120,
    strokeWidth = 10,
    className,
    trackClassName = 'text-muted',
    barClassName = 'text-primary',
    children,
}: Props) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.max(0, Math.min(100, value));

    return (
        <div
            className={cn('relative inline-flex items-center justify-center', className)}
            style={{ width: '100%', maxWidth: size, aspectRatio: '1 / 1' }}
        >
            <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className={trackClassName}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - pct / 100)}
                    className={cn('transition-[stroke-dashoffset] duration-500', barClassName)}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {children}
            </div>
        </div>
    );
}
