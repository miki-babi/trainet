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
            <ConversationView
                conversation={conversation}
                messages={messages}
                sendUrl={`/app/messages/${conversation.id}`}
                backHref="/app/messages"
            />
        </>
    );
}
