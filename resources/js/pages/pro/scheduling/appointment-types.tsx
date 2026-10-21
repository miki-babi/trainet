import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Clock, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { SectionCard } from '@/components/trainet/section-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Type = {
    id: number;
    name: string;
    duration_minutes: number;
    buffer_minutes: number | null;
    color: string | null;
    location_note: string | null;
};

export default function AppointmentTypes({ types }: { types: Type[] }) {
    const [form, setForm] = useState({
        name: '',
        duration_minutes: 60,
        buffer_minutes: 15,
        location_note: '',
    });

    const create = () => {
        router.post('/pro/appointment-types', form, { preserveScroll: true });
        setForm({ ...form, name: '' });
    };

    const save = (type: Type, patch: Partial<Type>) => {
        router.put(`/pro/appointment-types/${type.id}`, { ...type, ...patch }, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Session types" />
            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/pro/calendar">
                            <ArrowLeft className="mr-1" /> Calendar
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold">Session types</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    Bookable session kinds clients can pick when requesting an appointment.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                    {types.map((type) => (
                        <Card key={type.id}>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="size-3 rounded-full"
                                        style={{ backgroundColor: type.color ?? '#0e8a63' }}
                                    />
                                    <Input
                                        defaultValue={type.name}
                                        className="border-transparent font-medium hover:border-input"
                                        onBlur={(e) => e.target.value !== type.name && save(type, { name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <label className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="size-3.5" />
                                        <Input
                                            type="number"
                                            defaultValue={type.duration_minutes}
                                            className="h-8 w-20"
                                            onBlur={(e) => Number(e.target.value) !== type.duration_minutes && save(type, { duration_minutes: Number(e.target.value) })}
                                        />
                                        min
                                    </label>
                                    <label className="flex items-center gap-1.5 text-muted-foreground">
                                        <span className="text-xs">buffer</span>
                                        <Input
                                            type="number"
                                            defaultValue={type.buffer_minutes ?? 0}
                                            className="h-8 w-20"
                                            onBlur={(e) => save(type, { buffer_minutes: Number(e.target.value) })}
                                        />
                                        min
                                    </label>
                                </div>
                                <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <MapPin className="size-3.5" />
                                    <Input
                                        defaultValue={type.location_note ?? ''}
                                        placeholder="Location / video link"
                                        className="h-8"
                                        onBlur={(e) => e.target.value !== (type.location_note ?? '') && save(type, { location_note: e.target.value })}
                                    />
                                </label>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <SectionCard title="New session type">
                    <div className="grid gap-3 sm:grid-cols-4">
                        <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs">Name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. 1:1 Session"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Duration (min)</Label>
                            <Input
                                type="number"
                                value={form.duration_minutes}
                                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Buffer (min)</Label>
                            <Input
                                type="number"
                                value={form.buffer_minutes}
                                onChange={(e) => setForm({ ...form, buffer_minutes: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1 sm:col-span-3">
                            <Label className="text-xs">Location / video link</Label>
                            <Input
                                value={form.location_note}
                                onChange={(e) => setForm({ ...form, location_note: e.target.value })}
                                placeholder="Studio A / video call"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" onClick={create} disabled={!form.name.trim()}>
                                <Plus className="mr-1 size-4" /> Add
                            </Button>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
