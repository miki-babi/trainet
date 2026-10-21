import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ClientsPanel, type ClientFilters, type ClientRow } from '@/components/pro/clients-panel';
import { ConversationList, type ConversationListItem } from '@/components/trainet/conversation-list';
import { PageHeader } from '@/components/trainet/page-header';
import { cn } from '@/lib/utils';

type Tab = 'clients' | 'messages';

type Props = {
    tab: string;
    clients: ClientRow[];
    tags: { id: number; name: string; color: string | null }[];
    filters: ClientFilters;
    conversations: ConversationListItem[];
};

export default function ClientsIndex({ tab: initialTab, clients, tags, filters, conversations }: Props) {
    const [tab, setTab] = useState<Tab>(initialTab === 'messages' ? 'messages' : 'clients');
    const unread = conversations.reduce((a, c) => a + c.unread, 0);

    return (
        <>
            <Head title="Clients" />
            <div className="space-y-5">
                <PageHeader
                    title="Clients"
                    description={`${clients.length} client${clients.length === 1 ? '' : 's'} in your workspace`}
                />

                <div className="flex gap-1 rounded-full bg-muted p-1">
                    <button
                        type="button"
                        onClick={() => setTab('clients')}
                        className={cn(
                            'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                            tab === 'clients'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        Clients
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('messages')}
                        className={cn(
                            'relative flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                            tab === 'messages'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        Messages
                        {unread > 0 && (
                            <span
                                className={cn(
                                    'ml-1.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                                    tab === 'messages'
                                        ? 'bg-primary-foreground text-primary'
                                        : 'bg-primary text-primary-foreground',
                                )}
                            >
                                {unread}
                            </span>
                        )}
                    </button>
                </div>

                {tab === 'clients' && (
                    <ClientsPanel clients={clients} tags={tags} filters={filters} />
                )}
                {tab === 'messages' && (
                    <ConversationList
                        conversations={conversations}
                        baseHref="/pro/messages"
                    />
                )}
            </div>
        </>
    );
}
