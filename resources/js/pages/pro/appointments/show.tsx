import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, CheckCircle2, StickyNote, X } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/trainet/page-header';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip } from '@/components/trainet/status-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Appt = {
    id: number;
    starts_at: string;
    ends_at: string;
    status: string;
    location_note: string | null;
    client_note: string | null;
    session_notes: string | null;
    client: { id: number; user: { name: string } };
    type: { name: string; duration_minutes: number };
    professional: { name: string };
    events: {
        id: number;
        type: string;
        created_at: string;
        actor: { name: string } | null;
        old_starts_at: string | null;
        new_starts_at: string | null;
    }[];
};

export default function AppointmentShow({ appointment: a }: { appointment: Appt }) {
    const [resched, setResched] = useState('');
    const [notes, setNotes] = useState(a.session_notes ?? '');
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();

    const actionable = ['pending', 'confirmed'].includes(a.status);
    const fmt = (s: string) => new Date(s).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <Head title={`${a.type.name} — ${a.client.user.name}`} />
            <div className="mx-auto max-w-2xl space-y-5">
                <PageHeader
                    title={a.type.name}
                    description={`${fmt(a.starts_at)} – ${new Date(a.ends_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                    backHref="/pro/calendar"
                    actions={<StatusChip tone={a.status === 'confirmed' ? 'success' : a.status === 'pending' ? 'warning' : 'neutral'}>{a.status}</StatusChip>}
                />

                <SectionCard title="Details">
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <dt className="text-muted-foreground">Client</dt>
                            <dd className="font-medium">
                                <Link href={`/pro/clients/${a.client.id}`} className="text-primary hover:underline">
                                    {a.client.user.name}
                                </Link>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Coach</dt>
                            <dd className="font-medium">{a.professional.name}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Location</dt>
                            <dd className="font-medium">{a.location_note ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Duration</dt>
                            <dd className="font-medium">{a.type.duration_minutes} min</dd>
                        </div>
                        {a.client_note && (
                            <div className="col-span-2">
                                <dt className="text-muted-foreground">Client note</dt>
                                <dd>{a.client_note}</dd>
                            </div>
                        )}
                    </dl>
                </SectionCard>

                {actionable && (
                    <SectionCard title="Actions">
                        <div className="flex flex-wrap items-end gap-3">
                            {a.status === 'pending' && (
                                <Button onClick={() => router.post(`/pro/appointments/${a.id}/confirm`)}>
                                    <CheckCircle2 className="mr-1" /> Confirm
                                </Button>
                            )}
                            <div className="flex items-end gap-2">
                                <div className="space-y-1">
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <CalendarClock className="size-3.5" /> Reschedule to
                                    </p>
                                    <Input
                                        type="datetime-local"
                                        value={resched}
                                        onChange={(e) => setResched(e.target.value)}
                                        className="w-52"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    disabled={!resched}
                                    onClick={() => router.post(`/pro/appointments/${a.id}/reschedule`, { starts_at: resched })}
                                >
                                    Move
                                </Button>
                            </div>
                            <Button
                                variant="destructive"
                                className="ml-auto"
                                onClick={() => confirm('Cancel this appointment?') && router.post(`/pro/appointments/${a.id}/cancel`)}
                            >
                                <X className="mr-1" /> Cancel
                            </Button>
                        </div>
                    </SectionCard>
                )}

                <SectionCard
                    title={
                        <span className="flex items-center gap-1.5">
                            <StickyNote className="size-4" /> Session notes
                        </span>
                    }
                    action={<SaveIndicator state={saveState} />}
                >
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Private notes about this session…"
                        onBlur={() => {
                            if (notes !== (a.session_notes ?? '')) {
                                markSaving();
                                router.put(`/pro/appointments/${a.id}/notes`, { session_notes: notes }, {
                                    preserveScroll: true,
                                    onSuccess: markSaved,
                                    onError: markError,
                                });
                            }
                        }}
                    />
                </SectionCard>

                <SectionCard title="History">
                    <div className="space-y-2">
                        {a.events.map((e) => (
                            <div key={e.id} className="flex items-center gap-3 text-sm">
                                <span className="w-32 shrink-0 text-muted-foreground">
                                    {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="capitalize">
                                    {e.type.replace(/_/g, ' ')} by {e.actor?.name ?? 'system'}
                                </span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
