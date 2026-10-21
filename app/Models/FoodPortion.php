<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['food_id', 'label', 'grams'])]
class FoodPortion extends Model
{
    use HasFactory;

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    protected function casts(): array
    {
        return ['grams' => 'decimal:0'];
    }
}
