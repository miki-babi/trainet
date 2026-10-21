import { Head, Link, router } from '@inertiajs/react';
import { Save, Users } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/trainet/page-header';
import { SaveIndicator, useSaveState } from '@/components/trainet/save-indicator';
import { SectionCard } from '@/components/trainet/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
    workspace: { name: string; type: string };
    profile: { bio: string | null; credentials: string | null; business_name: string | null } | null;
    role: string;
};

export default function SettingsEdit({ workspace, profile, role }: Props) {
    const { state: saveState, markSaving, markSaved, markError } = useSaveState();
    const [form, setForm] = useState({
        workspace_name: workspace.name,
        bio: profile?.bio ?? '',
        credentials: profile?.credentials ?? '',
        business_name: profile?.business_name ?? '',
    });

    const save = () => {
        markSaving();
        router.put('/pro/settings', form, {
            preserveScroll: true,
            onSuccess: markSaved,
            onError: markError,
        });
    };

    return (
        <>
            <Head title="Workspace settings" />
            <div className="mx-auto max-w-2xl space-y-5">
                <PageHeader
                    title="Settings"
                    actions={
                        <div className="flex items-center gap-3">
                            <SaveIndicator state={saveState} />
                            <Button size="sm" onClick={save}>
                                <Save className="mr-1 size-4" /> Save
                            </Button>
                        </div>
                    }
                />

                <SectionCard title="Workspace">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Workspace name</Label>
                            <Input
                                value={form.workspace_name}
                                disabled={role !== 'owner'}
                                onChange={(e) => setForm({ ...form, workspace_name: e.target.value })}
                            />
                            {role !== 'owner' && (
                                <p className="text-xs text-muted-foreground">Only the owner can rename.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Team</Label>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/pro/members">
                                    <Users className="mr-1 size-4" /> Manage members
                                </Link>
                            </Button>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Your professional profile">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Business name (shown to clients)</Label>
                            <Input
                                value={form.business_name}
                                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Credentials</Label>
                            <Input
                                value={form.credentials}
                                onChange={(e) => setForm({ ...form, credentials: e.target.value })}
                                placeholder="CSCS, PN-1…"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Bio</Label>
                            <Textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                className="min-h-24"
                            />
                        </div>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
