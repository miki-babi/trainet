import { Head, Link, router } from '@inertiajs/react';
import { Check, Clock, Search, Star, UserRound } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { EmptyState } from '@/components/trainet/empty-state';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

type Professional = {
    id: number;
    name: string;
    avatar: string | null;
    type: 'trainer' | 'nutritionist' | 'both';
    business_name: string | null;
    bio: string | null;
    specialties: string[];
    rating: string | null;
    reviews_count: number;
    price_label: string | null;
    coaching_mode: 'online' | 'in_person' | 'both';
    state: 'none' | 'pending' | 'active';
};

type Props = {
    professionals: Professional[];
    specialties: string[];
    filters: { q: string; types: string[]; specialties: string[] };
};

const typeLabels: Record<string, string> = {
    trainer: 'Personal Trainer',
    nutritionist: 'Nutritionist',
    both: 'Coach + Nutritionist',
};

const typeChips = [
    { key: 'trainers', label: 'Trainers' },
    { key: 'nutritionists', label: 'Nutritionists' },
];

export default function ProfessionalsIndex({ professionals, specialties, filters }: Props) {
    const getInitials = useInitials();
    const [q, setQ] = useState(filters.q ?? '');

    const activeTypes = filters.types ?? [];
    const activeSpecialties = filters.specialties ?? [];

    const visit = (types: string[], specs: string[], query = q) =>
        router.get(
            '/app/professionals',
            { types, specialties: specs, q: query },
            { preserveState: true, replace: true },
        );

    const toggle = (list: string[], v: string) =>
        list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        visit(activeTypes, activeSpecialties);
    };

    return (
        <>
            <Head title="Find Your Coach" />
            <div className="space-y-5 py-5">
                <div>
                    <h1 className="text-[1.75rem] font-bold tracking-tight">Find Your Coach</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choose a trainer or nutritionist that fits your goals and style.
                    </p>
                </div>

                <form onSubmit={submit} className="relative">
                    <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by name, specialty, or goal…"
                        className="h-12 rounded-2xl border-0 bg-muted pl-10"
                    />
                </form>

                {/* Filter chips — multi-select; OR within a group, AND across groups */}
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                    <button
                        type="button"
                        onClick={() => visit([], [])}
                        className={cn(
                            'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                            activeTypes.length === 0 && activeSpecialties.length === 0
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground',
                        )}
                    >
                        All
                    </button>
                    {typeChips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={() => visit(toggle(activeTypes, chip.key), activeSpecialties)}
                            className={cn(
                                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                                activeTypes.includes(chip.key)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {chip.label}
                        </button>
                    ))}
                    {specialties.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => visit(activeTypes, toggle(activeSpecialties, s))}
                            className={cn(
                                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                                activeSpecialties.includes(s)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {professionals.length === 0 ? (
                    <EmptyState
                        icon={UserRound}
                        title="No professionals found"
                        description="Try a different search or filter."
                    />
                ) : (
                    <div className="space-y-3">
                        {professionals.map((pro) => (
                            <Link
                                key={pro.id}
                                href={`/app/professionals/${pro.id}`}
                                className="block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:ring-primary/50"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary">
                                        {pro.avatar ? (
                                            <img src={pro.avatar} alt={pro.name} className="size-14 rounded-full object-cover" />
                                        ) : (
                                            getInitials(pro.name)
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold">{pro.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {typeLabels[pro.type]}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {pro.specialties.slice(0, 3).join(' · ')}
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-2 text-xs">
                                            {pro.rating && (
                                                <span className="flex items-center gap-1 font-medium">
                                                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                                    {pro.rating}
                                                    <span className="font-normal text-muted-foreground">
                                                        ({pro.reviews_count})
                                                    </span>
                                                </span>
                                            )}
                                            {(pro.coaching_mode === 'online' || pro.coaching_mode === 'both') && (
                                                <span className="flex items-center gap-1 font-medium text-primary">
                                                    <span className="size-1.5 rounded-full bg-primary" />
                                                    Online
                                                </span>
                                            )}
                                            {pro.state === 'active' && (
                                                <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                                                    <Check className="size-3" /> Your coach
                                                </Badge>
                                            )}
                                            {pro.state === 'pending' && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Clock className="size-3" /> Requested
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
