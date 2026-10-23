# Demand forecasting model

Forecasting is a synchronous project analysis. The form accepts one non-negative actual value per regularly spaced daily, ISO-weekly, or monthly period, a forecast horizon, and one or more methods. Historical periods must be valid, unique, and contiguous. A selected project's `analysis_runs` relation stores the normalized input and calculated output in a transaction. The route that reopens an analysis is scoped to the owning project.

## Methods

Let `y_t` denote the actual value at period `t`, with time indices starting at zero.

- **Naive:** every next forecast equals the latest observed value.
- **Moving Average:** the next forecast is the arithmetic mean of the most recent `k` values. Multi-period forecasts append each forecast and calculate recursively.
- **Weighted Moving Average:** multiplies the last `k` values by user weights ordered oldest to newest. Weights must be non-negative and sum to one within `1e-8`. Multi-period forecasts are recursive.
- **Single Exponential Smoothing:** starts the level at the first actual, then computes `L_t = alpha*y_t + (1-alpha)*L_(t-1)`. The next forecast is the final level. Alpha is in `[0, 1]`.
- **Linear Trend Projection:** ordinary least-squares line `y_hat_t = intercept + slope*t` fitted to all training observations; the first future index is the number of training observations.

## Evaluation and outputs

The last `max(1, floor(20% of history))` observations are held out. For each holdout period, each model is refit using only observations before that period (rolling origin). All methods that meet their minimum training size are compared over the same holdout periods. The recommendation is the eligible method with lowest MAE; it describes the displayed historical holdout and is not a guarantee of future accuracy.

MAE is mean absolute error; MSE is mean squared error; RMSE is the square root of MSE; MAPE is mean absolute percentage error in percent. MAPE is unavailable when any actual in the evaluation range is zero. Actual values cannot be negative. Non-finite inputs, projections, and core error metrics are rejected rather than persisted. Period labels are `YYYY-MM-DD`, ISO `YYYY-Www`, or `YYYY-MM` for daily, weekly, or monthly intervals respectively.

The entered unit applies uniformly to every actual and forecast. The model assumes equally spaced, comparable observations and has no seasonality, external regressors, intermittent-demand treatment, confidence intervals, or automatic parameter tuning. Choose a horizon and method parameters appropriate to the process; inspect the holdout results before using a projection for operational decisions.

## Using and locating the module

Open a project and choose **Jalankan Forecasting**. Enter the same unit for the whole series, select the sampling interval, and add consecutive periods in the corresponding format. Remove unused rows. Choose methods to compare and review their window, weight, or alpha parameters. A method that lacks enough training points is marked unavailable instead of receiving a fabricated score. Saved analyses remain available from project history.

The routes are `GET`/`POST /projects/{project}/forecasting` and `GET /projects/{project}/analyses/{analysisRun}`. Core files are `backend/app/Http/Controllers/ForecastingController.php`, `backend/app/Services/ForecastingCalculator.php`, `backend/resources/js/pages/forecasting/create.tsx`, `backend/resources/js/pages/forecasting/show.tsx`, and `backend/tests/Unit/ForecastingCalculatorTest.php` plus `backend/tests/Feature/AnalysisRunsTest.php`. Run the full suite from `backend/` with `composer run test`; the focused tests can be run with `vendor/bin/pest tests/Unit/ForecastingCalculatorTest.php` and `vendor/bin/pest tests/Feature/AnalysisRunsTest.php`.

## Reproducible example

For monthly actuals `10, 20, 30, 40, 50` from `2025-01` through `2025-05`, with a one-period horizon, moving-average window `3`, WMA weights `[0.1, 0.2, 0.7]`, and SES alpha `0.5`, the holdout is the final one period (`2025-05`) and training uses the first four values. Holdout forecasts are: Naive `40`, Moving Average `30`, Weighted Moving Average `36`, SES `31.25`, and Linear Trend `50`. Since there is one evaluation point, each method's MAE and RMSE equal its absolute error (`10`, `20`, `14`, `18.75`, `0` respectively), MSE is the square of that error, and Linear Trend has the lowest MAE. MAPE is respectively `20%`, `40%`, `28%`, `37.5%`, and `0%`. Using all five observations for the next-period projection yields Naive `50`, Moving Average `40`, Weighted Moving Average `46`, SES `40.625`, and Linear Trend `60`.

## Remaining modules and deployment boundary

MRP and SPC are not implemented. MRP master data must not be treated as separated by project until ownership and authorization are added. The application currently has no authentication or authorization, so saved records are not isolated between users and the application is not safe for public deployment.
