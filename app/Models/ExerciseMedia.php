<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['exercise_id', 'type', 'path', 'sort_order'])]
class ExerciseMedia extends Model
{
    use HasFactory;

    protected $table = 'exercise_media';

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
