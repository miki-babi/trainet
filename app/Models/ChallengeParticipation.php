<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['challenge_id', 'client_id', 'score', 'joined_at'])]
class ChallengeParticipation extends Model
{
    protected $table = 'challenge_participation';

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'joined_at' => 'datetime',
        ];
    }
}
