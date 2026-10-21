import { Head } from '@inertiajs/react';
import { ConversationList, type ConversationListItem } from '@/components/trainet/conversation-list';
import { PageHeader } from '@/components/trainet/page-header';

export default function MessagesIndex({ conversations }: { conversations: ConversationListItem[] }) {
    return (
        <>
            <Head title="Messages" />
            <div className="space-y-5">
                <PageHeader title="Messages" description="Conversations with your clients." />
                <ConversationList conversations={conversations} baseHref="/pro/messages" />
            </div>
        </>
    );
}
