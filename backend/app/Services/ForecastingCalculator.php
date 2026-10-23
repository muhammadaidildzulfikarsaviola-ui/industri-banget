<?php

namespace App\Services;

use DateTimeImmutable;
use InvalidArgumentException;

class ForecastingCalculator
{
    private const METHOD_LABELS = [
        'naive' => 'Naive Forecast',
        'moving_average' => 'Moving Average',
        'weighted_moving_average' => 'Weighted Moving Average',
        'single_exponential_smoothing' => 'Single Exponential Smoothing',
        'linear_trend' => 'Linear Trend Projection',
    ];

    /**
     * @param array{
     *     analysis_name: string,
     *     unit: string,
     *     interval: 'daily'|'weekly'|'monthly',
     *     history: list<array{period: string, actual: int|float|string}>,
     *     horizon: int,
     *     methods: list<string>,
     *     moving_average_window: int,
     *     weighted_moving_average_weights: list<int|float|string>,
     *     alpha: int|float|string
     * } $inputs
     * @return array<string, mixed>
     */
    public function calculate(array $inputs): array
    {
        $history = $this->normalizeHistory($inputs['history'], $inputs['interval']);
        $methods = array_values(array_unique($inputs['methods']));
        foreach ($methods as $method) {
            if (! array_key_exists($method, self::METHOD_LABELS)) {
                throw new InvalidArgumentException('Metode forecast tidak didukung.');
            }
        }

        if (in_array('moving_average', $methods, true) && (int) $inputs['moving_average_window'] < 1) {
            throw new InvalidArgumentException('Panjang jendela Moving Average minimal satu periode.');
        }

        if (in_array('weighted_moving_average', $methods, true)) {
            $weights = array_map('floatval', $inputs['weighted_moving_average_weights']);
            if ($weights === [] || array_any($weights, static fn (float $weight): bool => ! is_finite($weight) || $weight < 0) || abs(array_sum($weights) - 1.0) > 1.0e-8) {
                throw new InvalidArgumentException('Bobot Weighted Moving Average harus hingga, non-negatif, dan berjumlah 1.');
            }
        }

        if (in_array('single_exponential_smoothing', $methods, true)) {
            $alpha = (float) $inputs['alpha'];
            if (! is_finite($alpha) || $alpha < 0 || $alpha > 1) {
                throw new InvalidArgumentException('Alpha Single Exponential Smoothing harus berada di antara 0 dan 1.');
            }
        }

        if ($history === []) {
            throw new InvalidArgumentException('Data historis harus berisi setidaknya satu periode.');
        }

        $holdoutCount = max(1, (int) floor(count($history) * 0.2));
        $evaluationStart = count($history) - $holdoutCount;
        $actuals = array_column($history, 'actual');
        $methodResults = [];
        $projections = [];
        $evaluationRows = [];

        foreach ($methods as $method) {
            $parameters = $this->parameters($method, $inputs);
            $minimumTraining = $this->minimumTrainingSize($method, $inputs);
            $futureAvailable = count($actuals) >= $minimumTraining;
            $evaluationAvailable = $evaluationStart >= $minimumTraining;

            if ($futureAvailable) {
                $forecastValues = $this->forecast(
                    $method,
                    $actuals,
                    (int) $inputs['horizon'],
                    $inputs,
                );
                $projections[$method] = $this->periodRows(
                    $history[count($history) - 1]['period'],
                    $forecastValues,
                    $inputs['interval'],
                );
            } else {
                $projections[$method] = [];
            }

            $rows = [];
            if ($evaluationAvailable) {
                for ($index = $evaluationStart; $index < count($history); $index++) {
                    $training = array_slice($actuals, 0, $index);
                    $prediction = $this->forecast($method, $training, 1, $inputs)[0];
                    $actual = $actuals[$index];
                    $rows[] = [
                        'period' => $history[$index]['period'],
                        'actual' => $actual,
                        'forecast' => $prediction,
                        'error' => $actual - $prediction,
                    ];
                }
                $evaluationRows[$method] = $rows;
            }

            $methodResults[$method] = [
                'label' => self::METHOD_LABELS[$method],
                'parameters' => $parameters,
                'forecast_available' => $futureAvailable,
                'evaluation_available' => $evaluationAvailable,
                'reason' => ! $futureAvailable
                    ? 'Data historis belum cukup untuk menghasilkan forecast dengan parameter ini.'
                    : (! $evaluationAvailable
                        ? 'Forecast tersedia, tetapi data latih tidak cukup untuk mengevaluasi metode pada periode holdout yang sama.'
                        : null),
                'metrics' => $evaluationAvailable ? $this->metrics($rows) : null,
            ];
        }

        $recommended = $this->recommend($methodResults);

        return [
            'historical' => $history,
            'evaluation' => [
                'scheme' => 'rolling_origin_last_holdout',
                'holdout_count' => $holdoutCount,
                'training_count' => $evaluationStart,
                'periods' => array_column(array_slice($history, $evaluationStart), 'period'),
                'rows' => $evaluationRows,
                'mape_note' => 'MAPE tidak dihitung jika salah satu nilai aktual pada periode evaluasi bernilai nol.',
            ],
            'methods' => $methodResults,
            'projections' => $projections,
            'recommended_method' => $recommended,
            'interpretation' => $recommended === null
                ? 'Belum ada metode yang dapat dibandingkan pada periode evaluasi yang sama.'
                : self::METHOD_LABELS[$recommended].' memiliki MAE terendah pada holdout yang ditampilkan. Ini ringkasan historis, bukan jaminan akurasi di masa depan.',
        ];
    }

