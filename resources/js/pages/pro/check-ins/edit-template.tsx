import { Head, router } from '@inertiajs/react';
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type Question = {
    id?: number;
    prompt: string;
    type: 'rating' | 'text' | 'photo' | 'adherence';
    required: boolean;
};

type Props = {
    template: {
        id: number;
        name: string;
        description: string | null;
        questions: (Question & { id: number; order: number })[];
    };
};

const TYPE_OPTIONS = [
    { value: 'rating', label: 'Rating (1–5)' },
    { value: 'adherence', label: 'Adherence %' },
    { value: 'text', label: 'Free text' },
    { value: 'photo', label: 'Photo upload' },
];

export default function EditTemplate({ template }: Props) {
    const [name, setName] = useState(template.name);
    const [description, setDescription] = useState(template.description ?? '');
    const [questions, setQuestions] = useState<Question[]>(
        [...template.questions]
            .sort((a, b) => a.order - b.order)
            .map((q) => ({ id: q.id, prompt: q.prompt, type: q.type, required: q.required })),
    );
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();

    const updateQ = (i: number, patch: Partial<Question>) => {
        const next = [...questions];
        next[i] = { ...next[i], ...patch };
        setQuestions(next);
    };

    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= questions.length) {
            return;
        }
        const next = [...questions];
        [next[i], next[j]] = [next[j], next[i]];
        setQuestions(next);
    };

    const save = () => {
        markSaving();
        router.put(
            `/pro/check-in-templates/${template.id}`,
            {
                name,
                description,
                questions: questions.map((q) => ({
                    id: q.id ?? null,
                    prompt: q.prompt,
                    type: q.type,
                    required: q.required,
                })),
            },
            { preserveScroll: true, onSuccess: markSaved, onError: markError },
        );
    };

    return (
        <>
            <Head title={`Edit ${template.name}`} />
            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/pro/check-ins">
                            <ArrowLeft className="mr-1" /> Check-ins
                        </Link>
                    </Button>
                    <SaveIndicator state={saveState} />
                    <Button className="ml-auto" onClick={save}>
                        <Save className="mr-1" /> Save template
                    </Button>
                </div>

                <Card>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Template name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <h2 className="font-semibold">Questions</h2>
                    {questions.map((q, i) => (
                        <Card key={i}>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Q{i + 1}
                                    </span>
                                    <Input
                                        value={q.prompt}
                                        onChange={(e) => updateQ(i, { prompt: e.target.value })}
                                        placeholder="Question prompt…"
                                        className="min-w-0 flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-destructive"
                                        onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            title="Move up"
                                            onClick={() => move(i, -1)}
                                        >
                                            <GripVertical className="size-3.5 rotate-90" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            title="Move down"
                                            onClick={() => move(i, 1)}
                                        >
                                            <GripVertical className="size-3.5 -rotate-90" />
                                        </Button>
                                    </div>
                                    <Select
                                        value={q.type}
                                        onValueChange={(v) => updateQ(i, { type: v as Question['type'] })}
                                    >
                                        <SelectTrigger className="h-8 w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPE_OPTIONS.map((o) => (
                                                <SelectItem key={o.value} value={o.value}>
                                                    {o.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <label className="ml-auto flex items-center gap-1.5 text-sm whitespace-nowrap">
                                        <Switch
                                            checked={q.required}
                                            onCheckedChange={(c) => updateQ(i, { required: c })}
                                        />
                                        Required
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() =>
                            setQuestions([...questions, { prompt: '', type: 'text', required: true }])
                        }
                    >
                        <Plus className="mr-1" /> Add question
                    </Button>
                </div>
            </div>
        </>
    );
}
