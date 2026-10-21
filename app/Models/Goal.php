<?php

namespace App\Models;

use App\Enums\GoalStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['client_id', 'created_by', 'title', 'metric', 'start_value', 'target_value', 'unit', 'due_on', 'status'])]
class Goal extends Model
{
    use HasFactory;

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function updates(): HasMany
    {
        return $this->hasMany(GoalUpdate::class);
    }

    protected function casts(): array
    {
        return [
            'status' => GoalStatus::class,
            'start_value' => 'decimal:2',
            'target_value' => 'decimal:2',
            'due_on' => 'date',
        ];
    }
}
