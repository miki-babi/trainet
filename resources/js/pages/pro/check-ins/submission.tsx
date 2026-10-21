import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Eye, Lock, Send } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/trainet/page-header';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip } from '@/components/trainet/status-chip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
        client: { id: number; user: { name: string } };
        answers: Answer[];
        review: {
            comment: string;
            private_note: string | null;
            reviewed_at: string;
            reviewer: { name: string };
        } | null;
    };
};

export default function SubmissionReview({ submission }: Props) {
    const [comment, setComment] = useState('');
    const [privateNote, setPrivateNote] = useState('');
    const reviewed = !!submission.review;

    const submit = () => {
        router.post(`/pro/check-in-submissions/${submission.id}/review`, {
            comment,
            private_note: privateNote || null,
        });
    };

    return (
        <>
            <Head title={`Check-in — ${submission.client.user.name}`} />
            <div className="mx-auto max-w-3xl space-y-5">
                <PageHeader
                    title={`${submission.client.user.name}`}
                    description={`Due ${new Date(submission.due_on + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                    backHref="/pro/check-in-submissions"
                    actions={
                        <StatusChip
                            tone={
                                submission.status === 'reviewed'
                                    ? 'success'
                                    : submission.status === 'submitted'
                                      ? 'info'
                                      : 'neutral'
                            }
                        >
                            {submission.status}
                        </StatusChip>
                    }
                />

                <SectionCard title="Answers">
                    <div className="divide-y">
                        {submission.answers.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Not submitted yet.
                            </p>
                        )}
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
                                        className="mt-2 w-40 rounded-lg border"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {reviewed ? (
                    <SectionCard title="Your review">
                        <div className="space-y-3">
                            <div>
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                    <Eye className="size-3.5" /> Sent to client
                                </p>
                                <p className="mt-1 text-sm">{submission.review!.comment}</p>
                            </div>
                            {submission.review!.private_note && (
                                <div>
                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                        <Lock className="size-3.5" /> Private note
                                    </p>
                                    <p className="mt-1 text-sm">{submission.review!.private_note}</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                ) : (
                    submission.status === 'submitted' && (
                        <Card>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5">
                                        <Eye className="size-4" /> Feedback (sent to client)
                                    </Label>
                                    <Textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Great week — keep it up. One thing to work on…"
                                        className="min-h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5 text-muted-foreground">
                                        <Lock className="size-4" /> Private note (coach only)
                                    </Label>
                                    <Textarea
                                        value={privateNote}
                                        onChange={(e) => setPrivateNote(e.target.value)}
                                        placeholder="Internal observations, follow-ups…"
                                    />
                                </div>
                                <Button onClick={submit} disabled={!comment.trim()}>
                                    <Send className="mr-1" /> Send review
                                </Button>
                            </CardContent>
                        </Card>
                    )
                )}
            </div>
        </>
    );
}
