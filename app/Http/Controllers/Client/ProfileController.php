<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\WorkoutSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $client = $request->user()->clientProfile;

        $recent = WorkoutSession::query()
            ->with('trainingDay')
            ->where('client_id', $client->id)
            ->where('status', 'completed')
            ->orderByDesc('scheduled_for')
            ->limit(5)
            ->get();

        return Inertia::render('client/profile/edit', [
            'profile' => $client->load('user'),
            'recent' => $recent,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'height_cm' => ['nullable', 'numeric', 'min:100', 'max:250'],
            'birth_year' => ['nullable', 'integer', 'min:1930', 'max:2015'],
            'training_days' => ['nullable', 'array'],
            'training_days.*' => ['integer', 'min:1', 'max:7'],
            'equipment' => ['nullable', 'array'],
            'dietary_preferences' => ['nullable', 'array'],
            'goals_summary' => ['nullable', 'string', 'max:500'],
            'allergies' => ['nullable', 'string', 'max:300'],
            'injuries' => ['nullable', 'string', 'max:300'],
            'timezone' => ['nullable', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:120'],
        ]);

        $profile = $request->user()->clientProfile;
        $profile->update(collect($validated)->except('name', 'timezone')->toArray());
        $request->user()->update(collect($validated)->only('name', 'timezone')->toArray());

        return back();
    }
}
