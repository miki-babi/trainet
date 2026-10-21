<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'name', 'description', 'icon'])]
class Habit extends Model
{
    use HasFactory;

    public function assignments(): HasMany
    {
        return $this->hasMany(HabitAssignment::class);
    }
}
