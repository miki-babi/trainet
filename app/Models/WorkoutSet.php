<?php

namespace App\Models;

use App\Enums\WorkStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workout_session_exercise_id',
    'set_order',
    'planned_reps',
    'planned_load',
    'actual_reps',
    'actual_load',
    'actual_duration_seconds',
    'actual_distance_meters',
    'actual_rpe',
    'actual_rir',
    'status',
    'notes',
])]
class WorkoutSet extends Model
{
    use HasFactory;

    public function sessionExercise(): BelongsTo
    {
        return $this->belongsTo(WorkoutSessionExercise::class, 'workout_session_exercise_id');
    }

    protected function casts(): array
    {
        return [
            'status' => WorkStatus::class,
            'planned_load' => 'decimal:2',
            'actual_load' => 'decimal:2',
            'actual_rpe' => 'decimal:1',
            'actual_rir' => 'decimal:1',
        ];
    }
}
