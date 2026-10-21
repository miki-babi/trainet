<?php

namespace App\Models;

use App\Enums\OnboardingStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'onboarding_status',
    'goals_summary',
    'experience_level',
    'equipment',
    'training_days',
    'dietary_preferences',
    'allergies',
    'height_cm',
    'birth_year',
    'consent_accepted_at',
])]
class ClientProfile extends Model
{
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function professionalAssignments(): HasMany
    {
        return $this->hasMany(ProfessionalClientAssignment::class, 'client_id');
    }

    public function programAssignments(): HasMany
    {
        return $this->hasMany(ProgramAssignment::class, 'client_id');
    }

    public function workoutSessions(): HasMany
    {
        return $this->hasMany(WorkoutSession::class, 'client_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ClientTag::class, 'client_tag_assignments', 'client_id', 'client_tag_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(ClientNote::class, 'client_id');
    }

    public function activeProfessionals(): HasMany
    {
        return $this->professionalAssignments()->where('status', 'active');
    }

    protected function casts(): array
    {
        return [
            'onboarding_status' => OnboardingStatus::class,
            'equipment' => 'array',
            'training_days' => 'array',
            'dietary_preferences' => 'array',
            'consent_accepted_at' => 'datetime',
        ];
    }
}
