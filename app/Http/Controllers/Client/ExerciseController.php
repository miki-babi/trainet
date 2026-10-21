<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\ExerciseCategory;
use App\Models\MuscleGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExerciseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $exercises = Exercise::query()
            ->with('category', 'muscleGroups', 'equipment')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->get();

        return Inertia::render('client/exercises/index', [
            'exercises' => $exercises,
            'categories' => ExerciseCategory::orderBy('name')->get(),
            'muscleGroups' => MuscleGroup::orderBy('name')->get(),
            'equipmentList' => Equipment::orderBy('name')->get(),
            'filters' => ['search' => $search],
        ]);
    }

    public function show(Request $request, Exercise $exercise): Response
    {
        return Inertia::render('client/exercises/show', [
            'exercise' => $exercise->load('category', 'muscleGroups', 'equipment', 'media', 'alternatives'),
        ]);
    }
}
