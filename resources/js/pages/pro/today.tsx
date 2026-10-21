import { Head, Link, router } from '@inertiajs/react';
import {
    ClipboardCheck,
    Dumbbell,
    MoonStar,
    TrendingDown,
} from 'lucide-react';
import { ActivityTile } from '@/components/trainet/activity-tile';
import { DayStrip, type DayStripDay } from '@/components/trainet/day-strip';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import type { StatusTone } from '@/components/trainet/status-chip';

type CheckIn = {
    id: number;
    client: string;
    template: string;
    status: string;
    submitted_at: string | null;
    due_on: string;
    answers: number;
};

type AttentionItem = {
    kind: 'missed_workout' | 'stalled';
    id: number;
    title: string;
    detail: string;
    href: string;
};

type Props = {
    professionalName: string;
    week: DayStripDay[];
    checkIns: CheckIn[];
    attention: AttentionItem[];
    activity: { id: string; text: string; at: string; href: string }[];
};

const attentionMeta: Record<
    AttentionItem['kind'],
    { icon: typeof ClipboardCheck; tone: StatusTone; label: string }
> = {
    missed_workout: { icon: Dumbbell, tone: 'danger', label: 'Missed' },
    stalled: { icon: TrendingDown, tone: 'warning', label: 'Stalled' },
};

export default function ProToday({
    professionalName,
    week,
    checkIns,
    attention,
    activity,
}: Props) {
    return (
        <>
            <Head title="Today" />
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </p>
                    <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">
                        Good day, {professionalName.split(' ')[0]}
                    </h1>
                </div>

                <DayStrip
                    days={week}
                    onSelect={(date) =>
                        router.visit('/pro/calendar', { data: { week: date } })
                    }
                />

                {/* Today's check-ins */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Today's check-ins
                        </h2>
                        <Link
                            href="/pro/check-in-submissions"
                            className="text-sm text-primary hover:underline"
                        >
                            All submissions
                        </Link>
                    </div>
                    {checkIns.length === 0 ? (
                        <EmptyState
                            icon={ClipboardCheck}
                            title="No check-ins due today"
                            description="Client check-ins due today will show up here."
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {checkIns.map((ci) => (
                                <ActivityTile
                                    key={ci.id}
                                    avatars={[ci.client.charAt(0)]}
                                    title={ci.client}
                                    subtitle={
                                        ci.status === 'pending'
                                            ? `${ci.template} · waiting`
                                            : `${ci.template} · ${ci.submitted_at ?? ''}`
                                    }
                                    href={`/pro/check-in-submissions/${ci.id}`}
                                    variant={
                                        ci.status === 'submitted'
                                            ? 'blue'
                                            : ci.status === 'reviewed'
                                              ? 'dark'
                                              : 'ghost'
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Needs attention */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Needs attention
                    </h2>
                    {attention.length === 0 ? (
                        <EmptyState
                            icon={MoonStar}
                            title="All clear"
                            description="Nothing needs your attention right now."
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {attention.map((item) => {
                                const meta = attentionMeta[item.kind];
                                return (
                                    <ActivityTile
                                        key={`${item.kind}-${item.id}`}
                                        icon={meta.icon}
                                        title={item.title}
                                        subtitle={`${meta.label} · ${item.detail}`}
                                        href={item.href}
                                        variant={
                                            item.kind === 'missed_workout'
                                                ? 'dark'
                                                : 'ghost'
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                <SectionCard title="Recent activity">
                    {activity.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No recent client activity.
                        </p>
                    ) : (
                        <div className="divide-y">
                            {activity.map((item) => (
                                <ListRow
                                    key={item.id}
                                    title={item.text}
                                    subtitle={item.at}
                                    href={item.href}
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </>
    );
}
