# Security before public deployment

The current application has no authentication or authorization. Project URLs are addressable by ID, and project, analysis, Forecasting, and MRP routes are available to any visitor who can reach the application. Nested route binding prevents opening one analysis through the wrong project, and MRP foreign keys keep a BOM inside its project, but neither mechanism identifies a user or protects data between users. Do not deploy this version as a public multi-user application.

## Recommended next security work

1. Add Laravel session authentication using the official Laravel starter kit that matches the existing React/Inertia stack. This uses Laravel's existing session, CSRF, validation, and middleware rather than introducing a separate authentication service.
2. Define project ownership explicitly, for example `projects.owner_id` linked to `users.id`, or a membership table if collaboration is required. Decide whether existing records are migrated to a designated administrator or remain accessible only in a private single-user deployment.
3. Add a Project policy and enforce it for every route, including EOQ, Forecasting, MRP, and SPC analysis creation/reopening, item and BOM management, and project deletion. Scope queries by the authenticated user's owned or shared projects; do not treat knowing a project URL as authorization.
4. Add tests for unauthenticated access, owner access, non-owner denial, shared-member roles if chosen, and nested analysis/MRP cross-project access.
5. Configure production secrets, HTTPS, trusted hosts/proxies, session cookie settings, backups, logging/retention, database least privilege, and rate limits. Review deployment configuration before exposing the service.

The starter-kit choice and ownership model should be confirmed before changing the user schema because they affect account registration, invitations, collaboration, and migration of current records. Authentication and authorization were not added as part of the analysis-module work.
