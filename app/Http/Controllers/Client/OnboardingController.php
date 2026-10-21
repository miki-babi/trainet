<?php

namespace App\Http\Controllers\Client;

use App\Enums\OnboardingStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function edit(Request $request): Response
    {
        $profile = $request->user()->clientProfile;

        return Inertia::render('client/onboarding', [
            'profile' => $profile,
            'step' => $request->integer('step', 1),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $profile = $request->user()->clientProfile;

        $validated = $request->validate([
            'height_cm' => ['nullable', 'numeric', 'min:100', 'max:250'],
            'birth_year' => ['nullable', 'integer', 'min:1930', 'max:2015'],
            'experience_level' => ['nullable', 'in:beginner,intermediate,advanced'],
            'equipment' => ['nullable', 'array'],
            'training_days' => ['nullable', 'array'],
            'dietary_preferences' => ['nullable', 'array'],
            'allergies' => ['nullable', 'string', 'max:300'],
            'injuries' => ['nullable', 'string', 'max:300'],
            'goals_summary' => ['nullable', 'string', 'max:500'],
            'consent' => ['accepted'],
            'finish' => ['boolean'],
        ]);

        $profile->update(collect($validated)->except('consent', 'finish')->toArray());

        if ($validated['finish'] ?? false) {
            $profile->update([
                'onboarding_status' => OnboardingStatus::Complete,
                'consent_accepted_at' => now(),
            ]);

            return redirect('/app/today');
        }

        $profile->update(['onboarding_status' => OnboardingStatus::InProgress]);

        return back();
    }
}
