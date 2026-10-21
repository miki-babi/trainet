<?php

namespace App\Models;

use App\Enums\WorkoutSessionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'program_assignment_id',
    'client_id',
    'training_day_id',
    'scheduled_for',
    'status',
    'started_at',
    'completed_at',
    'duration_seconds',
    'overall_rpe',
    'client_feedback',
    'notes',
])]
class WorkoutSession extends Model
{
    use HasFactory;

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ProgramAssignment::class, 'program_assignment_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function trainingDay(): BelongsTo
    {
        return $this->belongsTo(TrainingDay::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(WorkoutSessionExercise::class)->orderBy('order');
    }

    protected function casts(): array
    {
        return [
            'status' => WorkoutSessionStatus::class,
            'scheduled_for' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'overall_rpe' => 'decimal:1',
        ];
    }
}
