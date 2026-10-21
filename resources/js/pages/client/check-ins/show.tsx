import { Head } from '@inertiajs/react';
import { ArrowLeft, MessageSquareQuote } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { goBack } from '@/lib/back';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip } from '@/components/trainet/status-chip';

type Answer = {
    id: number;
    value_rating: number | null;
    value_text: string | null;
    photo_path: string | null;
    question: { prompt: string; type: string };
};

type Props = {
    submission: {
        id: number;
        status: string;
        due_on: string;
        submitted_at: string | null;
        schedule: { template: { name: string } } | null;
        answers: Answer[];
        review: {
            comment: string;
            reviewed_at: string;
            reviewer: { name: string };
        } | null;
    };
};

export default function CheckInShow({ submission }: Props) {
    return (
        <>
            <Head title={submission.schedule?.template?.name ?? 'Check-in'} />
            <div className="space-y-5 py-5">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => goBack('/app/check-ins')}>
                        <ArrowLeft className="mr-1" /> Check-ins
                    </Button>
                    <div className="mt-1 flex items-center gap-2">
                        <h1 className="text-2xl font-bold">
                            {submission.schedule?.template?.name ?? 'Check-in'}
                        </h1>
                        <StatusChip tone={submission.status === 'reviewed' ? 'success' : 'info'}>
                            {submission.status}
                        </StatusChip>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Submitted{' '}
                        {submission.submitted_at
                            ? new Date(submission.submitted_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                            : '—'}
                    </p>
                </div>

                {submission.review && (
                    <Card className="border-success/50 bg-success/5">
                        <CardContent className="space-y-1">
                            <p className="flex items-center gap-1.5 text-sm font-semibold">
                                <MessageSquareQuote className="size-4 text-success" />
                                Coach feedback — {submission.review.reviewer.name}
                            </p>
                            <p className="text-sm">{submission.review.comment}</p>
                        </CardContent>
                    </Card>
                )}

                <SectionCard title="Your answers">
                    <div className="divide-y">
                        {submission.answers.map((a) => (
                            <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                                <p className="text-sm text-muted-foreground">{a.question.prompt}</p>
                                <p className="mt-1 font-medium">
                                    {a.value_rating !== null
                                        ? a.question.type === 'adherence'
                                            ? `${a.value_rating}%`
                                            : `${a.value_rating} / 5`
                                        : a.value_text ?? '—'}
                                </p>
                                {a.photo_path && (
                                    <img
                                        src={`/storage/${a.photo_path}`}
                                        alt="Check-in"
                                        className="mt-2 w-32 rounded-lg border"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
