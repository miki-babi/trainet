<?php

namespace App\Models;

use App\Enums\VersionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nutrition_plan_id', 'version_number', 'created_by', 'change_summary', 'status', 'published_at'])]
class NutritionPlanVersion extends Model
{
    use HasFactory;

    public function plan(): BelongsTo
    {
        return $this->belongsTo(NutritionPlan::class, 'nutrition_plan_id');
    }

    public function days(): HasMany
    {
        return $this->hasMany(NutritionPlanDay::class)->orderBy('order');
    }

    protected function casts(): array
    {
        return [
            'status' => VersionStatus::class,
            'published_at' => 'datetime',
        ];
    }
}
