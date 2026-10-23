import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { haptics } from '@/lib/telegram';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            if (data.type === 'success' || data.type === 'error') {
                haptics.notify(data.type);
            }

            toast[data.type](data.message);
        });
    }, []);
}
