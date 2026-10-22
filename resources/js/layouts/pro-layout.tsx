import { Link, usePage } from '@inertiajs/react';
import {
    Apple,
    CalendarDays,
    ChartColumn,
    ClipboardCheck,
    ClipboardList,
    CreditCard,
    Dumbbell,
    Ellipsis,
    LayoutDashboard,
    LogOut,
    MessagesSquare,
    Settings,
    Users,
    Wallet,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import {
    Sheet,
    SheetContent,
    SheetHeader,
} from '@/components/ui/sheet';
import { useInitials } from '@/hooks/use-initials';
import { useNavDirection } from '@/hooks/use-nav-direction';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

const sidebarNav = [
    { title: 'Dashboard', href: '/pro/today', icon: LayoutDashboard },
    { title: 'Clients', href: '/pro/clients', icon: Users },
    { title: 'Programs', href: '/pro/programs', icon: ClipboardList },
    { title: 'Meal Plans', href: '/pro/nutrition', icon: Apple },
    { title: 'Messages', href: '/pro/messages', icon: MessagesSquare, matchExact: true },
    { title: 'Calendar', href: '/pro/calendar', icon: CalendarDays },
    { title: 'Analytics', href: '/pro/reports', icon: ChartColumn },
    { title: 'Payments', href: '/pro/payments', icon: Wallet },
];

const sidebarWorkspace = [
    { title: 'Check-ins', href: '/pro/check-ins', icon: ClipboardCheck },
    { title: 'Exercises', href: '/pro/exercises', icon: Dumbbell },
    { title: 'Content hub', href: '/pro/content', icon: ClipboardList },
    { title: 'Team', href: '/pro/members', icon: Users },
];

const tabs = [
    { title: 'Today', href: '/pro/today', icon: LayoutDashboard },
    { title: 'Content', href: '/pro/content', icon: ClipboardList },
    { title: 'Clients', href: '/pro/clients', icon: Users },
    { title: 'Reports', href: '/pro/reports', icon: ChartColumn },
];

const moreSections = [
    {
        label: 'Coaching',
        items: [
            { title: 'Calendar', href: '/pro/calendar', icon: CalendarDays },
            { title: 'Check-ins', href: '/pro/check-ins', icon: ClipboardCheck },
            { title: 'Messages', href: '/pro/clients?tab=messages', icon: MessagesSquare },
            { title: 'Payments', href: '/pro/payments', icon: CreditCard },
        ],
    },
    {
        label: 'Content',
        items: [
            { title: 'Programs', href: '/pro/content?tab=programs', icon: ClipboardList },
            { title: 'Exercises', href: '/pro/content?tab=exercises', icon: Dumbbell },
            { title: 'Nutrition', href: '/pro/content?tab=nutrition', icon: Apple },
        ],
    },
    {
        label: 'Workspace',
        items: [
            { title: 'Settings', href: '/pro/settings', icon: Settings },
            { title: 'Team', href: '/pro/members', icon: Users },
        ],
    },
];

export default function ProLayout({ children }: { children: ReactNode }) {
    const { url, props } = usePage<{
        auth: Auth;
        unreadMessages?: number;
        currentWorkspace?: { name: string };
    }>();
    const [moreOpen, setMoreOpen] = useState(false);
    const getInitials = useInitials();
    const user = props.auth?.user;
    const unread = props.unreadMessages ?? 0;

    const matches = (href: string) =>
        href.includes('?')
            ? url === href
            : url === href || url.startsWith(href + '/');
    const isActive = (href: string, extra?: string[]) =>
        [href, ...(extra ?? [])].some(matches);
    const moreActive = moreSections.some((s) => s.items.some((i) => isActive(i.href)));

    const direction = useNavDirection(tabs.map((t) => t.href));
    const pageAnim = {
        push: 'animate-in slide-in-from-bottom-8 fade-in duration-300',
        pop: 'animate-in slide-in-from-top-6 fade-in duration-300',
        tab: 'animate-in fade-in duration-200',
        none: '',
    }[direction];

    const sidebarItem = (item: { title: string; href: string; icon: typeof Users; matchExact?: boolean }) => {
        const active = item.matchExact
            ? url === item.href || url.startsWith(item.href + '/')
            : isActive(item.href);
        return (
            <Link
                key={item.title}
                href={item.href}
                className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-neutral-400 hover:bg-white/10 hover:text-white',
                )}
            >
                <item.icon className="size-4.5" />
                {item.title}
            </Link>
        );
    };

    return (
        <div className="min-h-svh bg-background">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-neutral-950 text-white lg:flex">
                <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Dumbbell className="size-5" />
                    </span>
                    <span className="text-lg font-bold tracking-tight">Trainet</span>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3">
                    {sidebarNav.map(sidebarItem)}
                    <p className="px-3 pt-5 pb-1 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                        Workspace
                    </p>
                    {sidebarWorkspace.map(sidebarItem)}
                </nav>

                <div className="border-t border-white/10 p-3">
                    <Link
                        href="/pro/settings"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/10"
                    >
                        <Avatar className="size-9">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-primary/20 text-xs text-primary">
                                {getInitials(user?.name ?? '?')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{user?.name}</p>
                            <p className="truncate text-xs text-neutral-400">
                                {props.currentWorkspace?.name ?? 'Professional'}
                            </p>
                        </div>
                    </Link>
                </div>
            </aside>

            <main
                key={url}
                className={cn(
                    'mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 motion-reduce:animate-none lg:ml-64 lg:max-w-5xl lg:px-8 lg:pt-8 lg:pb-12',
                    pageAnim,
                )}
            >
                {children}
            </main>

            {/* Mobile bottom nav */}
            <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
                <div className="mx-auto grid max-w-3xl grid-cols-5">
                    {tabs.map((tab) => {
                        const active = isActive(tab.href);
                        const showBadge = tab.href === '/pro/clients' && unread > 0;
                        return (
                            <Link
                                key={tab.title}
                                href={tab.href}
                                aria-label={tab.title}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 py-1.5 transition-colors active:scale-95',
                                    active
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'relative flex size-9 items-center justify-center rounded-full transition-colors',
                                        active && 'bg-primary text-primary-foreground',
                                    )}
                                >
                                    <tab.icon className="size-5" />
                                    {showBadge && (
                                        <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                                            {unread > 9 ? '9+' : unread}
                                        </span>
                                    )}
                                </span>
                            </Link>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => setMoreOpen(true)}
                        aria-label="More"
                        className={cn(
                            'flex flex-col items-center gap-0.5 py-1.5 transition-colors active:scale-95',
                            moreActive
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-9 items-center justify-center rounded-full transition-colors',
                                moreActive && 'bg-primary text-primary-foreground',
                            )}
                        >
                            <Ellipsis className="size-5" />
                        </span>
                    </button>
                </div>
            </nav>

            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent side="bottom" className="max-h-[75dvh] rounded-t-2xl">
                    <SheetHeader className="flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="size-10">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="bg-primary/15 text-xs text-primary">
                                    {getInitials(user?.name ?? '?')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                                <p className="text-sm font-semibold">{user?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {props.currentWorkspace?.name ?? 'Workspace'}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="space-y-4 pb-6">
                        {moreSections.map((section) => (
                            <div key={section.label}>
                                <p className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    {section.label}
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {section.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMoreOpen(false)}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs transition-colors',
                                                isActive(item.href)
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'hover:border-primary/40',
                                            )}
                                        >
                                            <item.icon className="size-5" />
                                            {item.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div>
                            <p className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Account
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                <Link
                                    href="/"
                                    onClick={() => setMoreOpen(false)}
                                    className="flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs transition-colors hover:border-primary/40"
                                >
                                    <LogOut className="size-5" />
                                    Switch persona
                                </Link>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
