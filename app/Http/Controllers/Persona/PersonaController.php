<?php

namespace App\Http\Controllers\Persona;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PersonaController extends Controller
{
    public function index(): Response
    {
        abort_unless(config('trainet.demo'), 404);

        $personas = User::query()
            ->with(['clientProfile', 'professionalProfile', 'workspaceMember.workspace'])
            ->where(fn ($q) => $q->whereHas('clientProfile')->orWhereHas('workspaceMember'))
            ->orderBy('id')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'kind' => $user->isClient() ? 'client' : 'professional',
                'role' => $user->professionalProfile?->professional_type?->value
                    ?? $user->workspaceMember?->role?->value,
                'workspace' => $user->workspaceMember?->workspace?->name,
                'onboarding' => $user->clientProfile?->onboarding_status?->value,
            ]);

        return Inertia::render('personas', ['personas' => $personas]);
    }

    public function store(Request $request, User $user): RedirectResponse
    {
        abort_unless(config('trainet.demo'), 404);

        Auth::logout();
        Auth::login($user, remember: false);
        $request->session()->regenerate();

        return redirect()->to($user->isClient() ? '/app/today' : '/pro/today');
    }
}
