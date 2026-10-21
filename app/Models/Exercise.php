<?php

namespace App\Models;

use App\Enums\ExerciseDifficulty;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'exercise_category_id',
    'workspace_id',
    'name',
    'difficulty',
    'movement_pattern',
    'instructions',
    'common_mistakes',
    'safety_notes',
    'is_custom',
])]
class Exercise extends Model
{
    use HasFactory;

    protected $appends = ['media_url', 'media_urls'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExerciseCategory::class, 'exercise_category_id');
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function muscleGroups(): BelongsToMany
    {
        return $this->belongsToMany(MuscleGroup::class, 'exercise_muscle_group');
    }

    public function equipment(): BelongsToMany
    {
        return $this->belongsToMany(Equipment::class, 'exercise_equipment');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ExerciseMedia::class)->orderBy('sort_order');
    }

    public function alternatives(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class, 'exercise_alternatives', 'exercise_id', 'alternative_exercise_id');
    }

    public function getMediaUrlAttribute(): ?string
    {
        $media = $this->relationLoaded('media') ? $this->media->first() : $this->media()->first();

        return $media ? Storage::url($media->path) : null;
    }

    /** @return array<int, string> */
    public function getMediaUrlsAttribute(): array
    {
        $media = $this->relationLoaded('media') ? $this->media : $this->media()->get();

        return $media->map(fn ($m) => Storage::url($m->path))->values()->all();
    }

    protected function casts(): array
    {
        return [
            'difficulty' => ExerciseDifficulty::class,
            'is_custom' => 'boolean',
        ];
    }
}
