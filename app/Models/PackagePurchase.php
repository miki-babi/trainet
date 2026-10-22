<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['pro_package_id', 'client_profile_id', 'workspace_id', 'professional_id', 'amount_cents', 'currency', 'status', 'intake', 'delivered_at', 'purchased_at'])]
class PackagePurchase extends Model
{
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'purchased_at' => 'datetime',
            'delivered_at' => 'datetime',
            'intake' => 'array',
        ];
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(ProPackage::class, 'pro_package_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_profile_id');
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_id');
    }
}
