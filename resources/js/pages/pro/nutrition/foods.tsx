import { Head, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/trainet/page-header';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Food = {
    id: number;
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    category: { name: string } | null;
    portions: { id: number; label: string }[];
};

type Props = {
    foods: Food[];
    categories: { id: number; name: string }[];
    filters: { search: string };
};

export default function FoodsIndex({ foods, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        food_category_id: '',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        fiber_g: '',
        default_portion_label: '',
        default_portion_grams: '',
    });

    const create = () => {
        router.post(
            '/pro/foods',
            { ...form, food_category_id: Number(form.food_category_id) },
            { preserveScroll: true, onSuccess: () => setOpen(false) },
        );
    };

    const numericFields = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'] as const;

    return (
        <>
            <Head title="Food database" />
            <div className="space-y-5">
                <PageHeader
                    title="Food database"
                    description={`${foods.length} foods with macro data per 100 g`}
                    actions={
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-1" /> New food
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Add food</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select
                                                value={form.food_category_id}
                                                onValueChange={(v) => setForm({ ...form, food_category_id: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                        Macros per 100 g
                                    </p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {numericFields.map((key) => (
                                            <div key={key} className="space-y-1">
                                                <Label className="text-xs capitalize">
                                                    {key === 'calories' ? 'kcal' : key.replace('_g', '')}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={form[key]}
                                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                                    className="h-9"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                        Default portion (optional)
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Label</Label>
                                            <Input
                                                value={form.default_portion_label}
                                                onChange={(e) => setForm({ ...form, default_portion_label: e.target.value })}
                                                placeholder="1 cup"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Grams</Label>
                                            <Input
                                                type="number"
                                                value={form.default_portion_grams}
                                                onChange={(e) => setForm({ ...form, default_portion_grams: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={create}
                                        disabled={!form.name || !form.food_category_id || !form.calories}
                                    >
                                        Add food
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    }
                />

                <div className="relative max-w-xs">
                    <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            router.get('/pro/foods', { search }, { preserveState: true, replace: true })
                        }
                        onBlur={() =>
                            router.get('/pro/foods', { search }, { preserveState: true, replace: true })
                        }
                        placeholder="Search foods…"
                        className="pl-9"
                    />
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <Table className="min-w-[640px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Food</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">kcal/100g</TableHead>
                                <TableHead className="text-right">P</TableHead>
                                <TableHead className="text-right">C</TableHead>
                                <TableHead className="text-right">F</TableHead>
                                <TableHead>Portions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {foods.map((food) => (
                                <TableRow key={food.id}>
                                    <TableCell className="font-medium">{food.name}</TableCell>
                                    <TableCell>
                                        {food.category ? (
                                            <Badge variant="secondary">{food.category.name}</Badge>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">{food.calories}</TableCell>
                                    <TableCell className="text-right">{food.protein_g}g</TableCell>
                                    <TableCell className="text-right">{food.carbs_g}g</TableCell>
                                    <TableCell className="text-right">{food.fat_g}g</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {food.portions.map((p) => p.label).join(', ') || '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}
