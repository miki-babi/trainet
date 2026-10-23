import { Head, Link, router } from '@inertiajs/react';
import { Calendar, CalendarPlus, Video } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { ListRow } from '@/components/trainet/list-row';
import { SectionCard } from '@/components/trainet/section-card';
import { StatusChip, type StatusTone } from '@/components/trainet/status-chip';
import { Button } from '@/components/ui/button';

type Appointment = {
    id: number;
    starts_at: string;
    ends_at: string;
    status: string;
    location_note: string | null;
    type: { name: string; duration_minutes: number };
    professional: { name: string };
};

const tone: Record<string, StatusTone> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
    completed: 'neutral',
    no_show: 'danger',
};

export default function AppointmentsIndex({
    upcoming,
    past,
}: {
    upcoming: Appointment[];
    past: Appointment[];
}) {
    return (
        <>
            <Head title="Sessions" />
            <div className="space-y-5 py-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-[1.75rem] font-bold tracking-tight">Sessions</h1>
                    <Button asChild>
                        <Link href="/app/appointments/book">
                            <CalendarPlus className="mr-1" /> Book
                        </Link>
                    </Button>
                </div>

                <SectionCard label="Upcoming">
                    {upcoming.length === 0 ? (
                        <EmptyState
                            icon={Calendar}
                            title="No upcoming sessions"
                            description="Book a session with your coach."
                        />
                    ) : (
                        <div >
                            {upcoming.map((a) => (
                                <ListRow
                                    key={a.id}
                                    leading={
                                        a.location_note?.includes('video') ? (
                                            <Video className="size-4 text-primary" />
                                        ) : (
                                            <Calendar className="size-4 text-primary" />
                                        )
                                    }
                                    title={a.type.name}
                                    subtitle={`${new Date(a.starts_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${new Date(a.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} with ${a.professional.name}`}
                                    trailing={
                                        <div className="flex items-center gap-2">
                                            <StatusChip tone={tone[a.status] ?? 'neutral'}>
                                                {a.status}
                                            </StatusChip>
                                            {['pending', 'confirmed'].includes(a.status) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (confirm('Cancel this session?')) {
                                                            router.post(`/app/appointments/${a.id}/cancel`);
                                                        }
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard label="Past">
                    {past.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No past sessions.</p>
                    ) : (
                        <div >
                            {past.map((a) => (
                                <ListRow
                                    key={a.id}
                                    title={a.type.name}
                                    subtitle={new Date(a.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    trailing={
                                        <StatusChip tone={tone[a.status] ?? 'neutral'}>
                                            {a.status}
                                        </StatusChip>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </>
    );
}
