<?php

namespace App\Models;

use App\Enums\CheckInQuestionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['check_in_template_id', 'order', 'prompt', 'type', 'required', 'config'])]
class CheckInQuestion extends Model
{
    use HasFactory;

    public function template(): BelongsTo
    {
        return $this->belongsTo(CheckInTemplate::class, 'check_in_template_id');
    }

    protected function casts(): array
    {
        return [
            'type' => CheckInQuestionType::class,
            'required' => 'boolean',
            'config' => 'array',
        ];
    }
}
