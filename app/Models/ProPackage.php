<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['professional_profile_id', 'name', 'description', 'image_url', 'price', 'billing_label', 'kind', 'sort_order', 'is_hidden'])]
class ProPackage extends Model
{
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_hidden' => 'boolean'];
    }

    public function professionalProfile(): BelongsTo
    {
        return $this->belongsTo(ProfessionalProfile::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(PackagePurchase::class, 'pro_package_id');
    }
}
