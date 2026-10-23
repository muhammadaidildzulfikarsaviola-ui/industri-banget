<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateUserCommand extends Command
{
    protected $signature = 'user:create';

    protected $description = 'Create an application user interactively';

    public function handle(): int
    {
        $name = trim((string) $this->ask('Name'));

        if ($name === '' || mb_strlen($name) > 255) {
            $this->error('Name is required and must be no longer than 255 characters.');

            return self::FAILURE;
        }

        $email = mb_strtolower(trim((string) $this->ask('Email')));

        if (
            filter_var($email, FILTER_VALIDATE_EMAIL) === false
            || mb_strlen($email) > 255
            || User::query()->where('email', $email)->exists()
        ) {
            $this->error('Enter a valid email address that is not already registered.');

            return self::FAILURE;
        }

        $password = $this->secret('Password');

        if (! is_string($password) || mb_strlen($password) < 12 || mb_strlen($password) > 255) {
            $this->error('Password must be between 12 and 255 characters.');

            return self::FAILURE;
        }

        $confirmation = $this->secret('Confirm password');

        if (! is_string($confirmation) || ! hash_equals($password, $confirmation)) {
            $this->error('Passwords do not match.');

            return self::FAILURE;
        }

        User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        $this->info('User account created.');

        return self::SUCCESS;
    }
}
