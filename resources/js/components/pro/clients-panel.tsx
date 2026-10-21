import { router, usePage } from '@inertiajs/react';
import { Filter, MessageSquare, Search, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { ActivityTile } from '@/components/trainet/activity-tile';
import { EmptyState } from '@/components/trainet/empty-state';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';

export type ClientRow = {
    id: number;
    name: string;
    email: string;
    onboarding: string | null;
    goals: string | null;
    tags: { id: number; name: string; color: string | null }[];
    program: string | null;
    last_active: string | null;
};

export type ClientFilters = { search: string; tag: string };

export function ClientsPanel({
    clients,
    tags,
    filters,
}: {
    clients: ClientRow[];
    tags: { id: number; name: string; color: string | null }[];
    filters: ClientFilters;
}) {
    const getInitials = useInitials();
    const [search, setSearch] = useState(filters.search);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteRel, setInviteRel] = useState('trainer');
    const page = usePage<{ inviteLink?: string }>();
    const inviteLink = page.props.inviteLink as string | undefined;

    const applyFilters = (next: { search?: string; tag?: string }) => {
        router.get(
            '/pro/clients',
            { search: next.search ?? search, tag: next.tag ?? filters.tag },
            { preserveState: true, replace: true },
        );
    };

    const sendInvite = () => {
        router.post(
            '/pro/invites',
            { client_name: inviteName, intended_relationship: inviteRel },
            { preserveScroll: true, onSuccess: () => setInviteName('') },
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters({})}
                        onBlur={() => applyFilters({})}
                        placeholder="Search clients…"
                        className="pl-9"
                    />
                </div>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <UserPlus className="mr-1 size-4" /> Invite
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a client</DialogTitle>
                            <DialogDescription>
                                Generates a one-time invite link. In production the
                                client opens it through the Telegram bot.
                            </DialogDescription>
                        </DialogHeader>
                        {inviteLink ? (
                            <div className="space-y-2">
                                <Label>Share this link</Label>
                                <Input readOnly value={inviteLink} />
                                <p className="text-xs text-muted-foreground">
                                    Expires in 7 days. Telegram delivery comes
                                    later — for now, copy it manually.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client_name">
                                        Client name (optional)
                                    </Label>
                                    <Input
                                        id="client_name"
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        placeholder="e.g. Alex Smith"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Relationship</Label>
                                    <Select value={inviteRel} onValueChange={setInviteRel}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="trainer">Trainer</SelectItem>
                                            <SelectItem value="nutritionist">
                                                Nutritionist
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            {inviteLink ? (
                                <Button
                                    onClick={() => {
                                        navigator.clipboard?.writeText(inviteLink);
                                        setInviteOpen(false);
                                    }}
                                >
                                    Copy & close
                                </Button>
                            ) : (
                                <Button onClick={sendInvite}>
                                    Create invite link
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <Filter className="size-4 shrink-0 text-muted-foreground" />
                <Button
                    variant={!filters.tag ? 'secondary' : 'ghost'}
                    size="sm"
                    className="shrink-0"
                    onClick={() => applyFilters({ tag: '' })}
                >
                    All
                </Button>
                {tags.map((tag) => (
                    <Button
                        key={tag.id}
                        variant={filters.tag === String(tag.id) ? 'secondary' : 'ghost'}
                        size="sm"
                        className="shrink-0"
                        onClick={() => applyFilters({ tag: String(tag.id) })}
                    >
                        {tag.name}
                    </Button>
                ))}
            </div>

            {clients.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No clients found"
                    description="Invite your first client or adjust your filters."
                />
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {clients.map((client) => (
                        <ActivityTile
                            key={client.id}
                            avatars={[getInitials(client.name)]}
                            title={client.name}
                            subtitle={
                                client.program ??
                                (client.last_active
                                    ? `Last session ${new Date(client.last_active + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                                    : 'No sessions yet')
                            }
                            href={`/pro/clients/${client.id}`}
                            variant={client.onboarding !== 'complete' ? 'blue' : 'dark'}
                            action={{
                                icon: MessageSquare,
                                label: `Message ${client.name}`,
                                onClick: () =>
                                    router.post(`/pro/messages/with/${client.id}`),
                            }}
                        />
                    ))}
                    <ActivityTile
                        icon={UserPlus}
                        title="Invite client"
                        subtitle="Share a link"
                        onClick={() => setInviteOpen(true)}
                        variant="ghost"
                    />
                </div>
            )}
        </div>
    );
}
