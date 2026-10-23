<?php

namespace App\Models;

use App\Enums\ProfessionalType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'professional_type', 'bio', 'credentials', 'certifications', 'testimonials', 'business_name', 'specialties', 'rating', 'reviews_count', 'price_label', 'coaching_mode', 'cover_image', 'approval_status', 'approved_at', 'approved_by', 'rejection_reason'])]
class ProfessionalProfile extends Model
{
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    public function packages(): HasMany
    {
        return $this->hasMany(ProPackage::class)->orderBy('sort_order');
    }

    protected function casts(): array
    {
        return [
            'professional_type' => ProfessionalType::class,
            'approved_at' => 'datetime',
            'specialties' => 'array',
            'certifications' => 'array',
            'testimonials' => 'array',
            'rating' => 'decimal:1',
        ];
    }
}
