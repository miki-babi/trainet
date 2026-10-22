import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, Camera, Plus, Send, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SectionCard } from '@/components/trainet/section-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Goal } from '@/types';

type MetricPoint = { id: number; date: string; full_date: string; value: number; unit: string };

type Props = {
    metrics: Record<string, MetricPoint[]>;
    metricDefs: { id: number; name: string; unit: string }[];
    goals: Goal[];
    photos: { id: number; url: string; taken_on: string; label: string | null }[];
    hasPro: boolean;
};

const RANGES = [
    { key: 'week', label: 'Weekly', days: 7 },
    { key: 'month', label: 'Monthly', days: 30 },
    { key: 'all', label: 'All', days: 3650 },
];

function Bars({ values, light = false }: { values: number[]; light?: boolean }) {
    const max = Math.max(...values, 1);
    return (
        <div className="flex h-16 items-end gap-1">
            {values.map((v, i) => (
                <div
                    key={i}
                    className={cn('flex-1 rounded-t-sm', light ? 'bg-white/85' : 'bg-primary')}
                    style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
                />
            ))}
        </div>
    );
}

export default function ProgressIndex({ metrics, metricDefs, goals, photos, hasPro }: Props) {
    const [section, setSection] = useState<'stats' | 'photos' | 'goals'>('stats');
    const [range, setRange] = useState('month');
    const [metricOpen, setMetricOpen] = useState(false);
    const [metricForm, setMetricForm] = useState({
        metric_definition_id: '',
        value: '',
        observed_on: new Date().toISOString().slice(0, 10),
    });
    const [uploading, setUploading] = useState(false);
    const [sharing, setSharing] = useState(false);

    const addMetric = () => {
        router.post(
            '/app/progress/metrics',
            { ...metricForm, metric_definition_id: Number(metricForm.metric_definition_id) },
            { preserveScroll: true, onSuccess: () => setMetricOpen(false) },
        );
    };

    const uploadPhoto = (file: File) => {
        setUploading(true);
        router.post(
            '/app/progress/photos',
            { photo: file },
            { preserveScroll: true, onFinish: () => setUploading(false) },
        );
    };

    const days = RANGES.find((r) => r.key === range)!.days;
    const cutoff = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().slice(0, 10);
    }, [days]);

    const filtered = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(metrics).map(([name, pts]) => [
                    name,
                    pts.filter((p) => p.full_date >= cutoff),
                ]),
            ),
        [metrics, cutoff],
    );

    const names = Object.keys(filtered);
    const hero = names[0];
    const heroPoints = hero ? filtered[hero] : [];
    const heroAvg = heroPoints.length
        ? heroPoints.reduce((a, p) => a + p.value, 0) / heroPoints.length
        : 0;
    const heroDelta =
        heroPoints.length > 1
            ? ((heroPoints.at(-1)!.value - heroPoints[0].value) / heroPoints[0].value) * 100
            : 0;

    const latestAll = (name: string) => metrics[name]?.at(-1);

    return (
        <>
            <Head title="Statistics" />
            <div className="space-y-5 py-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold tracking-tight">Statistics</h1>
                    <div className="flex gap-2">
                        <Dialog open={metricOpen} onOpenChange={setMetricOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Plus className="mr-1 size-4" /> Log
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Log a measurement</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Metric</Label>
                                        <Select
                                            value={metricForm.metric_definition_id}
                                            onValueChange={(v) => setMetricForm({ ...metricForm, metric_definition_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {metricDefs.map((d) => (
                                                    <SelectItem key={d.id} value={String(d.id)}>
                                                        {d.name} ({d.unit})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Value</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={metricForm.value}
                                                onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={metricForm.observed_on}
                                                onChange={(e) => setMetricForm({ ...metricForm, observed_on: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={addMetric} disabled={!metricForm.metric_definition_id || !metricForm.value}>
                                        Save
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button size="sm" asChild disabled={uploading}>
                            <label>
                                <Camera className="mr-1 size-4" /> Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* Section tabs */}
                <div className="flex w-fit gap-1 rounded-full bg-muted p-1">
                    {(
                        [
                            { key: 'stats', label: 'Statistics' },
                            { key: 'photos', label: 'Photos' },
                            { key: 'goals', label: 'Goals' },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setSection(t.key)}
                            className={cn(
                                'rounded-full px-5 py-1.5 text-sm font-medium transition-colors',
                                section === t.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Range pills */}
                {section === 'stats' && (
                <div className="flex w-fit gap-1 rounded-full bg-muted p-1">
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => setRange(r.key)}
                            className={cn(
                                'rounded-full px-5 py-1.5 text-sm font-medium transition-colors',
                                range === r.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                )}

                {/* Hero metric — highlight card */}
                {section === 'stats' && (hero && heroPoints.length > 0 ? (
                    <div className="rounded-3xl bg-highlight p-5 text-highlight-foreground">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">{hero}</p>
                                <p className="text-xs opacity-70">Total for the period</p>
                            </div>
                            <span
                                className={cn(
                                    'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                                    heroDelta >= 0 ? 'bg-white/20' : 'bg-black/20',
                                )}
                            >
                                {heroDelta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                {heroDelta >= 0 ? '+' : ''}
                                {heroDelta.toFixed(1)}%
                            </span>
                        </div>
                        <div className="mt-4">
                            <Bars values={heroPoints.map((p) => p.value)} light />
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/15 pt-3 text-center">
                            {[
                                { label: 'First', v: heroPoints[0].value },
                                { label: 'Average', v: heroAvg },
                                { label: 'Latest', v: heroPoints.at(-1)!.value },
                            ].map((s) => (
                                <div key={s.label}>
                                    <p className="text-[10px] tracking-wide uppercase opacity-70">
                                        {s.label}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {Math.round(s.v * 10) / 10}
                                        <span className="text-xs font-normal opacity-70">
                                            {' '}{heroPoints[0].unit}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <SectionCard title="Statistics">
                        <p className="text-sm text-muted-foreground">
                            No measurements in this range — log one to see your stats.
                        </p>
                    </SectionCard>
                ))}

                {/* Remaining metrics — 2-col stat tiles */}
                {section === 'stats' && names.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                        {names.slice(1).map((name) => {
                            const pts = filtered[name];
                            const last = pts.at(-1);
                            if (!last) {
                                return null;
                            }
                            const delta =
                                pts.length > 1
                                    ? ((last.value - pts[0].value) / pts[0].value) * 100
                                    : 0;
                            return (
                                <div key={name} className="rounded-3xl bg-card p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{name}</p>
                                            <p className="text-xs text-muted-foreground">Average</p>
                                        </div>
                                        <ArrowUpRight className="size-4 text-muted-foreground" />
                                    </div>
                                    <div className="mt-2 flex items-end gap-1.5">
                                        <span className="text-2xl font-bold">
                                            {Math.round(last.value * 10) / 10}
                                        </span>
                                        <span
                                            className={cn(
                                                'mb-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                                delta >= 0
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-destructive/20 text-destructive',
                                            )}
                                        >
                                            {delta >= 0 ? '+' : ''}
                                            {delta.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {pts.length} entries · latest {last.value} {last.unit}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {section === 'goals' &&
                    (goals.filter((g) => g.status === 'active').length > 0 ? (
                    <SectionCard title="Goals">
                        <div className="space-y-4">
                            {goals
                                .filter((g) => g.status === 'active')
                                .map((goal) => {
                                    const current = latestAll(goal.metric === 'weight' ? 'Body weight' : goal.metric)?.value;
                                    const span = (goal.target_value ?? 0) - (goal.start_value ?? 0);
                                    const pct =
                                        current && span
                                            ? Math.max(0, Math.min(100, ((current - (goal.start_value ?? 0)) / span) * 100))
                                            : 0;
                                    return (
                                        <div key={goal.id} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Target className="size-4 text-primary" />
                                                    {goal.title}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {current ? `${current} → ` : ''}
                                                    {goal.target_value} {goal.unit}
                                                </span>
                                            </div>
                                            <Progress value={pct} />
                                        </div>
                                    );
                                })}
                        </div>
                    </SectionCard>
                    ) : (
                        <SectionCard title="Goals">
                            <p className="text-sm text-muted-foreground">
                                No active goals yet — your coach can set them with you.
                            </p>
                        </SectionCard>
                    ))}

                {section === 'photos' && (
                <SectionCard title="Photos">
                    {photos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Add your first progress photo — before/after comparisons come later.
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo) => (
                                <figure key={photo.id}>
                                    <img
                                        src={photo.url}
                                        alt={photo.label ?? 'Progress'}
                                        className="aspect-[2/3] w-full rounded-xl border object-cover"
                                    />
                                    <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                                        {new Date(photo.taken_on + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    )}
                </SectionCard>
                )}

                {hasPro ? (
                    <Button
                        className="h-12 w-full rounded-2xl"
                        disabled={sharing}
                        onClick={() => {
                            setSharing(true);
                            router.post(
                                '/app/progress/share',
                                {},
                                { preserveScroll: true, onFinish: () => setSharing(false) },
                            );
                        }}
                    >
                        <Send className="mr-1" /> Share with your coach
                    </Button>
                ) : (
                    <Button className="h-12 w-full rounded-2xl" variant="outline" asChild>
                        <Link href="/app/professionals">Find a coach to share progress</Link>
                    </Button>
                )}
            </div>
        </>
    );
}
