# Industri Banget

**Industrial Engineering Analysis Workspace**

Industri Banget is a web-based workspace for industrial engineering projects and quantitative analysis.

## Current features

- A Laravel and Inertia dashboard with navigation to the project register.
- Light and Dark themes with a persistent user preference and operating-system default.
- Projects can be created, listed, opened, and edited with server-side validation. Deletion requires confirmation and is blocked while analysis history or MRP master data exists.
- EOQ analysis calculates recommendations and a cost curve from user input, then stores reproducible inputs and results against the selected project.
- Demand forecasting compares five classical time-series methods on a common rolling holdout, stores the inputs and results against the selected project, and provides a saved result page with metrics and projections.
- MRP manages project-scoped items and acyclic BOMs, calculates multi-period material plans with Lot-for-Lot or Fixed Order Quantity, and stores reproducible input/result snapshots.
- SPC supports I-MR, X-bar R, p, np, c, and u control charts, with Nelson Rules signals and project-scoped result snapshots. See [SPC model notes](docs/spc-model.md) for formulas and assumptions.

Dataset management and reports are not implemented yet. This application has no authentication or authorization: project and analysis data are not separated or protected between users, so it is not safe for public deployment. The [security roadmap](docs/security-roadmap.md) describes the work required before deployment. See the [forecasting](docs/forecasting-model.md), [MRP](docs/mrp-model.md), and [SPC](docs/spc-model.md) model notes for assumptions and limitations. No project blueprint was present in the repository at the current revision; see the [blueprint restoration proposal](docs/blueprint-restoration-proposal.md) before treating any new product requirements as authoritative. See the [architecture notes](docs/architecture.md), [EOQ model notes](docs/eoq-model.md), and [local development guide](docs/local-development.md) for current behavior and setup.

## Technology Stack

- Backend: Laravel 13 / PHP
- Frontend: React / TypeScript
- Integration: Inertia.js
- Styling: Tailwind CSS
- Database: PostgreSQL
- Build tooling: Vite / Vite Plus
- Future analysis engine: Python

## Repository Structure

```text
Industri-banget/
├── backend/          # Laravel application
├── docs/             # Architecture, analysis models, setup, and restoration proposal
├── .editorconfig
├── .gitattributes
├── .gitignore
└── README.md
```

## Requirements

Install the following tools before setting up the project:

- Git
- PHP 8.4.1 or newer, with `pdo_pgsql` enabled (`pdo_sqlite` is also needed for the test suite)
- Composer
- Node.js and npm
- PostgreSQL
- Python 3.11 or a compatible version when the analysis engine is introduced

## Local Development

1. Clone the repository and open `backend/`.
2. Install PHP dependencies with `composer install` and frontend dependencies with `npm install`.
3. Copy `.env.example` to `.env`, then configure the PostgreSQL database and credentials for your machine.
4. Generate the application key with `php artisan key:generate`.
5. Run database migrations with `php artisan migrate`.
6. Start the Laravel server with `php artisan serve` and the Vite development server with `npm run dev` in separate terminals.

The default example configuration expects a local PostgreSQL server. Never commit `.env` or database credentials.

## Development commands

Run these from `backend/`:

```sh
npm run dev
npm run check
npm run types:check
npm run build
composer run lint:check
composer run test
php artisan route:list
php artisan migrate:status
```

The future Python analysis engine is not currently an application or service; Laravel owns project records, validation, and the EOQ, Forecasting, MRP, and SPC workflows and calculations. Its proposed responsibility and integration boundary are described in [the architecture notes](docs/architecture.md). Integration can be chosen when a concrete analysis requires it.

## Development Principles

- Keep business logic separate from presentation.
- Validate input on the backend.
- Use database migrations to manage schema changes.
- Keep secrets and machine-specific configuration out of version control.
- Add tests for important calculations and workflows.
- Document changes as the project grows.

## License

No license has been assigned yet. All rights reserved unless a license is added to this repository.
