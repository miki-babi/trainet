<?php

namespace App\Http\Controllers\Pro;

use App\Enums\WorkoutSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CheckInSubmission;
use App\Models\ClientInvite;
use App\Models\ClientMetricEntry;
use App\Models\ClientNote;
use App\Models\ClientProfile;
use App\Models\ClientTag;
use App\Models\Conversation;
use App\Models\NutritionAssignment;
use App\Models\NutritionTarget;
use App\Models\ProfessionalClientAssignment;
use App\Models\ProgressPhoto;
use App\Models\WorkoutSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->workspaceMember->workspace_id;
    }

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);
        $search = $request->string('search')->toString();
        $tag = $request->string('tag')->toString();

        $status = $request->string('status')->toString();

        $pendingCheckinClientIds = CheckInSubmission::query()
            ->where('status', 'submitted')
            ->pluck('client_id')
            ->all();

        $clients = ClientProfile::query()
            ->with(['user', 'tags', 'programAssignments' => fn ($q) => $q->where('status', 'active')->with('programVersion.program'), 'professionalAssignments' => fn ($q) => $q->where('workspace_id', $workspaceId)])
            ->whereHas('professionalAssignments', fn ($q) => $q->where('workspace_id', $workspaceId)->where('status', 'active'))
            ->when($search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
            ->when($tag, fn ($q) => $q->whereHas('tags', fn ($t) => $t->where('client_tags.id', $tag)))
            ->get()
            ->map(function (ClientProfile $client) use ($pendingCheckinClientIds) {
                $lastSession = WorkoutSession::query()
                    ->where('client_id', $client->id)
                    ->where('status', WorkoutSessionStatus::Completed)
                    ->max('scheduled_for');

                $needsAttention = in_array($client->id, $pendingCheckinClientIds)
                    || ! $lastSession
                    || $lastSession < today()->subDays(10)->toDateString();

                $relationships = $client->professionalAssignments
                    ->where('status', 'active')
                    ->pluck('relationship_type')
                    ->map(fn ($r) => $r->value)
                    ->unique()
                    ->map(fn ($r) => $r === 'nutritionist' ? 'Nutrition' : 'Training')
                    ->values();

                return [
                    'id' => $client->id,
                    'name' => $client->user->name,
                    'avatar' => $client->user->avatar,
                    'email' => $client->user->email,
                    'onboarding' => $client->onboarding_status?->value,
                    'goals' => $client->goals_summary,
                    'tags' => $client->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'color' => $t->color]),
                    'program' => $client->programAssignments->first()?->programVersion?->program?->name,
                    'relationship' => $relationships->implode(' · '),
                    'last_active' => $lastSession,
                    'status' => $needsAttention ? 'needs_attention' : 'on_track',
                ];
            })
            ->when($status === 'attention', fn ($c) => $c->where('status', 'needs_attention')->values())
            ->when($status === 'on_track', fn ($c) => $c->where('status', 'on_track')->values());

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

        $pendingRequests = ProfessionalClientAssignment::query()
            ->with('client.user')
            ->where('workspace_id', $workspaceId)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'client_name' => $a->client->user->name,
                'relationship_type' => $a->relationship_type->value,
                'requested_at' => $a->created_at->diffForHumans(),
            ]);

        return Inertia::render('pro/clients/index', [
            'tab' => $request->string('tab', 'clients')->toString(),
            'clients' => $clients,
            'tags' => ClientTag::where('workspace_id', $workspaceId)->get(),
            'filters' => ['search' => $search, 'tag' => $tag, 'status' => $status],
            'conversations' => $conversations,
            'pendingRequests' => $pendingRequests,
        ]);
    }

    public function approveRequest(Request $request, ProfessionalClientAssignment $assignment): RedirectResponse
    {
        abort_unless(
            $assignment->workspace_id === $this->workspaceId($request)
                && $assignment->status->value === 'pending',
            403,
        );

        $assignment->update(['status' => 'active']);

        return back();
    }

    public function declineRequest(Request $request, ProfessionalClientAssignment $assignment): RedirectResponse
    {
        abort_unless(
            $assignment->workspace_id === $this->workspaceId($request)
                && $assignment->status->value === 'pending',
            403,
        );

        $assignment->delete();

        return back();
    }

    public function show(Request $request, ClientProfile $clientProfile): Response
    {
        $workspaceId = $this->workspaceId($request);
        abort_unless(
            $clientProfile->professionalAssignments()->where('workspace_id', $workspaceId)->exists(),
            404,
        );

        $clientProfile->load([
            'user',
            'tags',
            'professionalAssignments.professional',
            'programAssignments' => fn ($q) => $q->where('status', 'active')->with('programVersion.program', 'programVersion.days'),
            'notes' => fn ($q) => $q->with('author')->latest()->limit(20),
        ]);

        $sessions = WorkoutSession::query()
            ->with('trainingDay')
            ->where('client_id', $clientProfile->id)
            ->orderByDesc('scheduled_for')
            ->limit(10)
            ->get();

        $metrics = ClientMetricEntry::query()
            ->with('metric')
            ->where('client_id', $clientProfile->id)
            ->orderBy('observed_on')
            ->get()
            ->groupBy(fn ($e) => $e->metric->name)
            ->map(fn ($entries) => $entries->map(fn ($e) => [
                'date' => $e->observed_on->format('j M'),
                'value' => (float) $e->value,
                'unit' => $e->unit,
            ])->values());

        $checkIns = CheckInSubmission::query()
            ->with('review')
            ->where('client_id', $clientProfile->id)
            ->orderByDesc('due_on')
            ->limit(10)
            ->get();

        $appointments = Appointment::query()
            ->with('type', 'professional')
            ->where('client_id', $clientProfile->id)
            ->orderByDesc('starts_at')
            ->limit(10)
            ->get();

        $nutritionTargets = NutritionTarget::query()
            ->where('client_id', $clientProfile->id)
            ->orderByDesc('starts_on')
            ->first();

        $nutritionAssignment = NutritionAssignment::query()
            ->with('planVersion.plan', 'planVersion.days.meals.items.food')
            ->where('client_id', $clientProfile->id)
            ->where('status', 'active')
            ->first();

        $photos = ProgressPhoto::query()
            ->where('client_id', $clientProfile->id)
            ->orderByDesc('taken_on')
            ->limit(8)
            ->get();

        return Inertia::render('pro/clients/show', [
            'client' => $clientProfile,
            'sessions' => $sessions,
            'metrics' => $metrics,
            'checkIns' => $checkIns,
            'appointments' => $appointments,
            'nutritionTargets' => $nutritionTargets,
            'nutritionAssignment' => $nutritionAssignment,
            'photos' => $photos,
            'allTags' => ClientTag::where('workspace_id', $workspaceId)->get(),
            'workspace' => $request->user()->workspaceMember->workspace->only('id', 'name'),
        ]);
    }

    public function storeNote(Request $request, ClientProfile $clientProfile): RedirectResponse
    {
        $validated = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        ClientNote::create([
            'client_id' => $clientProfile->id,
            'author_id' => $request->user()->id,
            'body' => $validated['body'],
            'visibility' => 'private',
        ]);

        return back();
    }

    public function syncTags(Request $request, ClientProfile $clientProfile): RedirectResponse
    {
        $validated = $request->validate(['tag_ids' => ['array'], 'tag_ids.*' => ['integer', 'exists:client_tags,id']]);

        $clientProfile->tags()->sync($validated['tag_ids'] ?? []);

        return back();
    }

    public function updateStatus(Request $request, ClientProfile $clientProfile): RedirectResponse
    {
        $validated = $request->validate(['status' => ['required', 'in:active,paused,ended']]);

        $clientProfile->professionalAssignments()
            ->where('workspace_id', $this->workspaceId($request))
            ->update(['status' => $validated['status']]);

        return back();
    }

    public function storeInvite(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_name' => ['nullable', 'string', 'max:120'],
            'intended_relationship' => ['required', 'in:trainer,nutritionist'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:30'],
        ]);

        $token = Str::random(32);

        ClientInvite::create([
            'workspace_id' => $this->workspaceId($request),
            'creator_id' => $request->user()->id,
            'client_name' => $validated['client_name'] ?? null,
            'token_hash' => hash('sha256', $token),
            'intended_relationship' => $validated['intended_relationship'],
            'status' => 'pending',
            'expires_at' => now()->addDays($validated['expires_in_days'] ?? 7),
        ]);

        return back()->with('inviteLink', url("/invite/{$token}"));
    }
}
