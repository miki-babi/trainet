import { Head } from '@inertiajs/react';
import { ClipboardCheck, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { PageHeader } from '@/components/trainet/page-header';
import { StatusChip, type StatusTone } from '@/components/trainet/status-chip';

type Submission = {
    id: number;
    due_on: string;
    status: string;
    submitted_at: string | null;
    client: { user: { name: string } };
};

const tone: Record<string, StatusTone> = {
    pending: 'neutral',
    submitted: 'info',
    reviewed: 'success',
};

export default function SubmissionsIndex({ submissions }: { submissions: Submission[] }) {
    const needsReview = submissions.filter((s) => s.status === 'submitted');
    const rest = submissions.filter((s) => s.status !== 'submitted');

    return (
        <>
            <Head title="Check-in submissions" />
            <div className="space-y-6">
                <PageHeader
                    title="Submissions inbox"
                    description={`${needsReview.length} awaiting review`}
                    backHref="/pro/today"
                />

                <section className="space-y-2">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Awaiting review
                    </h2>
                    {needsReview.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title="Inbox zero"
                            description="No submissions waiting for review."
                        />
                    ) : (
                        <div className="divide-y rounded-xl border bg-card">
                            {needsReview.map((s) => (
                                <ListRow
                                    key={s.id}
                                    leading={<ClipboardCheck className="size-4 text-info" />}
                                    title={s.client.user.name}
                                    subtitle={`Due ${new Date(s.due_on + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · submitted ${s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}`}
                                    trailing={<StatusChip tone="info">Review</StatusChip>}
                                    href={`/pro/check-in-submissions/${s.id}`}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        History
                    </h2>
                    <div className="divide-y rounded-xl border bg-card">
                        {rest.map((s) => (
                            <ListRow
                                key={s.id}
                                leading={<ClipboardCheck className="size-4 text-muted-foreground" />}
                                title={s.client.user.name}
                                subtitle={`Due ${new Date(s.due_on + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                                trailing={
                                    <StatusChip tone={tone[s.status] ?? 'neutral'}>
                                        {s.status}
                                    </StatusChip>
                                }
                                href={`/pro/check-in-submissions/${s.id}`}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
