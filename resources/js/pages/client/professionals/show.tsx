import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Check,
    ChevronLeft,
    Clock,
    Dumbbell,
    GraduationCap,
    MessageSquare,
    Quote,
    Star,
    UtensilsCrossed,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { mediaUrl } from '@/lib/media';

type Package = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    billing_label: string;
    kind: 'coaching' | 'program' | 'meal_plan';
    image_url: string | null;
    purchased: boolean;
    preparing: boolean;
};

type Certification = { name: string; issuer: string | null; year: number | null };
type Testimonial = { name: string; text: string; rating: number | null };

type Professional = {
    id: number;
    name: string;
    avatar: string | null;
    type: 'trainer' | 'nutritionist' | 'both';
    business_name: string | null;
    bio: string | null;
    credentials: string | null;
    certifications: Certification[];
    testimonials: Testimonial[];
    specialties: string[];
    rating: string | null;
    reviews_count: number;
    price_label: string | null;
    coaching_mode: 'online' | 'in_person' | 'both';
    cover_image: string | null;
    state: 'none' | 'pending' | 'active';
    packages: Package[];
};

const typeLabels: Record<string, string> = {
    trainer: 'Personal Trainer',
    nutritionist: 'Nutritionist',
    both: 'Coach + Nutritionist',
};

const modeLabels: Record<string, string> = {
    online: 'Online coaching',
    in_person: 'In-person',
    both: 'Online & in-person',
};

const offerIcons = { program: Dumbbell, meal_plan: UtensilsCrossed } as const;
const offerLabels = { program: 'Program', meal_plan: 'Meal plan' } as const;

