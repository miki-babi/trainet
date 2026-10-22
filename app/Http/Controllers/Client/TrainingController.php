<?php

namespace App\Http\Controllers\Client;

use App\Enums\AssignmentStatus;
use App\Http\Controllers\Controller;
use App\Models\NutritionAssignment;
use App\Models\ProgramAssignment;
use App\Models\TrainingDay;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrainingController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->clientProfile;

        $assignment = ProgramAssignment::query()
            ->with(
                'programVersion.program',
                'programVersion.days.exercises.exercise',
                'assignedBy:id,name,avatar',
                'assignedBy.professionalProfile:id,user_id',
            )
            ->where('client_id', $client->id)
            ->where('status', AssignmentStatus::Active)
            ->first();

        $upcoming = WorkoutSession::query()
            ->with('trainingDay')
            ->where('client_id', $client->id)
            ->whereIn('status', ['scheduled', 'in_progress', 'paused'])
            ->orderBy('scheduled_for')
            ->limit(8)
            ->get();

        $mealPlan = NutritionAssignment::query()
            ->with(
                'planVersion.plan',
                'planVersion.days.meals',
                'assignedBy:id,name,avatar',
                'assignedBy.professionalProfile:id,user_id',
            )
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->first();

        return Inertia::render('client/training/index', [
            'assignment' => $assignment,
            'upcoming' => $upcoming,
            'mealPlan' => $mealPlan,
        ]);
    }

    public function day(Request $request, TrainingDay $trainingDay): Response
    {
        $trainingDay->load('exercises.exercise.muscleGroups', 'exercises.exercise.equipment', 'exercises.exercise.alternatives');

        return Inertia::render('client/training/day', [
            'day' => $trainingDay,
        ]);
    }
}
