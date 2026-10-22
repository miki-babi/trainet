/** Resolve a stored media path — hotlinked URLs pass through, local paths get /storage/. */
export function mediaUrl(path: string | null | undefined): string | null {
    if (!path) {
        return null;
    }

    return path.startsWith('http') ? path : `/storage/${path}`;
}
