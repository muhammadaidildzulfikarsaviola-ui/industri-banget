<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests can open the login page', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/login'));
});

test('valid credentials authenticate the user and regenerate the session', function () {
    $user = User::factory()->create(['password' => 'correct-password']);
    $this->withSession(['pre_login_marker' => 'preserved']);
    $previousSessionId = $this->app['session']->driver()->getId();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'correct-password',
    ])->assertRedirect(route('home'));

    $this->assertAuthenticatedAs($user);
    $this->assertNotSame($previousSessionId, $this->app['session']->driver()->getId());
});

test('invalid credentials return a generic login error', function () {
    $user = User::factory()->create(['password' => 'correct-password']);

    $this->from(route('login'))
        ->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'incorrect-password',
        ])
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors(['email']);

    $this->assertGuest();
});

test('login validates email and password fields', function () {
    $this->from(route('login'))
        ->post(route('login.store'), [
            'email' => 'not-an-email',
            'password' => '',
        ])
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors(['email', 'password']);

    $this->assertGuest();
});

test('logout clears authentication and rotates the csrf token', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $this->get(route('home'))->assertOk();
    $previousToken = $this->app['session']->token();

    $this->post(route('logout'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
    expect($this->app['session']->token())->not->toBe($previousToken);
});

test('private dashboard and project routes redirect guests to login', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
    $this->get(route('projects.index'))->assertRedirect(route('login'));
});

test('authenticated users are redirected away from login and public registration is absent', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('login'))->assertRedirect(route('home'));
    $this->get('/register')->assertNotFound();
});

test('an operator can create an account through the interactive cli command', function () {
    $this->artisan('user:create')
        ->expectsQuestion('Name', 'Workspace operator')
        ->expectsQuestion('Email', 'operator@example.test')
        ->expectsQuestion('Password', 'a-long-operator-password')
        ->expectsQuestion('Confirm password', 'a-long-operator-password')
        ->expectsOutput('User account created.')
        ->assertExitCode(0);

    $user = User::query()->where('email', 'operator@example.test')->firstOrFail();

    expect(password_verify('a-long-operator-password', $user->password))->toBeTrue();
});
