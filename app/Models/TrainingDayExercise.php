<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'training_day_id',
    'exercise_id',
    'order',
    'group_label',
    'sets',
    'reps',
    'target_load',
    'duration_seconds',
    'distance_meters',
    'rpe',
    'rir',
    'tempo',
    'rest_seconds',
    'notes',
])]
class TrainingDayExercise extends Model
{
    use HasFactory;

    public function day(): BelongsTo
    {
        return $this->belongsTo(TrainingDay::class, 'training_day_id');
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    protected function casts(): array
    {
        return [
            'target_load' => 'decimal:2',
            'rpe' => 'decimal:1',
            'rir' => 'decimal:1',
        ];
    }
}
