<?php

use App\Services\EoqCalculator;

test('it calculates the classical EOQ and annual costs', function () {
    $result = (new EoqCalculator)->calculate(12_000, 50, 2.5);

    expect(abs($result['eoq'] - sqrt(480_000)))->toBeLessThan(1.0e-10)
        ->and(abs($result['orders_per_year'] - (12_000 / sqrt(480_000))))->toBeLessThan(1.0e-10)
        ->and(abs($result['interval_days'] - (365 / $result['orders_per_year'])))->toBeLessThan(1.0e-10)
        ->and(abs($result['annual_ordering_cost'] - $result['annual_holding_cost']))->toBeLessThan(1.0e-9)
        ->and(abs($result['total_relevant_cost'] - ($result['annual_ordering_cost'] + $result['annual_holding_cost'])))->toBeLessThan(1.0e-9)
        ->and($result['chart'])->toHaveCount(49);
});

test('it rejects zero and negative input values', function (float $demand, float $orderCost, float $holdingCost) {
    expect(fn () => (new EoqCalculator)->calculate($demand, $orderCost, $holdingCost))
        ->toThrow(InvalidArgumentException::class);
})->with([
    'zero demand' => [0, 10, 2],
    'negative demand' => [-1, 10, 2],
    'zero order cost' => [100, 0, 2],
    'negative order cost' => [100, -1, 2],
    'zero holding cost' => [100, 10, 0],
    'negative holding cost' => [100, 10, -1],
    'infinite demand' => [INF, 10, 2],
    'not a number demand' => [NAN, 10, 2],
]);

test('it supports small and large finite inputs', function (float $demand, float $orderCost, float $holdingCost) {
    $result = (new EoqCalculator)->calculate($demand, $orderCost, $holdingCost);

    expect(is_finite($result['eoq']))->toBeTrue()
        ->and($result['eoq'])->toBeGreaterThan(0)
        ->and(is_finite($result['total_relevant_cost']))->toBeTrue()
        ->and($result['total_relevant_cost'])->toBeGreaterThan(0);
})->with([
    'small scale' => [1.0e-6, 1.0e-4, 1.0e-2],
    'large scale' => [1.0e12, 1.0e9, 1.0e4],
]);

test('it rejects finite inputs whose derived values exceed the numeric range', function () {
    expect(fn () => (new EoqCalculator)->calculate(1.0e308, 1.0e308, 1.0e-308))
        ->toThrow(InvalidArgumentException::class);
});

test('total relevant cost is minimized around the EOQ', function () {
    $calculator = new EoqCalculator;
    $result = $calculator->calculate(12_000, 50, 2.5);
    $below = $calculator->calculate(12_000, 50, 2.5, $result['eoq'] * 0.99)['comparison']['total_cost'];
    $above = $calculator->calculate(12_000, 50, 2.5, $result['eoq'] * 1.01)['comparison']['total_cost'];

    expect(abs($result['eoq'] - sqrt(480_000)))->toBeLessThan(1.0e-10)
        ->and($below)->toBeGreaterThan($result['total_relevant_cost'])
        ->and($above)->toBeGreaterThan($result['total_relevant_cost']);
});
