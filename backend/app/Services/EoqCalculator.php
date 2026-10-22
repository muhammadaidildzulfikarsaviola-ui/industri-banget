<?php

namespace App\Services;

use InvalidArgumentException;

class EoqCalculator
{
    private const CHART_STEPS = 48;

    /**
     * @return array{
     *     eoq: float,
     *     orders_per_year: float,
     *     interval_days: float,
     *     annual_ordering_cost: float,
     *     annual_holding_cost: float,
     *     total_relevant_cost: float,
     *     comparison: array{quantity: float, ordering_cost: float, holding_cost: float, total_cost: float}|null,
     *     chart: list<array{quantity: float, ordering_cost: float, holding_cost: float, total_cost: float}>
     * }
     */
    public function calculate(
        float $annualDemand,
        float $orderCost,
        float $annualHoldingCostPerUnit,
        ?float $comparisonQuantity = null,
    ): array {
        $this->assertPositiveFinite($annualDemand, 'Annual demand');
        $this->assertPositiveFinite($orderCost, 'Order cost');
        $this->assertPositiveFinite($annualHoldingCostPerUnit, 'Annual holding cost per unit');

        if ($comparisonQuantity !== null) {
            $this->assertPositiveFinite($comparisonQuantity, 'Comparison quantity');
        }

        $logEoq = (log(2) + log($annualDemand) + log($orderCost) - log($annualHoldingCostPerUnit)) / 2;
        $eoq = $this->safeExp($logEoq, 'EOQ is outside the supported numeric range.');
        $ordersPerYear = $this->safeExp(log($annualDemand) - log($eoq), 'Order frequency is outside the supported numeric range.');
        $intervalDays = $this->safeExp(log(365) - log($ordersPerYear), 'Order interval is outside the supported numeric range.');
        $atEoq = $this->costsAt($annualDemand, $orderCost, $annualHoldingCostPerUnit, $eoq);

        $chart = $this->chart($annualDemand, $orderCost, $annualHoldingCostPerUnit, $eoq);
        $comparison = $comparisonQuantity === null
            ? null
            : [
                'quantity' => $comparisonQuantity,
                ...$this->costsAt($annualDemand, $orderCost, $annualHoldingCostPerUnit, $comparisonQuantity),
            ];

        return [
            'eoq' => $eoq,
            'orders_per_year' => $ordersPerYear,
            'interval_days' => $intervalDays,
            'annual_ordering_cost' => $atEoq['ordering_cost'],
            'annual_holding_cost' => $atEoq['holding_cost'],
            'total_relevant_cost' => $atEoq['total_cost'],
            'comparison' => $comparison,
            'chart' => $chart,
        ];
    }

    /**
     * @return array{ordering_cost: float, holding_cost: float, total_cost: float}
     */
    private function costsAt(float $annualDemand, float $orderCost, float $holdingCostPerUnit, float $quantity): array
    {
        $orderingCost = $this->safeExp(
            log($annualDemand) + log($orderCost) - log($quantity),
            'Annual ordering cost is outside the supported numeric range.',
        );
        $holdingCost = $this->safeExp(
            log($quantity) + log($holdingCostPerUnit) - log(2),
            'Annual holding cost is outside the supported numeric range.',
        );
        $totalCost = $orderingCost + $holdingCost;

        if (! is_finite($totalCost)) {
            throw new InvalidArgumentException('Total relevant cost is outside the supported numeric range.');
        }

        return [
            'ordering_cost' => $orderingCost,
            'holding_cost' => $holdingCost,
            'total_cost' => $totalCost,
        ];
    }

    /**
     * @return list<array{quantity: float, ordering_cost: float, holding_cost: float, total_cost: float}>
     */
    private function chart(float $annualDemand, float $orderCost, float $holdingCostPerUnit, float $eoq): array
    {
        $minimumQuantity = $eoq / 4;
        $maximumQuantity = $eoq * 3;

        $this->assertPositiveFinite($minimumQuantity, 'Chart range');
        $this->assertPositiveFinite($maximumQuantity, 'Chart range');

        $points = [];
        for ($step = 0; $step <= self::CHART_STEPS; $step++) {
            $quantity = $minimumQuantity + (($maximumQuantity - $minimumQuantity) * ($step / self::CHART_STEPS));
            $costs = $this->costsAt($annualDemand, $orderCost, $holdingCostPerUnit, $quantity);
            $points[] = [
                'quantity' => $quantity,
                ...$costs,
            ];
        }

        return $points;
    }

    private function safeExp(float $logValue, string $message): float
    {
        $value = exp($logValue);

        if (! is_finite($value) || $value <= 0) {
            throw new InvalidArgumentException($message);
        }

        return $value;
    }

    private function assertPositiveFinite(float $value, string $field): void
    {
        if (! is_finite($value) || $value <= 0) {
            throw new InvalidArgumentException("{$field} must be a positive finite number.");
        }
    }
}
