import { Head, router } from '@inertiajs/react';
import { Apple, Dumbbell, RotateCcw, UserRound, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

type Persona = {
    id: number;
    name: string;
    email: string;
    kind: 'client' | 'professional';
    role: string | null;
    workspace: string | null;
    onboarding: string | null;
};

const kindMeta = {
    professional: { label: 'Professional', icon: Dumbbell },
    client: { label: 'Client', icon: UserRound },
};

const roleLabels: Record<string, string> = {
    both: 'Coach + Nutritionist',
    trainer: 'Coach',
    nutritionist: 'Nutritionist',
    assistant: 'Assistant',
    owner: 'Owner',
};

export default function Personas({ personas }: { personas: Persona[] }) {
    const getInitials = useInitials();
    const professionals = personas.filter((p) => p.kind === 'professional');
    const clients = personas.filter((p) => p.kind === 'client');

    const pick = (id: number) => {
        router.post(`/personas/${id}`);
    };

    const renderCard = (persona: Persona) => {
        const Icon = kindMeta[persona.kind].icon;
        return (
            <button
                key={persona.id}
                type="button"
                onClick={() => pick(persona.id)}
                className="text-left transition-transform hover:-translate-y-0.5"
            >
                <Card className="h-full transition-colors hover:border-primary/50 hover:shadow-md">
                    <CardContent className="flex items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {getInitials(persona.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="truncate font-medium">
                                    {persona.name}
                                </span>
                                {persona.onboarding &&
                                    persona.onboarding !== 'complete' && (
                                        <Badge variant="secondary">
                                            Onboarding
                                        </Badge>
                                    )}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Icon className="size-3.5" />
                                <span className="truncate">
                                    {persona.kind === 'professional'
                                        ? (roleLabels[persona.role ?? ''] ??
                                          'Professional')
                                        : 'Client'}
                                    {persona.workspace
                                        ? ` · ${persona.workspace}`
                                        : ''}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </button>
        );
    };

    return (
        <>
            <Head title="Trainet — Choose a persona" />
            <div className="space-y-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                        T
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Trainet
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        UI/UX mock — choose a persona to explore
                    </p>
                </div>

                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        <Dumbbell className="size-4" /> Professional workspace
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {professionals.map(renderCard)}
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        <Users className="size-4" /> Client app
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {clients.map(renderCard)}
                    </div>
                </section>

                <div className="space-y-2 text-center">
                    <p className={cn('text-xs text-muted-foreground')}>
                        <Apple className="mr-1 inline size-3.5" />
                        In production, clients enter through the Telegram Mini
                        App and professionals through this web workspace.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.post('/demo/reset')}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                        <RotateCcw className="size-3" /> Reset demo data
                    </button>
                </div>
            </div>
        </>
    );
}
