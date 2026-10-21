<?php

namespace App\Models;

use App\Enums\VersionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['training_program_id', 'version_number', 'created_by', 'change_summary', 'status', 'published_at'])]
class TrainingProgramVersion extends Model
{
    use HasFactory;

    public function program(): BelongsTo
    {
        return $this->belongsTo(TrainingProgram::class, 'training_program_id');
    }

    public function days(): HasMany
    {
        return $this->hasMany(TrainingDay::class, 'training_program_version_id')->orderBy('order');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ProgramAssignment::class, 'training_program_version_id');
    }

    protected function casts(): array
    {
        return [
            'status' => VersionStatus::class,
            'published_at' => 'datetime',
        ];
    }
}