    /**
     * @param  list<array{period: string, actual: int|float|string}>  $history
     * @return list<array{period: string, actual: float}>
     */
    private function normalizeHistory(array $history, string $interval): array
    {
        $normalized = [];
        $previous = null;

        foreach ($history as $row) {
            $period = (string) $row['period'];
            $date = $this->parsePeriod($period, $interval);
            $actual = (float) $row['actual'];

            if (! is_finite($actual) || $actual < 0) {
                throw new InvalidArgumentException('Setiap nilai aktual harus berupa angka hingga dan tidak negatif.');
            }

            if ($previous instanceof DateTimeImmutable) {
                $expected = $this->shiftPeriod($previous, $interval);
                if ($date->format('Y-m-d') !== $expected->format('Y-m-d')) {
                    throw new InvalidArgumentException('Periode historis harus berurutan dan tidak boleh memiliki celah.');
                }
            }

            $normalized[] = ['period' => $period, 'actual' => $actual];
            $previous = $date;
        }

        return $normalized;
    }

    private function parsePeriod(string $period, string $interval): DateTimeImmutable
    {
        $pattern = match ($interval) {
            'daily' => '/^\d{4}-\d{2}-\d{2}$/',
            'weekly' => '/^\d{4}-W\d{2}$/',
            'monthly' => '/^\d{4}-\d{2}$/',
            default => throw new InvalidArgumentException('Interval periode tidak didukung.'),
        };

        if (preg_match($pattern, $period) !== 1) {
            throw new InvalidArgumentException('Format periode tidak sesuai dengan interval yang dipilih.');
        }

        if ($interval === 'weekly') {
            [$year, $week] = explode('-W', $period);
            $date = (new DateTimeImmutable('2000-01-03'))
                ->setISODate((int) $year, (int) $week)
                ->setTime(0, 0);
            if ($date->format('o-\\WW') !== $period) {
                throw new InvalidArgumentException('Salah satu periode historis tidak valid.');
            }

            return $date;
        }

        $format = $interval === 'daily' ? '!Y-m-d' : '!Y-m';
        $date = DateTimeImmutable::createFromFormat($format, $period);
        $errors = DateTimeImmutable::getLastErrors();
        if (! $date instanceof DateTimeImmutable || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
            throw new InvalidArgumentException('Salah satu periode historis tidak valid.');
        }

        return $date;
    }

