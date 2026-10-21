<?php

namespace App\Models;

use App\Enums\AssignmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['habit_id', 'client_id', 'frequency', 'schedule', 'status'])]
class HabitAssignment extends Model
{
    use HasFactory;

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(HabitLog::class);
    }

    protected function casts(): array
    {
        return [
            'status' => AssignmentStatus::class,
            'schedule' => 'array',
        ];
    }
}
