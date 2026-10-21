import { Head } from '@inertiajs/react';
import { ConversationView, type ChatMessage } from '@/components/trainet/conversation-view';

type Props = {
    conversation: { id: number; other: { id: number; name: string } | null };
    messages: ChatMessage[];
};

export default function MessageShow({ conversation, messages }: Props) {
    return (
        <>
            <Head title={conversation.other?.name ?? 'Conversation'} />
            <div className="mx-auto max-w-2xl">
                <ConversationView
                    conversation={conversation}
                    messages={messages}
                    sendUrl={`/pro/messages/${conversation.id}`}
                    backHref="/pro/messages"
                />
            </div>
        </>
    );
}