    private function shiftPeriod(DateTimeImmutable $period, string $interval): DateTimeImmutable
    {
        return $period->modify(match ($interval) {
            'daily' => '+1 day',
            'weekly' => '+1 week',
            'monthly' => '+1 month',
            default => throw new InvalidArgumentException('Interval periode tidak didukung.'),
        });
    }

    /** @param list<float> $values
     * @return list<array{period: string, forecast: float}>
     */
    private function periodRows(string $lastPeriod, array $values, string $interval): array
    {
        $date = $this->parsePeriod($lastPeriod, $interval);
        $format = match ($interval) {
            'daily' => 'Y-m-d',
            'weekly' => 'o-\\WW',
            'monthly' => 'Y-m',
            default => throw new InvalidArgumentException('Interval periode tidak didukung.'),
        };
        $rows = [];

        foreach ($values as $value) {
            $date = $this->shiftPeriod($date, $interval);
            $rows[] = ['period' => $date->format($format), 'forecast' => $value];
        }

        return $rows;
    }

    /** @param array<string, mixed> $inputs
     * @return array{}|array{alpha: float}|array{window: int}|array{window: int, weights_oldest_to_newest: list<float>}
     */
    private function parameters(string $method, array $inputs): array
    {
        return match ($method) {
            'moving_average' => ['window' => (int) $inputs['moving_average_window']],
            'weighted_moving_average' => [
                'window' => count($inputs['weighted_moving_average_weights']),
                'weights_oldest_to_newest' => array_values(array_map('floatval', $inputs['weighted_moving_average_weights'])),
            ],
            'single_exponential_smoothing' => ['alpha' => (float) $inputs['alpha']],
            'naive', 'linear_trend' => [],
            default => throw new InvalidArgumentException('Metode forecast tidak didukung.'),
        };
    }

    /** @param array<string, mixed> $inputs */
    private function minimumTrainingSize(string $method, array $inputs): int
    {
        return match ($method) {
            'moving_average' => (int) $inputs['moving_average_window'],
            'weighted_moving_average' => count($inputs['weighted_moving_average_weights']),
            'linear_trend' => 2,
            default => 1,
        };
    }

    /** @param list<float> $history
     * @param  array<string, mixed>  $inputs
     * @return list<float>
     */
    private function forecast(string $method, array $history, int $horizon, array $inputs): array
    {
        if ($history === []) {
            throw new InvalidArgumentException('Data latih kosong untuk metode forecast yang dipilih.');
        }

        $predictions = [];
        $window = (int) $inputs['moving_average_window'];
        $weights = array_values(array_map('floatval', $inputs['weighted_moving_average_weights']));
        $alpha = (float) $inputs['alpha'];

        for ($step = 0; $step < $horizon; $step++) {
            $prediction = match ($method) {
                'naive' => (float) $history[array_key_last($history)],
                'moving_average' => $this->movingAverage($history, $window),
                'weighted_moving_average' => $this->weightedMovingAverage($history, $weights),
                'single_exponential_smoothing' => $this->exponentialSmoothing($history, $alpha),
                'linear_trend' => $this->linearTrend($history, count($history) + $step),
                default => throw new InvalidArgumentException('Metode forecast tidak didukung.'),
            };

            if (! is_finite($prediction)) {
                throw new InvalidArgumentException('Hasil forecast berada di luar rentang angka yang didukung.');
            }

            $predictions[] = $prediction;
            if (in_array($method, ['moving_average', 'weighted_moving_average'], true)) {
                $history[] = $prediction;
            }
        }

        return $predictions;
    }

    /** @param list<float> $history */
    private function movingAverage(array $history, int $window): float
    {
        if ($window < 1 || count($history) < $window) {
            throw new InvalidArgumentException('Moving Average memerlukan data latih sebanyak panjang jendela.');
        }

        return array_sum(array_slice($history, -$window)) / $window;
    }

