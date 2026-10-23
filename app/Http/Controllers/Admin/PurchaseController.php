<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\PackagePurchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->trim()->toString();
        $search = $request->string('q')->trim()->toString();

        $purchases = PackagePurchase::query()
            ->with(['client.user', 'professional', 'package'])
            ->when(in_array($status, ['paid', 'refunded'], true), fn ($q) => $q->where('status', $status))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->whereHas('client.user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                ->orWhereHas('professional', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                ->orWhereHas('package', fn ($p) => $p->where('name', 'like', "%{$search}%"))))
            ->latest('purchased_at')
            ->limit(200)
            ->get()
            ->map(fn (PackagePurchase $p) => [
                'id' => $p->id,
                'client' => $p->client?->user?->name,
                'professional' => $p->professional?->name,
                'package' => $p->package?->name,
                'kind' => $p->package?->kind,
                'amount_cents' => $p->amount_cents,
                'status' => $p->status,
                'delivered' => $p->delivered_at !== null,
                'purchased_at' => $p->purchased_at?->toDateString(),
            ]);

        return Inertia::render('admin/purchases/index', [
            'purchases' => $purchases,
            'summary' => [
                'paid' => PackagePurchase::where('status', 'paid')->count(),
                'refunded' => PackagePurchase::where('status', 'refunded')->count(),
                'gmvCents' => (int) PackagePurchase::where('status', 'paid')->sum('amount_cents'),
            ],
            'filters' => ['status' => $status, 'q' => $search],
        ]);
    }

    public function refund(Request $request, PackagePurchase $purchase): RedirectResponse
    {
        abort_if($purchase->status !== 'paid', 422, 'Only paid purchases can be refunded.');

        $purchase->update(['status' => 'refunded']);

        AuditEvent::record($request->user(), 'purchase.refunded', $purchase);

        return back()->with('success', 'Purchase marked as refunded.');
    }
}
