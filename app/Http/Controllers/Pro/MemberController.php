<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->workspaceMember->workspace_id;

        return Inertia::render('pro/members/index', [
            'members' => WorkspaceMember::query()
                ->with('user')
                ->where('workspace_id', $workspaceId)
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->user->name,
                    'email' => $m->user->email,
                    'role' => $m->role->value,
                    'status' => $m->status,
                ]),
        ]);
    }
}
