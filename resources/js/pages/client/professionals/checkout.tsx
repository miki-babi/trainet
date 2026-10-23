import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, Lock, PackageCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelegramMainButton } from '@/hooks/use-telegram';
import { useInitials } from '@/hooks/use-initials';

type Professional = {
    id: number;
    name: string;
    avatar: string | null;
    type: 'trainer' | 'nutritionist' | 'both';
    business_name: string | null;
};

type Package = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    billing_label: string;
    kind: 'coaching' | 'program' | 'meal_plan';
};

type Props = {
    professional: Professional;
    package: Package;
};

const typeLabels: Record<string, string> = {
    trainer: 'Personal Trainer',
    nutritionist: 'Nutritionist',
    both: 'Coach + Nutritionist',
};

export default function PackageCheckout({ professional: pro, package: pkg }: Props) {
    const getInitials = useInitials();
    const price = (cents: number) => `$${(cents / 100).toLocaleString()}`;
    const purchase = () => router.post(`/app/professionals/${pro.id}/packages/${pkg.id}`);

    useTelegramMainButton({ text: `PAY ${price(pkg.price).toUpperCase()}`, onClick: purchase });

    return (
        <>
            <Head title={`${pkg.name} — checkout`} />
            <div className="space-y-6 py-5">
                <Link
                    href={`/app/professionals/${pro.id}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="size-4" /> {pro.name}
                </Link>

                <div>
                    <h1 className="text-[1.75rem] font-bold tracking-tight">Checkout</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review your package before confirming.
                    </p>
                </div>

                {/* Coach */}
                <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary">
                        {pro.avatar ? (
                            <img src={pro.avatar} alt={pro.name} className="size-12 rounded-full object-cover" />
                        ) : (
                            getInitials(pro.name)
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-semibold">{pro.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {typeLabels[pro.type]}
                            {pro.business_name ? ` · ${pro.business_name}` : ''}
                        </p>
                    </div>
                </div>

                {/* Order summary */}
                <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                    <div className="flex items-center gap-2">
                        <PackageCheck className="size-4 text-primary" />
                        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Order summary
                        </p>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{pkg.name}</p>
                                {pkg.kind !== 'coaching' && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                                        {pkg.kind === 'program' ? 'Program' : 'Meal plan'}
                                    </span>
                                )}
                            </div>
                            {pkg.description && (
                                <p className="mt-0.5 text-sm text-muted-foreground">{pkg.description}</p>
                            )}
                        </div>
                        <p className="shrink-0 font-bold">{price(pkg.price)}</p>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                        <p className="text-sm text-muted-foreground">Total · {pkg.billing_label}</p>
                        <p className="text-lg font-bold text-primary">{price(pkg.price)}</p>
                    </div>
                </div>

                <Button
                    className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/30"
                    onClick={purchase}
                >
                    <Lock className="mr-2 size-4" /> Pay {price(pkg.price)}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-primary" />
                    Demo checkout — no real payment is processed.
                </p>
            </div>
        </>
    );
}
