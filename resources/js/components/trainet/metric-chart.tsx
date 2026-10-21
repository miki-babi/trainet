import { cn } from '@/lib/utils';

export type MetricPoint = {
    date: string;
    value: number;
};

export function MetricChart({
    points,
    unit,
    className,
    height = 160,
}: {
    points: MetricPoint[];
    unit?: string;
    className?: string;
    height?: number;
}) {
    if (points.length < 2) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center text-sm text-muted-foreground',
                    className,
                )}
                style={{ height }}
            >
                Not enough data yet
            </div>
        );
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15 || 1;
    const lo = min - pad;
    const hi = max + pad;
    const w = 100;
    const h = 100;

    const x = (i: number) => (i / (points.length - 1)) * w;
    const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
    const path = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
        .join(' ');
    const area = `${path} L${w},${h} L0,${h} Z`;

    return (
        <div className={cn('space-y-1', className)}>
            <svg
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="none"
                className="w-full"
                style={{ height }}
            >
                <path d={area} fill="var(--primary)" opacity={0.08} />
                <path
                    d={path}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
                {points.map((p, i) => (
                    <circle
                        key={p.date + i}
                        cx={x(i)}
                        cy={y(p.value)}
                        r={2}
                        fill="var(--primary)"
                    />
                ))}
            </svg>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                    {points[0].date} — {points[0].value}
                    {unit}
                </span>
                <span>
                    {points[points.length - 1].date} —{' '}
                    {points[points.length - 1].value}
                    {unit}
                </span>
            </div>
        </div>
    );
}
