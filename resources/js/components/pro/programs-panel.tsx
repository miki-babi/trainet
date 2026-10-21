import { Link, router } from '@inertiajs/react';
import { ClipboardList, Eye, Pencil, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import { StatusChip } from '@/components/trainet/status-chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';

type ProgramVersion = {
    id: number;
    number: number;
    status: string;
    days: number;
    published_at: string | null;
};

export type ProgramItem = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    versions: ProgramVersion[];
    assignments: number;
};

export function ProgramsPanel({ programs }: { programs: ProgramItem[] }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const create = () => {
        router.post('/pro/programs', { name, description });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {programs.length} program{programs.length === 1 ? '' : 's'}
                </p>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-1 size-4" /> New program
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New program</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Hypertrophy Block A"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Who it's for, what it does…"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={create} disabled={!name.trim()}>
                                Create & open builder
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {programs.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title="No programs yet"
                    description="Create your first program template to assign to clients."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {programs.map((program) => (
                        <Card key={program.id}>
                            <CardContent className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{program.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {program.description}
                                        </p>
                                    </div>
                                    <StatusChip
                                        tone={program.status === 'active' ? 'success' : 'neutral'}
                                    >
                                        {program.status}
                                    </StatusChip>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {program.versions.map((v) => (
                                        <Badge
                                            key={v.id}
                                            variant={v.status === 'published' ? 'default' : 'outline'}
                                        >
                                            v{v.number} · {v.days} days
                                            {v.status === 'draft' ? ' · draft' : ''}
                                        </Badge>
                                    ))}
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Users className="size-3.5" />
                                        {program.assignments}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" asChild>
                                        <Link href={`/pro/programs/${program.id}/edit`}>
                                            <Pencil className="mr-1 size-3.5" /> Builder
                                        </Link>
                                    </Button>
                                    <Button size="sm" variant="ghost" className="flex-1" asChild>
                                        <Link href={`/pro/programs/${program.id}/preview`}>
                                            <Eye className="mr-1 size-3.5" /> Client view
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
