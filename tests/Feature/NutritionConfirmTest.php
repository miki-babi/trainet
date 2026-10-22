<?php

use App\Models\FoodLog;
use App\Models\Meal;
use App\Models\NutritionAssignment;
use App\Models\User;
use Database\Seeders\DemoSeeder;

beforeEach(function () {
    $this->seed(DemoSeeder::class);
});

test('client can confirm eating a planned meal and only the checked items are logged', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $meal = Meal::where('name', 'Lunch')->firstOrFail();
    $itemIds = $meal->items()->pluck('id')->all();

    // Check only two of the four lunch items.
    $eaten = array_slice($itemIds, 0, 2);

    $this->actingAs($maya)
        ->post("/app/nutrition/plan-meals/{$meal->id}/confirm", [
            'item_ids' => $eaten,
        ])
        ->assertRedirect();

    $log = FoodLog::where('client_id', $maya->clientProfile->id)
        ->where('meal_name', 'Lunch')
        ->whereDate('logged_on', today())
        ->firstOrFail();

    expect($log->items)->toHaveCount(2)
        ->and($log->items->pluck('food_id')->sort()->values()->all())
        ->toBe($meal->items()->whereIn('id', $eaten)->pluck('food_id')->sort()->values()->all())
        ->and($log->items->sum('calories'))->toBeGreaterThan(0);
});

test('confirming a meal requires at least one checked item', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $meal = Meal::where('name', 'Breakfast')->firstOrFail();

    $this->actingAs($maya)
        ->post("/app/nutrition/plan-meals/{$meal->id}/confirm", ['item_ids' => []])
        ->assertSessionHasErrors('item_ids');
});

test('a meal outside the client active plan cannot be confirmed', function () {
    $leo = User::where('email', 'leo@trainet.test')->firstOrFail();
    $meal = Meal::firstOrFail(); // belongs to Dana's workspace plan, Leo has no assignment

    $this->actingAs($leo)
        ->post("/app/nutrition/plan-meals/{$meal->id}/confirm", [
            'item_ids' => $meal->items()->pluck('id')->all(),
        ])
        ->assertNotFound();
});

test('re-confirming replaces the logged items instead of duplicating', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $meal = Meal::where('name', 'Dinner')->firstOrFail();
    $itemIds = $meal->items()->pluck('id')->all();

    $this->actingAs($maya)
        ->post("/app/nutrition/plan-meals/{$meal->id}/confirm", ['item_ids' => $itemIds]);

    $this->actingAs($maya)
        ->post("/app/nutrition/plan-meals/{$meal->id}/confirm", ['item_ids' => [$itemIds[0]]]);

    expect(NutritionAssignment::where('client_id', $maya->clientProfile->id)->count())->toBeGreaterThan(0)
        ->and(
            FoodLog::where('client_id', $maya->clientProfile->id)
                ->where('meal_name', 'Dinner')
                ->whereDate('logged_on', today())
                ->firstOrFail()
                ->items()->count(),
        )->toBe(1);
});
