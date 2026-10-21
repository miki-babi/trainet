<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->with(['users', 'lastMessage.sender'])
            ->get()
            ->sortByDesc(fn ($c) => $c->lastMessage?->created_at)
            ->map(fn ($c) => [
                'id' => $c->id,
                'other' => $c->users->firstWhere('id', '!=', $user->id)?->only('id', 'name'),
                'last' => $c->lastMessage ? [
                    'body' => $c->lastMessage->body,
                    'at' => $c->lastMessage->created_at->diffForHumans(),
                    'mine' => $c->lastMessage->sender_id === $user->id,
                ] : null,
                'unread' => $c->unreadCountFor($user),
            ])
            ->values();

        return Inertia::render('pro/messages/index', [
            'conversations' => $conversations,
        ]);
    }

    public function show(Request $request, Conversation $conversation): Response
    {
        $user = $request->user();
        abort_unless($conversation->users()->where('users.id', $user->id)->exists(), 403);

        $conversation->load('users', 'messages.sender');
        $conversation->members()->where('user_id', $user->id)->update(['last_read_at' => now()]);

        return Inertia::render('pro/messages/show', [
            'conversation' => [
                'id' => $conversation->id,
                'other' => $conversation->users->firstWhere('id', '!=', $user->id)?->only('id', 'name'),
            ],
            'messages' => $conversation->messages->map(fn ($m) => [
                'id' => $m->id,
                'body' => $m->body,
                'mine' => $m->sender_id === $user->id,
                'sender' => $m->sender->name,
                'at' => $m->created_at->format('H:i'),
                'day' => $m->created_at->format('j M'),
            ]),
        ]);
    }

    public function withClient(Request $request, ClientProfile $clientProfile): RedirectResponse
    {
        $user = $request->user();
        $workspaceId = $user->workspaceMember()->value('workspace_id');

        $conversation = Conversation::query()
            ->where('workspace_id', $workspaceId)
            ->where('type', 'direct')
            ->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('members', fn ($q) => $q->where('user_id', $clientProfile->user_id))
            ->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'workspace_id' => $workspaceId,
                'type' => 'direct',
            ]);
            $conversation->users()->attach([$user->id => [], $clientProfile->user_id => []]);
        }

        return redirect("/pro/messages/{$conversation->id}");
    }

    public function store(Request $request, Conversation $conversation): RedirectResponse
    {
        abort_unless($conversation->users()->where('users.id', $request->user()->id)->exists(), 403);

        $validated = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return back();
    }
}
