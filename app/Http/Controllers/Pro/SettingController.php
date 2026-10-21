<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(Request $request): Response
    {
        $member = $request->user()->workspaceMember()->with('workspace')->firstOrFail();

        return Inertia::render('pro/settings/edit', [
            'workspace' => $member->workspace,
            'profile' => $request->user()->professionalProfile,
            'role' => $member->role->value,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $member = $request->user()->workspaceMember;

        $workspaceValidated = $request->validate([
            'workspace_name' => ['sometimes', 'required', 'string', 'max:120'],
        ]);
        $profileValidated = $request->validate([
            'bio' => ['nullable', 'string', 'max:1000'],
            'credentials' => ['nullable', 'string', 'max:300'],
            'business_name' => ['nullable', 'string', 'max:120'],
        ]);

        if ($member->role->value === 'owner' && isset($workspaceValidated['workspace_name'])) {
            $member->workspace->update(['name' => $workspaceValidated['workspace_name']]);
        }

        $request->user()->professionalProfile?->update($profileValidated);

        return back();
    }
}
