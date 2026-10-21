<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['workspace_id', 'created_by', 'name', 'description', 'status'])]
class NutritionPlan extends Model
{
    use HasFactory;

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(NutritionPlanVersion::class)->orderByDesc('version_number');
    }

    public function latestPublishedVersion(): HasOne
    {
        return $this->hasOne(NutritionPlanVersion::class)->where('status', 'published')->latestOfMany('version_number');
    }

    protected function casts(): array
    {
        return ['status' => ContentStatus::class];
    }
}
