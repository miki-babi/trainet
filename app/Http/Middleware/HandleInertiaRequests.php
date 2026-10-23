<?php

namespace App\Http\Middleware;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'persona' => $this->personaFor($user),
            'demo' => (bool) config('trainet.demo'),
            'telegram' => [
                'enabled' => (bool) config('services.telegram.bot_token'),
                'linked' => (bool) $user?->telegramAccounts()->exists(),
            ],
            'currentWorkspace' => $user?->workspaceMember?->workspace?->only('id', 'name', 'type'),
            'proApproval' => $user?->professionalProfile?->approval_status,
            'unreadMessages' => $user ? $this->unreadCount($user) : 0,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    private function personaFor(?User $user): ?string
    {
        if (! $user) {
            return null;
        }

        if ($user->isAdmin()) {
            return 'admin';
        }

        return $user->clientProfile()->exists() ? 'client' : 'professional';
    }

    private function unreadCount(User $user): int
    {
        return Conversation::query()
            ->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->with('members')
            ->get()
            ->sum(fn (Conversation $conversation) => $conversation->unreadCountFor($user));
    }
}
