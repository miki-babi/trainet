import { Link } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/trainet/empty-state';
import { Badge } from '@/components/ui/badge';

export type ConversationListItem = {
    id: number;
    other: { id: number; name: string } | null;
    last: { body: string; at: string; mine: boolean } | null;
    unread: number;
};

export function ConversationList({
    conversations,
    baseHref,
}: {
    conversations: ConversationListItem[];
    baseHref: string;
}) {
    if (conversations.length === 0) {
        return (
            <EmptyState
                icon={MessageSquare}
                title="No conversations"
                description="Messages between you and your coach appear here."
            />
        );
    }

    return (
        <div className="divide-y rounded-xl border bg-card">
            {conversations.map((c) => (
                <Link
                    key={c.id}
                    href={`${baseHref}/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 active:bg-accent active:scale-[0.99]"
                >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {c.other?.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate font-medium">{c.other?.name}</p>
                            {c.last && (
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {c.last.at}
                                </span>
                            )}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                            {c.last ? `${c.last.mine ? 'You: ' : ''}${c.last.body}` : 'Start the conversation'}
                        </p>
                    </div>
                    {c.unread > 0 && (
                        <Badge className="size-5 shrink-0 justify-center rounded-full p-0 text-xs">
                            {c.unread}
                        </Badge>
                    )}
                </Link>
            ))}
        </div>
    );
}
