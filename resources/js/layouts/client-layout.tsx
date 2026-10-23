import { Link, usePage } from '@inertiajs/react';
import {
    ChartLine,
    Dumbbell,
    Home,
    UserRound,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavDirection } from '@/hooks/use-nav-direction';
import { useTelegramBackButton } from '@/hooks/use-telegram';
import { haptics } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

type Tab = { title: string; href: string; icon: LucideIcon; matchExtra?: string[] };

const tabs: Tab[] = [
    { title: 'Home', href: '/app/today', icon: Home },
    {
        title: 'Plans',
        href: '/app/training',
        icon: Dumbbell,
        matchExtra: ['/app/workouts', '/app/exercises', '/app/history'],
    },
    {
        title: 'Discover',
        href: '/app/professionals',
        icon: Users,
        matchExtra: ['/app/messages'],
    },
    { title: 'Progress', href: '/app/progress', icon: ChartLine },
    { title: 'Profile', href: '/app/profile', icon: UserRound },
];

export default function ClientLayout({ children }: { children: ReactNode }) {
    const { url } = usePage<{ auth: Auth }>();

    const isActive = (href: string, extra?: string[]) =>
        url.startsWith(href) || (extra ?? []).some((m) => url.startsWith(m));

    const pathname = url.split('?')[0];
    const isTabRoot = tabs.some((tab) => pathname === tab.href);
    useTelegramBackButton(!isTabRoot);

    const direction = useNavDirection(tabs.map((t) => t.href));
    const pageAnim = {
        push: 'animate-in slide-in-from-bottom-8 fade-in duration-300',
        pop: 'animate-in slide-in-from-top-6 fade-in duration-300',
        tab: 'animate-in fade-in duration-200',
        none: '',
    }[direction];

    return (
        <div className="tg flex min-h-svh flex-col bg-background">
            <main
                key={url}
                className={cn(
                    'mx-auto w-full max-w-2xl flex-1 px-4 pb-24 motion-reduce:animate-none',
                    'pt-[max(1rem,var(--safe-top))]',
                    pageAnim,
                )}
            >
                {children}
            </main>

            <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[max(env(safe-area-inset-bottom),var(--safe-bottom))] backdrop-blur">
                <div className="mx-auto grid max-w-2xl grid-cols-5">
                    {tabs.map((tab) => {
                        const active = isActive(tab.href, tab.matchExtra);
                        return (
                            <Link
                                key={tab.title}
                                href={tab.href}
                                aria-label={tab.title}
                                onClick={() => haptics.selection()}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 py-1.5 transition-colors active:scale-95',
                                    active
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <tab.icon className="size-6" strokeWidth={active ? 2.25 : 1.75} />
                                <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>
                                    {tab.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
