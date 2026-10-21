<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['habit_assignment_id', 'client_id', 'logged_on', 'completed', 'value'])]
class HabitLog extends Model
{
    use HasFactory;

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(HabitAssignment::class, 'habit_assignment_id');
    }

    protected function casts(): array
    {
        return [
            'logged_on' => 'date',
            'completed' => 'boolean',
        ];
    }
}
