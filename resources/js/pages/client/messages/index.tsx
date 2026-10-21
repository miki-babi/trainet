import { Head } from '@inertiajs/react';
import { ConversationList, type ConversationListItem } from '@/components/trainet/conversation-list';

export default function MessagesIndex({ conversations }: { conversations: ConversationListItem[] }) {
    return (
        <>
            <Head title="Messages" />
            <div className="space-y-5 py-5">
                <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                <ConversationList conversations={conversations} baseHref="/app/messages" />
            </div>
        </>
    );
}
