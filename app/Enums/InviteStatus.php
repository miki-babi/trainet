<?php

namespace App\Enums;

enum InviteStatus: string
{
    case Pending = 'pending';
    case Redeemed = 'redeemed';
    case Expired = 'expired';
    case Revoked = 'revoked';
}
