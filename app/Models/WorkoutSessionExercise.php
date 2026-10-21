<?php

namespace App\Models;

use App\Enums\WorkStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workout_session_id',
    'exercise_id',
    'order',
    'group_label',
    'target_sets',
    'target_reps',
    'target_load',
    'target_duration_seconds',
    'target_rpe',
    'rest_seconds',
    'notes',
    'status',
])]
class WorkoutSessionExercise extends Model
{
    use HasFactory;

    public function workoutSession(): BelongsTo
    {
        return $this->belongsTo(WorkoutSession::class, 'workout_session_id');
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class, 'workout_session_exercise_id')->orderBy('set_order');
    }

    protected function casts(): array
    {
        return [
            'status' => WorkStatus::class,
            'target_load' => 'decimal:2',
            'target_rpe' => 'decimal:1',
        ];
    }
}
