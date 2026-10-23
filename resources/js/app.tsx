import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { useTelegram, useTelegramAutoAuth } from '@/hooks/use-telegram';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import ClientLayout from '@/layouts/client-layout';
import PersonaLayout from '@/layouts/persona-layout';
import ProLayout from '@/layouts/pro-layout';
import SettingsLayout from '@/layouts/settings/layout';

function TelegramBootstrap({ children }: { children: ReactNode }) {
    useTelegram();
    useTelegramAutoAuth();

    return <>{children}</>;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome' || name === 'personas':
                return PersonaLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('client/'):
                return ClientLayout;
            case name.startsWith('pro/'):
                return ProLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                <TelegramBootstrap>{app}</TelegramBootstrap>
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#059669',
    },
});

// This will set light / dark mode on load...
initializeTheme();
