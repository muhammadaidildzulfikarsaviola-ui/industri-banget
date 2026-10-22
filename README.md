# Industri Banget

**Industrial Engineering Analysis Workspace**

Industri Banget is a web-based workspace for industrial engineering projects and quantitative analysis.

## Project Status

🚧 Under active development.

The current application uses Laravel, React, TypeScript, Inertia.js, and PostgreSQL. Additional analysis capabilities will be developed incrementally.

## Planned Modules

- **Projects:** Organize industrial engineering projects.
- **EOQ:** Economic Order Quantity and inventory optimization.
- **Forecasting:** Demand forecasting and time-series analysis.
- **MRP:** Material Requirements Planning.
- **SPC:** Statistical Process Control.
- **Datasets:** Manage input data for analysis.
- **Reports:** Store and present analysis results.

Modules listed above may still be under development.

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
├── analysis-engine/  # Future Python analysis engine
├── docs/             # Technical documentation
├── .editorconfig
├── .gitattributes
├── .gitignore
└── README.md
```

## Requirements

Install the following tools before setting up the project:

- Git
- PHP version compatible with the Laravel dependencies
- Composer
- Node.js and npm
- PostgreSQL
- Python 3.11 or a compatible version when the analysis engine is introduced

## Local Development

1. Clone the repository.
2. Open the `backend` directory.
3. Install PHP dependencies with `composer install`.
4. Install frontend dependencies with `npm install`.
5. Copy `.env.example` to `.env`.
6. Configure the local database connection.
7. Generate the Laravel application key with `php artisan key:generate`.
8. Run migrations with `php artisan migrate`.
9. Start the Laravel server with `php artisan serve`.
10. Start the frontend development server in another terminal with `npm run dev`.

Check the project's dependency requirements and environment configuration before running commands. Local PHP, database credentials, and ports may differ between machines.

## Development Principles

- Keep business logic separate from presentation.
- Validate input on the backend.
- Use database migrations to manage schema changes.
- Keep secrets and machine-specific configuration out of version control.
- Add tests for important calculations and workflows.
- Document changes as the project grows.

## License

No license has been assigned yet. All rights reserved unless a license is added to this repository.
