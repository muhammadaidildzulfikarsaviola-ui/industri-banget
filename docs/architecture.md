# Architecture

## Current request flow

`backend/` contains the Laravel application and React pages served through Inertia. `/projects` lists Eloquent records and accepts validated project creation. Project detail, edit, update, and delete use nested Laravel routes and model binding. Inertia shares one-request success/error messages; validation errors return through the standard Inertia error prop.

## Current routes

| Method | Path | Route name | Handler |
| --- | --- | --- | --- |
| GET | `/` | `home` | Dashboard (`welcome`) |
| GET | `/projects` | `projects.index` | Project list |
| POST | `/projects` | `projects.store` | Create project |
| GET | `/projects/{project}` | `projects.show` | Project detail and analysis history |
| GET | `/projects/{project}/edit` | `projects.edit` | Edit form |
| PUT | `/projects/{project}` | `projects.update` | Update project |
| DELETE | `/projects/{project}` | `projects.destroy` | Delete only when there is no analysis history or MRP master data |
| GET | `/projects/{project}/eoq` | `projects.eoq.create` | EOQ form and recent runs |
| POST | `/projects/{project}/eoq` | `projects.eoq.store` | Validate, calculate, and persist an EOQ run |
| GET | `/projects/{project}/forecasting` | `projects.forecasting.create` | Forecasting form and recent runs |
| POST | `/projects/{project}/forecasting` | `projects.forecasting.store` | Validate, calculate, and persist a forecasting run |
| GET | `/projects/{project}/mrp` | `projects.mrp.create` | Project-scoped item/BOM register and MRP form |
| POST | `/projects/{project}/mrp/items` | `projects.mrp.items.store` | Add a project-scoped MRP item |
| PUT/DELETE | `/projects/{project}/mrp/items/{item}` | `projects.mrp.items.update` / `projects.mrp.items.destroy` | Update or remove an item scoped to the project |
| POST | `/projects/{project}/mrp/bom` | `projects.mrp.bom.store` | Add a validated, acyclic BOM line |
| PUT/DELETE | `/projects/{project}/mrp/bom/{bomLine}` | `projects.mrp.bom.update` / `projects.mrp.bom.destroy` | Update or remove a project-scoped BOM line |
| POST | `/projects/{project}/mrp` | `projects.mrp.store` | Calculate and persist an MRP snapshot |
| GET | `/projects/{project}/spc` | `projects.spc.create` | SPC chart input and recent saved runs |
| POST | `/projects/{project}/spc` | `projects.spc.store` | Validate, calculate, and persist a project-scoped SPC snapshot |
| GET | `/projects/{project}/analyses/{analysisRun}` | `analysis-runs.show` | Reopen a project-scoped EOQ, forecasting, MRP, or SPC result |

## Important files

- `backend/routes/web.php`: web routes and dashboard props.
- `backend/app/Http/Controllers/`: project, EOQ, forecasting, and analysis workflows.
- `backend/app/Services/EoqCalculator.php`: EOQ equations, range checks, and chart series.
- `backend/app/Services/ForecastingCalculator.php`: time-series methods, holdout evaluation, metrics, and projections.
- `backend/app/Services/MrpPlanner.php`: BOM graph checks, material netting, lot sizing, and lead-time offsets.
- `backend/app/Services/SpcCalculator.php`: control limits, point statistics, and Nelson Rules signals for six chart types.
- `backend/database/migrations/2026_10_23_120000_create_mrp_master_tables.php`: project-scoped MRP items and BOM lines with composite project/item foreign keys.
- `backend/app/Models/` and `backend/database/migrations/`: project/run relations and persistence schema.
- `backend/resources/js/pages/`: Inertia page components.
- `backend/resources/js/components/theme-toggle.tsx` and `backend/resources/css/app.css`: theme preference control and color tokens.
- `backend/tests/`: Pest unit and feature coverage for calculations and workflows.

`GET /projects/{project}/eoq` renders the EOQ inputs. Its POST validates values, calls `EoqCalculator`, then stores the JSON input/output in a transaction. The response redirects to the saved run. Nested route binding ensures an analysis run can only be opened through its owning project.

Forecasting follows the same persistence boundary. Its input and output JSON are saved through the selected project's analysis relation, and the scoped analysis route only reopens a result through that project. See [forecasting-model.md](forecasting-model.md) for calculation choices and numeric limits.

MRP stores reusable item and BOM master data under a project. Composite foreign keys include `project_id`, so a BOM edge cannot reference an item from another project even when written outside the controller. The planner checks cycles and runs a topological explosion from each parent's planned order releases. MPS, scheduled receipts, the item/BOM state, and computed tables are stored as an `analysis_runs` snapshot; later master edits do not rewrite old results. See [mrp-model.md](mrp-model.md) for the period-bucket and lead-time conventions.

SPC accepts observations or rational subgroups using the input shape for the selected chart, calculates chart-specific limits, checks compatible series against Nelson Rules, and stores data and results in an `analysis_runs` snapshot. No new migration is required because analysis types use the existing string column. See [spc-model.md](spc-model.md) for formulas, constants, and assumptions.

The `projects` table holds project metadata. `analysis_runs` belongs to one project through a foreign key with `RESTRICT` deletion. Each run stores its type, input JSON, result JSON, and timestamps. Analyses are synchronous, so they do not need an intermediate execution status: calculation completes before the transaction inserts the run. The project controller also refuses deletion when analysis history or MRP master data exists.

The original projects migration creates the table; a follow-up migration adds its detail fields. Later migrations add `analysis_runs`. Do not edit already-applied migrations to change a deployed schema. Add a new migration for future schema changes.

## Data and analysis boundaries

Laravel owns user-facing workflows, project metadata, validation, and persistence. `analysis-engine/` is reserved for Python numerical methods when a real analysis module benefits from Python's scientific libraries. It is not currently a service or package. A future integration should define a narrow input/output contract and keep project ownership and workflow state in Laravel. No network service, queue, or duplicate business logic is needed for the current project register.

## Current scope

The project register supports create, list, detail, and update. Deletion is blocked while analysis history or MRP master data exists. Analysis results and MRP records are scoped through their parent project in routes and database constraints. The application has no authentication, authorization, or per-user project ownership. All project and analysis routes are publicly accessible, and any visitor who can reach the application can view, create, edit, or delete project data where deletion constraints allow it. Route and database scoping prevent cross-project references, but they do not provide user access control or protect data between users. This application is not safe for public deployment until authentication and authorization are implemented and verified.

EOQ, Forecasting, MRP, and SPC are implemented in Laravel domain services with assumptions documented in [eoq-model.md](eoq-model.md), [forecasting-model.md](forecasting-model.md), [mrp-model.md](mrp-model.md), and [spc-model.md](spc-model.md). Dataset management and reports remain planned capabilities. Authentication and authorization are not implemented, so project records are not isolated by user and the app is not safe for public deployment. See [security-roadmap.md](security-roadmap.md) for recommended authentication, ownership, policy, and verification work.
