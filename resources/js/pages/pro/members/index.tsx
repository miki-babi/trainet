import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/trainet/page-header';
import { StatusChip } from '@/components/trainet/status-chip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Member = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
};

export default function MembersIndex({ members }: { members: Member[] }) {
    return (
        <>
            <Head title="Team members" />
            <div className="space-y-5">
                <PageHeader title="Team" description="Professionals in your workspace." />
                <Card>
                    <CardContent className="overflow-x-auto p-0">
                        <Table className="min-w-[480px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="font-medium">{m.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{m.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {m.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusChip tone={m.status === 'active' ? 'success' : 'neutral'}>
                                                {m.status}
                                            </StatusChip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
