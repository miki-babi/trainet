<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ClientMetricEntry;
use App\Models\Goal;
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
}
