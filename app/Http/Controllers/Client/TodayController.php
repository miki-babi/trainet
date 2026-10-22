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
            ->with('trainingDay.exercises.exercise.media')
            ->where('client_id', $client->id)
            ->whereDate('scheduled_for', $today)
            ->first();

        $nextSession = $session ? null : WorkoutSession::query()
            ->with('trainingDay.exercises.exercise.media')
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

        $assignment = NutritionAssignment::query()
            ->with(
                'planVersion.days.meals.items.food',
                'planVersion.days.meals.items.portion',
                'planVersion.days.meals.items.recipe',
            )
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->first();

        // Rotate through the plan's days based on how far into the assignment we are.
        $planDay = null;
        $days = $assignment?->planVersion?->days;
        if ($days?->isNotEmpty()) {
            $offset = $assignment->starts_on
                ? max(0, (int) $assignment->starts_on->diffInDays($today))
                : 0;
            $planDay = $days->get($offset % $days->count());
        }

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

        $activeSession = $session ?? $nextSession;
        $exerciseCount = $activeSession?->trainingDay?->exercises?->count() ?? 0;
        $workoutImage = $activeSession?->trainingDay?->exercises
            ?->first()?->exercise?->media_url;

        return Inertia::render('client/today', [
            'clientName' => $client->user->name,
            'clientAvatar' => $client->user->avatar,
            'onboardingComplete' => $client->onboarding_status?->value === 'complete',
            'workoutMeta' => [
                'exercise_count' => $exerciseCount,
                'est_minutes' => $exerciseCount ? max(20, $exerciseCount * 9) : null,
                'image' => $workoutImage,
            ],
            'session' => $session,
            'nextSession' => $nextSession,
            'week' => $week,
            'nutrition' => [
                'targets' => $targets,
                'totals' => $totals,
                'planTitle' => $planDay?->title,
                'planMeals' => $planDay?->meals?->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'time_hint' => $m->time_hint,
                    'image_url' => $m->image_url,
                    'items' => $m->items->map(fn ($i) => [
                        'id' => $i->id,
                        'name' => $i->food?->name ?? $i->recipe?->name ?? 'Item',
                        'portion' => $i->portion
                            ? "{$i->quantity} × {$i->portion->label}"
                            : ($i->quantity ? ($i->quantity * 100).' g' : null),
                        'kcal' => $i->food
                            ? (int) round($i->food->calories * ($i->portion ? $i->portion->grams * $i->quantity : $i->quantity * 100) / 100)
                            : null,
                        'food' => $i->food?->only(['name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'serving_description', 'image_url']),
                    ])->values(),
                    'kcal' => (int) $m->items->sum(fn ($i) => $i->food
                        ? $i->food->calories * ($i->portion ? $i->portion->grams * $i->quantity : $i->quantity * 100) / 100
                        : 0),
                    'logged' => $todayLogs->contains('meal_name', $m->name),
                    'logged_item_ids' => (function () use ($m, $todayLogs) {
                        $foodIds = $todayLogs->firstWhere('meal_name', $m->name)?->items->pluck('food_id');

                        return $foodIds
                            ? $m->items->filter(fn ($i) => $i->food?->id && $foodIds->contains($i->food->id))->pluck('id')->values()
                            : [];
                    })(),
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
