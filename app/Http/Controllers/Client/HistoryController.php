<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->clientProfile;

        $sessions = WorkoutSession::query()
            ->with('trainingDay', 'exercises.sets')
            ->where('client_id', $client->id)
            ->orderByDesc('scheduled_for')
            ->limit(30)
            ->get()
            ->map(fn (WorkoutSession $s) => [
                'id' => $s->id,
                'date' => $s->scheduled_for->toDateString(),
                'day' => $s->trainingDay?->title,
                'status' => $s->status->value,
                'duration' => $s->duration_seconds,
                'sets_done' => $s->exercises->flatMap->sets->where('status', 'done')->count(),
                'total_volume' => round($s->exercises->flatMap->sets
                    ->where('status', 'done')
                    ->sum(fn ($set) => ($set->actual_load ?? 0) * ($set->actual_reps ?? 0))),
            ]);

        return Inertia::render('client/history/index', [
            'sessions' => $sessions,
        ]);
    }
}
