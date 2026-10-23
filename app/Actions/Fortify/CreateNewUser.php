<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\OnboardingStatus;
use App\Enums\ProfessionalType;
use App\Enums\WorkspaceMemberRole;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'account_type' => ['required', Rule::in(['client', 'professional'])],
            'professional_type' => [
                'required_if:account_type,professional',
                'nullable',
                Rule::in(array_map(fn (ProfessionalType $t) => $t->value, ProfessionalType::cases())),
            ],
            'business_name' => ['required_if:account_type,professional', 'nullable', 'string', 'max:120'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            if ($input['account_type'] === 'professional') {
                $this->createProfessionalAccount($user, $input);
            } else {
                $user->clientProfile()->create([
                    'onboarding_status' => OnboardingStatus::Pending,
                ]);
            }

            return $user;
        });
    }

    /**
     * Create the professional profile and solo workspace for a new pro.
     *
     * @param  array<string, string>  $input
     */
    private function createProfessionalAccount(User $user, array $input): void
    {
        $user->professionalProfile()->create([
            'professional_type' => $input['professional_type'],
            'business_name' => $input['business_name'],
            'approval_status' => 'pending',
        ]);

        $workspace = Workspace::create([
            'name' => $input['business_name'],
            'type' => 'solo',
            'owner_id' => $user->id,
        ]);

        $workspace->members()->create([
            'user_id' => $user->id,
            'role' => WorkspaceMemberRole::Owner,
            'status' => 'active',
        ]);
    }
}
