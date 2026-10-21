<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'event_type', 'channel', 'enabled', 'quiet_hours_start', 'quiet_hours_end'])]
class NotificationPreference extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['enabled' => 'boolean'];
    }
}
