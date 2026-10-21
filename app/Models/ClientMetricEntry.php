<?php

namespace App\Models;

use App\Enums\MetricVisibility;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['client_id', 'metric_definition_id', 'value', 'unit', 'observed_on', 'source', 'visibility', 'note'])]
class ClientMetricEntry extends Model
{
    use HasFactory;

    public function metric(): BelongsTo
    {
        return $this->belongsTo(MetricDefinition::class, 'metric_definition_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'observed_on' => 'date',
            'visibility' => MetricVisibility::class,
        ];
    }
}
