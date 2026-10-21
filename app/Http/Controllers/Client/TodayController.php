<?php

namespace App\Http\Controllers\Client;

use App\Enums\CheckInSubmissionStatus;
use App\Enums\WorkoutSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\CheckInSubmission;
use App\Models\Conversation;
use App\Models\FoodLog;
use App\Models\HabitAssignment;
use App\Models\NutritionAssignment;
use App\Models\NutritionTarget;
use App\Models\WaterLog;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->clientProfile()->with('user')->firstOrFail();
        $today = today();

        // Today's workout session, or the next scheduled one.
        $session = WorkoutSession::query()
            ->with('trainingDay.exercises.exercise')
            ->where('client_id', $client->id)
            ->whereDate('scheduled_for', $today)
            ->first();

        $nextSession = $session ? null : WorkoutSession::query()
            ->with('trainingDay.exercises.exercise')
            ->where('client_id', $client->id)
            ->whereDate('scheduled_for', '>', $today)
            ->where('status', WorkoutSessionStatus::Scheduled)
            ->orderBy('scheduled_for')
            ->first();

        // This week's sessions for the day strip.
        $weekSessions = WorkoutSession::query()
            ->where('client_id', $client->id)
            ->whereBetween('scheduled_for', [
                now()->startOfWeek()->toDateString(),
                now()->endOfWeek()->toDateString(),
            ])
            ->get()
            ->keyBy(fn (WorkoutSession $s) => $s->scheduled_for->toDateString());

        $week = collect(range(0, 6))->map(function (int $offset) use ($weekSessions, $today) {
            $date = now()->startOfWeek()->addDays($offset);
            $key = $date->toDateString();
            $s = $weekSessions->get($key);

            return [
                'date' => $key,
                'dayLabel' => $date->format('D'),
                'dayNumber' => (int) $date->format('j'),
                'isToday' => $key === $today->toDateString(),
                'marker' => $s ? match ($s->status) {
                    WorkoutSessionStatus::Completed => 'done',
                    WorkoutSessionStatus::Skipped => 'rest',
                    default => 'workout',
                } : null,
                'sessionId' => $s?->id,
            ];
        });

        // Nutrition today.
        $targets = NutritionTarget::query()
            ->where('client_id', $client->id)
            ->where('starts_on', '<=', $today)
            ->where(fn ($q) => $q->whereNull('ends_on')->orWhere('ends_on', '>=', $today))
            ->orderByDesc('starts_on')
            ->first();

        $todayLogs = FoodLog::query()
            ->with('items.food', 'items.portion')
            ->where('client_id', $client->id)
            ->whereDate('logged_on', $today)
            ->get();

        $totals = [
            'calories' => (int) $todayLogs->flatMap->items->sum('calories'),
            'protein_g' => (float) $todayLogs->flatMap->items->sum('protein_g'),
            'carbs_g' => (float) $todayLogs->flatMap->items->sum('carbs_g'),
            'fat_g' => (float) $todayLogs->flatMap->items->sum('fat_g'),
        ];

        $planDay = NutritionAssignment::query()
            ->with('planVersion.days.meals.items.food', 'planVersion.days.meals.items.portion')
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->first()
            ?->planVersion?->days?->first();

        // Habits.
        $habits = HabitAssignment::query()
            ->with(['habit', 'logs' => fn ($q) => $q->whereDate('logged_on', $today)])
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->get()
            ->map(fn (HabitAssignment $a) => [
                'id' => $a->id,
                'name' => $a->habit->name,
                'done' => $a->logs->isNotEmpty() && (bool) $a->logs->first()->completed,
            ]);

        $water = WaterLog::query()
            ->where('client_id', $client->id)
            ->whereDate('logged_on', $today)
            ->first();

        // Check-in due.
        $checkIn = CheckInSubmission::query()
            ->where('client_id', $client->id)
            ->whereIn('status', [CheckInSubmissionStatus::Pending, CheckInSubmissionStatus::Submitted])
            ->orderBy('due_on')
            ->first();

        // Latest coach message.
        $conversation = Conversation::query()
            ->whereHas('members', fn ($q) => $q->where('user_id', $client->user_id))
            ->with(['lastMessage.sender'])
            ->get()
            ->sortByDesc(fn (Conversation $c) => $c->lastMessage?->created_at)
            ->first();

        return Inertia::render('client/today', [
            'clientName' => $client->user->name,
            'onboardingComplete' => $client->onboarding_status?->value === 'complete',
            'session' => $session,
            'nextSession' => $nextSession,
            'week' => $week,
            'nutrition' => [
                'targets' => $targets,
                'totals' => $totals,
                'planMeals' => $planDay?->meals?->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'time_hint' => $m->time_hint,
                    'item_count' => $m->items->count(),
                ]),
            ],
            'habits' => $habits,
            'water' => [
                'amount_ml' => $water?->amount_ml ?? 0,
                'target_ml' => $targets?->water_ml,
            ],
            'checkIn' => $checkIn,
            'latestMessage' => $conversation ? [
                'conversation_id' => $conversation->id,
                'sender' => $conversation->lastMessage?->sender?->name,
                'body' => $conversation->lastMessage?->body,
                'unread' => $conversation->unreadCountFor($request->user()),
            ] : null,
        ]);
    }
}
