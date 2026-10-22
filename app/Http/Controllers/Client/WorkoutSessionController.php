<?php

namespace App\Http\Controllers\Client;

use App\Enums\WorkoutSessionStatus;
use App\Enums\WorkStatus;
use App\Http\Controllers\Controller;
use App\Models\PersonalRecord;
use App\Models\WorkoutSession;
use App\Models\WorkoutSessionExercise;
use App\Models\WorkoutSet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WorkoutSessionController extends Controller
{
    private function authorize(Request $request, WorkoutSession $session): void
    {
        abort_unless($session->client_id === $request->user()->clientProfile->id, 403);
    }

    public function show(Request $request, WorkoutSession $workoutSession): Response
    {
        $this->authorize($request, $workoutSession);

        $workoutSession->load([
            'trainingDay',
            'exercises.exercise.muscleGroups',
            'exercises.exercise.equipment',
            'exercises.exercise.alternatives',
            'exercises.exercise.media',
            'exercises.sets' => fn ($q) => $q->orderBy('set_order'),
        ]);

        // Previous bests per exercise for context.
        $prMap = PersonalRecord::query()
            ->where('client_id', $workoutSession->client_id)
            ->whereIn('exercise_id', $workoutSession->exercises->pluck('exercise_id'))
            ->get()
            ->keyBy('exercise_id');

        return Inertia::render('client/workouts/show', [
            'session' => $workoutSession,
            'personalRecords' => $prMap,
        ]);
    }

    public function start(Request $request, WorkoutSession $workoutSession): RedirectResponse
    {
        $this->authorize($request, $workoutSession);

        abort_unless(
            in_array($workoutSession->status, [WorkoutSessionStatus::Scheduled, WorkoutSessionStatus::Paused]),
            422,
            'Session cannot be started from its current state.',
        );

        DB::transaction(function () use ($workoutSession) {
            if ($workoutSession->exercises()->doesntExist()) {
                $this->seedSessionExercises($workoutSession);
            }
            $workoutSession->update([
                'status' => WorkoutSessionStatus::InProgress,
                'started_at' => $workoutSession->started_at ?? now(),
            ]);
        });

        return redirect("/app/workouts/{$workoutSession->id}");
    }

    public function pause(Request $request, WorkoutSession $workoutSession): RedirectResponse
    {
        $this->authorize($request, $workoutSession);
        $workoutSession->update(['status' => WorkoutSessionStatus::Paused]);

        return back();
    }

    public function resume(Request $request, WorkoutSession $workoutSession): RedirectResponse
    {
        $this->authorize($request, $workoutSession);
        $workoutSession->update(['status' => WorkoutSessionStatus::InProgress]);

        return back();
    }

    public function complete(Request $request, WorkoutSession $workoutSession): RedirectResponse
    {
        $this->authorize($request, $workoutSession);

        DB::transaction(function () use ($workoutSession) {
            $started = $workoutSession->started_at ?? now();
            $workoutSession->update([
                'status' => WorkoutSessionStatus::Completed,
                'completed_at' => now(),
                'duration_seconds' => now()->diffInSeconds($started),
            ]);

            // Record personal records for any completed max-load sets.
            foreach ($workoutSession->exercises()->with('sets')->get() as $exercise) {
                $maxLoad = $exercise->sets->where('status', 'done')->max('actual_load');
                if ($maxLoad) {
                    $current = PersonalRecord::query()
                        ->where('client_id', $workoutSession->client_id)
                        ->where('exercise_id', $exercise->exercise_id)
                        ->where('type', 'max_load')
                        ->max('value');
                    if (! $current || $maxLoad > $current) {
                        PersonalRecord::create([
                            'client_id' => $workoutSession->client_id,
                            'exercise_id' => $exercise->exercise_id,
                            'type' => 'max_load',
                            'value' => $maxLoad,
                            'achieved_at' => now(),
                        ]);
                    }
                }
            }
        });

        return redirect("/app/workouts/{$workoutSession->id}");
    }

    public function skip(Request $request, WorkoutSession $workoutSession): RedirectResponse
    {
        $this->authorize($request, $workoutSession);
        $workoutSession->update(['status' => WorkoutSessionStatus::Skipped]);

        return redirect('/app/today');
    }

    public function update(Request $request, WorkoutSession $workoutSession): RedirectResponse
    {
        $this->authorize($request, $workoutSession);
        $workoutSession->update($request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]));

        return back();
    }

    private function seedSessionExercises(WorkoutSession $session): void
    {
        $session->loadMissing('trainingDay.exercises');

        foreach ($session->trainingDay->exercises as $dayExercise) {
            $sessionExercise = WorkoutSessionExercise::create([
                'workout_session_id' => $session->id,
                'exercise_id' => $dayExercise->exercise_id,
                'order' => $dayExercise->order,
                'group_label' => $dayExercise->group_label,
                'target_sets' => $dayExercise->sets,
                'target_reps' => $dayExercise->reps,
                'target_load' => $dayExercise->target_load,
                'target_duration_seconds' => $dayExercise->duration_seconds,
                'target_rpe' => $dayExercise->rpe,
                'rest_seconds' => $dayExercise->rest_seconds,
                'status' => WorkStatus::Pending,
            ]);

            $setCount = $dayExercise->sets ?? 3;
            for ($s = 1; $s <= $setCount; $s++) {
                WorkoutSet::create([
                    'workout_session_exercise_id' => $sessionExercise->id,
                    'set_order' => $s,
                    'planned_reps' => (int) ($dayExercise->reps ?: 8),
                    'planned_load' => $dayExercise->target_load,
                    'status' => WorkStatus::Pending,
                ]);
            }
        }
    }
}
