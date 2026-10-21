<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['training_program_version_id', 'order', 'title', 'is_rest_day', 'notes'])]
class TrainingDay extends Model
{
    use HasFactory;

    public function version(): BelongsTo
    {
        return $this->belongsTo(TrainingProgramVersion::class, 'training_program_version_id');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(TrainingDayExercise::class)->orderBy('order');
    }

    protected function casts(): array
    {
        return ['is_rest_day' => 'boolean'];
    }
}
