import { Head } from '@inertiajs/react';
import { ClipboardCheck } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { StatusChip, type StatusTone } from '@/components/trainet/status-chip';

type Submission = {
    id: number;
    due_on: string;
    status: string;
    submitted_at: string | null;
    schedule: { template: { name: string } } | null;
};

const tone: Record<string, StatusTone> = {
    pending: 'warning',
    submitted: 'info',
    reviewed: 'success',
};

export default function CheckInsIndex({ submissions }: { submissions: Submission[] }) {
    return (
        <>
            <Head title="Check-ins" />
            <div className="space-y-5 py-5">
                <h1 className="text-[1.75rem] font-bold tracking-tight">Check-ins</h1>
                {submissions.length === 0 ? (
                    <EmptyState
                        icon={ClipboardCheck}
                        title="No check-ins yet"
                        description="Your coach will schedule weekly check-ins here."
                    />
                ) : (
                    <div className="divide-y rounded-xl border bg-card">
                        {submissions.map((s) => {
                            const overdue = s.status === 'pending' && s.due_on < new Date().toISOString().slice(0, 10);
                            return (
                                <ListRow
                                    key={s.id}
                                    leading={<ClipboardCheck className="size-4 text-muted-foreground" />}
                                    title={s.schedule?.template?.name ?? 'Check-in'}
                                    subtitle={`Due ${new Date(s.due_on + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}${overdue ? ' — overdue' : ''}`}
                                    trailing={
                                        <StatusChip tone={overdue ? 'danger' : tone[s.status] ?? 'neutral'}>
                                            {overdue ? 'overdue' : s.status}
                                        </StatusChip>
                                    }
                                    href={
                                        s.status === 'pending'
                                            ? `/app/check-ins/${s.id}/edit`
                                            : `/app/check-ins/${s.id}`
                                    }
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