const OfferCard = ({ proId, pkg }: { proId: number; pkg: Package }) => {
    const Icon = pkg.kind === 'coaching' ? BadgeCheck : (offerIcons[pkg.kind] ?? Dumbbell);
    const label = pkg.kind === 'coaching' ? pkg.billing_label : (offerLabels[pkg.kind] ?? 'One-time');

    return (
        <Link
            href={`/app/professionals/${proId}/packages/${pkg.id}`}
            className="group overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-colors hover:ring-primary/50"
        >
            <div className="relative h-28 overflow-hidden bg-muted">
                {pkg.image_url ? (
                    <img
                        src={mediaUrl(pkg.image_url) ?? ''}
                        alt={pkg.name}
                        className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-28 items-center justify-center text-muted-foreground">
                        <Icon className="size-7" />
                    </div>
                )}
                {pkg.purchased && (
                    <Badge
                        variant={pkg.preparing ? 'outline' : 'secondary'}
                        className="absolute top-2 right-2 gap-1 bg-card text-[10px] shadow"
                    >
                        {pkg.preparing ? <Clock className="size-2.5" /> : <Check className="size-2.5" />}
                        {pkg.preparing ? 'Preparing' : 'Purchased'}
                    </Badge>
                )}
            </div>
            <div className="p-3">
                <p className="truncate text-sm font-semibold">{pkg.name}</p>
                {pkg.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{pkg.description}</p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">{label}</p>
                <span className="mt-2 flex items-center justify-center gap-1 rounded-full bg-primary/10 py-1.5 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {pkg.preparing ? 'Order in progress' : pkg.purchased ? 'View again' : 'View offer'}
                    <ArrowRight className="size-3" />
                </span>
            </div>
        </Link>
    );
};

export default function ProfessionalShow({ professional: pro }: { professional: Professional }) {
    const getInitials = useInitials();
    const coachingPackages = pro.packages.filter((p) => p.kind === 'coaching');
    const oneTimeOffers = pro.packages.filter((p) => p.kind !== 'coaching');

    return (
        <>
            <Head title={pro.name} />
            <div className="pb-10">
                {/* Cover hero */}
                <div className="relative -mx-4 -mt-4 h-64 overflow-hidden">
                    {pro.cover_image ? (
                        <img
                            src={pro.cover_image}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-950" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-black/30" />
                    <Link
                        href="/app/professionals"
                        aria-label="Back to professionals"
                        className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
                    >
                        <ChevronLeft className="size-5" />
                    </Link>
                </div>

                {/* Identity */}
                <div className="relative -mt-12 space-y-4 px-1">
                    <div className="flex items-end justify-between gap-3">
                        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-2xl font-bold text-primary ring-4 ring-background">
                            {pro.avatar ? (
                                <img src={pro.avatar} alt={pro.name} className="size-24 rounded-full object-cover" />
                            ) : (
                                getInitials(pro.name)
                            )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pb-1">
                            {pro.state === 'active' ? (
                                <Button
                                    size="icon"
                                    aria-label="Message"
                                    className="size-10 rounded-full shadow-lg shadow-primary/30"
                                    onClick={() => router.post(`/app/professionals/${pro.id}/message`)}
                                >
                                    <MessageSquare className="size-4" />
                                </Button>
                            ) : pro.state === 'pending' ? (
                                <Button variant="outline" className="h-10 rounded-full px-5 font-semibold" disabled>
                                    <Clock className="mr-1.5 size-4" /> Request sent
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Message"
                                        className="size-10 rounded-full"
                                        onClick={() => router.post(`/app/professionals/${pro.id}/message`)}
                                    >
                                        <MessageSquare className="size-4" />
                                    </Button>
                                    <Button
                                        className="h-10 rounded-full px-5 font-semibold shadow-lg shadow-primary/30"
                                        onClick={() => router.post(`/app/professionals/${pro.id}/request`)}
                                    >
                                        Request coach
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0">
                        <h1 className="truncate text-[1.75rem] font-bold tracking-tight">{pro.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {typeLabels[pro.type]}
                            {pro.business_name ? ` · ${pro.business_name}` : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        {pro.rating && (
                            <span className="flex items-center gap-1 font-medium">
                                <Star className="size-4 fill-amber-400 text-amber-400" />
                                {pro.rating}
                                <span className="font-normal text-muted-foreground">
                                    ({pro.reviews_count} reviews)
                                </span>
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 font-medium text-primary">
                            <span className="size-1.5 rounded-full bg-primary" />
                            {modeLabels[pro.coaching_mode] ?? 'Online coaching'}
                        </span>
                    </div>

                    {pro.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {pro.specialties.map((s) => (
                                <Badge key={s} variant="secondary" className="rounded-full">
                                    {s}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* About */}
                    {(pro.bio || pro.credentials) && (
                        <section className="space-y-2">
                            <h2 className="px-1 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">About</h2>
                            {pro.bio && (
                                <p className="text-sm leading-relaxed text-muted-foreground">{pro.bio}</p>
                            )}
                            {pro.credentials && (
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <BadgeCheck className="size-3.5 text-primary" />
                                    {pro.credentials}
                                </p>
                            )}
                        </section>
                    )}

                    {/* Certifications */}
                    {pro.certifications.length > 0 && (
                        <section className="space-y-2">
                            <h2 className="px-1 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">Certifications</h2>
                            <div className="divide-y overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                                {pro.certifications.map((cert) => (
                                    <div key={cert.name} className="flex items-center gap-3 p-3.5">
                                        <GraduationCap className="size-4 shrink-0 text-primary" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">{cert.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {[cert.issuer, cert.year].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Packages — ongoing coaching */}
                    {coachingPackages.length > 0 && (
                        <section className="space-y-2">
                            <h2 className="px-1 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">Coaching packages</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {coachingPackages.map((pkg) => (
                                    <OfferCard key={pkg.id} proId={pro.id} pkg={pkg} />
                                ))}
                            </div>
                            {pro.state === 'none' && (
                                <button
                                    type="button"
                                    onClick={() => router.post(`/app/professionals/${pro.id}/request`)}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Prefer to talk first? Send a coaching request
                                </button>
                            )}
                        </section>
                    )}

                    {/* One-time offers — programs & meal plans */}
                    {oneTimeOffers.length > 0 && (
                        <section className="space-y-2">
                            <h2 className="px-1 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">Programs & meal plans</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {oneTimeOffers.map((pkg) => (
                                    <OfferCard key={pkg.id} proId={pro.id} pkg={pkg} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Testimonials */}
                    {pro.testimonials.length > 0 && (
                        <section className="space-y-2">
                            <h2 className="px-1 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">Testimonials</h2>
                            <div className="space-y-3">
                                {pro.testimonials.map((t) => (
                                    <figure
                                        key={t.name}
                                        className="rounded-2xl bg-card p-4 ring-1 ring-border"
                                    >
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="size-3.5 fill-amber-400 text-amber-400"
                                                />
                                            ))}
                                        </div>
                                        <blockquote className="mt-2 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                                            <Quote className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
                                            {t.text}
                                        </blockquote>
                                        <figcaption className="mt-2 text-xs font-medium">
                                            — {t.name}
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

        </>
    );
}
