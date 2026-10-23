<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('q')->trim()->toString();

        $events = AuditEvent::query()
            ->with('actor')
            ->when($search !== '', fn ($q) => $q->where('action', 'like', "%{$search}%"))
            ->latest('created_at')
            ->limit(300)
            ->get()
            ->map(fn (AuditEvent $e) => [
                'id' => $e->id,
                'actor' => $e->actor?->name ?? 'system',
                'action' => $e->action,
                'resource' => $e->resource_type ? class_basename($e->resource_type).' #'.$e->resource_id : null,
                'reason' => $e->reason,
                'meta' => $e->meta,
                'created_at' => $e->created_at->toDateTimeString(),
            ]);

        return Inertia::render('admin/audit/index', [
            'events' => $events,
            'filters' => ['q' => $search],
        ]);
    }
}
