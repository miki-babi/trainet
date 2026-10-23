<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('trainet:admin {email : Email of the user} {--revoke : Remove admin access instead of granting it}')]
#[Description('Grant or revoke super-admin access for a user account')]
class GrantAdminAccess extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error("No user found with email {$this->argument('email')}. Register the account first.");

            return self::FAILURE;
        }

        $revoke = (bool) $this->option('revoke');
        $user->forceFill(['is_admin' => ! $revoke])->save();

        $this->info($revoke
            ? "Admin access revoked for {$user->email}."
            : "Admin access granted to {$user->email}.");

        return self::SUCCESS;
    }
}