    /** @param list<float> $history
     * @param  list<float>  $weights
     */
    private function weightedMovingAverage(array $history, array $weights): float
    {
        if ($weights === [] || count($history) < count($weights)) {
            throw new InvalidArgumentException('Weighted Moving Average memerlukan satu bobot untuk setiap periode jendela.');
        }

        $sum = array_sum($weights);
        if (abs($sum - 1.0) > 1.0e-8 || min($weights) < 0) {
            throw new InvalidArgumentException('Bobot Weighted Moving Average harus non-negatif dan berjumlah 1.');
        }

        $values = array_slice($history, -count($weights));
        $forecast = 0.0;
        foreach ($weights as $index => $weight) {
            $forecast += $values[$index] * $weight;
        }

        return $forecast;
    }

    /** @param list<float> $history */
    private function exponentialSmoothing(array $history, float $alpha): float
    {
        if (! is_finite($alpha) || $alpha < 0 || $alpha > 1) {
            throw new InvalidArgumentException('Alpha Single Exponential Smoothing harus berada di antara 0 dan 1.');
        }

        $level = (float) $history[0];
        for ($index = 1; $index < count($history); $index++) {
            $level = ($alpha * (float) $history[$index]) + ((1 - $alpha) * $level);
        }

        return $level;
    }

    /** @param list<float> $history */
    private function linearTrend(array $history, int $futureIndex): float
    {
        $count = count($history);
        if ($count < 2) {
            throw new InvalidArgumentException('Linear Trend memerlukan setidaknya dua periode historis.');
        }

        $meanX = ($count - 1) / 2;
        $meanY = array_sum($history) / $count;
        $numerator = 0.0;
        $denominator = 0.0;
        foreach ($history as $index => $value) {
            $deltaX = $index - $meanX;
            $numerator += $deltaX * ($value - $meanY);
            $denominator += $deltaX * $deltaX;
        }

        if ($denominator <= 0) {
            throw new InvalidArgumentException('Linear Trend tidak dapat menghitung variasi waktu pada data ini.');
        }

        $slope = $numerator / $denominator;
        $intercept = $meanY - ($slope * $meanX);

        return $intercept + ($slope * $futureIndex);
    }

    /** @param list<array{period: string, actual: float, forecast: float, error: float}> $rows
     * @return array{mae: float, mse: float, rmse: float, mape: float|null, mape_reason: string|null}
     */
    private function metrics(array $rows): array
    {
        $absoluteErrors = array_map(static fn (array $row): float => abs($row['error']), $rows);
        $squaredErrors = array_map(static fn (array $row): float => $row['error'] ** 2, $rows);
        $mae = array_sum($absoluteErrors) / count($rows);
        $mse = array_sum($squaredErrors) / count($rows);
        $mape = null;
        $mapeReason = null;

        if (array_any($rows, static fn (array $row): bool => $row['actual'] === 0.0)) {
            $mapeReason = 'MAPE tidak tersedia karena terdapat aktual nol pada periode evaluasi.';
        } else {
            $percentages = array_map(static fn (array $row): float => abs($row['error'] / $row['actual']) * 100, $rows);
            if (array_all($percentages, static fn (float $percentage): bool => is_finite($percentage))) {
                $candidateMape = array_sum($percentages) / count($percentages);
                if (is_finite($candidateMape)) {
                    $mape = $candidateMape;
                } else {
                    $mapeReason = 'MAPE tidak tersedia karena hasil persentase melampaui rentang numerik.';
                }
            } else {
                $mapeReason = 'MAPE tidak tersedia karena hasil persentase melampaui rentang numerik.';
            }
        }

        if (! is_finite($mae) || ! is_finite($mse)) {
            throw new InvalidArgumentException('Metrik error melampaui rentang numerik yang didukung.');
        }

        return [
            'mae' => $mae,
            'mse' => $mse,
            'rmse' => sqrt($mse),
            'mape' => $mape,
            'mape_reason' => $mapeReason,
        ];
    }

    /** @param array<string, array<string, mixed>> $methods */
    private function recommend(array $methods): ?string
    {
        $eligible = array_filter($methods, static fn (array $method): bool => $method['evaluation_available'] && is_array($method['metrics']));
        if ($eligible === []) {
            return null;
        }

        uasort($eligible, static fn (array $left, array $right): int => $left['metrics']['mae'] <=> $right['metrics']['mae']);

        return (string) array_key_first($eligible);
    }
}
