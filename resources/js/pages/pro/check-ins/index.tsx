import { Head, Link, router } from '@inertiajs/react';
import { ClipboardCheck, Pencil, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { PageHeader } from '@/components/trainet/page-header';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip } from '@/components/trainet/status-chip';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Template = {
    id: number;
    name: string;
    description: string | null;
    questions: { id: number }[];
};

type Schedule = {
    id: number;
    weekday: number;
    status: string;
    client: { user: { name: string } };
    template: { name: string };
};

const WEEKDAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CheckInsIndex({
    templates,
    schedules,
    clients,
}: {
    templates: Template[];
    schedules: Schedule[];
    clients: { id: number; name: string }[];
}) {
    const [tplOpen, setTplOpen] = useState(false);
    const [schedOpen, setSchedOpen] = useState(false);
    const [tplForm, setTplForm] = useState({ name: '', description: '' });
    const [schedForm, setSchedForm] = useState({
        client_id: '',
        check_in_template_id: '',
        weekday: '5',
        starts_on: new Date().toISOString().slice(0, 10),
    });

    return (
        <>
            <Head title="Check-ins" />
            <div className="space-y-6">
                <PageHeader
                    title="Check-ins"
                    description="Weekly templates, schedules, and the submissions inbox."
                    actions={
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/pro/check-in-submissions">Submissions inbox</Link>
                            </Button>
                            <Dialog open={tplOpen} onOpenChange={setTplOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-1" /> New template
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>New check-in template</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={tplForm.name}
                                                onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                                                placeholder="e.g. Weekly Check-in"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={tplForm.description}
                                                onChange={(e) => setTplForm({ ...tplForm, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() => router.post('/pro/check-in-templates', tplForm)}
                                            disabled={!tplForm.name.trim()}
                                        >
                                            Create & build questions
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    <SectionCard title="Templates">
                        {templates.length === 0 ? (
                            <EmptyState icon={ClipboardCheck} title="No templates" />
                        ) : (
                            <div className="divide-y">
                                {templates.map((t) => (
                                    <ListRow
                                        key={t.id}
                                        title={t.name}
                                        subtitle={`${t.questions.length} questions`}
                                        trailing={
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/pro/check-in-templates/${t.id}/edit`}>
                                                    <Pencil className="mr-1 size-3.5" /> Edit
                                                </Link>
                                            </Button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Schedules"
                        action={
                            <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Send className="mr-1 size-3.5" /> Schedule
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Schedule a check-in</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Client</Label>
                                            <Select
                                                value={schedForm.client_id}
                                                onValueChange={(v) => setSchedForm({ ...schedForm, client_id: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select client" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Template</Label>
                                            <Select
                                                value={schedForm.check_in_template_id}
                                                onValueChange={(v) => setSchedForm({ ...schedForm, check_in_template_id: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates.map((t) => (
                                                        <SelectItem key={t.id} value={String(t.id)}>
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label>Every</Label>
                                                <Select
                                                    value={schedForm.weekday}
                                                    onValueChange={(v) => setSchedForm({ ...schedForm, weekday: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {WEEKDAYS.slice(1).map((d, i) => (
                                                            <SelectItem key={i + 1} value={String(i + 1)}>
                                                                {d}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>First due</Label>
                                                <Input
                                                    type="date"
                                                    value={schedForm.starts_on}
                                                    onChange={(e) => setSchedForm({ ...schedForm, starts_on: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            disabled={!schedForm.client_id || !schedForm.check_in_template_id}
                                            onClick={() => {
                                                router.post('/pro/check-in-schedules', {
                                                    ...schedForm,
                                                    client_id: Number(schedForm.client_id),
                                                    check_in_template_id: Number(schedForm.check_in_template_id),
                                                    weekday: Number(schedForm.weekday),
                                                });
                                                setSchedOpen(false);
                                            }}
                                        >
                                            Schedule
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        }
                    >
                        {schedules.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No schedules yet.</p>
                        ) : (
                            <div className="divide-y">
                                {schedules.map((s) => (
                                    <ListRow
                                        key={s.id}
                                        title={s.client.user.name}
                                        subtitle={`${s.template.name} · every ${WEEKDAYS[s.weekday]}`}
                                        trailing={
                                            <StatusChip tone={s.status === 'active' ? 'success' : 'neutral'}>
                                                {s.status}
                                            </StatusChip>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>
            </div>
        </>
    );
}
