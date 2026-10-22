<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ClientMetricEntry;
use App\Models\Conversation;
use App\Models\Goal;
use App\Models\Message;
use App\Models\MetricDefinition;
use App\Models\ProgressPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgressController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->clientProfile;

        $metrics = ClientMetricEntry::query()
            ->with('metric')
            ->where('client_id', $client->id)
            ->orderBy('observed_on')
            ->get()
            ->groupBy(fn ($e) => $e->metric->name)
            ->map(fn ($entries) => $entries->map(fn ($e) => [
                'id' => $e->id,
                'date' => $e->observed_on->format('j M'),
                'full_date' => $e->observed_on->toDateString(),
                'value' => (float) $e->value,
                'unit' => $e->unit,
            ])->values());

        return Inertia::render('client/progress/index', [
            'metrics' => $metrics,
            'metricDefs' => MetricDefinition::query()
                ->where(fn ($q) => $q->whereNull('workspace_id')->orWhere('workspace_id', $client->user->workspaceMember?->workspace_id))
                ->get(),
            'goals' => Goal::query()->where('client_id', $client->id)->orderByDesc('created_at')->get(),
            'photos' => ProgressPhoto::query()->where('client_id', $client->id)->orderByDesc('taken_on')->get(),
            'hasPro' => $client->activeProfessionals()->exists(),
        ]);
    }

    public function storeMetric(Request $request): RedirectResponse
    {
        $client = $request->user()->clientProfile;

        $validated = $request->validate([
            'metric_definition_id' => ['required', 'exists:metric_definitions,id'],
            'value' => ['required', 'numeric'],
            'observed_on' => ['required', 'date', 'before_or_equal:today'],
            'unit' => ['nullable', 'string', 'max:20'],
        ]);

        $def = MetricDefinition::findOrFail($validated['metric_definition_id']);

        ClientMetricEntry::create([
            'client_id' => $client->id,
            'metric_definition_id' => $def->id,
            'value' => $validated['value'],
            'unit' => $validated['unit'] ?? $def->unit,
            'observed_on' => $validated['observed_on'],
            'source' => 'manual',
        ]);

        return back();
    }

    /** One-tap progress log: photo + date + weight in a single submit. */
    public function quickLog(Request $request): RedirectResponse
    {
        $client = $request->user()->clientProfile;

        $validated = $request->validate([
            'photo' => ['required_without:weight', 'nullable', 'image', 'max:5120'],
            'weight' => ['required_without:photo', 'nullable', 'numeric', 'min:0', 'max:500'],
            'taken_on' => ['required', 'date', 'before_or_equal:today'],
        ]);

        if ($request->hasFile('photo')) {
            ProgressPhoto::create([
                'client_id' => $client->id,
                'path' => $request->file('photo')->store('progress', 'public'),
                'taken_on' => $validated['taken_on'],
                'label' => 'Quick log',
            ]);
        }

        if ($validated['weight'] ?? null) {
            $def = MetricDefinition::query()->where('key', 'weight')->firstOrFail();
            ClientMetricEntry::create([
                'client_id' => $client->id,
                'metric_definition_id' => $def->id,
                'value' => $validated['weight'],
                'unit' => $def->unit,
                'observed_on' => $validated['taken_on'],
                'source' => 'manual',
            ]);
        }

        return back();
    }

    public function storePhoto(Request $request): RedirectResponse
    {
        $client = $request->user()->clientProfile;

        $validated = $request->validate([
            'photo' => ['required', 'image', 'max:5120'],
            'taken_on' => ['nullable', 'date', 'before_or_equal:today'],
            'label' => ['nullable', 'string', 'max:60'],
        ]);

        $path = $request->file('photo')->store('progress', 'public');

        ProgressPhoto::create([
            'client_id' => $client->id,
            'path' => $path,
            'taken_on' => $validated['taken_on'] ?? today(),
            'label' => $validated['label'] ?? null,
        ]);

        return back();
    }

    /** Post a snapshot of the client's latest metrics into their coach conversation. */
    public function share(Request $request): RedirectResponse
    {
        $user = $request->user();
        $client = $user->clientProfile;
        $pro = $client->activeProfessionals()->with('professional')->first()?->professional;

        $conversation = $pro ? Conversation::query()
            ->where('type', 'direct')
            ->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('members', fn ($q) => $q->where('user_id', $pro->id))
            ->first() : null;

        abort_unless($conversation, 422, 'No coach conversation to share with yet.');

        $latest = fn (string $key) => ClientMetricEntry::query()
            ->where('client_id', $client->id)
            ->whereHas('metric', fn ($q) => $q->where('key', $key))
            ->orderByDesc('observed_on')
            ->first();

        $parts = collect([
            'weight' => $latest('weight'),
            'body_fat' => $latest('body_fat'),
        ])->filter()->map(fn ($e) => "{$e->metric->name}: {$e->value} {$e->unit}")->implode(' · ');

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'body' => $parts ? "Progress update — {$parts}" : 'Shared my progress — take a look!',
        ]);

        return back();
    }
}
