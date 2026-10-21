import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { cn } from '@/lib/utils';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
);

/** Resolve a CSS variable token (--primary, …) to a usable color string. */
const token = (name: string, fallback: string): string => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue(`--${name}`)
            .trim() || fallback
    );
};

export const chartColors = {
    primary: () => token('chart-1', '#84cc16'),
    info: () => token('chart-2', '#818cf8'),
    warning: () => token('chart-4', '#eab308'),
    destructive: () => token('destructive', '#ef4444'),
    muted: () => token('muted-foreground', '#9ca3af'),
    /** Shared accent palette — every chart draws from chart-1..5 in order. */
    accent: () => token('chart-3', '#f472b6'),
    accent2: () => token('chart-5', '#fb923c'),
};

/** Same palette everywhere: lime → periwinkle → pink → amber → orange. */
export const CHART_PALETTE_KEYS = [
    'primary',
    'info',
    'accent',
    'warning',
    'accent2',
] as const;

export type ChartColorKey = keyof typeof chartColors;

/** Apply alpha to a resolved CSS color (oklch, rgb, hex). */
const withAlpha = (color: string, alpha: number): string => {
    if (color.startsWith('oklch(') || color.startsWith('oklab(') || color.startsWith('lch(') || color.startsWith('lab(') || color.startsWith('hsl(')) {
        return color.replace(/\)$/, ` / ${alpha})`);
    }
    if (color.startsWith('rgb(')) {
        return color.replace(/\)$/, ` / ${alpha})`);
    }
    if (color.startsWith('#')) {
        return color + Math.round(alpha * 255).toString(16).padStart(2, '0');
    }
    return color;
};

const baseScale = {
    grid: { color: 'rgba(128,128,128,0.12)' },
    ticks: { color: token('muted-foreground', '#9ca3af'), font: { size: 11 } },
    border: { display: false },
};

const tooltip = {
    backgroundColor: '#1a1f16',
    titleColor: '#e8ecc9',
    bodyColor: '#c9d1b5',
    padding: 10,
    cornerRadius: 10,
};

const baseOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, displayColors: false },
    },
    scales: {
        x: { ...baseScale },
        y: { ...baseScale, beginAtZero: true },
    },
};

export function BarChart({
    labels,
    data,
    color = 'primary',
    horizontal = false,
    className,
}: {
    labels: string[];
    data: number[];
    color?: keyof typeof chartColors;
    horizontal?: boolean;
    className?: string;
}) {
    const c = chartColors[color]();
    const options: ChartOptions<'bar'> = {
        ...baseOptions,
        indexAxis: horizontal ? ('y' as const) : ('x' as const),
    };

    return (
        <div className={cn('h-52', className)}>
            <Bar
                options={options}
                data={{
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: c,
                            borderRadius: 8,
                            borderSkipped: false,
                            barPercentage: 0.7,
                        },
                    ],
                }}
            />
        </div>
    );
}

export function StackedBarChart({
    labels,
    series,
    className,
}: {
    labels: string[];
    series: { label: string; data: number[]; color: keyof typeof chartColors }[];
    className?: string;
}) {
    const options: ChartOptions<'bar'> = {
        ...baseOptions,
        scales: {
            x: { ...baseScale, stacked: true },
            y: { ...baseScale, stacked: true, beginAtZero: true },
        },
    };

    return (
        <div className={cn('h-52', className)}>
            <Bar
                options={options}
                data={{
                    labels,
                    datasets: series.map((s) => ({
                        label: s.label,
                        data: s.data,
                        backgroundColor: chartColors[s.color](),
                        borderRadius: 6,
                        borderSkipped: false,
                        stack: 'total',
                    })),
                }}
            />
        </div>
    );
}

export function LineChart({
    labels,
    data,
    color = 'primary',
    className,
}: {
    labels: string[];
    data: number[];
    color?: keyof typeof chartColors;
    className?: string;
}) {
    const c = chartColors[color]();

    return (
        <div className={cn('h-52', className)}>
            <Line
                options={baseOptions as ChartOptions<'line'>}
                data={{
                    labels,
                    datasets: [
                        {
                            data,
                            borderColor: c,
                            backgroundColor: withAlpha(c, 0.2),
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2.5,
                            pointRadius: 4,
                            pointBackgroundColor: c,
                        },
                    ],
                }}
            />
        </div>
    );
}

export function DoughnutChart({
    labels,
    data,
    colors,
    centerLabel,
    className,
}: {
    labels: string[];
    data: number[];
    colors: (keyof typeof chartColors)[];
    centerLabel?: string;
    className?: string;
}) {
    return (
        <div className={cn('relative h-52', className)}>
            {centerLabel && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="text-xl font-bold">{centerLabel}</p>
                </div>
            )}
            <Doughnut
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, boxWidth: 8, padding: 16 },
                        },
                        tooltip,
                    },
                }}
                data={{
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: colors.map((c) => chartColors[c]()),
                            borderWidth: 0,
                        },
                    ],
                }}
            />
        </div>
    );
}
