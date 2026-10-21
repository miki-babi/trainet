<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['client_id', 'exercise_id', 'type', 'value', 'workout_set_id', 'achieved_at'])]
class PersonalRecord extends Model
{
    use HasFactory;

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'achieved_at' => 'datetime',
        ];
    }
}
