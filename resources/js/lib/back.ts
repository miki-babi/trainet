import { router } from '@inertiajs/react';

let hasNavigated = false;

if (typeof window !== 'undefined') {
    router.on('navigate', () => {
        hasNavigated = true;
    });
}

/**
 * Go back to the previous in-app page when there is one, otherwise visit the
 * given fallback so deep links still have a sane back target.
 */
export function goBack(fallback: string = '/') {
    if (hasNavigated && window.history.length > 1) {
        window.history.back();
    } else {
        router.visit(fallback);
    }
}
