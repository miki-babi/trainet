<?php

namespace App\Http\Controllers\Client;

use App\Enums\WorkStatus;
use App\Http\Controllers\Controller;
use App\Models\WorkoutSessionExercise;
use App\Models\WorkoutSet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WorkoutSetController extends Controller
{
    public function store(Request $request, WorkoutSessionExercise $workoutSessionExercise): RedirectResponse
    {
        $this->authorize($request, $workoutSessionExercise);

        WorkoutSet::create([
            'workout_session_exercise_id' => $workoutSessionExercise->id,
            'set_order' => $workoutSessionExercise->sets()->max('set_order') + 1,
            'planned_reps' => $workoutSessionExercise->sets()->first()?->planned_reps ?? 8,
            'planned_load' => $workoutSessionExercise->target_load,
            'status' => WorkStatus::Pending,
        ]);

        return back();
    }

    public function update(Request $request, WorkoutSessionExercise $workoutSessionExercise, WorkoutSet $workoutSet): RedirectResponse
    {
        $this->authorize($request, $workoutSessionExercise);

        $validated = $request->validate([
            'actual_reps' => ['nullable', 'integer', 'min:0', 'max:999'],
            'actual_load' => ['nullable', 'numeric', 'min:0'],
            'actual_rpe' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'status' => ['nullable', 'in:pending,done,skipped'],
        ]);

        $workoutSet->update($validated);

        // Mark parent exercise done when all sets are done/skipped.
        $exercise = $workoutSessionExercise->refresh();
        if ($exercise->sets->every(fn ($s) => in_array($s->status?->value ?? $s->status, ['done', 'skipped']))) {
            $exercise->update(['status' => WorkStatus::Done]);
        }

        return back();
    }

    private function authorize(Request $request, WorkoutSessionExercise $exercise): void
    {
        abort_unless(
            $exercise->workoutSession->client_id === $request->user()->clientProfile->id,
            403,
        );
    }
}
