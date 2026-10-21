<?php

namespace App\Http\Controllers\Client;

use App\Enums\CheckInSubmissionStatus;
use App\Http\Controllers\Controller;
use App\Models\CheckInAnswer;
use App\Models\CheckInSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    private function clientId(Request $request): int
    {
        return $request->user()->clientProfile->id;
    }

    public function index(Request $request): Response
    {
        $submissions = CheckInSubmission::query()
            ->with('review.reviewer', 'schedule.template')
            ->where('client_id', $this->clientId($request))
            ->orderByDesc('due_on')
            ->get();

        return Inertia::render('client/check-ins/index', [
            'submissions' => $submissions,
        ]);
    }

    public function edit(Request $request, CheckInSubmission $checkInSubmission): Response
    {
        abort_unless($checkInSubmission->client_id === $this->clientId($request), 403);
        abort_unless($checkInSubmission->status === CheckInSubmissionStatus::Pending, 404);

        $checkInSubmission->load('schedule.template.questions');

        return Inertia::render('client/check-ins/edit', [
            'submission' => $checkInSubmission,
            'questions' => $checkInSubmission->schedule->template->questions,
        ]);
    }

    public function update(Request $request, CheckInSubmission $checkInSubmission): RedirectResponse
    {
        abort_unless($checkInSubmission->client_id === $this->clientId($request), 403);
        abort_unless($checkInSubmission->status === CheckInSubmissionStatus::Pending, 422);

        $questions = $checkInSubmission->schedule->template->questions;
        $requiredIds = $questions->where('required', true)->pluck('id')->all();

        $rules = ['answers' => ['required', 'array']];
        foreach ($questions as $q) {
            $key = "answers.{$q->id}";
            $rules[$key] = in_array($q->id, $requiredIds)
                ? ['required']
                : ['nullable'];
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($validated, $checkInSubmission, $request, $questions) {
            foreach ($questions as $q) {
                $value = $validated['answers'][$q->id] ?? null;
                if ($value === null || $value === '') {
                    continue;
                }

                $photoPath = null;
                if ($q->type->value === 'photo' && $request->hasFile("answers.{$q->id}")) {
                    $photoPath = $request->file("answers.{$q->id}")->store('check-ins', 'public');
                }

                CheckInAnswer::create([
                    'check_in_submission_id' => $checkInSubmission->id,
                    'check_in_question_id' => $q->id,
                    'value_rating' => is_numeric($value) ? (int) $value : null,
                    'value_text' => is_string($value) && ! is_numeric($value) ? $value : null,
                    'photo_path' => $photoPath,
                ]);
            }

            $checkInSubmission->update([
                'status' => CheckInSubmissionStatus::Submitted,
                'submitted_at' => now(),
            ]);
        });

        return redirect('/app/check-ins');
    }

    public function show(Request $request, CheckInSubmission $checkInSubmission): Response
    {
        abort_unless($checkInSubmission->client_id === $this->clientId($request), 403);

        $checkInSubmission->load('answers.question', 'review.reviewer', 'schedule.template');

        return Inertia::render('client/check-ins/show', [
            'submission' => $checkInSubmission,
        ]);
    }
}
