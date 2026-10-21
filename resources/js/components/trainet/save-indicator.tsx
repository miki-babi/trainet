import { Check, CloudOff, Loader2, TriangleAlert } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type SaveState = 'saved' | 'saving' | 'offline' | 'error' | 'idle';

export function useSaveState(idleDelayMs = 2500) {
    const [state, setState] = useState<SaveState>('idle');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleIdle = useCallback(
        (delay = idleDelayMs) => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
            timer.current = setTimeout(() => setState('idle'), delay);
        },
        [idleDelayMs],
    );

    const markSaving = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
        }
        setState('saving');
    }, []);

    const markSaved = useCallback(() => {
        setState('saved');
        scheduleIdle();
    }, [scheduleIdle]);

    const markError = useCallback(() => {
        setState('error');
        scheduleIdle(5000);
    }, [scheduleIdle]);

    return { state, markSaving, markSaved, markError };
}

export function SaveIndicator({
    state,
    className,
}: {
    state: SaveState;
    className?: string;
}) {
    if (state === 'idle') {
        return null;
    }
    const config = {
        saving: { icon: Loader2, label: 'Saving…', cls: 'text-muted-foreground' },
        saved: { icon: Check, label: 'Saved', cls: 'text-success' },
        offline: { icon: CloudOff, label: 'Offline — will retry', cls: 'text-warning' },
        error: { icon: TriangleAlert, label: 'Save failed', cls: 'text-destructive' },
    }[state];
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                config.cls,
                className,
            )}
        >
            <Icon
                className={cn('size-3.5', state === 'saving' && 'animate-spin')}
            />
            {config.label}
        </span>
    );
}
