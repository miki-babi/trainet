<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'food_category_id',
    'workspace_id',
    'name',
    'calories',
    'protein_g',
    'carbs_g',
    'fat_g',
    'fiber_g',
    'sodium_mg',
    'serving_description',
    'image_url',
    'is_custom',
])]
class Food extends Model
{
    use HasFactory;

    protected $table = 'foods';

    public function category(): BelongsTo
    {
        return $this->belongsTo(FoodCategory::class, 'food_category_id');
    }

    public function portions(): HasMany
    {
        return $this->hasMany(FoodPortion::class);
    }

    protected function casts(): array
    {
        return [
            'calories' => 'decimal:0',
            'protein_g' => 'decimal:1',
            'carbs_g' => 'decimal:1',
            'fat_g' => 'decimal:1',
            'fiber_g' => 'decimal:1',
            'sodium_mg' => 'decimal:0',
            'is_custom' => 'boolean',
        ];
    }
}
