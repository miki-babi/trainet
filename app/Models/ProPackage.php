<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['professional_profile_id', 'name', 'description', 'image_url', 'price', 'billing_label', 'kind', 'sort_order'])]
class ProPackage extends Model
{
    use HasFactory;

    public function professionalProfile(): BelongsTo
    {
        return $this->belongsTo(ProfessionalProfile::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(PackagePurchase::class, 'pro_package_id');
    }
}
