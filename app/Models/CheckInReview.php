<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['check_in_submission_id', 'reviewer_id', 'comment', 'private_note', 'reviewed_at'])]
class CheckInReview extends Model
{
    use HasFactory;

    public function submission(): BelongsTo
    {
        return $this->belongsTo(CheckInSubmission::class, 'check_in_submission_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }
}
