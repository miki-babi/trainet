<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\FoodLog;
use App\Models\FoodLogItem;
use App\Models\NutritionAssignment;
use App\Models\NutritionTarget;
use App\Models\WaterLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NutritionController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->clientProfile;
        $date = $request->date('date')?->toDateString() ?? today()->toDateString();

        $targets = NutritionTarget::query()
            ->where('client_id', $client->id)
            ->where('starts_on', '<=', $date)
            ->where(fn ($q) => $q->whereNull('ends_on')->orWhere('ends_on', '>=', $date))
            ->orderByDesc('starts_on')
            ->first();

        $logs = FoodLog::query()
            ->with('items.food', 'items.portion')
            ->where('client_id', $client->id)
            ->whereDate('logged_on', $date)
            ->get();

        $totals = [
            'calories' => (int) $logs->flatMap->items->sum('calories'),
            'protein_g' => (float) $logs->flatMap->items->sum('protein_g'),
            'carbs_g' => (float) $logs->flatMap->items->sum('carbs_g'),
            'fat_g' => (float) $logs->flatMap->items->sum('fat_g'),
        ];

        $planDay = NutritionAssignment::query()
            ->with('planVersion.days.meals.items.food', 'planVersion.days.meals.items.portion')
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->first()
            ?->planVersion?->days?->first();

        $water = WaterLog::query()
            ->where('client_id', $client->id)
            ->whereDate('logged_on', $date)
            ->first();

        return Inertia::render('client/nutrition/index', [
            'date' => $date,
            'targets' => $targets,
            'totals' => $totals,
            'logs' => $logs,
            'planDay' => $planDay,
            'water' => [
                'amount_ml' => $water?->amount_ml ?? 0,
                'target_ml' => $targets?->water_ml ?? 2500,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $mealName = $request->string('meal')->toString() ?: 'Snack';
        $date = $request->date('date')?->toDateString() ?? today()->toDateString();

        return Inertia::render('client/nutrition/log', [
            'mealName' => $mealName,
            'date' => $date,
            'foods' => Food::query()
                ->with('category', 'portions')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $client = $request->user()->clientProfile;

        $validated = $request->validate([
            'meal_name' => ['required', 'string', 'max:60'],
            'logged_on' => ['required', 'date'],
            'photo' => ['nullable', 'image', 'max:8192'],
            'notes' => ['nullable', 'string', 'max:300'],
            'items' => ['nullable', 'array'],
            'items.*.food_id' => ['required', 'exists:foods,id'],
            'items.*.grams' => ['required', 'numeric', 'min:1'],
        ]);

        abort_unless($request->hasFile('photo') || ! empty($validated['items']), 422);

        $log = FoodLog::create([
            'client_id' => $client->id,
            'logged_on' => $validated['logged_on'],
            'meal_name' => $validated['meal_name'],
            'notes' => $validated['notes'] ?? null,
            'photo_path' => $request->hasFile('photo')
                ? $request->file('photo')->store('meal-photos', 'public')
                : null,
        ]);

        foreach ($validated['items'] ?? [] as $item) {
            $food = Food::findOrFail($item['food_id']);
            $grams = (float) $item['grams'];
            FoodLogItem::create([
                'food_log_id' => $log->id,
                'food_id' => $food->id,
                'grams' => $grams,
                'calories' => round($food->calories * $grams / 100),
                'protein_g' => round($food->protein_g * $grams / 100, 1),
                'carbs_g' => round($food->carbs_g * $grams / 100, 1),
                'fat_g' => round($food->fat_g * $grams / 100, 1),
                'logged_at' => now(),
            ]);
        }

        return redirect("/app/nutrition?date={$validated['logged_on']}");
    }

    public function destroyItem(Request $request, FoodLogItem $foodLogItem): RedirectResponse
    {
        abort_unless($foodLogItem->log->client_id === $request->user()->clientProfile->id, 403);
        $foodLogItem->delete();

        return back();
    }

    public function storeWater(Request $request): RedirectResponse
    {
        $client = $request->user()->clientProfile;
        $validated = $request->validate(['amount_ml' => ['required', 'integer', 'min:50', 'max:2000']]);

        $log = WaterLog::firstOrNew(['client_id' => $client->id, 'logged_on' => today()]);
        $log->amount_ml = ($log->amount_ml ?? 0) + $validated['amount_ml'];
        $log->save();

        return back();
    }
}
