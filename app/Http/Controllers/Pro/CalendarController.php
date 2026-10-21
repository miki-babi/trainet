<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->workspaceMember->workspace_id;
        $week = $request->date('week')?->startOfWeek() ?? now()->startOfWeek();

        $appointments = Appointment::query()
            ->with('client.user', 'type', 'professional')
            ->where('workspace_id', $workspaceId)
            ->whereBetween('starts_at', [$week->copy()->startOfWeek(), $week->copy()->endOfWeek()])
            ->orderBy('starts_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'client' => $a->client->user->name,
                'professional' => $a->professional->name,
                'type' => $a->type->name,
                'color' => $a->type->color,
                'status' => $a->status->value,
                'date' => $a->starts_at->toDateString(),
                'start' => $a->starts_at->format('H:i'),
                'end' => $a->ends_at->format('H:i'),
            ])
            ->groupBy('date');

        return Inertia::render('pro/calendar/index', [
            'weekStart' => $week->toDateString(),
            'days' => collect(range(0, 6))->map(fn ($i) => [
                'date' => $week->copy()->addDays($i)->toDateString(),
                'label' => $week->copy()->addDays($i)->format('D j'),
                'isToday' => $week->copy()->addDays($i)->isToday(),
            ]),
            'appointments' => $appointments,
            'pending' => Appointment::query()
                ->with('client.user', 'type')
                ->where('workspace_id', $workspaceId)
                ->where('status', 'pending')
                ->where('starts_at', '>', now())
                ->orderBy('starts_at')
                ->limit(10)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'client' => $a->client->user->name,
                    'type' => $a->type->name,
                    'starts' => $a->starts_at->format('D j M H:i'),
                ]),
        ]);
    }
}
