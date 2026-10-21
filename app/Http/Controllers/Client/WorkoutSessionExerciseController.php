<?php

namespace App\Http\Controllers\Client;

use App\Enums\WorkStatus;
use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Models\WorkoutSessionExercise;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WorkoutSessionExerciseController extends Controller
{
    public function skip(Request $request, WorkoutSessionExercise $workoutSessionExercise): RedirectResponse
    {
        $this->authorize($request, $workoutSessionExercise);

        $workoutSessionExercise->update([
            'status' => WorkStatus::Skipped,
            'skip_reason' => $request->input('reason'),
        ]);

        return back();
    }

    public function replace(Request $request, WorkoutSessionExercise $workoutSessionExercise): RedirectResponse
    {
        $this->authorize($request, $workoutSessionExercise);

        $validated = $request->validate(['exercise_id' => ['required', 'exists:exercises,id']]);

        $new = Exercise::findOrFail($validated['exercise_id']);

        $workoutSessionExercise->update([
            'exercise_id' => $new->id,
            'replaced_exercise_id' => $workoutSessionExercise->exercise_id,
            'notes' => $workoutSessionExercise->notes
                ? $workoutSessionExercise->notes.' (swapped)'
                : 'Swapped exercise',
        ]);

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
