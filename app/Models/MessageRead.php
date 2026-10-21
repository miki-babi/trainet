<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['message_id', 'user_id', 'read_at'])]
class MessageRead extends Model
{
    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }
}
