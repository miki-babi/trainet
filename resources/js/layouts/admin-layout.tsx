import { Link, usePage } from '@inertiajs/react';
import {
    BadgeDollarSign,
    Dumbbell,
    FileClock,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    UserRound,
    Users,
    EyeOff,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

const nav = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { title: 'Professionals', href: '/admin/professionals', icon: ShieldCheck },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Purchases', href: '/admin/purchases', icon: BadgeDollarSign },
    { title: 'Moderation', href: '/admin/moderation', icon: EyeOff },
    { title: 'Audit log', href: '/admin/audit', icon: FileClock },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { url, props } = usePage<{ auth: Auth }>();
    const getInitials = useInitials();
    const user = props.auth?.user;

    const isActive = (href: string, exact?: boolean) =>
        exact ? url === href : url === href || url.startsWith(`${href}/`);

    return (
        <div className="min-h-svh bg-background">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card md:flex">
                <div className="flex items-center gap-2.5 px-5 pt-6 pb-6">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Dumbbell className="size-5" />
                    </span>
                    <div>
                        <p className="text-base font-bold tracking-tight">Trainet</p>
                        <p className="-mt-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                            Admin
                        </p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3">
                    {nav.map((item) => {
                        const active = isActive(item.href, item.exact);
                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                <item.icon className="size-4.5" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t p-3">
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                        <Avatar className="size-9">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-primary/20 text-xs text-primary">
                                {getInitials(user?.name ?? '?')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{user?.name}</p>
                            <p className="truncate text-xs text-muted-foreground">Super admin</p>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <LogOut className="size-4.5" />
                        Back to site
                    </Link>
                </div>
            </aside>

            {/* Mobile top bar */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
                <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Dumbbell className="size-4" />
                    </span>
                    <span className="text-sm font-bold">Trainet Admin</span>
                </div>
            </header>

            <nav className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
                {nav.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                            isActive(item.href, item.exact)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        <item.icon className="size-3.5" />
                        {item.title}
                    </Link>
                ))}
            </nav>

            <main className="mx-auto w-full max-w-5xl px-4 py-6 md:ml-60 md:max-w-6xl md:px-8">
                {children}
            </main>
        </div>
    );
}
