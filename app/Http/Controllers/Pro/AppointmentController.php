<?php

namespace App\Http\Controllers\Pro;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function show(Request $request, Appointment $appointment): Response
    {
        abort_unless($appointment->workspace_id === $request->user()->workspaceMember->workspace_id, 404);

        return Inertia::render('pro/appointments/show', [
            'appointment' => $appointment->load('client.user', 'type', 'professional', 'events.actor'),
        ]);
    }

    public function confirm(Request $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update(['status' => AppointmentStatus::Confirmed]);
        AppointmentEvent::create([
            'appointment_id' => $appointment->id,
            'actor_id' => $request->user()->id,
            'type' => 'confirmed',
            'new_starts_at' => $appointment->starts_at,
        ]);

        return back();
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update(['status' => AppointmentStatus::Cancelled]);
        AppointmentEvent::create([
            'appointment_id' => $appointment->id,
            'actor_id' => $request->user()->id,
            'type' => 'cancelled',
            'old_starts_at' => $appointment->starts_at,
        ]);

        return back();
    }

    public function reschedule(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate(['starts_at' => ['required', 'date']]);
        $newStart = Carbon::parse($validated['starts_at']);

        AppointmentEvent::create([
            'appointment_id' => $appointment->id,
            'actor_id' => $request->user()->id,
            'type' => 'rescheduled',
            'old_starts_at' => $appointment->starts_at,
            'new_starts_at' => $newStart,
        ]);

        $appointment->update([
            'starts_at' => $newStart,
            'ends_at' => $newStart->copy()->addMinutes($appointment->type->duration_minutes),
            'status' => AppointmentStatus::Confirmed,
        ]);

        return back();
    }

    public function updateNotes(Request $request, Appointment $appointment): RedirectResponse
    {
        $appointment->update($request->validate([
            'session_notes' => ['nullable', 'string', 'max:2000'],
        ]));

        return back();
    }
}
