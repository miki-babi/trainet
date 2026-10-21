<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['client_id', 'logged_on', 'meal_name', 'photo_path', 'notes'])]
class FoodLog extends Model
{
    use HasFactory;

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FoodLogItem::class);
    }

    protected function casts(): array
    {
        return ['logged_on' => 'date'];
    }
}
