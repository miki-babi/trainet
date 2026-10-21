<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['client_id', 'source', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'water_ml', 'starts_on', 'ends_on'])]
class NutritionTarget extends Model
{
    use HasFactory;

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    protected function casts(): array
    {
        return [
            'calories' => 'decimal:0',
            'protein_g' => 'decimal:0',
            'carbs_g' => 'decimal:0',
            'fat_g' => 'decimal:0',
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }
}
