<?php

namespace App\Http\Controllers\Pro;

use App\Enums\CheckInSubmissionStatus;
use App\Http\Controllers\Controller;
use App\Models\CheckInReview;
use App\Models\CheckInSchedule;
use App\Models\CheckInSubmission;
use App\Models\CheckInTemplate;
use App\Models\ClientProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->workspaceMember->workspace_id;
    }

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);

        return Inertia::render('pro/check-ins/index', [
            'templates' => CheckInTemplate::query()
                ->where('workspace_id', $workspaceId)
                ->with('questions')
                ->get(),
            'schedules' => CheckInSchedule::query()
                ->with('client.user', 'template')
                ->whereHas('client', fn ($q) => $q->whereHas('professionalAssignments', fn ($a) => $a->where('workspace_id', $workspaceId)))
                ->get(),
            'clients' => ClientProfile::query()
                ->with('user')
                ->whereHas('professionalAssignments', fn ($q) => $q->where('workspace_id', $workspaceId)->where('status', 'active'))
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->user->name]),
        ]);
    }

    public function storeTemplate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $template = CheckInTemplate::create([
            'workspace_id' => $this->workspaceId($request),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => 'active',
        ]);

        return redirect("/pro/check-in-templates/{$template->id}/edit");
    }

    public function editTemplate(Request $request, CheckInTemplate $checkInTemplate): Response
    {
        abort_unless($checkInTemplate->workspace_id === $this->workspaceId($request), 404);
        $checkInTemplate->load('questions');

        return Inertia::render('pro/check-ins/edit-template', [
            'template' => $checkInTemplate,
        ]);
    }

    public function updateTemplate(Request $request, CheckInTemplate $checkInTemplate): RedirectResponse
    {
        abort_unless($checkInTemplate->workspace_id === $this->workspaceId($request), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'questions' => ['array'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.prompt' => ['required', 'string', 'max:300'],
            'questions.*.type' => ['required', 'in:rating,text,photo,adherence'],
            'questions.*.required' => ['boolean'],
        ]);

        DB::transaction(function () use ($validated, $checkInTemplate) {
            $checkInTemplate->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            $keepIds = collect($validated['questions'] ?? [])->pluck('id')->filter();
            $checkInTemplate->questions()->whereNotIn('id', $keepIds)->delete();

            foreach ($validated['questions'] ?? [] as $i => $q) {
                $data = [
                    'check_in_template_id' => $checkInTemplate->id,
                    'order' => $i + 1,
                    'prompt' => $q['prompt'],
                    'type' => $q['type'],
                    'required' => $q['required'] ?? false,
                ];
                if (! empty($q['id'])) {
                    $checkInTemplate->questions()->where('id', $q['id'])->update($data);
                } else {
                    $checkInTemplate->questions()->create($data);
                }
            }
        });

        return back();
    }

    public function storeSchedule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:client_profiles,id'],
            'check_in_template_id' => ['required', 'exists:check_in_templates,id'],
            'weekday' => ['required', 'integer', 'min:1', 'max:7'],
            'starts_on' => ['required', 'date'],
        ]);

        $schedule = CheckInSchedule::create([
            'client_id' => $validated['client_id'],
            'check_in_template_id' => $validated['check_in_template_id'],
            'frequency' => 'weekly',
            'weekday' => $validated['weekday'],
            'starts_on' => $validated['starts_on'],
            'status' => 'active',
        ]);

        // Generate the first pending submission.
        CheckInSubmission::create([
            'check_in_schedule_id' => $schedule->id,
            'client_id' => $validated['client_id'],
            'due_on' => $validated['starts_on'],
            'status' => CheckInSubmissionStatus::Pending,
        ]);

        return back();
    }

    public function submissions(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);

        $submissions = CheckInSubmission::query()
            ->with('client.user', 'review')
            ->whereHas('client', fn ($q) => $q->whereHas('professionalAssignments', fn ($a) => $a->where('workspace_id', $workspaceId)))
            ->orderByDesc('due_on')
            ->limit(50)
            ->get();

        return Inertia::render('pro/check-ins/submissions', [
            'submissions' => $submissions,
        ]);
    }

    public function showSubmission(Request $request, CheckInSubmission $checkInSubmission): Response
    {
        $checkInSubmission->load('client.user', 'answers.question', 'review.reviewer', 'schedule.template');

        return Inertia::render('pro/check-ins/submission', [
            'submission' => $checkInSubmission,
        ]);
    }

    public function storeReview(Request $request, CheckInSubmission $checkInSubmission): RedirectResponse
    {
        abort_unless($checkInSubmission->status === CheckInSubmissionStatus::Submitted, 422);

        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
            'private_note' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($request, $validated, $checkInSubmission) {
            CheckInReview::create([
                'check_in_submission_id' => $checkInSubmission->id,
                'reviewer_id' => $request->user()->id,
                'comment' => $validated['comment'],
                'private_note' => $validated['private_note'] ?? null,
                'reviewed_at' => now(),
            ]);
            $checkInSubmission->update(['status' => CheckInSubmissionStatus::Reviewed]);
        });

        return redirect('/pro/check-in-submissions');
    }
}
