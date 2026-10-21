<?php

namespace App\Models;

use App\Enums\AssignmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'client_id', 'training_program_version_id', 'assigned_by', 'starts_on', 'ends_on', 'schedule_days', 'status'])]
class ProgramAssignment extends Model
{
    use HasFactory;

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function programVersion(): BelongsTo
    {
        return $this->belongsTo(TrainingProgramVersion::class, 'training_program_version_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(WorkoutSession::class, 'program_assignment_id');
    }

    protected function casts(): array
    {
        return [
            'status' => AssignmentStatus::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
            'schedule_days' => 'array',
        ];
    }
}
