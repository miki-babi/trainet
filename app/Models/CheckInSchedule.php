<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['client_id', 'check_in_template_id', 'frequency', 'weekday', 'starts_on', 'ends_on', 'status'])]
class CheckInSchedule extends Model
{
    use HasFactory;

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CheckInTemplate::class, 'check_in_template_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(CheckInSubmission::class);
    }

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }
}
