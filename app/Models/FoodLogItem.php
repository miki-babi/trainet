<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'food_log_id',
    'food_id',
    'custom_name',
    'quantity',
    'food_portion_id',
    'grams',
    'calories',
    'protein_g',
    'carbs_g',
    'fat_g',
    'logged_at',
])]
class FoodLogItem extends Model
{
    use HasFactory;

    public function log(): BelongsTo
    {
        return $this->belongsTo(FoodLog::class, 'food_log_id');
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function portion(): BelongsTo
    {
        return $this->belongsTo(FoodPortion::class, 'food_portion_id');
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'grams' => 'decimal:0',
            'calories' => 'decimal:0',
            'protein_g' => 'decimal:1',
            'carbs_g' => 'decimal:1',
            'fat_g' => 'decimal:1',
            'logged_at' => 'datetime',
        ];
    }
}
