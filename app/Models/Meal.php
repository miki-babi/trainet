<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nutrition_plan_day_id', 'name', 'time_hint', 'order', 'notes'])]
class Meal extends Model
{
    use HasFactory;

    public function items(): HasMany
    {
        return $this->hasMany(MealItem::class);
    }

    public function planDay(): BelongsTo
    {
        return $this->belongsTo(NutritionPlanDay::class, 'nutrition_plan_day_id');
    }
}
