<?php

namespace App\Services;

use InvalidArgumentException;

class MrpPlanner
{
    /** @param list<int> $itemIds
     * @param  list<array{parent_item_id: int, component_item_id: int, quantity_per: int|float|string}>  $bom
     */
    public function assertAcyclic(array $itemIds, array $bom): void
    {
        $children = array_fill_keys($itemIds, []);
        $indegree = array_fill_keys($itemIds, 0);
        $seenEdges = [];

        foreach ($bom as $line) {
            $parentId = (int) $line['parent_item_id'];
            $componentId = (int) $line['component_item_id'];
            if (! array_key_exists($parentId, $children) || ! array_key_exists($componentId, $children) || $parentId === $componentId) {
                throw new InvalidArgumentException('Setiap baris BOM harus menghubungkan dua item berbeda dalam proyek yang sama.');
            }

            $edgeKey = $parentId.':'.$componentId;
            if (isset($seenEdges[$edgeKey])) {
                throw new InvalidArgumentException('Setiap pasangan item induk dan komponen hanya boleh memiliki satu baris BOM.');
            }
            $seenEdges[$edgeKey] = true;

            $children[$parentId][] = $componentId;
            $indegree[$componentId]++;
        }

        $queue = [];
        foreach ($indegree as $itemId => $degree) {
            if ($degree === 0) {
                $queue[] = $itemId;
            }
        }

        $visited = 0;
        while ($queue !== []) {
            $itemId = array_shift($queue);
            $visited++;
            foreach ($children[$itemId] as $componentId) {
                $indegree[$componentId]--;
                if ($indegree[$componentId] === 0) {
                    $queue[] = $componentId;
                }
            }
        }

        if ($visited !== count($itemIds)) {
            throw new InvalidArgumentException('BOM tidak boleh membentuk siklus.');
        }
    }

