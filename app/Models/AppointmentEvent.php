<?php

namespace App\Models;

use App\Enums\AppointmentEventType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['appointment_id', 'actor_id', 'type', 'old_starts_at', 'new_starts_at', 'meta'])]
class AppointmentEvent extends Model
{
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    protected function casts(): array
    {
        return [
            'type' => AppointmentEventType::class,
            'old_starts_at' => 'datetime',
            'new_starts_at' => 'datetime',
            'meta' => 'array',
        ];
    }
}
