# SPC chart model and limitations

The SPC page creates project-scoped `AnalysisRun` snapshots. Each run stores its submitted values, chart type, labels, calculated point statistics, control limits, Nelson Rule signals, assumptions, and status. Opening an old run reads the saved JSON; it does not recalculate it.

## Supported charts

| Chart | Point statistic and center line | Control limits | Required data / assumptions |
| --- | --- | --- | --- |
| I-MR | Individuals: `X̄`; moving range: `MR̄` | I: `X̄ ± 2.66 MR̄`; MR: `[0, 3.267 MR̄]` | At least two individual observations in time order; moving range is `|Xᵢ − Xᵢ₋₁|`, with range-of-two constants `d₂=1.128`, `E₂=2.66`, `D₄=3.267`. |
| X-bar R | Subgroup mean `X̄̄`; mean range `R̄` | X-bar: `X̄̄ ± A₂R̄`; R: `[D₃R̄, D₄R̄]` | At least two rational subgroups, same size `n=2…10`. `A₂`, `D₃`, `D₄`, `d₂`, and `d₃` use the standard constants for that n. Process sigma is estimated using `R̄/d₂`; standard error of subgroup means is `R̄/(d₂√n)`. |
| p | Fraction nonconforming `dᵢ/nᵢ`; `p̄=Σdᵢ/Σnᵢ` | Per point: `p̄ ± 3√(p̄(1−p̄)/nᵢ)` | Binomial defective-unit counts, varying positive integer sample size; `dᵢ≤nᵢ`. |
| np | Number nonconforming; center `np̄` | `np̄ ± 3√(np̄(1−p̄))` | Binomial defective-unit counts and constant positive integer sample size; `dᵢ≤n`. |
| c | Defect count; `c̄` | `c̄ ± 3√c̄` | Count of defects with constant opportunity/area and a Poisson approximation. |
| u | Defects per unit `cᵢ/nᵢ`; `ū=Σcᵢ/Σnᵢ` | Per point: `ū ± 3√(ū/nᵢ)` | Defect counts with varying positive integer opportunity/unit counts; Poisson approximation and comparable opportunities. |

For p, np, c, and u, negative LCL values are truncated to zero. Measurement charts retain their formula-derived limits, which can be negative. Zero estimated variation yields finite z-scores of zero; any nonzero point against coincident limits is still detected by the limit comparison. Nelson Rules are skipped for a series when its estimated sigma is zero, because the rule zones cannot be meaningfully estimated. Input counts, sizes, and measurement observations must be finite and nonnegative. X-bar R subgroup values use constant subgroup size from 2 through 10.

The X-bar R factors used by the calculator are:

| n | A₂ | D₃ | D₄ | d₂ | d₃ |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | 1.880 | 0.000 | 3.267 | 1.128 | 0.853 |
| 3 | 1.023 | 0.000 | 2.574 | 1.693 | 0.888 |
| 4 | 0.729 | 0.000 | 2.282 | 2.059 | 0.880 |
| 5 | 0.577 | 0.000 | 2.114 | 2.326 | 0.864 |
| 6 | 0.483 | 0.000 | 2.004 | 2.534 | 0.848 |
| 7 | 0.419 | 0.076 | 1.924 | 2.704 | 0.833 |
| 8 | 0.373 | 0.136 | 1.864 | 2.847 | 0.820 |
| 9 | 0.337 | 0.184 | 1.816 | 2.970 | 0.808 |
| 10 | 0.308 | 0.223 | 1.777 | 3.078 | 0.797 |

## Nelson Rules

Rules run on the individuals series for I-MR, subgroup means for X-bar R, and standardized statistics for p, np, c, and u. The MR and R companion charts are checked against their control limits but excluded from Nelson rules because their distributions are non-normal and their variability estimates are not the same individual-point sigma model.

Each statistic is standardized as `z=(point−CL)/estimated σ`, with point-specific sigma for p/u and np. The tested rules are: (1) one point beyond 3σ; (2) nine consecutive points on one side of CL; (3) six increasing or decreasing; (4) fourteen alternating; (5) two of three beyond 2σ on one side; (6) four of five beyond 1σ on one side; (7) fifteen within 1σ; (8) eight beyond 1σ on both sides. Windows shorter than a rule's required length cannot trigger it. Results record the rule number, chart, first/last point, and reason. Rule signals are screening heuristics and do not establish a cause.

Control limits describe estimated process variation; they are not specification limits. Distributional assumptions, rational subgroup formation, independence, stable sampling conditions, and sufficient historical data matter. The status is a statistical signal, not a guarantee of process capability or product conformity.

## Routes and tests

- `GET /projects/{project}/spc`: chart input and recent SPC runs.
- `POST /projects/{project}/spc`: validate, calculate, and save an SPC snapshot.
- `GET /projects/{project}/analyses/{analysisRun}`: reopen the project-scoped snapshot.
- Service: `backend/app/Services/SpcCalculator.php`; controller: `backend/app/Http/Controllers/SpcController.php`.
- Tests: `backend/tests/Unit/SpcCalculatorTest.php` and `backend/tests/Feature/SpcTest.php`.

The application still has no authentication or project ownership. Project scoping does not isolate records between users. Do not expose it as a public multi-user service before authentication, authorization, and ownership policies are implemented and verified.