    /**
     * @param  list<array{id: int, project_id?: int, code: string, name: string, unit: string, lead_time_periods: int, initial_on_hand: int|float|string, lot_sizing_policy: string, fixed_order_quantity: int|float|string|null}>  $items
     * @param  list<array{parent_item_id: int, component_item_id: int, quantity_per: int|float|string}>  $bom
     * @param  list<array{item_id: int, period: string, quantity: int|float|string}>  $mps
     * @param  list<array{item_id: int, period: string, quantity: int|float|string}>  $scheduledReceipts
     * @return array<string, mixed>
     */
    public function calculate(int $horizon, array $items, array $bom, array $mps, array $scheduledReceipts): array
    {
        if ($horizon < 1 || $horizon > 36 || $items === [] || count($items) > 200 || count($bom) > 1000) {
            throw new InvalidArgumentException('Horizon harus 1 sampai 36 periode; proyek harus memiliki 1 sampai 200 item dan maksimal 1.000 baris BOM.');
        }

        $itemIds = array_map(static fn (array $item): int => (int) $item['id'], $items);
        if (count(array_unique($itemIds)) !== count($itemIds)) {
            throw new InvalidArgumentException('Data item mengandung ID duplikat.');
        }
        $itemsById = [];
        foreach ($items as $item) {
            $this->assertFiniteNonNegative((float) $item['initial_on_hand'], 'Persediaan awal');
            if ((int) $item['lead_time_periods'] < 0) {
                throw new InvalidArgumentException('Lead time tidak boleh negatif.');
            }
            if ($item['lot_sizing_policy'] === 'fixed_order_quantity') {
                $fixedQuantity = (float) $item['fixed_order_quantity'];
                if (! is_finite($fixedQuantity) || $fixedQuantity <= 0) {
                    throw new InvalidArgumentException('Fixed Order Quantity harus berupa angka hingga yang lebih besar dari nol.');
                }
            } elseif ($item['lot_sizing_policy'] !== 'lot_for_lot') {
                throw new InvalidArgumentException('Aturan lot sizing tidak dikenal.');
            }
            $itemsById[(int) $item['id']] = $item;
        }

        $this->assertAcyclic($itemIds, $bom);
        $periods = array_map(static fn (int $period): string => 'P'.$period, range(1, $horizon));
        $gross = array_fill_keys($itemIds, array_fill(0, $horizon, 0.0));
        $scheduled = array_fill_keys($itemIds, array_fill(0, $horizon, 0.0));

        foreach ($mps as $row) {
            $this->addRequirement($gross, $row, $horizon, $itemsById, 'Master Production Schedule');
        }
        foreach ($scheduledReceipts as $row) {
            $this->addRequirement($scheduled, $row, $horizon, $itemsById, 'Scheduled receipt');
        }

        $bomByParent = [];
        foreach ($bom as $line) {
            $parentId = (int) $line['parent_item_id'];
            $componentId = (int) $line['component_item_id'];
            $quantityPer = (float) $line['quantity_per'];
            $this->assertFiniteNonNegative($quantityPer, 'Kuantitas BOM');
            if ($quantityPer <= 0) {
                throw new InvalidArgumentException('Kuantitas BOM harus lebih besar dari nol.');
            }
            if (isset($itemsById[$parentId]['project_id'], $itemsById[$componentId]['project_id']) && $itemsById[$parentId]['project_id'] !== $itemsById[$componentId]['project_id']) {
                throw new InvalidArgumentException('BOM tidak boleh menghubungkan item dari proyek berbeda.');
            }
            $bomByParent[$parentId][] = ['component_item_id' => $componentId, 'quantity_per' => $quantityPer];
        }

        $orderedIds = $this->topologicalOrder($itemIds, $bom);
        $records = [];
        $warnings = [];

        foreach ($orderedIds as $itemId) {
            $item = $itemsById[$itemId];
            $projectedOnHand = (float) $item['initial_on_hand'];
            $plannedReleases = array_fill(0, $horizon, 0.0);
            $preHorizonReleases = [];
            $periodRows = [];

            for ($periodIndex = 0; $periodIndex < $horizon; $periodIndex++) {
                $grossRequirement = $gross[$itemId][$periodIndex];
                $scheduledReceipt = $scheduled[$itemId][$periodIndex];
                $availableBeforeOrder = $projectedOnHand + $scheduledReceipt - $grossRequirement;
                $netRequirement = max(0.0, -$availableBeforeOrder);
                $plannedReceipt = $this->lotSize($item, $netRequirement);
                $projectedOnHand = $availableBeforeOrder + $plannedReceipt;
                $this->assertFiniteNonNegative($plannedReceipt, 'Planned order receipt');
                if (! is_finite($projectedOnHand)) {
                    throw new InvalidArgumentException('Projected on-hand melampaui rentang angka yang didukung.');
                }

                if ($plannedReceipt > 0) {
                    $releaseIndex = $periodIndex - (int) $item['lead_time_periods'];
                    if ($releaseIndex < 0) {
                        $preHorizonReleases[] = [
                            'receipt_period' => $periods[$periodIndex],
                            'release_offset' => $releaseIndex,
                            'quantity' => $plannedReceipt,
                        ];
                        $warnings[] = [
                            'type' => 'release_before_horizon',
                            'item_code' => $item['code'],
                            'item_name' => $item['name'],
                            'receipt_period' => $periods[$periodIndex],
                            'lead_time_periods' => (int) $item['lead_time_periods'],
                            'quantity' => $plannedReceipt,
                            'message' => "Order {$item['code']} untuk penerimaan {$periods[$periodIndex]} harus dilepas sebelum awal horizon.",
                        ];
                    } else {
                        $plannedReleases[$releaseIndex] += $plannedReceipt;
                    }
                }

                $periodRows[] = [
                    'period' => $periods[$periodIndex],
                    'gross_requirements' => $grossRequirement,
                    'scheduled_receipts' => $scheduledReceipt,
                    'projected_on_hand' => $projectedOnHand,
                    'net_requirements' => $netRequirement,
                    'planned_order_receipts' => $plannedReceipt,
                    'planned_order_releases' => $plannedReleases[$periodIndex],
                ];
            }

            foreach ($periodRows as $periodIndex => &$periodRow) {
                $periodRow['planned_order_releases'] = $plannedReleases[$periodIndex];
            }
            unset($periodRow);

            $records[$itemId] = [
                'item' => [
                    'id' => $itemId,
                    'code' => $item['code'],
                    'name' => $item['name'],
                    'unit' => $item['unit'],
                    'lead_time_periods' => (int) $item['lead_time_periods'],
                    'initial_on_hand' => (float) $item['initial_on_hand'],
                    'lot_sizing_policy' => $item['lot_sizing_policy'],
                    'fixed_order_quantity' => $item['fixed_order_quantity'] === null ? null : (float) $item['fixed_order_quantity'],
                ],
                'periods' => $periodRows,
            ];

            foreach ($bomByParent[$itemId] ?? [] as $line) {
                $componentId = $line['component_item_id'];
                foreach ($plannedReleases as $periodIndex => $releaseQuantity) {
                    if ($releaseQuantity <= 0) {
                        continue;
                    }
                    $componentGross = $releaseQuantity * $line['quantity_per'];
                    if (! is_finite($componentGross)) {
                        throw new InvalidArgumentException('Gross requirement komponen melampaui rentang angka yang didukung.');
                    }
                    $gross[$componentId][$periodIndex] += $componentGross;
                }
                foreach ($preHorizonReleases as $release) {
                    $componentGross = $release['quantity'] * $line['quantity_per'];
                    if (! is_finite($componentGross)) {
                        throw new InvalidArgumentException('Gross requirement sebelum horizon melampaui rentang angka yang didukung.');
                    }
                    $warnings[] = [
                        'type' => 'component_requirement_before_horizon',
                        'item_code' => $itemsById[$componentId]['code'],
                        'item_name' => $itemsById[$componentId]['name'],
                        'parent_code' => $item['code'],
                        'release_offset' => $release['release_offset'],
                        'quantity' => $componentGross,
                        'message' => "Komponen {$itemsById[$componentId]['code']} dibutuhkan {$componentGross} {$itemsById[$componentId]['unit']} sebelum horizon untuk order {$item['code']}.",
                    ];
                }
            }
        }

        return [
            'periods' => $periods,
            'records' => array_values($records),
            'warnings' => $warnings,
            'lot_sizing_notes' => [
                'lot_for_lot' => 'Planned order receipt sama dengan net requirement pada setiap periode.',
                'fixed_order_quantity' => 'Planned order receipt dibulatkan ke kelipatan Fixed Order Quantity terkecil yang memenuhi net requirement; sisa masuk projected on-hand.',
            ],
            'lead_time_note' => 'Lead time dihitung dalam bucket periode yang sama. Release di luar awal horizon ditampilkan sebagai peringatan dan tidak disembunyikan.',
        ];
    }

