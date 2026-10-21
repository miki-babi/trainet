import { Link, router } from '@inertiajs/react';
import { Apple, Pencil, Plus } from 'lucide-react';
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

export type NutritionPlanItem = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    versions: {
        id: number;
        version_number: number;
        status: string;
        days: { id: number; meals: { id: number }[] }[];
    }[];
};

export function NutritionPanel({ plans }: { plans: NutritionPlanItem[] }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const create = () => {
        router.post('/pro/nutrition-plans', { name, description });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {plans.length} plan{plans.length === 1 ? '' : 's'}
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/pro/foods">Food database</Link>
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-1 size-4" /> New plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New nutrition plan</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Cut Phase 1800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
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
            </div>

            {plans.length === 0 ? (
                <EmptyState
                    icon={Apple}
                    title="No nutrition plans"
                    description="Create a meal-plan template to assign to clients."
                />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {plans.map((plan) => (
                        <Card key={plan.id}>
                            <CardContent className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{plan.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {plan.description}
                                        </p>
                                    </div>
                                    <StatusChip tone={plan.status === 'active' ? 'success' : 'neutral'}>
                                        {plan.status}
                                    </StatusChip>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {plan.versions.map((v) => (
                                        <Badge
                                            key={v.id}
                                            variant={v.status === 'published' ? 'default' : 'outline'}
                                        >
                                            v{v.version_number}
                                            {v.days.length > 0 &&
                                                ` · ${v.days[0].meals.length} meals`}
                                            {v.status === 'draft' ? ' · draft' : ''}
                                        </Badge>
                                    ))}
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/pro/nutrition-plans/${plan.id}/edit`}>
                                        <Pencil className="mr-1 size-3.5" /> Open builder
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
