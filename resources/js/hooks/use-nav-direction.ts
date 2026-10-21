import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export type NavDirection = 'push' | 'pop' | 'tab' | 'none';

/**
 * Tracks Inertia navigations and reports whether the current visit was a
 * "push" (new sheet sliding in), "pop" (back navigation), "tab" (switching
 * between root destinations) or the initial render ("none").
 */
export function useNavDirection(roots: string[]): NavDirection {
    const { url } = usePage();
    const stack = useRef<string[]>([url]);
    const [direction, setDirection] = useState<NavDirection>('none');

    useEffect(() => {
        const s = stack.current;
        const last = s[s.length - 1];
        if (last === url) {
            return; // same-page visit (form posts, partial reloads)
        }

        if (s.length > 1 && s[s.length - 2] === url) {
            s.pop();
            setDirection('pop');
            return;
        }

        const isRoot = (u: string) => roots.some((r) => u.startsWith(r));
        if (isRoot(last) && isRoot(url)) {
            s.length = 0;
            s.push(url);
            setDirection('tab');
            return;
        }

        s.push(url);
        if (s.length > 50) {
            s.splice(0, s.length - 50);
        }
        setDirection('push');
    }, [url]);

    return direction;
}
