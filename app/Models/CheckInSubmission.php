<?php

namespace App\Models;

use App\Enums\CheckInSubmissionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['check_in_schedule_id', 'client_id', 'due_on', 'submitted_at', 'status'])]
class CheckInSubmission extends Model
{
    use HasFactory;

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(CheckInSchedule::class, 'check_in_schedule_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(CheckInAnswer::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(CheckInReview::class);
    }

    protected function casts(): array
    {
        return [
            'status' => CheckInSubmissionStatus::class,
            'due_on' => 'date',
            'submitted_at' => 'datetime',
        ];
    }
}
