<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['workspace_id', 'created_by', 'name', 'description', 'visibility', 'status'])]
class TrainingProgram extends Model
{
    use HasFactory;

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(TrainingProgramVersion::class)->orderByDesc('version_number');
    }

    public function draftVersion(): HasOne
    {
        return $this->hasOne(TrainingProgramVersion::class)->where('status', 'draft')->latestOfMany('version_number');
    }

    public function latestPublishedVersion(): HasOne
    {
        return $this->hasOne(TrainingProgramVersion::class)->where('status', 'published')->latestOfMany('version_number');
    }

    protected function casts(): array
    {
        return ['status' => ContentStatus::class];
    }
}
