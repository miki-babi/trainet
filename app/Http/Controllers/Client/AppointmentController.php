<?php

namespace App\Http\Controllers\Client;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentEvent;
use App\Models\AppointmentType;
use App\Models\AvailabilityRule;
use App\Models\ProfessionalClientAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    private function clientId(Request $request): int
    {
        return $request->user()->clientProfile->id;
    }

    public function index(Request $request): Response
    {
        $appointments = Appointment::query()
            ->with('type', 'professional')
            ->where('client_id', $this->clientId($request))
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('client/appointments/index', [
            'upcoming' => $appointments->where('starts_at', '>=', now())->values(),
            'past' => $appointments->where('starts_at', '<', now())->sortByDesc('starts_at')->values(),
        ]);
    }

    public function create(Request $request): Response
    {
        $client = $request->user()->clientProfile;
        $workspaceId = $client->professionalAssignments()->firstOrFail()->workspace_id;

        $professionals = ProfessionalClientAssignment::query()
            ->with('professional')
            ->where('client_id', $client->id)
            ->where('status', 'active')
            ->get()
            ->map(fn ($a) => ['id' => $a->professional_id, 'name' => $a->professional->name]);

        $date = $request->date('date') ?? today();
        $professionalId = $request->integer('professional_id', $professionals->first()['id'] ?? 0);

        return Inertia::render('client/appointments/create', [
            'types' => AppointmentType::where('workspace_id', $workspaceId)->get(),
            'professionals' => $professionals,
            'professionalId' => $professionalId,
            'date' => $date->toDateString(),
            'slots' => $professionalId ? $this->slotsFor($professionalId, $date->toDateString()) : [],
            'week' => collect(range(-2, 11))->map(fn ($i) => today()->addDays($i)->toDateString()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'appointment_type_id' => ['required', 'exists:appointment_types,id'],
            'professional_id' => ['required', 'exists:users,id'],
            'starts_at' => ['required', 'date', 'after:now'],
            'client_note' => ['nullable', 'string', 'max:300'],
        ]);

        $type = AppointmentType::findOrFail($validated['appointment_type_id']);
        $start = Carbon::parse($validated['starts_at']);

        $appointment = Appointment::create([
            'workspace_id' => $type->workspace_id,
            'client_id' => $this->clientId($request),
            'professional_id' => $validated['professional_id'],
            'appointment_type_id' => $type->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes($type->duration_minutes),
            'status' => AppointmentStatus::Pending,
            'location_note' => $type->location_note,
            'client_note' => $validated['client_note'] ?? null,
        ]);

        AppointmentEvent::create([
            'appointment_id' => $appointment->id,
            'actor_id' => $request->user()->id,
            'type' => 'created',
            'new_starts_at' => $start,
        ]);

        return redirect('/app/appointments');
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($appointment->client_id === $this->clientId($request), 403);

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
        abort_unless($appointment->client_id === $this->clientId($request), 403);

        $validated = $request->validate(['starts_at' => ['required', 'date', 'after:now']]);
        $newStart = Carbon::parse($validated['starts_at']);

        $appointment->update([
            'starts_at' => $newStart,
            'ends_at' => $newStart->copy()->addMinutes($appointment->type->duration_minutes),
            'status' => AppointmentStatus::Pending,
        ]);
        AppointmentEvent::create([
            'appointment_id' => $appointment->id,
            'actor_id' => $request->user()->id,
            'type' => 'reschedule_request',
            'old_starts_at' => $appointment->getOriginal('starts_at'),
            'new_starts_at' => $newStart,
        ]);

        return back();
    }

    /**
     * Compute bookable 30-min slots for a professional on a date.
     */
    private function slotsFor(int $professionalId, string $date): array
    {
        $day = Carbon::parse($date);
        $weekday = (int) $day->format('N');

        $rules = AvailabilityRule::query()
            ->where('user_id', $professionalId)
            ->where('weekday', $weekday)
            ->where(fn ($q) => $q->whereNull('effective_from')->orWhere('effective_from', '<=', $date))
            ->where(fn ($q) => $q->whereNull('effective_to')->orWhere('effective_to', '>=', $date))
            ->get();

        if ($rules->isEmpty()) {
            return [];
        }

        $booked = Appointment::query()
            ->where('professional_id', $professionalId)
            ->whereDate('starts_at', $date)
            ->whereIn('status', [AppointmentStatus::Pending, AppointmentStatus::Confirmed])
            ->get(['starts_at', 'ends_at']);

        $slots = [];
        foreach ($rules as $rule) {
            $cursor = Carbon::parse("{$date} {$rule->start_time}");
            $end = Carbon::parse("{$date} {$rule->end_time}");
            while ($cursor->copy()->addMinutes(30) <= $end) {
                $slotEnd = $cursor->copy()->addMinutes(30);
                $overlaps = $booked->contains(
                    fn ($a) => $a->starts_at < $slotEnd && $a->ends_at > $cursor,
                );
                if ($cursor->isFuture() && ! $overlaps) {
                    $slots[] = $cursor->format('H:i');
                }
                $cursor->addMinutes(30);
            }
        }

        return $slots;
    }
}
