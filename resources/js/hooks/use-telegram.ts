import { useEffect, useRef } from 'react';
import { applySafeAreas, getTg, isInTelegram } from '@/lib/telegram';

type SharedTelegram = { enabled: boolean; linked: boolean };

type BootPage = {
    props?: {
        auth?: { user: { id: number } | null };
        telegram?: SharedTelegram;
    };
};

/**
 * Shared props for the initial page, parsed from the data-page JSON on the
 * Inertia root element. usePage() isn't available here because this hook is
 * mounted outside the Inertia component tree.
 */
function bootPageProps(): BootPage['props'] {
    try {
        const raw = document.getElementById('app')?.dataset.page;

        return raw ? (JSON.parse(raw) as BootPage).props : undefined;
    } catch {
        return undefined;
    }
}

const SAFE_AREA_EVENTS = [
    'safeAreaChanged',
    'contentSafeAreaChanged',
    'viewportChanged',
];

/**
 * Boot the Telegram WebApp SDK inside a WebView: ready(), expand(), safe-area
 * injection, and Telegram chrome colors. No-op outside Telegram.
 */
export function useTelegram(): void {
    useEffect(() => {
        const tg = getTg();

        if (!tg?.initData) {
            return;
        }

        tg.ready();
        tg.expand();
        applySafeAreas();

        for (const event of SAFE_AREA_EVENTS) {
            tg.onEvent(event, applySafeAreas);
        }

        // Match Telegram chrome to the app theme.
        const scheme = tg.colorScheme;
        tg.setHeaderColor(scheme === 'dark' ? '#1c1c1e' : '#ffffff');
        tg.setBottomBarColor(scheme === 'dark' ? '#1c1c1e' : '#ffffff');
        tg.setBackgroundColor(scheme === 'dark' ? '#0e0e0e' : '#efeff4');

        return () => {
            for (const event of SAFE_AREA_EVENTS) {
                tg.offEvent(event, applySafeAreas);
            }
        };
    }, []);
}

/**
 * When the app runs inside Telegram and the visitor isn't authenticated,
 * POST the (server-validated) initData to sign in or create a client
 * account, then land on the client home. Already-authenticated users get
 * their Telegram identity linked instead.
 */
export function useTelegramAutoAuth(): void {
    const attempted = useRef(false);

    useEffect(() => {
        const tg = getTg();
        const props = bootPageProps();
        const telegram = props?.telegram;

        if (!tg?.initData || !telegram?.enabled || attempted.current) {
            return;
        }

        const shouldLink = props?.auth?.user && !telegram.linked;
        const shouldLogin = !props?.auth?.user;

        if (!shouldLogin && !shouldLink) {
            return;
        }

        attempted.current = true;

        const xsrf = decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
        );

        void fetch('/telegram/webapp-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrf,
            },
            body: JSON.stringify({ initData: tg.initData }),
            credentials: 'same-origin',
        }).then((res) => {
            if (!res.ok) {
                attempted.current = false;

                return;
            }

            if (shouldLogin) {
                // New session — full reload so deep links land server-authed.
                if (window.location.pathname.startsWith('/app')) {
                    window.location.reload();
                } else {
                    window.location.assign('/app/today');
                }
            }
            // Link-only: silent — shared prop refreshes on next visit.
        });
    }, []);
}

/**
 * Show Telegram's native back button on sub-pages. Hides on tab roots.
 */
export function useTelegramBackButton(visible = true): void {
    useEffect(() => {
        const tg = getTg();

        if (!tg) {
            return;
        }

        if (!visible) {
            tg.BackButton.hide();

            return;
        }

        const back = () => window.history.back();

        tg.BackButton.show();
        tg.BackButton.onClick(back);

        return () => {
            tg.BackButton.offClick(back);
            tg.BackButton.hide();
        };
    }, [visible]);
}

type MainButtonOptions = {
    text: string;
    onClick: () => void;
    visible?: boolean;
    disabled?: boolean;
    processing?: boolean;
};

/**
 * Drive Telegram's native MainButton for a page's primary action. The regular
 * in-page button must remain rendered as the fallback outside Telegram.
 */
export function useTelegramMainButton({
    text,
    onClick,
    visible = true,
    disabled = false,
    processing = false,
}: MainButtonOptions): void {
    const clickRef = useRef(onClick);

    clickRef.current = onClick;

    useEffect(() => {
        const tg = getTg();

        if (!tg?.initData) {
            return;
        }

        const btn = tg.MainButton;
        const handler = () => clickRef.current();

        if (!visible) {
            btn.hide();

            return;
        }

        btn.setParams({
            text,
            is_visible: true,
            is_active: !disabled,
        });

        if (processing) {
            btn.showProgress();
            btn.disable();
        } else {
            btn.hideProgress();
            if (disabled) {
                btn.disable();
            } else {
                btn.enable();
            }
        }

        btn.onClick(handler);

        return () => {
            btn.offClick(handler);
            btn.hide();
            btn.hideProgress();
        };
    }, [text, visible, disabled, processing]);
}

export { isInTelegram };
