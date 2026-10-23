# Material Requirements Planning

The MRP module plans discrete, equally spaced buckets labelled `P1` through `P36`. A bucket is an abstract period; the user supplies the intended calendar interpretation outside the calculation. Each project's reusable items contain code, name, unit, lead time in buckets, initial on-hand, and a lot sizing policy. Codes are unique within a project. BOM components and parents are protected by composite `(project_id, item_id)` foreign keys. The BOM must be acyclic.

## Calculation order and equations

The planner seeds gross requirements from the user-entered Master Production Schedule. It processes the BOM topologically from parents to components. A child receives gross requirements equal to each parent's planned order release quantity multiplied by the BOM quantity per parent unit, in the same release bucket.

For item `i` and bucket `t`:

- `available before new order = previous projected on-hand + scheduled receipts - gross requirements`
- `net requirements = max(0, -available before new order)`
- **Lot-for-Lot:** planned order receipt equals net requirements.
- **Fixed Order Quantity:** planned order receipt is `ceil(net requirements / fixed quantity) * fixed quantity`.
- `projected on-hand = available before new order + planned order receipt`
- `planned order release at t - lead time = planned order receipt at t`

Scheduled receipts are analysis inputs and are included in the bucket entered. They are not reusable master records. When lead-time offset puts a release before `P1`, the receipt remains in its due bucket and a warning states that the order must have been released before the horizon. The corresponding component requirement before the horizon is also reported; it is not silently shifted into `P1` or treated as an in-horizon requirement.

## Reproducible example

Plan five units of parent `A` in `P2`. It has two units of component `B` per parent, initial stock zero, lead time one bucket, and a scheduled receipt of two units in `P2`. `A` has gross requirements `0, 5`, scheduled receipts `0, 2`, net requirements `0, 3`, planned receipts `0, 3`, and a planned release of `3` in `P1`. Therefore `B` has gross requirements `6` in `P1`. If `B` has zero opening stock, lead time zero, and Lot-for-Lot, its net requirement, planned receipt, and planned release are all `6` in `P1`.

## Use, snapshots, and limits

Open a project and choose **Jalankan MRP**. Add item records, define parent-to-component BOM quantities, set a horizon, enter the MPS for any planned item, and add scheduled receipts if known. Results show gross requirements, scheduled receipts, projected on-hand, net requirements, planned receipts, and planned releases for every item/bucket. A summary lists releases and warnings. MRP snapshots include the MPS, scheduled receipts, item and BOM state, and calculated results. Reopening an old result does not recalculate it against changed master data.

There is no minimum order quantity, safety stock, scrap/yield factor, capacity constraint, or calendar date handling in this first model. A Fixed Order Quantity remainder stays in projected on-hand. Lead time is an integer bucket count and components are required in the parent's release bucket. These are explicit initial assumptions. Input quantity and item limits are bounded to avoid pathological plans. Tests are in `backend/tests/Unit/MrpPlannerTest.php` and `backend/tests/Feature/MrpTest.php`; run them from `backend/` with `vendor/bin/pest tests/Unit/MrpPlannerTest.php` and `vendor/bin/pest tests/Feature/MrpTest.php` after installing the required PHP runtime.

The migration is `backend/database/migrations/2026_10_23_120000_create_mrp_master_tables.php`. The main implementation is `backend/app/Http/Controllers/MrpController.php`, `backend/app/Services/MrpPlanner.php`, and the `mrp_items`/`mrp_bom_lines` tables.

The project scope constrains which records are shown and stored, but it is not authentication. The app still has no user access control and is not safe for public deployment.
