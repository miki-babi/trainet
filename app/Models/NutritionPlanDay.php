<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nutrition_plan_version_id', 'order', 'title'])]
class NutritionPlanDay extends Model
{
    use HasFactory;

    public function meals(): HasMany
    {
        return $this->hasMany(Meal::class, 'nutrition_plan_day_id')->orderBy('order');
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(NutritionPlanVersion::class, 'nutrition_plan_version_id');
    }
}
