<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['exercise_id', 'alternative_exercise_id'])]
class ExerciseAlternative extends Model
{
    public $timestamps = false;
}
