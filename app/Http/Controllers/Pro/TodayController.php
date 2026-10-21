<?php

namespace App\Http\Controllers\Pro;

use App\Enums\CheckInSubmissionStatus;
use App\Enums\WorkoutSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CheckInSubmission;
use App\Models\ProfessionalClientAssignment;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $member = $user->workspaceMember()->with('workspace')->firstOrFail();
        $workspaceId = $member->workspace_id;

        // Clients this professional is assigned to (or all workspace clients for owner).
        $assignedClientIds = ProfessionalClientAssignment::query()
            ->where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->when(
                $member->role->value !== 'owner',
                fn ($q) => $q->where('professional_id', $user->id),
            )
            ->pluck('client_id');

        // Attention: check-ins submitted, awaiting review.
        $pendingReviews = CheckInSubmission::query()
            ->with('client.user')
            ->whereIn('client_id', $assignedClientIds)
            ->where('status', CheckInSubmissionStatus::Submitted)
            ->orderBy('due_on')
            ->get()
            ->map(fn ($s) => [
                'kind' => 'check_in',
                'id' => $s->id,
                'title' => $s->client->user->name,
                'detail' => 'Check-in submitted '.$s->submitted_at?->diffForHumans(),
                'href' => "/pro/check-in-submissions/{$s->id}",
            ]);

        // Attention: sessions skipped or missed (scheduled in the past, not completed).
        $missedSessions = WorkoutSession::query()
            ->with('client.user', 'trainingDay')
            ->whereIn('client_id', $assignedClientIds)
            ->whereDate('scheduled_for', '<', today())
            ->whereIn('status', [WorkoutSessionStatus::Skipped, WorkoutSessionStatus::Scheduled])
            ->orderByDesc('scheduled_for')
            ->limit(10)
            ->get()
            ->map(fn ($s) => [
                'kind' => 'missed_workout',
                'id' => $s->id,
                'title' => $s->client->user->name,
                'detail' => ($s->trainingDay?->title ?? 'Workout').' — '.$s->scheduled_for->format('D j M'),
                'href' => "/pro/clients/{$s->client_id}",
            ]);

        // Stalled clients: no completed session in 10+ days among assigned.
        $stalled = ProfessionalClientAssignment::query()
            ->with('client.user')
            ->where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->whereIn('client_id', $assignedClientIds)
            ->get()
            ->filter(function ($assignment) {
                $lastDone = WorkoutSession::query()
                    ->where('client_id', $assignment->client_id)
                    ->where('status', WorkoutSessionStatus::Completed)
                    ->max('scheduled_for');

                return ! $lastDone || $lastDone < today()->subDays(10)->toDateString();
            })
            ->map(fn ($a) => [
                'kind' => 'stalled',
                'id' => $a->client_id,
                'title' => $a->client->user->name,
                'detail' => 'No completed workout in 10+ days',
                'href' => "/pro/clients/{$a->client_id}",
            ]);

        // Week strip: mark days that have appointments.
        $weekAppointments = Appointment::query()
            ->where('workspace_id', $workspaceId)
            ->whereBetween('starts_at', [now()->startOfWeek(), now()->endOfWeek()->endOfDay()])
            ->get()
            ->keyBy(fn (Appointment $a) => $a->starts_at->toDateString());

        $week = collect(range(0, 6))->map(function (int $offset) use ($weekAppointments) {
            $date = now()->startOfWeek()->addDays($offset);
            $key = $date->toDateString();

            return [
                'date' => $key,
                'dayLabel' => $date->format('D'),
                'dayNumber' => (int) $date->format('j'),
                'isToday' => $date->isToday(),
                'marker' => $weekAppointments->has($key) ? 'workout' : null,
            ];
        });

        // Today's check-ins per client (due today or submitted today).
        $checkIns = CheckInSubmission::query()
            ->with('client.user', 'schedule.template', 'review')
            ->whereIn('client_id', $assignedClientIds)
            ->where(fn ($q) => $q->whereDate('due_on', today())->orWhereDate('submitted_at', today()))
            ->orderBy('due_on')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'client' => $s->client->user->name,
                'template' => $s->schedule?->template?->name ?? 'Check-in',
                'status' => $s->status->value,
                'submitted_at' => $s->submitted_at?->format('H:i'),
                'due_on' => $s->due_on->toDateString(),
                'answers' => $s->answers()->count(),
            ]);

        // Recent activity feed: latest sessions + submissions.
        $recentSessions = WorkoutSession::query()
            ->with('client.user', 'trainingDay')
            ->whereIn('client_id', $assignedClientIds)
            ->where('status', WorkoutSessionStatus::Completed)
            ->orderByDesc('completed_at')
            ->limit(6)
            ->get()
            ->map(fn ($s) => [
                'id' => "s{$s->id}",
                'text' => "{$s->client->user->name} completed {$s->trainingDay?->title}",
                'at' => $s->completed_at?->diffForHumans(),
                'href' => "/pro/clients/{$s->client_id}",
            ]);

        return Inertia::render('pro/today', [
            'professionalName' => $user->name,
            'week' => $week,
            'checkIns' => $checkIns,
            'attention' => $missedSessions->concat($stalled)->values(),
            'activity' => $recentSessions,
        ]);
    }
}
