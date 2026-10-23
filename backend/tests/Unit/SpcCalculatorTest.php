<?php

use App\Services\SpcCalculator;

test('it calculates I-MR and X-bar R limits with subgroup-size constants', function () {
    $calculator = new SpcCalculator;
    $imr = $calculator->calculate(['chart_type' => 'imr', 'observations' => [10, 12, 11, 13]]);
    expect($imr['charts'][0]['center_line'])->toBe(11.5)
        ->and($imr['charts'][0]['ucl'])->toBe(11.5 + 2.66 * (2 + 1 + 2) / 3)
        ->and($imr['charts'][1]['points'][0]['value'])->toBe(2.0)
        ->and($imr['charts'][1]['ucl'])->toBe(3.267 * (5 / 3));

    $xbar = $calculator->calculate([
        'chart_type' => 'xbar_r',
        'subgroups' => [[10, 12, 11, 13], [11, 12, 12, 14], [9, 10, 11, 12]],
    ]);
    $grandMean = (11.5 + 12.25 + 10.5) / 3;
    expect($xbar['charts'][0]['center_line'])->toBe($grandMean)
        ->and($xbar['charts'][0]['ucl'])->toBe($grandMean + 0.729 * 3)
        ->and($xbar['charts'][1]['center_line'])->toBe(3.0)
        ->and($xbar['charts'][1]['ucl'])->toBe(2.282 * 3);
});

test('it calculates p np c and u charts using their own denominators', function () {
    $calculator = new SpcCalculator;
    $p = $calculator->calculate(['chart_type' => 'p', 'observations' => [
        ['defects' => 2, 'sample_size' => 100], ['defects' => 4, 'sample_size' => 200],
    ]]);
    expect($p['charts'][0]['points'][0]['cl'])->toBe(0.02)
        ->and($p['charts'][0]['points'][0]['ucl'])->toBeGreaterThan($p['charts'][0]['points'][1]['ucl']);

    $np = $calculator->calculate(['chart_type' => 'np', 'observations' => [
        ['defects' => 2, 'sample_size' => 100], ['defects' => 4, 'sample_size' => 100],
    ]]);
    expect($np['charts'][0]['points'][0]['cl'])->toBe(3.0);

    $c = $calculator->calculate(['chart_type' => 'c', 'observations' => [2, 4, 3]]);
    expect($c['charts'][0]['center_line'])->toBe(3.0)
        ->and($c['charts'][0]['points'][0]['lcl'])->toBe(0.0);

    $u = $calculator->calculate(['chart_type' => 'u', 'observations' => [
        ['defects' => 4, 'opportunities' => 100], ['defects' => 6, 'opportunities' => 200],
    ]]);
    expect($u['charts'][0]['points'][0]['cl'])->toBe(10 / 300)
        ->and($u['charts'][0]['points'][0]['ucl'])->toBeGreaterThan($u['charts'][0]['points'][1]['ucl']);
});

test('it rejects invalid data assumptions and keeps zero-variation output finite', function () {
    $calculator = new SpcCalculator;
    expect(fn () => $calculator->calculate(['chart_type' => 'np', 'observations' => [
        ['defects' => 1, 'sample_size' => 10], ['defects' => 2, 'sample_size' => 11],
    ]]))->toThrow(InvalidArgumentException::class, 'ukuran sampel konstan');
    expect(fn () => $calculator->calculate(['chart_type' => 'p', 'observations' => [
        ['defects' => 11, 'sample_size' => 10], ['defects' => 1, 'sample_size' => 10],
    ]]))->toThrow(InvalidArgumentException::class);
    expect(fn () => $calculator->calculate(['chart_type' => 'xbar_r', 'subgroups' => [[1, 2], [1, 2, 3]]]))->toThrow(InvalidArgumentException::class);
    expect(fn () => $calculator->calculate(['chart_type' => 'imr', 'observations' => [1, -1]]))->toThrow(InvalidArgumentException::class);

    $flat = $calculator->calculate(['chart_type' => 'imr', 'observations' => [5, 5, 5, 5]]);
    expect($flat['status'])->toBe('in_control')
        ->and($flat['charts'][0]['points'][0]['z_score'])->toBe(0.0)
        ->and($flat['nelson_violations'])->toBe([])
        ->and($flat['charts'][1]['ucl'])->toBe(0.0);
});

test('all Nelson rules detect a positive sequence and reject a neutral sequence', function () {
    $method = new ReflectionMethod(SpcCalculator::class, 'nelsonRules');
    $cases = [
        1 => [3.1],
        2 => array_fill(0, 9, 0.5),
        3 => [0, 0.1, 0.2, 0.3, 0.4, 0.5],
        4 => [0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5],
        5 => [2.1, 0, 2.2],
        6 => [1.1, 1.2, 0, 1.3, 1.4],
        7 => array_fill(0, 15, 0.2),
        8 => [1.1, -1.1, 1.2, -1.2, 1.3, -1.3, 1.4, -1.4],
    ];
    foreach ($cases as $rule => $scores) {
        $points = array_map(static fn (float $score, int $index): array => ['label' => 'P'.($index + 1), 'z_score' => $score], $scores, array_keys($scores));
        $negativeScores = match ($rule) {
            1 => [0.0],
            2 => [0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5],
            3 => array_fill(0, 6, 0.2),
            4 => array_fill(0, 14, 0.5),
            5 => [2.1, -2.1, 0.0],
            6 => [1.2, -1.2, 0.0, -1.3, 1.4],
            7 => array_fill(0, 15, 1.1),
            8 => array_fill(0, 8, 1.2),
        };
        $negative = array_map(static fn (float $score, int $index): array => ['label' => 'N'.($index + 1), 'z_score' => $score], $negativeScores, array_keys($negativeScores));
        $positiveRules = $method->invoke(new SpcCalculator, $points);
        $negativeRules = $method->invoke(new SpcCalculator, $negative);
        expect(array_column($positiveRules, 'rule'))->toContain($rule)
            ->and(array_column($negativeRules, 'rule'))->not->toContain($rule);
    }
});

test('Nelson rules skip windows shorter than their required point count', function () {
    $method = new ReflectionMethod(SpcCalculator::class, 'nelsonRules');
    $points = array_fill(0, 5, ['label' => 'P', 'z_score' => 0.2]);
    expect($method->invoke(new SpcCalculator, $points))->toBe([]);
});
