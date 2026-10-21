import { cn } from '@/lib/utils';

export function ChatBubble({
    body,
    time,
    mine,
    sender,
    className,
}: {
    body: string;
    time?: string;
    mine?: boolean;
    sender?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-0.5',
                mine ? 'items-end' : 'items-start',
                className,
            )}
        >
            {sender && !mine && (
                <span className="px-1 text-xs text-muted-foreground">
                    {sender}
                </span>
            )}
            <div
                className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                    mine
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-muted',
                )}
            >
                {body}
            </div>
            {time && (
                <span className="px-1 text-[10px] text-muted-foreground">
                    {time}
                </span>
            )}
        </div>
    );
}
