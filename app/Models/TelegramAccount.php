<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'telegram_user_id', 'username', 'first_name', 'last_name', 'linked_at', 'verified_at'])]
class TelegramAccount extends Model
{
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'linked_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }
}
