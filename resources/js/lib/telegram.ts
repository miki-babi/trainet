type TelegramUser = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
};

type BottomButtonParams = {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
    has_shine_effect?: boolean;
};

type TelegramBottomButton = {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    setParams: (params: BottomButtonParams) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
};

type TelegramBackButton = {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
};

type TelegramHapticFeedback = {
    impactOccurred: (
        style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft',
    ) => void;
    notificationOccurred: (type: 'success' | 'error' | 'warning') => void;
    selectionChanged: () => void;
};

type Inset = { top: number; bottom: number; left: number; right: number };

type TelegramWebApp = {
    initData: string;
    initDataUnsafe: { user?: TelegramUser } & Record<string, unknown>;
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: Record<string, string>;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    bottomBarColor: string;
    isFullscreen: boolean;
    safeAreaInset?: Inset;
    contentSafeAreaInset?: Inset;
    BackButton: TelegramBackButton;
    MainButton: TelegramBottomButton;
    SecondaryButton: TelegramBottomButton;
    HapticFeedback: TelegramHapticFeedback;
    ready: () => void;
    expand: () => void;
    close: () => void;
    onEvent: (event: string, cb: (...args: unknown[]) => void) => void;
    offEvent: (event: string, cb: (...args: unknown[]) => void) => void;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setBottomBarColor: (color: string) => void;
    showAlert: (message: string, cb?: () => void) => void;
    showConfirm: (message: string, cb: (confirmed: boolean) => void) => void;
    openTelegramLink: (url: string) => void;
};

declare global {
    interface Window {
        Telegram?: { WebApp?: TelegramWebApp };
    }
}

export function getTg(): TelegramWebApp | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.Telegram?.WebApp ?? null;
}

export function isInTelegram(): boolean {
    return !!getTg()?.initData;
}

export function telegramUser(): TelegramUser | null {
    return getTg()?.initDataUnsafe?.user ?? null;
}

/**
 * Inject --safe-top/--safe-bottom on <html>, combining Telegram's system and
 * content safe-area insets (with sane fallbacks for non-Telegram browsers).
 */
export function applySafeAreas(): void {
    const tg = getTg();
    const safe = tg?.safeAreaInset;
    const content = tg?.contentSafeAreaInset;
    const top = Math.max(0, (content?.top ?? 0) + (safe?.top ?? 0));
    const bottom = Math.max(0, (content?.bottom ?? 0) + (safe?.bottom ?? 0));

    document.documentElement.style.setProperty('--safe-top', `${top}px`);
    document.documentElement.style.setProperty('--safe-bottom', `${bottom}px`);
}

export const haptics = {
    impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
        getTg()?.HapticFeedback?.impactOccurred(style);
    },
    notify(type: 'success' | 'error' | 'warning') {
        getTg()?.HapticFeedback?.notificationOccurred(type);
    },
    selection() {
        getTg()?.HapticFeedback?.selectionChanged();
    },
};

export type { TelegramUser, TelegramWebApp };
