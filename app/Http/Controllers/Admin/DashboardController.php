<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\PackagePurchase;
use App\Models\ProfessionalProfile;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users' => User::count(),
                'clients' => ClientProfile::count(),
                'professionals' => ProfessionalProfile::count(),
                'pendingPros' => ProfessionalProfile::where('approval_status', 'pending')->count(),
                'suspendedUsers' => User::where('status', 'suspended')->count(),
                'purchases' => PackagePurchase::where('status', 'paid')->count(),
                'monthPurchases' => PackagePurchase::where('status', 'paid')->where('purchased_at', '>=', now()->startOfMonth())->count(),
                'monthGmvCents' => (int) PackagePurchase::where('status', 'paid')->where('purchased_at', '>=', now()->startOfMonth())->sum('amount_cents'),
            ],
            'pendingProfessionals' => ProfessionalProfile::query()
                ->with('user')
                ->where('approval_status', 'pending')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (ProfessionalProfile $p) => [
                    'id' => $p->id,
                    'name' => $p->user?->name,
                    'business_name' => $p->business_name,
                    'type' => $p->professional_type->value,
                    'created_at' => $p->created_at->toDateString(),
                ]),
            'recentUsers' => User::query()
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'kind' => $u->isAdmin() ? 'admin' : ($u->isProfessional() ? 'professional' : 'client'),
                    'status' => $u->status,
                    'created_at' => $u->created_at->toDateString(),
                ]),
            'recentPurchases' => PackagePurchase::query()
                ->with(['client.user', 'professional', 'package'])
                ->latest('purchased_at')
                ->limit(6)
                ->get()
                ->map(fn (PackagePurchase $p) => [
                    'id' => $p->id,
                    'client' => $p->client?->user?->name,
                    'professional' => $p->professional?->name,
                    'package' => $p->package?->name,
                    'amount_cents' => $p->amount_cents,
                    'status' => $p->status,
                    'purchased_at' => $p->purchased_at?->toDateString(),
                ]),
        ]);
    }
}
