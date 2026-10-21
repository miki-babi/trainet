<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\AppointmentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentTypeController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('pro/scheduling/appointment-types', [
            'types' => AppointmentType::where('workspace_id', $request->user()->workspaceMember->workspace_id)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'buffer_minutes' => ['nullable', 'integer', 'min:0', 'max:120'],
            'color' => ['nullable', 'string', 'max:20'],
            'location_note' => ['nullable', 'string', 'max:120'],
        ]);

        AppointmentType::create([
            ...$validated,
            'workspace_id' => $request->user()->workspaceMember->workspace_id,
        ]);

        return back();
    }

    public function update(Request $request, AppointmentType $appointmentType): RedirectResponse
    {
        $appointmentType->update($request->validate([
            'name' => ['required', 'string', 'max:80'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'buffer_minutes' => ['nullable', 'integer', 'min:0', 'max:120'],
            'color' => ['nullable', 'string', 'max:20'],
            'location_note' => ['nullable', 'string', 'max:120'],
        ]));

        return back();
    }
}
