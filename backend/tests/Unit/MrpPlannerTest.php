<?php

use App\Services\MrpPlanner;

function mrpItem(int $id, array $overrides = []): array
{
    return array_replace([
        'id' => $id,
        'project_id' => 1,
        'code' => 'ITEM-'.$id,
        'name' => 'Item '.$id,
        'unit' => 'unit',
        'lead_time_periods' => 0,
        'initial_on_hand' => 0.0,
        'lot_sizing_policy' => 'lot_for_lot',
        'fixed_order_quantity' => null,
    ], $overrides);
}

test('it explodes multilevel BOM demand from parent planned releases and nets scheduled receipts', function () {
    $result = (new MrpPlanner)->calculate(
        3,
        [
            mrpItem(1, ['code' => 'A', 'lead_time_periods' => 1]),
            mrpItem(2, ['code' => 'B']),
            mrpItem(3, ['code' => 'C', 'lot_sizing_policy' => 'fixed_order_quantity', 'fixed_order_quantity' => 10]),
        ],
        [
            ['parent_item_id' => 1, 'component_item_id' => 2, 'quantity_per' => 2],
            ['parent_item_id' => 2, 'component_item_id' => 3, 'quantity_per' => 3],
        ],
        [['item_id' => 1, 'period' => 'P2', 'quantity' => 5]],
        [['item_id' => 1, 'period' => 'P2', 'quantity' => 2]],
    );
    $records = [];
    foreach ($result['records'] as $record) {
        $records[$record['item']['id']] = $record;
    }

    expect($records[1]['periods'][1]['net_requirements'])->toBe(3.0)
        ->and($records[1]['periods'][0]['planned_order_releases'])->toBe(3.0)
        ->and($records[2]['periods'][0]['gross_requirements'])->toBe(6.0)
        ->and($records[2]['periods'][0]['planned_order_receipts'])->toBe(6.0)
        ->and($records[3]['periods'][0]['gross_requirements'])->toBe(18.0)
        ->and($records[3]['periods'][0]['planned_order_receipts'])->toBe(20.0)
        ->and($records[3]['periods'][0]['projected_on_hand'])->toBe(2.0)
        ->and($records[3]['periods'][0]['planned_order_releases'])->toBe(20.0);
});

test('it applies lot for lot and fixed order quantity policies', function () {
    $items = [
        mrpItem(1),
        mrpItem(2, ['lot_sizing_policy' => 'fixed_order_quantity', 'fixed_order_quantity' => 10]),
    ];
    $mps = [
        ['item_id' => 1, 'period' => 'P1', 'quantity' => 12],
        ['item_id' => 2, 'period' => 'P1', 'quantity' => 12],
        ['item_id' => 2, 'period' => 'P2', 'quantity' => 2],
    ];
    $result = (new MrpPlanner)->calculate(2, $items, [], $mps, []);
    $records = [];
    foreach ($result['records'] as $record) {
        $records[$record['item']['id']] = $record;
    }

    expect($records[1]['periods'][0]['planned_order_receipts'])->toBe(12.0)
        ->and($records[2]['periods'][0]['planned_order_receipts'])->toBe(20.0)
        ->and($records[2]['periods'][0]['projected_on_hand'])->toBe(8.0)
        ->and($records[2]['periods'][1]['net_requirements'])->toBe(0.0)
        ->and($records[2]['periods'][1]['projected_on_hand'])->toBe(6.0);
});

test('it warns about planned orders and component needs that fall before the horizon', function () {
    $result = (new MrpPlanner)->calculate(
        2,
        [mrpItem(1, ['code' => 'P', 'lead_time_periods' => 2]), mrpItem(2, ['code' => 'C'])],
        [['parent_item_id' => 1, 'component_item_id' => 2, 'quantity_per' => 4]],
        [['item_id' => 1, 'period' => 'P1', 'quantity' => 3]],
        [],
    );

    expect($result['records'][0]['periods'][0]['planned_order_receipts'])->toBe(3.0)
        ->and($result['records'][0]['periods'][0]['planned_order_releases'])->toBe(0.0)
        ->and($result['warnings'])->toHaveCount(2)
        ->and($result['warnings'][0]['type'])->toBe('release_before_horizon')
        ->and($result['warnings'][1]['type'])->toBe('component_requirement_before_horizon');
});

test('it rejects cyclic BOMs cross project BOMs invalid periods and non-finite totals', function (callable $operation) {
    expect($operation)->toThrow(InvalidArgumentException::class);
})->with([
    'cycle' => [fn () => (new MrpPlanner)->calculate(2, [mrpItem(1), mrpItem(2)], [
        ['parent_item_id' => 1, 'component_item_id' => 2, 'quantity_per' => 1],
        ['parent_item_id' => 2, 'component_item_id' => 1, 'quantity_per' => 1],
    ], [['item_id' => 1, 'period' => 'P1', 'quantity' => 1]], [])],
    'cross project' => [fn () => (new MrpPlanner)->calculate(2, [mrpItem(1), mrpItem(2, ['project_id' => 2])], [
        ['parent_item_id' => 1, 'component_item_id' => 2, 'quantity_per' => 1],
    ], [['item_id' => 1, 'period' => 'P1', 'quantity' => 1]], [])],
    'period outside horizon' => [fn () => (new MrpPlanner)->calculate(2, [mrpItem(1)], [], [['item_id' => 1, 'period' => 'P3', 'quantity' => 1]], [])],
    'infinite demand' => [fn () => (new MrpPlanner)->calculate(2, [mrpItem(1)], [], [['item_id' => 1, 'period' => 'P1', 'quantity' => INF]], [])],
]);

test('it rejects fixed quantity rounding overflow', function () {
    expect(fn () => (new MrpPlanner)->calculate(
        1,
        [mrpItem(1, ['lot_sizing_policy' => 'fixed_order_quantity', 'fixed_order_quantity' => 1.0e-308])],
        [],
        [['item_id' => 1, 'period' => 'P1', 'quantity' => 1.0e308]],
        [],
    ))->toThrow(InvalidArgumentException::class);
});
