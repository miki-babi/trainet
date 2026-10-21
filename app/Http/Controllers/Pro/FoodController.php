<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\FoodCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FoodController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        return Inertia::render('pro/nutrition/foods', [
            'foods' => Food::query()
                ->with('category', 'portions')
                ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->orderBy('name')
                ->get(),
            'categories' => FoodCategory::orderBy('name')->get(),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'food_category_id' => ['required', 'exists:food_categories,id'],
            'calories' => ['required', 'numeric', 'min:0'],
            'protein_g' => ['required', 'numeric', 'min:0'],
            'carbs_g' => ['required', 'numeric', 'min:0'],
            'fat_g' => ['required', 'numeric', 'min:0'],
            'fiber_g' => ['nullable', 'numeric', 'min:0'],
            'default_portion_label' => ['nullable', 'string', 'max:60'],
            'default_portion_grams' => ['nullable', 'numeric', 'min:0'],
        ]);

        $food = Food::create([
            ...collect($validated)->except('default_portion_label', 'default_portion_grams')->toArray(),
            'workspace_id' => $request->user()->workspaceMember->workspace_id,
        ]);

        if ($validated['default_portion_grams'] ?? null) {
            $food->portions()->create([
                'label' => $validated['default_portion_label'] ?? 'portion',
                'grams' => $validated['default_portion_grams'],
            ]);
        }

        return back();
    }

    public function update(Request $request, Food $food): RedirectResponse
    {
        $food->update($request->validate([
            'name' => ['required', 'string', 'max:120'],
            'food_category_id' => ['required', 'exists:food_categories,id'],
            'calories' => ['required', 'numeric', 'min:0'],
            'protein_g' => ['required', 'numeric', 'min:0'],
            'carbs_g' => ['required', 'numeric', 'min:0'],
            'fat_g' => ['required', 'numeric', 'min:0'],
            'fiber_g' => ['nullable', 'numeric', 'min:0'],
        ]));

        return back();
    }
}
