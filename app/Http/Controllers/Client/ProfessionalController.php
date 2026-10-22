<?php

namespace App\Http\Controllers\Client;

use App\Enums\AssignmentStatus;
use App\Enums\ProfessionalType;
use App\Enums\RelationshipType;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\PackagePurchase;
use App\Models\ProfessionalClientAssignment;
use App\Models\ProfessionalProfile;
use App\Models\ProPackage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->clientProfile;
        $search = $request->string('q')->trim()->toString();
        $types = array_filter($request->array('types'));
        $specialtyFilter = array_filter($request->array('specialties'));

        $states = ProfessionalClientAssignment::query()
            ->where('client_id', $client->id)
            ->whereIn('status', [AssignmentStatus::Pending->value, AssignmentStatus::Active->value])
            ->pluck('status', 'professional_id');

        $professionals = ProfessionalProfile::query()
            ->with('user')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(fn ($w) => $w
                    ->where('business_name', 'like', "%{$search}%")
                    ->orWhere('bio', 'like', "%{$search}%")
                    ->orWhere('specialties', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")));
            })
            ->when($types !== [], function ($q) use ($types) {
                $q->where(function ($w) use ($types) {
                    if (in_array('trainers', $types, true)) {
                        $w->whereIn('professional_type', [ProfessionalType::Trainer->value, ProfessionalType::Both->value]);
                    }
                    if (in_array('nutritionists', $types, true)) {
                        $w->orWhereIn('professional_type', [ProfessionalType::Nutritionist->value, ProfessionalType::Both->value]);
                    }
                });
            })
            ->when($specialtyFilter !== [], function ($q) use ($specialtyFilter) {
                $q->where(function ($w) use ($specialtyFilter) {
                    foreach ($specialtyFilter as $spec) {
                        $w->orWhere('specialties', 'like', "%{$spec}%");
                    }
                });
            })
            ->orderByDesc('rating')
            ->get()
            ->map(fn (ProfessionalProfile $p) => [
                'id' => $p->id,
                'name' => $p->user->name,
                'avatar' => $p->user->avatar,
                'type' => $p->professional_type->value,
                'business_name' => $p->business_name,
                'bio' => $p->bio,
                'specialties' => $p->specialties ?? [],
                'rating' => $p->rating,
                'reviews_count' => $p->reviews_count,
                'price_label' => $p->price_label,
                'coaching_mode' => $p->coaching_mode,
                'state' => $states->get($p->user_id) ?? 'none',
            ]);

        $specialties = ProfessionalProfile::query()
            ->pluck('specialties')
            ->flatten()
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('client/professionals/index', [
            'professionals' => $professionals,
            'specialties' => $specialties,
            'filters' => ['q' => $search, 'types' => array_values($types), 'specialties' => array_values($specialtyFilter)],
        ]);
    }

    public function show(Request $request, ProfessionalProfile $professionalProfile): Response
    {
        $client = $request->user()->clientProfile;
        $professionalProfile->load('user', 'packages');

        $purchasedIds = PackagePurchase::query()
            ->where('client_profile_id', $client->id)
            ->whereIn('pro_package_id', $professionalProfile->packages->pluck('id'))
            ->pluck('pro_package_id');

        $pendingMealPlanIds = PackagePurchase::query()
            ->where('client_profile_id', $client->id)
            ->whereNull('delivered_at')
            ->whereHas('package', fn ($q) => $q->where('kind', 'meal_plan'))
            ->pluck('pro_package_id');

        $state = ProfessionalClientAssignment::query()
            ->where('client_id', $client->id)
            ->where('professional_id', $professionalProfile->user_id)
            ->whereIn('status', [AssignmentStatus::Pending->value, AssignmentStatus::Active->value])
            ->value('status') ?? 'none';

        return Inertia::render('client/professionals/show', [
            'professional' => [
                'id' => $professionalProfile->id,
                'name' => $professionalProfile->user->name,
                'avatar' => $professionalProfile->user->avatar,
                'type' => $professionalProfile->professional_type->value,
                'business_name' => $professionalProfile->business_name,
                'bio' => $professionalProfile->bio,
                'credentials' => $professionalProfile->credentials,
                'certifications' => $professionalProfile->certifications ?? [],
                'testimonials' => $professionalProfile->testimonials ?? [],
                'specialties' => $professionalProfile->specialties ?? [],
                'rating' => $professionalProfile->rating,
                'reviews_count' => $professionalProfile->reviews_count,
                'price_label' => $professionalProfile->price_label,
                'coaching_mode' => $professionalProfile->coaching_mode,
                'cover_image' => $professionalProfile->cover_image,
                'state' => $state,
                'packages' => $professionalProfile->packages->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'price' => $p->price,
                    'billing_label' => $p->billing_label,
                    'kind' => $p->kind,
                    'image_url' => $p->image_url,
                    'purchased' => $purchasedIds->contains($p->id),
                    'preparing' => $pendingMealPlanIds->contains($p->id),
                ]),
            ],
        ]);
    }

    public function request(Request $request, ProfessionalProfile $professionalProfile): RedirectResponse
    {
        $client = $request->user()->clientProfile;
        $pro = $professionalProfile->user;

        $exists = ProfessionalClientAssignment::query()
            ->where('client_id', $client->id)
            ->where('professional_id', $pro->id)
            ->whereIn('status', [AssignmentStatus::Pending->value, AssignmentStatus::Active->value])
            ->exists();

        abort_if($exists, 422, 'You already have a request or active assignment with this professional.');

        $workspace = $pro->workspaceMember?->workspace;
        abort_unless($workspace, 422, 'This professional is not taking on clients.');

        ProfessionalClientAssignment::create([
            'workspace_id' => $workspace->id,
            'client_id' => $client->id,
            'professional_id' => $pro->id,
            'relationship_type' => $professionalProfile->professional_type === ProfessionalType::Nutritionist
                ? RelationshipType::Nutritionist
                : RelationshipType::Trainer,
            'status' => AssignmentStatus::Pending,
            'starts_on' => today()->toDateString(),
        ]);

        return back();
    }

    public function checkout(Request $request, ProfessionalProfile $professionalProfile, ProPackage $proPackage): Response
    {
        abort_unless($proPackage->professional_profile_id === $professionalProfile->id, 404);
        $professionalProfile->load('user');

        // Meal plans are personalized — the client fills an intake form first.
        if ($proPackage->kind === 'meal_plan') {
            return Inertia::render('client/professionals/intake', [
                'professional' => [
                    'id' => $professionalProfile->id,
                    'name' => $professionalProfile->user->name,
                    'avatar' => $professionalProfile->user->avatar,
                    'type' => $professionalProfile->professional_type->value,
                    'business_name' => $professionalProfile->business_name,
                ],
                'package' => [
                    'id' => $proPackage->id,
                    'name' => $proPackage->name,
                    'description' => $proPackage->description,
                    'price' => $proPackage->price,
                    'image_url' => $proPackage->image_url,
                ],
            ]);
        }

        return Inertia::render('client/professionals/checkout', [
            'professional' => [
                'id' => $professionalProfile->id,
                'name' => $professionalProfile->user->name,
                'avatar' => $professionalProfile->user->avatar,
                'type' => $professionalProfile->professional_type->value,
                'business_name' => $professionalProfile->business_name,
            ],
            'package' => [
                'id' => $proPackage->id,
                'name' => $proPackage->name,
                'description' => $proPackage->description,
                'price' => $proPackage->price,
                'billing_label' => $proPackage->billing_label,
                'kind' => $proPackage->kind,
            ],
        ]);
    }

    public function purchase(Request $request, ProfessionalProfile $professionalProfile, ProPackage $proPackage): RedirectResponse
    {
        abort_unless($proPackage->professional_profile_id === $professionalProfile->id, 404);

        $client = $request->user()->clientProfile;
        $pro = $professionalProfile->user;
        $workspace = $pro->workspaceMember?->workspace;
        abort_unless($workspace, 422, 'This professional is not taking on clients.');

        $assignment = ProfessionalClientAssignment::query()
            ->where('client_id', $client->id)
            ->where('professional_id', $pro->id)
            ->whereIn('status', [AssignmentStatus::Pending->value, AssignmentStatus::Active->value])
            ->first();

        $isOneTime = $proPackage->kind !== 'coaching';
        abort_if(! $isOneTime && $assignment?->status === AssignmentStatus::Active, 422, 'You already have an active package with this professional.');

        if (PackagePurchase::query()->where('pro_package_id', $proPackage->id)->where('client_profile_id', $client->id)->exists()) {
            return redirect("/app/professionals/{$professionalProfile->id}")
                ->with('success', 'Already purchased — your order is in.');
        }

        $intake = $proPackage->kind === 'meal_plan'
            ? $request->validate([
                'intake.goal' => ['required', 'string', 'max:300'],
                'intake.current_weight_kg' => ['nullable', 'numeric', 'min:30', 'max:300'],
                'intake.dietary_preferences' => ['nullable', 'array'],
                'intake.dietary_preferences.*' => ['string', 'max:60'],
                'intake.allergies' => ['nullable', 'string', 'max:300'],
                'intake.avoid' => ['nullable', 'string', 'max:300'],
                'intake.notes' => ['nullable', 'string', 'max:500'],
            ])['intake']
            : null;

        PackagePurchase::create([
            'pro_package_id' => $proPackage->id,
            'client_profile_id' => $client->id,
            'workspace_id' => $workspace->id,
            'professional_id' => $pro->id,
            'amount_cents' => $proPackage->price,
            'status' => 'paid',
            'intake' => $intake,
            'purchased_at' => now(),
        ]);

        if (! $assignment) {
            ProfessionalClientAssignment::create([
                'workspace_id' => $workspace->id,
                'client_id' => $client->id,
                'professional_id' => $pro->id,
                'relationship_type' => $professionalProfile->professional_type === ProfessionalType::Nutritionist
                    ? RelationshipType::Nutritionist
                    : RelationshipType::Trainer,
                'status' => AssignmentStatus::Active,
                'starts_on' => today()->toDateString(),
            ]);
        } elseif (! $isOneTime) {
            $assignment->update(['status' => AssignmentStatus::Active, 'starts_on' => today()->toDateString()]);
        }

        if ($isOneTime) {
            $message = $proPackage->kind === 'meal_plan'
                ? "Order received — {$pro->name} will prepare your meal plan and notify you when it's ready."
                : "Purchased — {$pro->name} will deliver it to your plans.";

            return redirect("/app/professionals/{$professionalProfile->id}")->with('success', $message);
        }

        return redirect('/app/today')->with('success', "You're in! {$pro->name} will review your goals and publish your plan.");
    }

    public function message(Request $request, ProfessionalProfile $professionalProfile): RedirectResponse
    {
        $user = $request->user();
        $pro = $professionalProfile->user;

        $conversation = Conversation::query()
            ->where('type', 'direct')
            ->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('members', fn ($q) => $q->where('user_id', $pro->id))
            ->first();

        if (! $conversation) {
            $workspace = $pro->workspaceMember?->workspace;
            abort_unless($workspace, 422, 'This professional is not available for messaging.');

            $conversation = Conversation::create([
                'workspace_id' => $workspace->id,
                'type' => 'direct',
            ]);
            $conversation->members()->createMany([
                ['user_id' => $user->id],
                ['user_id' => $pro->id],
            ]);
        }

        return redirect("/app/messages/{$conversation->id}");
    }
}
