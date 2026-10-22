<?php

namespace App\Http\Controllers\Pro;

use App\Enums\CheckInSubmissionStatus;
use App\Enums\WorkoutSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\CheckInSubmission;
use App\Models\ClientMetricEntry;
use App\Models\FoodLog;
use App\Models\MetricDefinition;
use App\Models\PackagePurchase;
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

        // Mockup analytics: retention, avg client progress, revenue
        $assignmentCounts = ProfessionalClientAssignment::query()
            ->where('workspace_id', $workspaceId)
            ->selectRaw('status, count(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status');
        $activeAssignments = (int) ($assignmentCounts['active'] ?? 0);
        $endedAssignments = (int) ($assignmentCounts['ended'] ?? 0);
        $retention = ($activeAssignments + $endedAssignments) > 0
            ? round($activeAssignments / ($activeAssignments + $endedAssignments) * 100)
            : null;

        $weightDef = MetricDefinition::where('key', 'weight')->first();
        $bodyFatDef = MetricDefinition::where('key', 'body_fat')->first();

        $avgProgress = null;
        if ($weightDef) {
            $deltas = ClientMetricEntry::query()
                ->where('metric_definition_id', $weightDef->id)
                ->whereIn('client_id', $clientIds)
                ->orderBy('observed_on')
                ->get()
                ->groupBy('client_id')
                ->map(fn ($entries) => $entries->count() > 1
                    ? (($entries->last()->value - $entries->first()->value) / $entries->first()->value) * 100
                    : null)
                ->filter();
            $avgProgress = $deltas->isEmpty() ? null : round($deltas->avg(), 1);
        }

        $monthRevenue = PackagePurchase::where('workspace_id', $workspaceId)
            ->where('status', 'paid')
            ->where('purchased_at', '>=', now()->startOfMonth())
            ->sum('amount_cents');
        $lastMonthRevenue = PackagePurchase::where('workspace_id', $workspaceId)
            ->where('status', 'paid')
            ->whereBetween('purchased_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->sum('amount_cents');

        // Average client progress per week (weight + body fat)
        $progressWeeks = collect(range(7, 0))->map(fn ($i) => now()->subWeeks($i)->startOfWeek());
        $metricEntries = ClientMetricEntry::query()
            ->whereIn('client_id', $clientIds)
            ->whereIn('metric_definition_id', array_filter([$weightDef?->id, $bodyFatDef?->id]))
            ->where('observed_on', '>=', $progressWeeks->first()->toDateString())
            ->get();
        $clientProgress = $progressWeeks->map(function ($w) use ($metricEntries, $weightDef, $bodyFatDef) {
            $weekEntries = $metricEntries->filter(
                fn ($e) => $e->observed_on->between($w, $w->copy()->endOfWeek()),
            );

            return [
                'label' => $w->format('j M'),
                'weight' => $weightDef ? round((float) $weekEntries->where('metric_definition_id', $weightDef->id)->avg('value'), 1) : null,
                'body_fat' => $bodyFatDef ? round((float) $weekEntries->where('metric_definition_id', $bodyFatDef->id)->avg('value'), 1) : null,
            ];
        })->values();

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
            'analytics' => [
                'total_clients' => $clientIds->unique()->count(),
                'retention' => $retention,
                'avg_progress' => $avgProgress,
                'revenue' => $monthRevenue,
                'revenue_delta' => $lastMonthRevenue > 0
                    ? round(($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue * 100)
                    : null,
            ],
            'clientProgress' => $clientProgress,
        ]);
    }
}
