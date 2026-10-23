import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { goBack } from '@/lib/back';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Type = {
    id: number;
    name: string;
    duration_minutes: number;
    location_note: string | null;
};

type Props = {
    types: Type[];
    professionals: { id: number; name: string }[];
    professionalId: number;
    date: string;
    slots: string[];
    week: string[];
};

export default function BookAppointment({ types, professionals, professionalId, date, slots, week }: Props) {
    const [typeId, setTypeId] = useState<number | null>(types[0]?.id ?? null);
    const [slot, setSlot] = useState<string | null>(null);
    const [note, setNote] = useState('');

    const load = (params: { date?: string; professional?: number }) => {
        router.get(
            '/app/appointments/book',
            {
                date: params.date ?? date,
                professional_id: params.professional ?? professionalId,
            },
            { preserveState: true },
        );
        setSlot(null);
    };

    const book = () => {
        router.post('/app/appointments', {
            appointment_type_id: typeId,
            professional_id: professionalId,
            starts_at: `${date} ${slot}`,
            client_note: note || null,
        });
    };

    const selectedType = types.find((t) => t.id === typeId);

    return (
        <>
            <Head title="Book a session" />
            <div className="space-y-5 py-5">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => goBack('/app/appointments')}>
                        <ArrowLeft className="mr-1" /> Sessions
                    </Button>
                    <h1 className="mt-1 text-[1.75rem] font-bold">Book a session</h1>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Session type</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {types.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setTypeId(type.id)}
                                className={cn(
                                    'shrink-0 rounded-xl border-2 px-4 py-2.5 text-left transition-colors',
                                    typeId === type.id
                                        ? 'border-primary bg-primary/5'
                                        : 'hover:border-primary/40',
                                )}
                            >
                                <p className="text-sm font-medium">{type.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {type.duration_minutes} min{type.location_note ? ` · ${type.location_note}` : ''}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {professionals.length > 1 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Coach</p>
                        <div className="flex gap-2">
                            {professionals.map((p) => (
                                <Badge
                                    key={p.id}
                                    variant={professionalId === p.id ? 'default' : 'outline'}
                                    className="cursor-pointer px-3 py-1.5"
                                    onClick={() => load({ professional: p.id })}
                                >
                                    {p.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                        <CalendarDays className="size-4" /> Day
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {week.map((d) => {
                            const dt = new Date(d + 'T00:00:00');
                            const active = d === date;
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => load({ date: d })}
                                    className={cn(
                                        'flex w-12 shrink-0 flex-col items-center rounded-lg border py-2 transition-colors',
                                        active ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40',
                                    )}
                                >
                                    <span className="text-[10px] uppercase">
                                        {dt.toLocaleDateString('en-GB', { weekday: 'short' })}
                                    </span>
                                    <span className="text-lg font-semibold">{dt.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Available times</p>
                    {slots.length === 0 ? (
                        <Card>
                            <CardContent className="py-6 text-center text-sm text-muted-foreground">
                                No openings on {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })} — try another day.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {slots.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSlot(s)}
                                    className={cn(
                                        'rounded-lg border-2 py-2.5 text-sm font-medium transition-colors',
                                        slot === s
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'hover:border-primary/50',
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {slot && (
                    <div className="space-y-3">
                        <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Anything your coach should know before the session? (optional)"
                        />
                        <Button className="h-12 w-full text-base" onClick={book}>
                            Request {selectedType?.name} · {slot}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            Your coach will confirm the booking.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
