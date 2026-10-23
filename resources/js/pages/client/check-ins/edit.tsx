import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { goBack } from '@/lib/back';
import { useTelegramMainButton } from '@/hooks/use-telegram';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { CheckInQuestion } from '@/types';

type Props = {
    submission: { id: number; due_on: string };
    questions: CheckInQuestion[];
};

export default function CheckInEdit({ submission, questions }: Props) {
    const [answers, setAnswers] = useState<Record<number, string | number | File | null>>({});
    const [errors, setErrors] = useState<string[]>([]);

    const sorted = [...questions].sort((a, b) => a.order - b.order);
    const answered = sorted.filter((q) => {
        const v = answers[q.id];
        return v !== undefined && v !== null && v !== '';
    }).length;

    const submit = () => {
        const missing = sorted
            .filter((q) => q.required && !answers[q.id])
            .map((q) => q.prompt);
        if (missing.length) {
            setErrors(missing);
            return;
        }
        setErrors([]);

        const hasFile = Object.values(answers).some((v) => v instanceof File);
        const payload: Record<string, unknown> = {};
        for (const [qid, value] of Object.entries(answers)) {
            if (value !== undefined && value !== null && value !== '') {
                payload[qid] = value;
            }
        }
        router.put(
            `/app/check-ins/${submission.id}`,
            { answers: payload } as never,
            { forceFormData: hasFile },
        );
    };

    useTelegramMainButton({ text: 'SUBMIT CHECK-IN', onClick: submit });

    return (
        <>
            <Head title="Weekly check-in" />
            <div className="space-y-5 py-5">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => goBack('/app/check-ins')}>
                        <ArrowLeft className="mr-1" /> Back
                    </Button>
                    <h1 className="mt-1 text-[1.75rem] font-bold">Weekly check-in</h1>
                    <p className="text-sm text-muted-foreground">
                        Due {new Date(submission.due_on + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                        <Progress value={(answered / sorted.length) * 100} className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                            {answered}/{sorted.length}
                        </span>
                    </div>
                </div>

                {errors.length > 0 && (
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardContent className="py-3 text-sm">
                            <p className="font-medium text-destructive">Please answer:</p>
                            <ul className="mt-1 list-inside list-disc text-muted-foreground">
                                {errors.map((e) => (
                                    <li key={e}>{e}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {sorted.map((q, i) => (
                        <Card key={q.id}>
                            <CardContent className="space-y-3">
                                <Label className="text-base font-medium">
                                    {i + 1}. {q.prompt}
                                    {q.required && <span className="ml-1 text-destructive">*</span>}
                                </Label>
                                {q.type === 'rating' && (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setAnswers({ ...answers, [q.id]: n })}
                                                className={cn(
                                                    'flex size-11 items-center justify-center rounded-full border-2 font-semibold transition-colors',
                                                    answers[q.id] === n
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'text-muted-foreground hover:border-primary/50',
                                                )}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {q.type === 'adherence' && (
                                    <div className="flex gap-2">
                                        {[0, 25, 50, 75, 100].map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setAnswers({ ...answers, [q.id]: n })}
                                                className={cn(
                                                    'flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors',
                                                    answers[q.id] === n
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'text-muted-foreground hover:border-primary/50',
                                                )}
                                            >
                                                {n}%
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {q.type === 'text' && (
                                    <Textarea
                                        value={(answers[q.id] as string) ?? ''}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        placeholder="Write freely…"
                                    />
                                )}
                                {q.type === 'photo' && (
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setAnswers({ ...answers, [q.id]: e.target.files?.[0] ?? null })
                                        }
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Button size="lg" className="h-13 w-full text-base" onClick={submit}>
                    <Send className="mr-1" /> Submit check-in
                </Button>
            </div>
        </>
    );
}
