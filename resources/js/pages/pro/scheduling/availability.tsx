import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const WEEKDAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Rule = { weekday: number; start_time: string; end_time: string };

export default function AvailabilityEdit({ rules }: { rules: Rule[] }) {
    const [rows, setRows] = useState<Rule[]>(
        rules.length ? rules.map((r) => ({ ...r, start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5) })) : [],
    );
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();

    const addRule = (weekday: number) =>
        setRows([...rows, { weekday, start_time: '09:00', end_time: '17:00' }]);

    const duplicateDay = (weekday: number) => {
        const dayRules = rows.filter((r) => r.weekday === weekday);
        const targets = [1, 2, 3, 4, 5].filter((d) => d !== weekday);
        setRows([
            ...rows,
            ...dayRules.flatMap((r) => targets.map((t) => ({ ...r, weekday: t }))),
        ]);
    };

    const save = () => {
        markSaving();
        router.put('/pro/availability', { rules: rows }, {
            preserveScroll: true,
            onSuccess: markSaved,
            onError: markError,
        });
    };

    return (
        <>
            <Head title="Availability" />
            <div className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/pro/calendar">
                            <ArrowLeft className="mr-1" /> Calendar
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold">Weekly availability</h1>
                    <SaveIndicator state={saveState} />
                    <Button className="ml-auto" size="sm" onClick={save}>
                        <Save className="mr-1 size-4" /> Save
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Clients book sessions inside these windows. Leave a day empty to make it unavailable.
                </p>

                {WEEKDAYS.slice(1).map((name, weekday) => {
                    const dayRules = rows
                        .map((r, i) => ({ ...r, index: i }))
                        .filter((r) => r.weekday === weekday + 1);
                    return (
                        <Card key={name}>
                            <CardContent className="space-y-3 py-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{name}</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => addRule(weekday + 1)}>
                                            <Plus className="mr-1 size-3.5" /> Window
                                        </Button>
                                        {dayRules.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Copy to all weekdays"
                                                onClick={() => duplicateDay(weekday + 1)}
                                            >
                                                <Copy className="size-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {dayRules.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Unavailable</p>
                                ) : (
                                    dayRules.map((r) => (
                                        <div key={r.index} className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={r.start_time}
                                                className="w-32"
                                                onChange={(e) => {
                                                    const next = [...rows];
                                                    next[r.index].start_time = e.target.value;
                                                    setRows(next);
                                                }}
                                            />
                                            <span className="text-muted-foreground">–</span>
                                            <Input
                                                type="time"
                                                value={r.end_time}
                                                className="w-32"
                                                onChange={(e) => {
                                                    const next = [...rows];
                                                    next[r.index].end_time = e.target.value;
                                                    setRows(next);
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="ml-auto size-7 text-muted-foreground hover:text-destructive"
                                                onClick={() => setRows(rows.filter((_, i) => i !== r.index))}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </>
    );
}
