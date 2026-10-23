<?php

use App\Services\ForecastingCalculator;

function forecastingInput(array $overrides = []): array
{
    return array_replace([
        'analysis_name' => 'Test',
        'unit' => 'unit',
        'interval' => 'monthly',
        'history' => [
            ['period' => '2025-01', 'actual' => 10],
            ['period' => '2025-02', 'actual' => 20],
            ['period' => '2025-03', 'actual' => 30],
            ['period' => '2025-04', 'actual' => 40],
            ['period' => '2025-05', 'actual' => 50],
            ['period' => '2025-06', 'actual' => 60],
            ['period' => '2025-07', 'actual' => 70],
            ['period' => '2025-08', 'actual' => 80],
            ['period' => '2025-09', 'actual' => 90],
            ['period' => '2025-10', 'actual' => 100],
        ],
        'horizon' => 2,
        'methods' => ['naive', 'moving_average', 'weighted_moving_average', 'single_exponential_smoothing', 'linear_trend'],
        'moving_average_window' => 3,
        'weighted_moving_average_weights' => [0.2, 0.3, 0.5],
        'alpha' => 0.5,
    ], $overrides);
}

test('it evaluates methods on the same rolling holdout and produces multi step projections', function () {
    $result = (new ForecastingCalculator)->calculate(forecastingInput());

    expect($result['evaluation']['holdout_count'])->toBe(2)
        ->and($result['evaluation']['training_count'])->toBe(8)
        ->and($result['evaluation']['periods'])->toBe(['2025-09', '2025-10'])
        ->and($result['evaluation']['rows']['naive'][0]['forecast'])->toBe(80.0)
        ->and($result['projections']['naive'])->toBe([
            ['period' => '2025-11', 'forecast' => 100.0],
            ['period' => '2025-12', 'forecast' => 100.0],
        ])
        ->and($result['methods']['linear_trend']['metrics']['mae'])->toBe(0.0)
        ->and($result['recommended_method'])->toBe('linear_trend');
});

test('it applies methods with correct time weighting and trend slope', function () {
    $inputs = forecastingInput([
        'history' => array_slice(forecastingInput()['history'], 0, 5),
        'methods' => ['naive', 'moving_average', 'weighted_moving_average', 'single_exponential_smoothing', 'linear_trend'],
        'weighted_moving_average_weights' => [0.1, 0.2, 0.7],
    ]);
    $result = (new ForecastingCalculator)->calculate($inputs);

    expect($result['projections']['naive'][0]['forecast'])->toBe(50.0)
        ->and($result['projections']['moving_average'][0]['forecast'])->toBe(40.0)
        ->and($result['projections']['weighted_moving_average'][0]['forecast'])->toBe(46.0)
        ->and($result['projections']['weighted_moving_average'][1]['forecast'])
        ->toBeGreaterThan(46.2 - 1.0e-9)
        ->toBeLessThan(46.2 + 1.0e-9)
        ->and($result['projections']['single_exponential_smoothing'][0]['forecast'])->toBe(40.625)
        ->and($result['projections']['linear_trend'][0]['forecast'])->toBe(60.0)
        ->and($result['projections']['linear_trend'][1]['forecast'])->toBe(70.0);
});

test('it accepts ISO week continuity including year boundaries', function () {
    $input = forecastingInput([
        'interval' => 'weekly',
        'history' => [
            ['period' => '2025-W51', 'actual' => 1], ['period' => '2025-W52', 'actual' => 2],
            ['period' => '2026-W01', 'actual' => 3], ['period' => '2026-W02', 'actual' => 4],
            ['period' => '2026-W03', 'actual' => 5],
        ],
        'methods' => ['naive'],
    ]);

    expect((new ForecastingCalculator)->calculate($input)['projections']['naive'][0]['period'])->toBe('2026-W04');
});

test('it reports a method unavailable when training data is insufficient', function () {
    $input = forecastingInput([
        'history' => array_slice(forecastingInput()['history'], 0, 4),
        'methods' => ['moving_average'],
        'moving_average_window' => 5,
    ]);
    $result = (new ForecastingCalculator)->calculate($input);

    expect($result['methods']['moving_average']['forecast_available'])->toBeFalse()
        ->and($result['methods']['moving_average']['metrics'])->toBeNull()
        ->and($result['methods']['moving_average']['reason'])->toContain('belum cukup')
        ->and($result['recommended_method'])->toBeNull();
});

test('it rejects duplicate periods', function () {
    $history = forecastingInput()['history'];
    $history[1]['period'] = $history[0]['period'];

    expect(fn () => (new ForecastingCalculator)->calculate(forecastingInput(['history' => $history])))
        ->toThrow(InvalidArgumentException::class);
});

test('it rejects invalid selected method parameters even when data is insufficient', function () {
    $inputs = forecastingInput([
        'history' => array_slice(forecastingInput()['history'], 0, 3),
        'methods' => ['weighted_moving_average'],
        'weighted_moving_average_weights' => [0.5, 0.5, 1.0, 1.0],
    ]);

    expect(fn () => (new ForecastingCalculator)->calculate($inputs))
        ->toThrow(InvalidArgumentException::class);
});

test('it rejects gaps malformed periods negative values and invalid weights', function (array $input) {
    expect(fn () => (new ForecastingCalculator)->calculate($input))->toThrow(InvalidArgumentException::class);
})->with([
    'gap' => [forecastingInput(['history' => [
        ['period' => '2025-01', 'actual' => 1], ['period' => '2025-02', 'actual' => 2],
        ['period' => '2025-04', 'actual' => 3], ['period' => '2025-05', 'actual' => 4],
    ]])],
    'malformed date' => [forecastingInput(['history' => array_replace(forecastingInput()['history'], [0 => ['period' => '2025-13', 'actual' => 1]])])],
    'negative actual' => [forecastingInput(['history' => array_replace(forecastingInput()['history'], [0 => ['period' => '2025-01', 'actual' => -1]])])],
    'weights do not sum to one' => [forecastingInput(['weighted_moving_average_weights' => [0.2, 0.2, 0.2]])],
    'non-finite actual' => [forecastingInput(['history' => array_replace(forecastingInput()['history'], [0 => ['period' => '2025-01', 'actual' => INF]])])],
]);

test('it leaves MAPE unavailable when an evaluation actual is zero', function () {
    $input = forecastingInput(['history' => [
        ['period' => '2025-01', 'actual' => 1], ['period' => '2025-02', 'actual' => 2],
        ['period' => '2025-03', 'actual' => 3], ['period' => '2025-04', 'actual' => 4],
        ['period' => '2025-05', 'actual' => 5], ['period' => '2025-06', 'actual' => 0],
    ], 'methods' => ['naive']]);
    $metrics = (new ForecastingCalculator)->calculate($input)['methods']['naive']['metrics'];

    expect($metrics['mape'])->toBeNull()
        ->and($metrics['mape_reason'])->toContain('aktual nol');
});
