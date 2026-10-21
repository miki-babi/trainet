import { cn } from '@/lib/utils';

export type DayStripDay = {
    date: string; // YYYY-MM-DD
    dayLabel: string; // Mon
    dayNumber: number;
    isToday?: boolean;
    isSelected?: boolean;
    marker?: 'workout' | 'done' | 'rest' | 'checkin' | null;
};

export function DayStrip({
    days,
    onSelect,
    className,
}: {
    days: DayStripDay[];
    onSelect?: (date: string) => void;
    className?: string;
}) {
    return (
        <div className={cn('grid grid-cols-7 gap-1', className)}>
            {days.map((day) => (
                <button
                    key={day.date}
                    type="button"
                    onClick={() => onSelect?.(day.date)}
                    className={cn(
                        'flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors',
                        day.isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent',
                    )}
                >
                    <span
                        className={cn(
                            'text-[10px] font-medium uppercase tracking-wide',
                            day.isSelected
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground',
                        )}
                    >
                        {day.dayLabel}
                    </span>
                    <span
                        className={cn(
                            'flex size-7 items-center justify-center rounded-full text-sm font-semibold',
                            day.isToday &&
                                !day.isSelected &&
                                'bg-primary/15 text-primary',
                        )}
                    >
                        {day.dayNumber}
                    </span>
                    <span
                        className={cn(
                            'size-1.5 rounded-full',
                            day.marker === 'workout' &&
                                (day.isSelected
                                    ? 'bg-primary-foreground'
                                    : 'bg-primary'),
                            day.marker === 'done' &&
                                (day.isSelected
                                    ? 'bg-primary-foreground/70'
                                    : 'bg-success'),
                            day.marker === 'checkin' &&
                                (day.isSelected
                                    ? 'bg-primary-foreground/70'
                                    : 'bg-info'),
                            !day.marker && 'bg-transparent',
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
