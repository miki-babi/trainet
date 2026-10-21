<?php

namespace App\Http\Controllers\Pro;

use App\Enums\AssignmentStatus;
use App\Enums\ContentStatus;
use App\Enums\VersionStatus;
use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\Exercise;
use App\Models\ProgramAssignment;
use App\Models\TrainingDay;
use App\Models\TrainingDayExercise;
use App\Models\TrainingProgram;
use App\Models\TrainingProgramVersion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->workspaceMember->workspace_id;
    }

    public function index(Request $request): Response
    {
        $programs = TrainingProgram::query()
            ->where('workspace_id', $this->workspaceId($request))
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
            ]);

        return Inertia::render('pro/programs/index', [
            'programs' => $programs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $program = DB::transaction(function () use ($request, $validated) {
            $program = TrainingProgram::create([
                'workspace_id' => $this->workspaceId($request),
                'created_by' => $request->user()->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => ContentStatus::Draft,
            ]);

            $version = TrainingProgramVersion::create([
                'training_program_id' => $program->id,
                'version_number' => 1,
                'created_by' => $request->user()->id,
                'status' => VersionStatus::Draft,
            ]);

            TrainingDay::create([
                'training_program_version_id' => $version->id,
                'order' => 1,
                'title' => 'Day 1',
            ]);

            return $program;
        });

        return redirect("/pro/programs/{$program->id}/edit");
    }

    public function edit(Request $request, TrainingProgram $trainingProgram): Response
    {
        abort_unless($trainingProgram->workspace_id === $this->workspaceId($request), 404);

        $trainingProgram->load(['versions' => fn ($q) => $q->orderByDesc('version_number')->with('days.exercises.exercise')]);

        $editableVersion = $trainingProgram->versions->firstWhere('status', VersionStatus::Draft)
            ?? $trainingProgram->versions->first();

        return Inertia::render('pro/programs/edit', [
            'program' => $trainingProgram,
            'version' => $editableVersion,
            'versions' => $trainingProgram->versions->map(fn ($v) => $v->only('id', 'version_number', 'status', 'published_at', 'change_summary')),
            'exerciseLibrary' => Exercise::query()
                ->with('muscleGroups', 'equipment', 'category')
                ->where(fn ($q) => $q->whereNull('workspace_id')->orWhere('workspace_id', $trainingProgram->workspace_id))
                ->orderBy('name')
                ->get(),
            'clients' => ClientProfile::query()
                ->with('user')
                ->whereHas('professionalAssignments', fn ($q) => $q->where('workspace_id', $trainingProgram->workspace_id)->where('status', 'active'))
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->user->name]),
        ]);
    }

    public function update(Request $request, TrainingProgram $trainingProgram): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $trainingProgram->update($validated);

        return back();
    }

    public function storeDay(Request $request, TrainingProgram $trainingProgram): RedirectResponse
    {
        $version = $this->editableVersion($trainingProgram);

        TrainingDay::create([
            'training_program_version_id' => $version->id,
            'order' => $version->days()->max('order') + 1,
            'title' => 'Day '.($version->days()->max('order') + 1),
        ]);

        return back();
    }

    public function updateDay(Request $request, TrainingDay $trainingDay): RedirectResponse
    {
        $trainingDay->update($request->validate([
            'title' => ['required', 'string', 'max:120'],
            'is_rest_day' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]));

        return back();
    }

    public function destroyDay(TrainingDay $trainingDay): RedirectResponse
    {
        $trainingDay->delete();

        return back();
    }

    public function storeDayExercise(Request $request, TrainingDay $trainingDay): RedirectResponse
    {
        $validated = $request->validate([
            'exercise_id' => ['required', 'exists:exercises,id'],
            'sets' => ['nullable', 'integer', 'min:1', 'max:20'],
            'reps' => ['nullable', 'string', 'max:20'],
            'target_load' => ['nullable', 'numeric', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'rpe' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'rest_seconds' => ['nullable', 'integer', 'min:0'],
            'group_label' => ['nullable', 'string', 'max:5'],
            'notes' => ['nullable', 'string'],
        ]);

        TrainingDayExercise::create([
            ...$validated,
            'training_day_id' => $trainingDay->id,
            'order' => $trainingDay->exercises()->max('order') + 1,
        ]);

        return back();
    }

    public function updateDayExercise(Request $request, TrainingDayExercise $trainingDayExercise): RedirectResponse
    {
        $trainingDayExercise->update($request->validate([
            'sets' => ['nullable', 'integer', 'min:1', 'max:20'],
            'reps' => ['nullable', 'string', 'max:20'],
            'target_load' => ['nullable', 'numeric', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'rpe' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'rest_seconds' => ['nullable', 'integer', 'min:0'],
            'group_label' => ['nullable', 'string', 'max:5'],
            'notes' => ['nullable', 'string'],
            'order' => ['nullable', 'integer'],
        ]));

        return back();
    }

    public function destroyDayExercise(TrainingDayExercise $trainingDayExercise): RedirectResponse
    {
        $trainingDayExercise->delete();

        return back();
    }

    public function publish(Request $request, TrainingProgram $trainingProgram): RedirectResponse
    {
        abort_unless($trainingProgram->workspace_id === $this->workspaceId($request), 404);

        $draft = $trainingProgram->versions()->where('status', VersionStatus::Draft)->first();
        abort_if(! $draft, 422, 'No draft version to publish.');

        DB::transaction(function () use ($trainingProgram, $draft) {
            $draft->update([
                'status' => VersionStatus::Published,
                'published_at' => now(),
            ]);
            $trainingProgram->update(['status' => ContentStatus::Active]);

            // Open a new draft version for further editing.
            TrainingProgramVersion::create([
                'training_program_id' => $trainingProgram->id,
                'version_number' => $trainingProgram->versions()->max('version_number') + 1,
                'created_by' => auth()->id(),
                'status' => VersionStatus::Draft,
            ]);
        });

        return back();
    }

    public function assign(Request $request, TrainingProgramVersion $trainingProgramVersion): RedirectResponse
    {
        abort_unless($trainingProgramVersion->status === VersionStatus::Published, 422, 'Only published versions can be assigned.');

        $validated = $request->validate([
            'client_id' => ['required', 'exists:client_profiles,id'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after:starts_on'],
            'schedule_days' => ['nullable', 'array'],
        ]);

        // Supersede any existing active program assignment for this client.
        ProgramAssignment::query()
            ->where('client_id', $validated['client_id'])
            ->where('status', AssignmentStatus::Active)
            ->update(['status' => AssignmentStatus::Ended]);

        ProgramAssignment::create([
            'workspace_id' => $this->workspaceId($request),
            'client_id' => $validated['client_id'],
            'training_program_version_id' => $trainingProgramVersion->id,
            'assigned_by' => $request->user()->id,
            'starts_on' => $validated['starts_on'],
            'ends_on' => $validated['ends_on'] ?? null,
            'schedule_days' => $validated['schedule_days'] ?? null,
            'status' => AssignmentStatus::Active,
        ]);

        return back();
    }

    public function preview(Request $request, TrainingProgram $trainingProgram): Response
    {
        abort_unless($trainingProgram->workspace_id === $this->workspaceId($request), 404);

        $version = $trainingProgram->versions()->orderByDesc('version_number')->with('days.exercises.exercise')->first();

        return Inertia::render('pro/programs/preview', [
            'program' => $trainingProgram,
            'version' => $version,
        ]);
    }

    private function editableVersion(TrainingProgram $program): TrainingProgramVersion
    {
        return $program->versions()
            ->where('status', VersionStatus::Draft)
            ->orderByDesc('version_number')
            ->firstOrFail();
    }
}
