<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['check_in_submission_id', 'check_in_question_id', 'value_rating', 'value_text', 'photo_path'])]
class CheckInAnswer extends Model
{
    use HasFactory;

    public function submission(): BelongsTo
    {
        return $this->belongsTo(CheckInSubmission::class, 'check_in_submission_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(CheckInQuestion::class, 'check_in_question_id');
    }
}
