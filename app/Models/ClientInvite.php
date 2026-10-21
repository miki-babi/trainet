<?php

namespace App\Models;

use App\Enums\InviteStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'creator_id', 'client_name', 'token_hash', 'intended_relationship', 'status', 'expires_at', 'redeemed_at', 'redeemed_by'])]
class ClientInvite extends Model
{
    use HasFactory;

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    protected function casts(): array
    {
        return [
            'status' => InviteStatus::class,
            'expires_at' => 'datetime',
            'redeemed_at' => 'datetime',
        ];
    }
}
