<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\PackagePurchase;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->workspaceMember->workspace_id;

        $purchases = PackagePurchase::query()
            ->with(['client.user', 'package'])
            ->where('workspace_id', $workspaceId)
            ->orderByDesc('purchased_at')
            ->get();

        return Inertia::render('pro/payments/index', [
            'purchases' => $purchases->map(fn (PackagePurchase $p) => [
                'id' => $p->id,
                'client' => $p->client->user->name,
                'package' => $p->package->name,
                'amount' => $p->amount_cents,
                'currency' => $p->currency,
                'status' => $p->status,
                'date' => $p->purchased_at->format('j M Y'),
            ]),
            'monthRevenue' => $purchases->where('status', 'paid')
                ->filter(fn ($p) => $p->purchased_at->isCurrentMonth())
                ->sum('amount_cents'),
            'totalRevenue' => $purchases->where('status', 'paid')->sum('amount_cents'),
        ]);
    }
}
