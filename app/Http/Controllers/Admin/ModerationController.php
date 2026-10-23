<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\ProfessionalProfile;
use App\Models\ProPackage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModerationController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('q')->trim()->toString();

        $packages = ProPackage::query()
            ->with('professionalProfile.user')
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->latest()
            ->limit(200)
            ->get()
            ->map(fn (ProPackage $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'kind' => $p->kind,
                'price' => $p->price,
                'is_hidden' => $p->is_hidden,
                'professional' => $p->professionalProfile?->user?->name,
                'professional_status' => $p->professionalProfile?->approval_status,
            ]);

        return Inertia::render('admin/moderation/index', [
            'packages' => $packages,
            'profiles' => ProfessionalProfile::query()
                ->with('user')
                ->latest()
                ->limit(200)
                ->get()
                ->map(fn (ProfessionalProfile $p) => [
                    'id' => $p->id,
                    'name' => $p->user?->name,
                    'business_name' => $p->business_name,
                    'type' => $p->professional_type->value,
                    'approval_status' => $p->approval_status,
                ]),
            'filters' => ['q' => $search],
        ]);
    }

    public function togglePackage(Request $request, ProPackage $proPackage): RedirectResponse
    {
        $proPackage->update(['is_hidden' => ! $proPackage->is_hidden]);

        AuditEvent::record(
            $request->user(),
            $proPackage->is_hidden ? 'package.hidden' : 'package.unhidden',
            $proPackage,
        );

        return back()->with('success', $proPackage->is_hidden ? 'Package hidden from marketplace.' : 'Package visible again.');
    }
}
