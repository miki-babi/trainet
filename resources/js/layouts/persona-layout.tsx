import type { ReactNode } from 'react';

export default function PersonaLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="tg flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10 pt-[max(2.5rem,var(--safe-top))] pb-[max(2.5rem,var(--safe-bottom))]">
            <div className="w-full max-w-4xl">{children}</div>
        </div>
    );
}
