# EOQ model

## Inputs and units

- `D`: annual demand, in units per year.
- `S`: cost per replenishment order, in the selected currency per order.
- `H`: annual holding cost per unit, in the same currency per unit per year.
- Optional comparison quantity `Q`: units per order under an existing policy.

All required numeric inputs must be positive and finite. The currency code is stored as three uppercase letters. The calculation rejects values whose derived results cannot be represented as finite floating point numbers.

## Equations

The classical economic order quantity is:

```text
Q* = sqrt(2DS / H)
orders per year = D / Q*
interval in days = 365 / (orders per year)
annual ordering cost = (D / Q) × S
annual holding cost = (Q / 2) × H
relevant annual total = annual ordering cost + annual holding cost
```

At `Q*`, annual ordering and holding costs are equal, apart from floating point rounding. If a comparison quantity is provided, its ordering, holding, and relevant total costs are calculated with the same equations.

The relevant total excludes purchase cost. No purchase price is included in the current inputs. Results preserve the submitted input values and calculated output, including 49 points used to render the cost curves. The chart plots ordering, holding, and combined relevant annual costs for quantities from one quarter to three times the EOQ and marks the EOQ and its calculated total cost.

## Assumptions and limits

The basic model assumes demand and per-order/per-unit holding costs are stable over the period, replenishment arrives as one lot, and no stockout constraint is modeled. Lead time does not change EOQ; a reorder point is a separate calculation. Quantity discounts, capacity limits, and uncertain demand are outside this model.

This is a planning estimate. Its usefulness depends on whether the inputs reasonably represent the operation being studied.
