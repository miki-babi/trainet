import { Head } from '@inertiajs/react';
import { Dumbbell } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip, type StatusTone } from '@/components/trainet/status-chip';

type SessionRow = {
    id: number;
    date: string;
    day: string | null;
    status: string;
    duration: number | null;
    sets_done: number;
    total_volume: number;
};

const tone: Record<string, StatusTone> = {
    completed: 'success',
    skipped: 'danger',
    scheduled: 'neutral',
    in_progress: 'info',
    paused: 'warning',
};

export default function HistoryIndex({ sessions }: { sessions: SessionRow[] }) {
    const grouped = sessions.reduce<Record<string, SessionRow[]>>((acc, s) => {
        const month = new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
        });
        (acc[month] ??= []).push(s);
        return acc;
    }, {});

    return (
        <>
            <Head title="History" />
            <div className="space-y-5 py-5">
                <h1 className="text-[1.75rem] font-bold tracking-tight">Workout history</h1>
                {sessions.length === 0 ? (
                    <EmptyState
                        icon={Dumbbell}
                        title="No workouts yet"
                        description="Completed sessions will show up here."
                    />
                ) : (
                    Object.entries(grouped).map(([month, rows]) => (
                        <SectionCard key={month} label={month}>
                            <div >
                                {rows.map((s) => (
                                    <ListRow
                                        key={s.id}
                                        title={s.day ?? 'Workout'}
                                        subtitle={`${new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}${
                                            s.status === 'completed'
                                                ? ` · ${s.sets_done} sets · ${s.total_volume} kg${s.duration ? ` · ${Math.round(s.duration / 60)} min` : ''}`
                                                : ''
                                        }`}
                                        trailing={
                                            <StatusChip tone={tone[s.status] ?? 'neutral'}>
                                                {s.status.replace('_', ' ')}
                                            </StatusChip>
                                        }
                                        href={`/app/workouts/${s.id}`}
                                    />
                                ))}
                            </div>
                        </SectionCard>
                    ))
                )}
            </div>
        </>
    );
}
