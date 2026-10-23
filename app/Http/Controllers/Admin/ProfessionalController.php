<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\ProfessionalClientAssignment;
use App\Models\ProfessionalProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->trim()->toString();
        $search = $request->string('q')->trim()->toString();

        $professionals = ProfessionalProfile::query()
            ->with(['user', 'approvedBy'])
            ->withCount('packages')
            ->when(in_array($status, ['pending', 'approved', 'rejected'], true), fn ($q) => $q->where('approval_status', $status))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('business_name', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))))
            ->latest()
            ->get()
            ->map(fn (ProfessionalProfile $p) => [
                'id' => $p->id,
                'name' => $p->user?->name,
                'email' => $p->user?->email,
                'avatar' => $p->user?->avatar,
                'user_status' => $p->user?->status,
                'type' => $p->professional_type->value,
                'business_name' => $p->business_name,
                'approval_status' => $p->approval_status,
                'approved_at' => $p->approved_at?->toDateString(),
                'packages_count' => $p->packages_count,
                'created_at' => $p->created_at->toDateString(),
            ]);

        $counts = [
            'pending' => ProfessionalProfile::where('approval_status', 'pending')->count(),
            'approved' => ProfessionalProfile::where('approval_status', 'approved')->count(),
            'rejected' => ProfessionalProfile::where('approval_status', 'rejected')->count(),
        ];

        return Inertia::render('admin/professionals/index', [
            'professionals' => $professionals,
            'counts' => $counts,
            'filters' => ['status' => $status, 'q' => $search],
        ]);
    }

    public function show(ProfessionalProfile $professionalProfile): Response
    {
        $professionalProfile->load(['user', 'approvedBy', 'packages']);

        $assignments = ProfessionalClientAssignment::query()
            ->where('professional_id', $professionalProfile->user_id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return Inertia::render('admin/professionals/show', [
            'professional' => [
                'id' => $professionalProfile->id,
                'user_id' => $professionalProfile->user_id,
                'name' => $professionalProfile->user?->name,
                'email' => $professionalProfile->user?->email,
                'avatar' => $professionalProfile->user?->avatar,
                'user_status' => $professionalProfile->user?->status,
                'type' => $professionalProfile->professional_type->value,
                'business_name' => $professionalProfile->business_name,
                'bio' => $professionalProfile->bio,
                'credentials' => $professionalProfile->credentials,
                'certifications' => $professionalProfile->certifications ?? [],
                'specialties' => $professionalProfile->specialties ?? [],
                'coaching_mode' => $professionalProfile->coaching_mode,
                'approval_status' => $professionalProfile->approval_status,
                'approved_at' => $professionalProfile->approved_at?->toDateString(),
                'approved_by' => $professionalProfile->approvedBy?->name,
                'rejection_reason' => $professionalProfile->rejection_reason,
                'joined' => $professionalProfile->created_at->toDateString(),
                'packages' => $professionalProfile->packages->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'kind' => $p->kind,
                    'price' => $p->price,
                    'is_hidden' => $p->is_hidden,
                ]),
                'assignment_counts' => $assignments,
            ],
        ]);
    }

    public function approve(Request $request, ProfessionalProfile $professionalProfile): RedirectResponse
    {
        $professionalProfile->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        AuditEvent::record($request->user(), 'professional.approved', $professionalProfile);

        return back()->with('success', "Approved {$professionalProfile->user?->name} — now live in the marketplace.");
    }

    public function reject(Request $request, ProfessionalProfile $professionalProfile): RedirectResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $professionalProfile->update([
            'approval_status' => 'rejected',
            'approved_at' => null,
            'approved_by' => $request->user()->id,
            'rejection_reason' => $data['reason'] ?? null,
        ]);

        AuditEvent::record($request->user(), 'professional.rejected', $professionalProfile, $data['reason'] ?? null);

        return back()->with('success', "Rejected {$professionalProfile->user?->name}'s application.");
    }
}
