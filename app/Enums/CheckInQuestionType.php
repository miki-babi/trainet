<?php

namespace App\Enums;

enum CheckInQuestionType: string
{
    case Rating = 'rating';
    case Text = 'text';
    case Photo = 'photo';
    case Adherence = 'adherence';
}
