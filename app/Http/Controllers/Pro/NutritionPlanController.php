<?php

namespace App\Http\Controllers\Pro;

use App\Enums\AssignmentStatus;
use App\Enums\ContentStatus;
use App\Enums\VersionStatus;
use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\Conversation;
use App\Models\Food;
use App\Models\Meal;
use App\Models\MealItem;
use App\Models\Message;
use App\Models\NutritionAssignment;
use App\Models\NutritionPlan;
use App\Models\NutritionPlanDay;
use App\Models\NutritionPlanVersion;
use App\Models\NutritionTarget;
use App\Models\PackagePurchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class NutritionPlanController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->workspaceMember->workspace_id;
    }

    public function index(Request $request): Response
    {
        return Inertia::render('pro/nutrition/index', [
            'plans' => NutritionPlan::query()
                ->where('workspace_id', $this->workspaceId($request))
                ->with('versions.days.meals')
                ->get(),
            'clients' => ClientProfile::query()
                ->with('user')
                ->whereHas('professionalAssignments', fn ($q) => $q->where('workspace_id', $this->workspaceId($request))->where('status', 'active'))
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->user->name]),
            'requests' => PackagePurchase::query()
                ->where('workspace_id', $this->workspaceId($request))
                ->whereNull('delivered_at')
                ->whereHas('package', fn ($q) => $q->where('kind', 'meal_plan'))
                ->with('package:id,name', 'client.user:id,name')
                ->latest('purchased_at')
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'client' => $p->client?->user?->name,
                    'package' => $p->package?->name,
                    'intake' => $p->intake,
                    'purchased_at' => $p->purchased_at?->diffForHumans(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $plan = DB::transaction(function () use ($request, $validated) {
            $plan = NutritionPlan::create([
                'workspace_id' => $this->workspaceId($request),
                'created_by' => $request->user()->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => ContentStatus::Draft,
            ]);

            $version = NutritionPlanVersion::create([
                'nutrition_plan_id' => $plan->id,
                'version_number' => 1,
                'created_by' => $request->user()->id,
                'status' => VersionStatus::Draft,
            ]);

            $day = NutritionPlanDay::create([
                'nutrition_plan_version_id' => $version->id,
                'order' => 1,
                'title' => 'Every day',
            ]);

            foreach (['Breakfast', 'Lunch', 'Dinner'] as $i => $name) {
                Meal::create(['nutrition_plan_day_id' => $day->id, 'name' => $name, 'order' => $i + 1]);
            }

            return $plan;
        });

        return redirect("/pro/nutrition-plans/{$plan->id}/edit");
    }

    public function edit(Request $request, NutritionPlan $nutritionPlan): Response
    {
        abort_unless($nutritionPlan->workspace_id === $this->workspaceId($request), 404);

        $version = $nutritionPlan->versions()
            ->orderByDesc('version_number')
            ->with('days.meals.items.food', 'days.meals.items.portion')
            ->first();

        return Inertia::render('pro/nutrition/edit', [
            'plan' => $nutritionPlan,
            'version' => $version,
            'versions' => $nutritionPlan->versions()->orderByDesc('version_number')->get(['id', 'version_number', 'status', 'published_at']),
            'foods' => Food::with('portions')->orderBy('name')->get(),
            'clients' => ClientProfile::query()
                ->with('user')
                ->whereHas('professionalAssignments', fn ($q) => $q->where('workspace_id', $nutritionPlan->workspace_id)->where('status', 'active'))
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'name' => $c->user->name]),
        ]);
    }

    public function storeMeal(Request $request, NutritionPlanDay $nutritionPlanDay): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'time_hint' => ['nullable', 'string', 'max:10'],
        ]);

        Meal::create([
            'nutrition_plan_day_id' => $nutritionPlanDay->id,
            'name' => $validated['name'],
            'time_hint' => $validated['time_hint'] ?? null,
            'order' => $nutritionPlanDay->meals()->max('order') + 1,
        ]);

        return back();
    }

    public function storeMealItem(Request $request, Meal $meal): RedirectResponse
    {
        $validated = $request->validate([
            'food_id' => ['required', 'exists:foods,id'],
            'quantity' => ['required', 'numeric', 'min:0.1'],
            'food_portion_id' => ['nullable', 'exists:food_portions,id'],
            'notes' => ['nullable', 'string', 'max:200'],
        ]);

        MealItem::create([...$validated, 'meal_id' => $meal->id]);

        return back();
    }

    public function destroyMealItem(MealItem $mealItem): RedirectResponse
    {
        $mealItem->delete();

        return back();
    }

    public function publish(Request $request, NutritionPlan $nutritionPlan): RedirectResponse
    {
        abort_unless($nutritionPlan->workspace_id === $this->workspaceId($request), 404);

        $draft = $nutritionPlan->versions()->where('status', VersionStatus::Draft)->first();
        abort_if(! $draft, 422, 'No draft version to publish.');

        DB::transaction(function () use ($nutritionPlan, $draft) {
            $draft->update(['status' => VersionStatus::Published, 'published_at' => now()]);
            $nutritionPlan->update(['status' => ContentStatus::Active]);
            NutritionPlanVersion::create([
                'nutrition_plan_id' => $nutritionPlan->id,
                'version_number' => $nutritionPlan->versions()->max('version_number') + 1,
                'created_by' => auth()->id(),
                'status' => VersionStatus::Draft,
            ]);
        });

        return back();
    }

    public function assign(Request $request, NutritionPlanVersion $nutritionPlanVersion): RedirectResponse
    {
        abort_unless($nutritionPlanVersion->status === VersionStatus::Published, 422);

        $validated = $request->validate([
            'client_id' => ['required', 'exists:client_profiles,id'],
            'starts_on' => ['required', 'date'],
            'calories' => ['nullable', 'numeric'],
            'protein_g' => ['nullable', 'numeric'],
            'carbs_g' => ['nullable', 'numeric'],
            'fat_g' => ['nullable', 'numeric'],
            'water_ml' => ['nullable', 'integer'],
        ]);

        DB::transaction(function () use ($request, $validated, $nutritionPlanVersion) {
            NutritionAssignment::query()
                ->where('client_id', $validated['client_id'])
                ->where('status', AssignmentStatus::Active)
                ->update(['status' => AssignmentStatus::Ended]);

            NutritionAssignment::create([
                'workspace_id' => $this->workspaceId($request),
                'client_id' => $validated['client_id'],
                'nutrition_plan_version_id' => $nutritionPlanVersion->id,
                'assigned_by' => $request->user()->id,
                'starts_on' => $validated['starts_on'],
                'status' => AssignmentStatus::Active,
            ]);

            if ($validated['calories'] ?? null) {
                NutritionTarget::create([
                    'client_id' => $validated['client_id'],
                    'source' => 'plan',
                    'calories' => $validated['calories'],
                    'protein_g' => $validated['protein_g'] ?? null,
                    'carbs_g' => $validated['carbs_g'] ?? null,
                    'fat_g' => $validated['fat_g'] ?? null,
                    'water_ml' => $validated['water_ml'] ?? null,
                    'starts_on' => $validated['starts_on'],
                ]);
            }

            // A published plan delivery fulfils pending meal-plan purchases — mark them and notify the client.
            $pending = PackagePurchase::query()
                ->where('workspace_id', $this->workspaceId($request))
                ->where('client_profile_id', $validated['client_id'])
                ->whereNull('delivered_at')
                ->whereHas('package', fn ($q) => $q->where('kind', 'meal_plan'))
                ->get();

            if ($pending->isNotEmpty()) {
                PackagePurchase::query()->whereIn('id', $pending->pluck('id'))->update(['delivered_at' => now()]);

                $clientUser = ClientProfile::query()->find($validated['client_id'])?->user;

                if ($clientUser) {
                    $conversation = Conversation::query()
                        ->where('workspace_id', $this->workspaceId($request))
                        ->where('type', 'direct')
                        ->whereHas('members', fn ($q) => $q->where('user_id', $request->user()->id))
                        ->whereHas('members', fn ($q) => $q->where('user_id', $clientUser->id))
                        ->first();

                    if (! $conversation) {
                        $conversation = Conversation::create([
                            'workspace_id' => $this->workspaceId($request),
                            'type' => 'direct',
                        ]);
                        $conversation->members()->createMany([
                            ['user_id' => $request->user()->id],
                            ['user_id' => $clientUser->id],
                        ]);
                    }

                    $planName = $nutritionPlanVersion->plan?->name ?? 'your meal plan';

                    Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $request->user()->id,
                        'body' => "Your personalized meal plan is ready — I've assigned \"{$planName}\" to you. Open Nutrition → Full plan to see it.",
                    ]);
                }
            }
        });

        return back();
    }
}