    /** @param array<int, array<int, float>> $requirements
     * @param  array{item_id: int, period: string, quantity: int|float|string}  $row
     * @param  array<int, array<string, mixed>>  $itemsById
     */
    private function addRequirement(array &$requirements, array $row, int $horizon, array $itemsById, string $label): void
    {
        $itemId = (int) $row['item_id'];
        $period = (string) $row['period'];
        $quantity = (float) $row['quantity'];
        $periodIndex = preg_match('/^P([1-9]\d*)$/', $period, $matches) === 1 ? (int) $matches[1] - 1 : -1;
        if (! isset($itemsById[$itemId]) || $periodIndex < 0 || $periodIndex >= $horizon) {
            throw new InvalidArgumentException("{$label} harus memakai item dan periode dalam horizon yang dipilih.");
        }
        $this->assertFiniteNonNegative($quantity, $label);
        $requirements[$itemId][$periodIndex] += $quantity;
        if (! is_finite($requirements[$itemId][$periodIndex])) {
            throw new InvalidArgumentException("{$label} gabungan melampaui rentang angka yang didukung.");
        }
    }

    /** @param array<string, mixed> $item */
    private function lotSize(array $item, float $netRequirement): float
    {
        if ($netRequirement <= 0) {
            return 0.0;
        }

        if ($item['lot_sizing_policy'] === 'lot_for_lot') {
            return $netRequirement;
        }

        $fixedQuantity = (float) $item['fixed_order_quantity'];
        $orderQuantity = ceil($netRequirement / $fixedQuantity) * $fixedQuantity;
        if (! is_finite($orderQuantity)) {
            throw new InvalidArgumentException('Fixed Order Quantity menghasilkan planned order di luar rentang numerik.');
        }

        return $orderQuantity;
    }

    /** @param list<int> $itemIds
     * @param  list<array{parent_item_id: int, component_item_id: int, quantity_per: int|float|string}>  $bom
     * @return list<int>
     */
    private function topologicalOrder(array $itemIds, array $bom): array
    {
        $children = array_fill_keys($itemIds, []);
        $indegree = array_fill_keys($itemIds, 0);
        foreach ($bom as $line) {
            $parentId = (int) $line['parent_item_id'];
            $componentId = (int) $line['component_item_id'];
            $children[$parentId][] = $componentId;
            $indegree[$componentId]++;
        }

        $queue = [];
        foreach ($indegree as $itemId => $degree) {
            if ($degree === 0) {
                $queue[] = $itemId;
            }
        }
        $ordered = [];
        while ($queue !== []) {
            $itemId = array_shift($queue);
            $ordered[] = $itemId;
            foreach ($children[$itemId] as $componentId) {
                $indegree[$componentId]--;
                if ($indegree[$componentId] === 0) {
                    $queue[] = $componentId;
                }
            }
        }
        if (count($ordered) !== count($itemIds)) {
            throw new InvalidArgumentException('BOM tidak boleh membentuk siklus.');
        }

        return $ordered;
    }

    private function assertFiniteNonNegative(float $value, string $label): void
    {
        if (! is_finite($value) || $value < 0) {
            throw new InvalidArgumentException("{$label} harus berupa angka hingga dan tidak negatif.");
        }
    }
}
