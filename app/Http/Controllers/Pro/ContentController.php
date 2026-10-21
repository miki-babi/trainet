<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\ExerciseCategory;
use App\Models\MuscleGroup;
use App\Models\NutritionPlan;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContentController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->workspaceMember->workspace_id;

        $search = $request->string('search')->toString();
        $category = $request->string('category')->toString();
        $equipment = $request->string('equipment')->toString();
        $muscle = $request->string('muscle')->toString();

        return Inertia::render('pro/content', [
            'tab' => $request->string('tab', 'programs')->toString(),
            'programs' => TrainingProgram::query()
                ->where('workspace_id', $workspaceId)
                ->with(['versions' => fn ($q) => $q->orderByDesc('version_number')])
                ->get()
                ->map(fn (TrainingProgram $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'status' => $p->status->value,
                    'versions' => $p->versions->map(fn ($v) => [
                        'id' => $v->id,
                        'number' => $v->version_number,
                        'status' => $v->status->value,
                        'days' => $v->days->count(),
                        'published_at' => $v->published_at?->format('j M Y'),
                    ]),
                    'assignments' => $p->versions->sum(fn ($v) => $v->assignments->count()),
                ]),
            'exercises' => Exercise::query()
                ->with('category', 'muscleGroups', 'equipment')
                ->where(fn ($q) => $q->whereNull('workspace_id')->orWhere('workspace_id', $workspaceId))
                ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->when($category, fn ($q) => $q->where('exercise_category_id', $category))
                ->when($equipment, fn ($q) => $q->whereHas('equipment', fn ($e) => $e->where('equipment.id', $equipment)))
                ->when($muscle, fn ($q) => $q->whereHas('muscleGroups', fn ($m) => $m->where('muscle_groups.id', $muscle)))
                ->orderBy('name')
                ->get(),
            'categories' => ExerciseCategory::orderBy('name')->get(),
            'muscleGroups' => MuscleGroup::orderBy('name')->get(),
            'equipmentList' => Equipment::orderBy('name')->get(),
            'plans' => NutritionPlan::query()
                ->where('workspace_id', $workspaceId)
                ->with('versions.days.meals')
                ->get(),
            'filters' => compact('search', 'category', 'equipment', 'muscle'),
        ]);
    }
}
