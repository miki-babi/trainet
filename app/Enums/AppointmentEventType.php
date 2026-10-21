<?php

namespace App\Enums;

enum AppointmentEventType: string
{
    case Created = 'created';
    case Rescheduled = 'rescheduled';
    case Cancelled = 'cancelled';
    case Confirmed = 'confirmed';
    case Completed = 'completed';
    case NoteAdded = 'note_added';
}
