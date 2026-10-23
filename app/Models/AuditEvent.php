<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['actor_id', 'action', 'resource_type', 'resource_id', 'reason', 'correlation_id', 'meta', 'created_at'])]
class AuditEvent extends Model
{
    public const UPDATED_AT = null;

    /**
     * Record an auditable action performed by an actor on a resource.
     *
     * @param  array<string, mixed>  $meta
     */
    public static function record(User $actor, string $action, ?Model $resource = null, ?string $reason = null, array $meta = []): self
    {
        return static::create([
            'actor_id' => $actor->id,
            'action' => $action,
            'resource_type' => $resource?->getMorphClass(),
            'resource_id' => $resource?->getKey(),
            'reason' => $reason,
            'meta' => $meta ?: null,
            'created_at' => now(),
        ]);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
