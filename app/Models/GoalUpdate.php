<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['goal_id', 'value', 'noted_at', 'note'])]
class GoalUpdate extends Model
{
    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'noted_at' => 'datetime',
        ];
    }
}
