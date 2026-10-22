<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\FoodLog;
use App\Models\FoodLogItem;
use App\Models\Meal;
use App\Models\NutritionAssignment;
use App\Models\NutritionTarget;
use App\Models\WaterLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
                ? max(0, (int) $assignment->starts_on->diffInDays($date))
                : 0;
            $planDay = $days->get($offset % $days->count());
        }

        // Mark which plan items are already logged so meals can be re-edited.
        $planDay?->meals->each(function ($meal) use ($logs) {
            $foodIds = $logs->firstWhere('meal_name', $meal->name)?->items->pluck('food_id');
            $meal->setAttribute('logged_item_ids', $foodIds
                ? $meal->items->filter(fn ($i) => $i->food?->id && $foodIds->contains($i->food->id))->pluck('id')->values()
                : []);
        });

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

    public function plan(Request $request): Response
    {
        $client = $request->user()->clientProfile;

        $assignment = NutritionAssignment::query()
            ->with(
                'planVersion.plan',
                'planVersion.days.meals.items.food',
                'planVersion.days.meals.items.portion',
                'planVersion.days.meals.items.recipe',
                'assignedBy:id,name,avatar',
                'assignedBy.professionalProfile:id,user_id',
            )
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->first();

        return Inertia::render('client/nutrition/plan', [
            'assignment' => $assignment,
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

    /** Confirm the client ate a planned meal — copy its items into a food log. */
    public function confirmMeal(Request $request, Meal $meal): RedirectResponse
    {
        $client = $request->user()->clientProfile;
        $validated = $request->validate([
            'logged_on' => ['nullable', 'date'],
            'item_ids' => ['required', 'array', 'min:1'],
            'item_ids.*' => ['integer'],
        ]);
        $date = $validated['logged_on'] ?? today()->toDateString();

        // The meal must belong to the client's active meal plan.
        abort_unless(
            NutritionAssignment::query()
                ->where('client_id', $client->id)
                ->where('status', 'active')
                ->whereHas('planVersion.days.meals', fn ($q) => $q->where('meals.id', $meal->id))
                ->exists(),
            404,
        );

        $log = FoodLog::query()
            ->where('client_id', $client->id)
            ->where('meal_name', $meal->name)
            ->whereDate('logged_on', $date)
            ->first() ?? FoodLog::create([
                'client_id' => $client->id,
                'logged_on' => $date,
                'meal_name' => $meal->name,
            ]);

        if (! $log->wasRecentlyCreated || $log->items()->doesntExist()) {
            $log->items()->delete();

            foreach ($meal->items()->with('food', 'portion')->whereIn('id', $validated['item_ids'])->get() as $item) {
                if (! $item->food) {
                    continue;
                }

                $grams = $item->portion ? $item->portion->grams * $item->quantity : $item->quantity * 100;

                FoodLogItem::create([
                    'food_log_id' => $log->id,
                    'food_id' => $item->food->id,
                    'grams' => $grams,
                    'calories' => round($item->food->calories * $grams / 100),
                    'protein_g' => round($item->food->protein_g * $grams / 100, 1),
                    'carbs_g' => round($item->food->carbs_g * $grams / 100, 1),
                    'fat_g' => round($item->food->fat_g * $grams / 100, 1),
                    'logged_at' => now(),
                ]);
            }
        }

        return back();
    }

    public function destroy(Request $request, FoodLog $foodLog): RedirectResponse
    {
        abort_unless($foodLog->client_id === $request->user()->clientProfile->id, 403);

        $photoPath = $foodLog->photo_path;
        $foodLog->delete();

        if ($photoPath) {
            Storage::disk('public')->delete($photoPath);
        }

        return back();
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
