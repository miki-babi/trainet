import { Head } from '@inertiajs/react';
import { ProgramsPanel, type ProgramItem } from '@/components/pro/programs-panel';
import { PageHeader } from '@/components/trainet/page-header';

export default function ProgramsIndex({ programs }: { programs: ProgramItem[] }) {
    return (
        <>
            <Head title="Programs" />
            <div className="space-y-5">
                <PageHeader
                    title="Training programs"
                    description="Build reusable programs, publish versions, assign to clients."
                />
                <ProgramsPanel programs={programs} />
            </div>
        </>
    );
}
