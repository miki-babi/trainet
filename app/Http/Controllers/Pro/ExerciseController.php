<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\ExerciseCategory;
use App\Models\ExerciseMedia;
use App\Models\MuscleGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ExerciseController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->workspaceMember->workspace_id;
        $search = $request->string('search')->toString();
        $category = $request->string('category')->toString();
        $equipment = $request->string('equipment')->toString();
        $muscle = $request->string('muscle')->toString();

        $exercises = Exercise::query()
            ->with('category', 'muscleGroups', 'equipment', 'media')
            ->where(fn ($q) => $q->whereNull('workspace_id')->orWhere('workspace_id', $workspaceId))
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($category, fn ($q) => $q->where('exercise_category_id', $category))
            ->when($equipment, fn ($q) => $q->whereHas('equipment', fn ($e) => $e->where('equipment.id', $equipment)))
            ->when($muscle, fn ($q) => $q->whereHas('muscleGroups', fn ($m) => $m->where('muscle_groups.id', $muscle)))
            ->orderBy('name')
            ->get();

        return Inertia::render('pro/exercises/index', [
            'exercises' => $exercises,
            'categories' => ExerciseCategory::orderBy('name')->get(),
            'muscleGroups' => MuscleGroup::orderBy('name')->get(),
            'equipmentList' => Equipment::orderBy('name')->get(),
            'filters' => compact('search', 'category', 'equipment', 'muscle'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $workspaceId = $request->user()->workspaceMember->workspace_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'exercise_category_id' => ['required', 'exists:exercise_categories,id'],
            'difficulty' => ['required', 'in:beginner,intermediate,advanced'],
            'movement_pattern' => ['nullable', 'string', 'max:60'],
            'instructions' => ['nullable', 'string'],
            'common_mistakes' => ['nullable', 'string'],
            'safety_notes' => ['nullable', 'string'],
            'video_url' => ['nullable', 'url'],
            'images' => ['nullable', 'array', 'max:6'],
            'images.*' => ['image', 'max:4096'],
            'muscle_group_ids' => ['array'],
            'muscle_group_ids.*' => ['exists:muscle_groups,id'],
            'equipment_ids' => ['array'],
            'equipment_ids.*' => ['exists:equipment,id'],
        ]);

        $exercise = Exercise::create([
            ...$validated,
            'workspace_id' => $workspaceId,
            'is_custom' => true,
        ]);

        $exercise->muscleGroups()->sync($validated['muscle_group_ids'] ?? []);
        $exercise->equipment()->sync($validated['equipment_ids'] ?? []);

        $this->syncImage($request, $exercise);

        return back();
    }

    public function edit(Request $request, Exercise $exercise): Response
    {
        return Inertia::render('pro/exercises/edit', [
            'exercise' => $exercise->load('muscleGroups', 'equipment', 'alternatives', 'media'),
            'categories' => ExerciseCategory::orderBy('name')->get(),
            'muscleGroups' => MuscleGroup::orderBy('name')->get(),
            'equipmentList' => Equipment::orderBy('name')->get(),
            'allExercises' => Exercise::orderBy('name')->where('id', '!=', $exercise->id)->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Exercise $exercise): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'exercise_category_id' => ['required', 'exists:exercise_categories,id'],
            'difficulty' => ['required', 'in:beginner,intermediate,advanced'],
            'movement_pattern' => ['nullable', 'string', 'max:60'],
            'instructions' => ['nullable', 'string'],
            'common_mistakes' => ['nullable', 'string'],
            'safety_notes' => ['nullable', 'string'],
            'video_url' => ['nullable', 'url'],
            'images' => ['nullable', 'array', 'max:6'],
            'images.*' => ['image', 'max:4096'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer', 'exists:exercise_media,id'],
            'muscle_group_ids' => ['array'],
            'equipment_ids' => ['array'],
            'alternative_ids' => ['array'],
        ]);

        $exercise->update(collect($validated)->except('images', 'remove_media_ids')->toArray());
        $exercise->muscleGroups()->sync($validated['muscle_group_ids'] ?? []);
        $exercise->equipment()->sync($validated['equipment_ids'] ?? []);
        $exercise->alternatives()->sync($validated['alternative_ids'] ?? []);

        $this->syncImage($request, $exercise);

        return back();
    }

    private function syncImage(Request $request, Exercise $exercise): void
    {
        foreach ((array) $request->input('remove_media_ids', []) as $mediaId) {
            $media = $exercise->media()->find($mediaId);
            if ($media) {
                Storage::disk('public')->delete($media->path);
                $media->delete();
            }
        }

        if (! $request->hasFile('images')) {
            return;
        }

        $next = (int) $exercise->media()->max('sort_order') + 1;
        foreach ((array) $request->file('images') as $file) {
            ExerciseMedia::create([
                'exercise_id' => $exercise->id,
                'type' => 'image',
                'path' => $file->store('exercises', 'public'),
                'sort_order' => $next++,
            ]);
        }
    }
}
