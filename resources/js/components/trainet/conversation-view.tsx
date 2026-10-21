import { router } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { goBack } from '@/lib/back';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ChatMessage = {
    id: number;
    body: string;
    mine: boolean;
    sender: string;
    at: string;
    day: string;
};

export function ConversationView({
    conversation,
    messages,
    sendUrl,
    backHref,
}: {
    conversation: { id: number; other: { id: number; name: string } | null };
    messages: ChatMessage[];
    sendUrl: string;
    backHref: string;
}) {
    const [body, setBody] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView();
    }, [messages.length]);

    const send = () => {
        if (!body.trim()) {
            return;
        }
        const text = body;
        setBody('');
        router.post(sendUrl, { body: text }, { preserveScroll: true });
    };

    let lastDay = '';

    return (
        <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
            <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" onClick={() => goBack(backHref)}>
                    <ArrowLeft className="size-5" />
                </Button>
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {conversation.other?.name.charAt(0)}
                </div>
                <div>
                    <p className="font-semibold">{conversation.other?.name}</p>
                    <p className="text-xs text-muted-foreground">Active in Telegram</p>
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {messages.map((m) => {
                    const showDay = m.day !== lastDay;
                    lastDay = m.day;
                    return (
                        <div key={m.id}>
                            {showDay && (
                                <p className="my-3 text-center text-xs text-muted-foreground">
                                    {m.day}
                                </p>
                            )}
                            <div className={cn('flex', m.mine && 'justify-end')}>
                                <div
                                    className={cn(
                                        'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                                        m.mine
                                            ? 'rounded-br-sm bg-primary text-primary-foreground'
                                            : 'rounded-bl-sm bg-muted',
                                    )}
                                >
                                    <p>{m.body}</p>
                                    <p
                                        className={cn(
                                            'mt-0.5 text-right text-[10px]',
                                            m.mine
                                                ? 'text-primary-foreground/70'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {m.at}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="border-t p-3">
                <div className="flex gap-2">
                    <Input
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        placeholder="Message…"
                        className="h-11"
                    />
                    <Button size="icon" className="h-11 w-11" onClick={send} disabled={!body.trim()}>
                        <Send className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
