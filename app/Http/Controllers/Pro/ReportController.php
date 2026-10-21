<?php

namespace App\Http\Controllers\Pro;

use App\Enums\CheckInSubmissionStatus;
use App\Enums\WorkoutSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\CheckInSubmission;
use App\Models\FoodLog;
use App\Models\ProfessionalClientAssignment;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->workspaceMember->workspace_id;

        $clientIds = ProfessionalClientAssignment::query()
            ->where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->pluck('client_id');

        $fourWeeksAgo = now()->subWeeks(4)->toDateString();

        // Fixed 4-week buckets, oldest → newest.
        $weeks = collect(range(3, 0))->map(fn ($i) => now()->subWeeks($i)->startOfWeek());
        $weekLabels = $weeks->map(fn ($w) => 'w/o '.$w->format('j M'))->all();

        $sessions = WorkoutSession::query()
            ->whereIn('client_id', $clientIds)
            ->where('scheduled_for', '>=', $fourWeeksAgo)
            ->get();
        $isMissed = fn ($s) => $s->scheduled_for->isPast()
            && ! $s->scheduled_for->isToday()
            && ! in_array($s->status, [WorkoutSessionStatus::Completed, WorkoutSessionStatus::Skipped]);
        $sessionsByWeek = $sessions->groupBy(fn ($s) => $s->scheduled_for->startOfWeek()->toDateString());

        $sessionWeeks = $weeks->map(function ($w) use ($sessionsByWeek, $isMissed) {
            $week = $sessionsByWeek->get($w->toDateString(), collect());

            return [
                'label' => 'w/o '.$w->format('j M'),
                'completed' => $week->where('status', WorkoutSessionStatus::Completed)->count(),
                'missed' => $week->filter($isMissed)->count(),
                'skipped' => $week->where('status', WorkoutSessionStatus::Skipped)->count(),
            ];
        });

        // Check-ins per week: due vs submitted/reviewed.
        $checkIns = CheckInSubmission::query()
            ->whereIn('client_id', $clientIds)
            ->where('due_on', '>=', $fourWeeksAgo)
            ->get();
        $checkInsByWeek = $checkIns->groupBy(fn ($c) => $c->due_on->startOfWeek()->toDateString());

        $checkInWeeks = $weeks->map(function ($w) use ($checkInsByWeek) {
            $week = $checkInsByWeek->get($w->toDateString(), collect());

            return [
                'label' => 'w/o '.$w->format('j M'),
                'due' => $week->count(),
                'submitted' => $week->whereIn('status', [
                    CheckInSubmissionStatus::Submitted,
                    CheckInSubmissionStatus::Reviewed,
                ])->count(),
            ];
        });

        // Nutrition logs per week.
        $foodLogs = FoodLog::query()
            ->whereIn('client_id', $clientIds)
            ->where('logged_on', '>=', $fourWeeksAgo)
            ->get();
        $logsByWeek = $foodLogs->groupBy(fn ($l) => $l->logged_on->startOfWeek()->toDateString());

        $nutritionWeeks = $weeks->map(fn ($w) => [
            'label' => 'w/o '.$w->format('j M'),
            'logs' => $logsByWeek->get($w->toDateString(), collect())->count(),
        ]);

        // Per-client adherence
        $clients = ProfessionalClientAssignment::query()
            ->with('client.user')
            ->where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->get()
            ->map(function ($a) use ($fourWeeksAgo) {
                $sessions = WorkoutSession::where('client_id', $a->client_id)
                    ->where('scheduled_for', '>=', $fourWeeksAgo)
                    ->where('scheduled_for', '<=', today())
                    ->get();
                $planned = $sessions->count();
                $done = $sessions->where('status', WorkoutSessionStatus::Completed)->count();
                $logs = FoodLog::where('client_id', $a->client_id)
                    ->where('logged_on', '>=', $fourWeeksAgo)
                    ->count();
                $checkIns = CheckInSubmission::where('client_id', $a->client_id)
                    ->where('due_on', '>=', $fourWeeksAgo)
                    ->get();

                return [
                    'name' => $a->client->user->name,
                    'workouts' => "{$done}/{$planned}",
                    'adherence' => $planned ? round(($done / $planned) * 100) : null,
                    'nutrition_logs' => $logs,
                    'check_ins' => [
                        'submitted' => $checkIns->whereIn('status', [CheckInSubmissionStatus::Submitted, CheckInSubmissionStatus::Reviewed])->count(),
                        'total' => $checkIns->count(),
                    ],
                ];
            })
            ->sortByDesc('adherence')
            ->values();

        $adherenceClients = $clients->whereNotNull('adherence');
        $totalCheckIns = $checkIns->count();
        $submittedCheckIns = $checkIns->whereIn('status', [CheckInSubmissionStatus::Submitted, CheckInSubmissionStatus::Reviewed])->count();

        return Inertia::render('pro/reports/index', [
            'weekLabels' => $weekLabels,
            'sessionWeeks' => $sessionWeeks,
            'checkInWeeks' => $checkInWeeks,
            'nutritionWeeks' => $nutritionWeeks,
            'sessionTotals' => [
                'completed' => $sessions->where('status', WorkoutSessionStatus::Completed)->count(),
                'missed' => $sessions->filter($isMissed)->count(),
                'skipped' => $sessions->where('status', WorkoutSessionStatus::Skipped)->count(),
                'upcoming' => $sessions->filter(fn ($s) => ! $s->scheduled_for->isPast() && $s->status === WorkoutSessionStatus::Scheduled)->count(),
            ],
            'clients' => $clients,
            'totals' => [
                'active_clients' => $clientIds->count(),
                'sessions_done' => $sessions->where('status', WorkoutSessionStatus::Completed)->count(),
                'check_in_rate' => $totalCheckIns ? round($submittedCheckIns / $totalCheckIns * 100) : null,
                'avg_adherence' => $adherenceClients->isEmpty() ? null : round($adherenceClients->avg('adherence')),
                'pending_checkins' => $checkIns->where('status', CheckInSubmissionStatus::Pending)->count(),
                'nutrition_logs' => $foodLogs->count(),
            ],
        ]);
    }
}
