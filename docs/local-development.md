# Local development

## Requirements

- PHP 8.4.1 or later, with `pdo_pgsql` enabled (`pdo_sqlite` is needed to run the test suite)
- Composer
- Node.js and npm
- PostgreSQL

The Python analysis engine is not part of local application setup yet.

On Windows, select the PHP executable for the current PowerShell session before running Composer, Artisan, or the frontend build. This example changes only the current shell process, not the machine or user PATH:

```powershell
$phpExecutable = 'C:\tools\php-8.4.1\php.exe'
& $phpExecutable -v
$env:Path = "$(Split-Path -Parent $phpExecutable);$env:Path"
where.exe php
php -m | Select-String 'pdo_sqlite|pdo_pgsql'
```

Confirm the first `where.exe php` result is the selected executable. `composer` scripts and the Wayfinder process started by `npm run build` then use that PHP from the same terminal session. The SQLite test suite needs `pdo_sqlite`; the local PostgreSQL application needs `pdo_pgsql`.

## Setup

From the repository root, change to `backend/` and install dependencies:

```sh
composer install
npm install
```

Copy `.env.example` to `.env`. Set `DB_CONNECTION=pgsql` and configure the local PostgreSQL host, port, database, username, and password. Create the database and grant the configured role access before continuing. Keep `.env` local and never commit it.

Generate an application key and apply pending migrations:

```sh
php artisan key:generate
php artisan migrate
```

Migrations change the configured database schema. Inspect `php artisan migrate:status` and confirm the configured connection before applying them. Do not use `migrate:fresh` with a database containing data.

Run Laravel and Vite in separate terminals:

```sh
php artisan serve
npm run dev
```

## Checks

```sh
composer check-platform-reqs
composer run lint:check
composer run types:check
composer run test
npm run check
npm run types:check
npm run build
php artisan route:list
php artisan migrate:status
```

To run just the module suites while debugging, use `php artisan test --filter=Spc`, `php artisan test --filter=Forecasting`, or `php artisan test --filter=MRP` from `backend/`. The test suite uses an in-memory SQLite database as configured in `phpunit.xml`; PostgreSQL is used by the local application configuration. The production frontend build runs Wayfinder, which invokes Artisan, so the PHP version and required extensions must also be available to the Node/Vite process.

## Troubleshooting

- If Composer reports a PHP platform mismatch, check `php -v` and make sure the PHP 8.4+ executable comes first on the current terminal's `PATH`.
- If PostgreSQL reports a connection error, verify the server is running and that the local `.env` database name and role are correct. Do not paste credentials into issue reports.
- If `npm run build` fails in Wayfinder, run `php artisan route:list` in the same terminal first. This helps distinguish a Laravel/PHP issue from a frontend bundling issue.
- If a migration is pending, inspect its `up()` method and the configured target database before running `php artisan migrate`.
