import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Dumbbell } from 'lucide-react';

export default function Welcome() {
    return (
        <>
            <Head title="Trainet" />
            <div className="relative flex min-h-svh flex-col overflow-hidden bg-neutral-950 text-white">
                {/* Photo hero with dark gradient overlay */}
                <img
                    src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(6,10,24,0.25) 0%, rgba(6,10,24,0.35) 40%, rgba(6,10,24,0.92) 75%, rgba(6,10,24,0.98) 100%)',
                    }}
                />

                <header className="relative z-10 flex items-center justify-between px-6 pt-6">
                    <div className="flex items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Dumbbell className="size-5" />
                        </span>
                        <span className="text-lg font-bold tracking-tight">Trainet</span>
                    </div>
                    <Link
                        href="/personas"
                        className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                    >
                        Log in
                    </Link>
                </header>

                <main className="relative z-10 mt-auto flex flex-col gap-6 px-6 pb-12">
                    <div>
                        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight">
                            Better
                            <br />
                            Health.
                            <br />
                            Bigger
                            <br />
                            Goals.
                        </h1>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
                            Find expert trainers and nutritionists, get personalized plans, and track
                            your progress — all in one place.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/personas"
                            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
                        >
                            Get Started <ArrowRight className="size-4" />
                        </Link>
                        <Link
                            href="/personas"
                            className="block text-center text-sm font-medium text-white/80 transition-colors hover:text-white"
                        >
                            Log in
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}
