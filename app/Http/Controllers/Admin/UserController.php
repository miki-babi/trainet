<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\PackagePurchase;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $kind = $request->string('kind')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $search = $request->string('q')->trim()->toString();

        $users = User::query()
            ->with(['clientProfile', 'professionalProfile', 'workspaceMember'])
            ->when($kind === 'client', fn ($q) => $q->whereHas('clientProfile'))
            ->when($kind === 'professional', fn ($q) => $q->whereHas('professionalProfile'))
            ->when($kind === 'admin', fn ($q) => $q->where('is_admin', true))
            ->when(in_array($status, ['active', 'suspended', 'deleted'], true), fn ($q) => $q->where('status', $status))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->latest()
            ->limit(200)
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => $u->avatar,
                'is_admin' => $u->is_admin,
                'status' => $u->status,
                'kind' => $u->professionalProfile ? 'professional' : ($u->clientProfile ? 'client' : 'none'),
                'approval_status' => $u->professionalProfile?->approval_status,
                'created_at' => $u->created_at->toDateString(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => ['kind' => $kind, 'status' => $status, 'q' => $search],
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['clientProfile', 'professionalProfile', 'workspaceMember.workspace']);

        $purchaseCount = $user->clientProfile
            ? PackagePurchase::where('client_profile_id', $user->clientProfile->id)->count()
            : 0;

        return Inertia::render('admin/users/show', [
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'is_admin' => $user->is_admin,
                'status' => $user->status,
                'joined' => $user->created_at->toDateString(),
                'email_verified' => $user->email_verified_at !== null,
                'client_profile' => $user->clientProfile ? [
                    'onboarding_status' => $user->clientProfile->onboarding_status->value,
                    'experience_level' => $user->clientProfile->experience_level,
                    'goals_summary' => $user->clientProfile->goals_summary,
                    'purchases' => $purchaseCount,
                ] : null,
                'professional_profile' => $user->professionalProfile ? [
                    'id' => $user->professionalProfile->id,
                    'type' => $user->professionalProfile->professional_type->value,
                    'business_name' => $user->professionalProfile->business_name,
                    'approval_status' => $user->professionalProfile->approval_status,
                ] : null,
                'workspace' => $user->workspaceMember?->workspace ? [
                    'name' => $user->workspaceMember->workspace->name,
                    'role' => $user->workspaceMember->role->value,
                ] : null,
            ],
        ]);
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        abort_if($user->id === $request->user()->id, 422, 'You cannot suspend your own account.');
        abort_if($user->isAdmin(), 422, 'Admin accounts cannot be suspended.');

        $user->update(['status' => 'suspended']);

        AuditEvent::record($request->user(), 'user.suspended', $user, $data['reason'] ?? null);

        return back()->with('success', "Suspended {$user->name}.");
    }

    public function activate(Request $request, User $user): RedirectResponse
    {
        $user->update(['status' => 'active']);

        AuditEvent::record($request->user(), 'user.activated', $user);

        return back()->with('success', "Reactivated {$user->name}.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_if($user->id === $request->user()->id, 422, 'You cannot delete your own account.');
        abort_if($user->isAdmin(), 422, 'Admin accounts cannot be deleted.');

        $user->update(['status' => 'deleted']);

        AuditEvent::record($request->user(), 'user.deleted', $user);

        return redirect()->route('admin.users.index')->with('success', "Deleted {$user->name}.");
    }
}
