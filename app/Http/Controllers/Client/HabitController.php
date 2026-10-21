<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\HabitAssignment;
use App\Models\HabitLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HabitController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->clientProfile;

        $habits = HabitAssignment::query()
            ->with(['habit', 'logs' => fn ($q) => $q->orderByDesc('logged_on')->limit(14)])
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->get()
            ->map(fn (HabitAssignment $a) => [
                'id' => $a->id,
                'name' => $a->habit->name,
                'description' => $a->habit->description,
                'today_done' => $a->logs->where('logged_on', today()->toDateString())->first()?->completed ?? false,
                'recent' => $a->logs->map(fn ($l) => [
                    'date' => $l->logged_on->toDateString(),
                    'completed' => (bool) $l->completed,
                ]),
                'streak' => $this->streak($a),
            ]);

        return Inertia::render('client/habits/index', ['habits' => $habits]);
    }

    public function toggle(Request $request, HabitAssignment $habitAssignment): RedirectResponse
    {
        abort_unless($habitAssignment->client_id === $request->user()->clientProfile->id, 403);

        $existing = HabitLog::query()
            ->where('habit_assignment_id', $habitAssignment->id)
            ->whereDate('logged_on', today())
            ->first();

        if ($existing) {
            $existing->update(['completed' => ! $existing->completed]);
        } else {
            HabitLog::create([
                'habit_assignment_id' => $habitAssignment->id,
                'client_id' => $habitAssignment->client_id,
                'logged_on' => today(),
                'completed' => true,
            ]);
        }

        return back();
    }

    private function streak(HabitAssignment $assignment): int
    {
        $days = $assignment->logs->keyBy(fn ($l) => $l->logged_on->toDateString());
        $streak = 0;
        $cursor = today();

        // Allow "today" to be unlogged without breaking the streak.
        if (! ($days[$cursor->toDateString()]->completed ?? false)) {
            $cursor = $cursor->subDay();
        }
        while ($days[$cursor->toDateString()]->completed ?? false) {
            $streak++;
            $cursor = $cursor->subDay();
        }

        return $streak;
    }
}
