<?php

namespace App\Models;

use App\Enums\MetricVisibility;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['client_id', 'path', 'taken_on', 'label', 'visibility'])]
class ProgressPhoto extends Model
{
    use HasFactory;

    protected $appends = ['url'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function getUrlAttribute(): string
    {
        return str_starts_with($this->path, 'http') ? $this->path : Storage::url($this->path);
    }

    protected function casts(): array
    {
        return [
            'taken_on' => 'date',
            'visibility' => MetricVisibility::class,
        ];
    }
}
