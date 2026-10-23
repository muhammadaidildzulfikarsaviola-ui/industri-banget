<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * @phpstan-type SpcPoint array{label: string, value: float, cl: float, lcl: float, ucl: float, sigma: float, z_score: float, defects?: float, sample_size?: float, opportunities?: float}
 */
class SpcCalculator
{
    private const XR_CONSTANTS = [
        2 => ['A2' => 1.880, 'D3' => 0.000, 'D4' => 3.267, 'd2' => 1.128, 'd3' => 0.853],
        3 => ['A2' => 1.023, 'D3' => 0.000, 'D4' => 2.574, 'd2' => 1.693, 'd3' => 0.888],
        4 => ['A2' => 0.729, 'D3' => 0.000, 'D4' => 2.282, 'd2' => 2.059, 'd3' => 0.880],
        5 => ['A2' => 0.577, 'D3' => 0.000, 'D4' => 2.114, 'd2' => 2.326, 'd3' => 0.864],
        6 => ['A2' => 0.483, 'D3' => 0.000, 'D4' => 2.004, 'd2' => 2.534, 'd3' => 0.848],
        7 => ['A2' => 0.419, 'D3' => 0.076, 'D4' => 1.924, 'd2' => 2.704, 'd3' => 0.833],
        8 => ['A2' => 0.373, 'D3' => 0.136, 'D4' => 1.864, 'd2' => 2.847, 'd3' => 0.820],
        9 => ['A2' => 0.337, 'D3' => 0.184, 'D4' => 1.816, 'd2' => 2.970, 'd3' => 0.808],
        10 => ['A2' => 0.308, 'D3' => 0.223, 'D4' => 1.777, 'd2' => 3.078, 'd3' => 0.797],
    ];

    /** @param array<string, mixed> $inputs
     * @return array<string, mixed>
     */
    public function calculate(array $inputs): array
    {
        $chartType = $inputs['chart_type'] ?? '';
        $labels = $this->labels($inputs['labels'] ?? []);
        if ($labels !== []) {
            $expectedLabels = count($chartType === 'xbar_r' ? ($inputs['subgroups'] ?? []) : ($inputs['observations'] ?? []));
            if (count($labels) !== $expectedLabels) {
                throw new InvalidArgumentException('Jumlah label harus sama dengan jumlah titik data.');
            }
        }
        $spec = match ($chartType) {
            'imr' => $this->imr($inputs),
            'xbar_r' => $this->xbarR($inputs),
            'p' => $this->proportion($inputs, false),
            'np' => $this->proportion($inputs, true),
            'c' => $this->countChart($inputs),
            'u' => $this->uChart($inputs),
            default => throw new InvalidArgumentException('Jenis control chart tidak didukung.'),
        };

        $violations = [];
        $outside = [];
        foreach ($spec['charts'] as $chartIndex => &$chart) {
            foreach ($chart['points'] as $pointIndex => &$point) {
                $point['outside_control_limits'] = $point['value'] < $point['lcl'] || $point['value'] > $point['ucl'];
                if ($point['outside_control_limits']) {
                    $outside[] = ['chart' => $chart['key'], 'point' => $point['label'], 'value' => $point['value'], 'lcl' => $point['lcl'], 'ucl' => $point['ucl']];
                }
                $point['index'] = $pointIndex + 1;
            }
            unset($point);

            if ($chart['nelson_compatible']) {
                $chartViolations = $this->nelsonRules($chart['points']);
                foreach ($chartViolations as $violation) {
                    $violation['chart'] = $chart['key'];
                    $violations[] = $violation;
                }
            }
        }
        unset($chart);

        return [
            'chart_type' => $chartType,
            'charts' => $spec['charts'],
            'outside_points' => $outside,
            'nelson_violations' => $violations,
            'status' => $outside === [] && $violations === [] ? 'in_control' : 'out_of_control',
            'interpretation' => $outside === [] && $violations === []
                ? 'Tidak ada sinyal melewati batas kontrol atau Nelson Rules yang diuji. Ini tidak membuktikan proses selalu stabil.'
                : 'Sinyal statistik ditemukan. Periksa proses dan konteks pengambilan sampel; sinyal bukan bukti penyebab tertentu.',
            'assumptions' => $spec['assumptions'],
            'formula_note' => $spec['formula_note'],
            'nelson_note' => 'Nelson Rules memakai z-score terhadap CL dan simpangan baku chart. Zona 1σ dan 2σ dihitung dari simpangan baku estimasi chart; batas Rule 1 adalah ±3σ. Evaluasi dilakukan pada setiap chart yang kompatibel dengan sigma estimasi positif; chart dengan sigma nol tidak diuji karena zona tidak dapat diestimasi.',
        ];
    }

    /** @param array<string, mixed> $inputs
     * @return array<string, mixed>
     */
    private function imr(array $inputs): array
    {
        $values = $this->numbers($inputs['observations'] ?? [], 'Observasi', 2);
        $ranges = [];
        for ($i = 1; $i < count($values); $i++) {
            $ranges[] = abs($values[$i] - $values[$i - 1]);
        }
        $mrbar = array_sum($ranges) / count($ranges);
        $center = array_sum($values) / count($values);
        $sigma = $mrbar / 1.128;
        $sigmaMr = (0.853 / 1.128) * $mrbar;
        $labels = $this->labels($inputs['labels'] ?? []);
        $iChart = $this->constantChart('individuals', 'Individuals', $values, $center, $center - 2.66 * $mrbar, $center + 2.66 * $mrbar, $sigma, $labels);
        $mrChart = $this->constantChart('moving_range', 'Moving range', $ranges, $mrbar, 0, 3.267 * $mrbar, $sigmaMr, array_slice($labels, 1), false);

        return ['charts' => [$iChart, $mrChart], 'assumptions' => ['Observasi individual berurutan, independen, dan diambil pada interval yang konsisten.', 'Moving range memakai dua observasi berurutan; D2=1.128, E2=2.66, D4=3.267.'], 'formula_note' => 'MRᵢ=|Xᵢ−Xᵢ₋₁|; MR̄=mean(MR); I CL=X̄, limits=X̄±2.66MR̄; MR CL=MR̄, LCL=0, UCL=3.267MR̄.'];
    }

    /** @param array<string, mixed> $inputs
     * @return array<string, mixed>
     */
    private function xbarR(array $inputs): array
    {
        $subgroups = $inputs['subgroups'] ?? null;
        if (! is_array($subgroups) || count($subgroups) < 2) {
            throw new InvalidArgumentException('X-bar R membutuhkan minimal dua subgroup.');
        }
        $normalized = [];
        foreach ($subgroups as $subgroup) {
            $normalized[] = $this->numbers($subgroup, 'Nilai subgroup', 2, 10);
        }
        $n = count($normalized[0]);
        foreach ($normalized as $group) {
            if (count($group) !== $n) {
                throw new InvalidArgumentException('Ukuran setiap subgroup X-bar R harus sama.');
            }
        }
        $constants = self::XR_CONSTANTS[$n];
        $means = array_map(static fn (array $group): float => array_sum($group) / $n, $normalized);
        $ranges = array_map(static function (array $group): float {
            if ($group === []) {
                throw new InvalidArgumentException('X-bar R membutuhkan subgroup yang tidak kosong.');
            }

            return max($group) - min($group);
        }, $normalized);
        $xbar = array_sum($means) / count($means);
        $rbar = array_sum($ranges) / count($ranges);
        $sigmaXbar = $rbar / ($constants['d2'] * sqrt($n));
        $sigmaRange = $constants['d3'] * $rbar / $constants['d2'];
        $labels = $this->labels($inputs['labels'] ?? []);

        return ['charts' => [
            $this->constantChart('xbar', 'X-bar', $means, $xbar, $xbar - $constants['A2'] * $rbar, $xbar + $constants['A2'] * $rbar, $sigmaXbar, $labels),
            $this->constantChart('range', 'Range', $ranges, $rbar, $constants['D3'] * $rbar, $constants['D4'] * $rbar, $sigmaRange, $labels, false),
        ], 'assumptions' => ['Subgroup rasional, berukuran tetap n=2..10, dan observasi dalam subgroup mewakili kondisi proses yang sama.', 'Simpangan proses diperkirakan dengan R̄/d₂; batas X-bar memakai A₂R̄ dan batas R memakai D₃R̄/D₄R̄.'], 'formula_note' => "n={$n}; constants A₂={$constants['A2']}, D₃={$constants['D3']}, D₄={$constants['D4']}; X̄ CL=grand mean, limits=CL±A₂R̄; R CL=R̄, limits=D₃R̄/D₄R̄."];
    }

    /** @param array<string, mixed> $inputs
     * @return array<string, mixed>
     */
    private function proportion(array $inputs, bool $np): array
    {
        $rows = $this->countRows($inputs['observations'] ?? [], $np ? 2 : 2);
        if ($np && count(array_unique(array_column($rows, 'sample_size'))) !== 1) {
            throw new InvalidArgumentException('np-chart mensyaratkan ukuran sampel konstan.');
        }
        $totalDefects = array_sum(array_column($rows, 'defects'));
        $totalN = array_sum(array_column($rows, 'sample_size'));
        $pbar = $totalDefects / $totalN;
        $points = [];
        foreach ($rows as $index => $row) {
            $n = $row['sample_size'];
            $sigma = sqrt(max(0.0, $pbar * (1 - $pbar) / $n));
            $center = $np ? $n * $pbar : $pbar;
            $spread = $np ? $n * $sigma : $sigma;
            $value = $np ? $row['defects'] : $row['defects'] / $n;
            $points[] = $this->point($index, $value, $center, max(0.0, $center - 3 * $spread), $center + 3 * $spread, $spread, $this->labels($inputs['labels'] ?? []), ['defects' => $row['defects'], 'sample_size' => $n]);
        }

        return ['charts' => [$this->variableChart($np ? 'np' : 'p', $np ? 'np-chart' : 'p-chart', $points, true)], 'assumptions' => [$np ? 'Ukuran sampel konstan dan unit cacat binomial.' : 'Unit cacat binomial; ukuran sampel dapat bervariasi; observasi antarunit independen.'], 'formula_note' => $np ? 'CL=np̄=n p̄; σᵢ=√(n p̄(1−p̄)); limits=CL±3σ, LCL dibatasi nol.' : 'CL=p̄=Σdᵢ/Σnᵢ; σᵢ=√(p̄(1−p̄)/nᵢ); limits=p̄±3σᵢ, LCL dibatasi nol.'];
    }

    /** @param array<string, mixed> $inputs
     * @return array<string, mixed>
     */
    private function countChart(array $inputs): array
    {
        $values = $this->numbers($inputs['observations'] ?? [], 'Jumlah defect', 2);
        if (array_any($values, static fn (float $value): bool => floor($value) !== $value)) {
            throw new InvalidArgumentException('Jumlah defect c-chart harus bilangan bulat.');
        }
        $cbar = array_sum($values) / count($values);
        $sigma = sqrt($cbar);
        $points = [];
        foreach ($values as $i => $value) {
            $points[] = $this->point($i, $value, $cbar, max(0.0, $cbar - 3 * $sigma), $cbar + 3 * $sigma, $sigma, $this->labels($inputs['labels'] ?? []));
        }

        return ['charts' => [$this->variableChart('c', 'c-chart', $points, true)], 'assumptions' => ['Ukuran peluang dan area peluang konstan; kejadian defect mengikuti pendekatan Poisson.'], 'formula_note' => 'CL=c̄; σ=√c̄; limits=c̄±3√c̄, LCL dibatasi nol.'];
    }

    /** @param array<string, mixed> $inputs
     * @return array<string, mixed>
     */
    private function uChart(array $inputs): array
    {
        $rows = $this->countRows($inputs['observations'] ?? [], 2, 'defects', 'opportunities');
        $totalDefects = array_sum(array_column($rows, 'defects'));
        $totalUnits = array_sum(array_column($rows, 'sample_size'));
        $ubar = $totalDefects / $totalUnits;
        $points = [];
        foreach ($rows as $i => $row) {
            $sigma = sqrt(max(0.0, $ubar / $row['sample_size']));
            $points[] = $this->point($i, $row['defects'] / $row['sample_size'], $ubar, max(0.0, $ubar - 3 * $sigma), $ubar + 3 * $sigma, $sigma, $this->labels($inputs['labels'] ?? []), ['defects' => $row['defects'], 'opportunities' => $row['sample_size']]);
        }

        return ['charts' => [$this->variableChart('u', 'u-chart', $points, true)], 'assumptions' => ['Jumlah peluang/units dapat bervariasi; jumlah defect mengikuti pendekatan Poisson dan peluang antarunit setara.'], 'formula_note' => 'CL=ū=Σcᵢ/Σnᵢ; σᵢ=√(ū/nᵢ); limits=ū±3σᵢ, LCL dibatasi nol.'];
    }

    /** @param list<float> $values
     * @param  list<string|null>  $labels
     * @return array<string, mixed>
     */
    private function constantChart(string $key, string $label, array $values, float $center, float $lcl, float $ucl, float $sigma, array $labels, bool $nelson = true): array
    {
        $points = [];
        foreach ($values as $i => $value) {
            $points[] = $this->point($i, $value, $center, $lcl, $ucl, $sigma, $labels);
        }
        $hasEstimableSigma = array_any(array_column($points, 'sigma'), static fn (float $sigma): bool => $sigma > 0);

        return ['key' => $key, 'label' => $label, 'center_line' => $center, 'ucl' => $ucl, 'lcl' => $lcl, 'points' => $points, 'nelson_compatible' => $nelson && $hasEstimableSigma];
    }

    /** @param list<SpcPoint> $points
     * @return array<string, mixed>
     */
    private function variableChart(string $key, string $label, array $points, bool $nelson): array
    {
        $hasEstimableSigma = array_any(array_column($points, 'sigma'), static fn (float $sigma): bool => $sigma > 0);

        return ['key' => $key, 'label' => $label, 'center_line' => $points[0]['cl'], 'ucl' => null, 'lcl' => null, 'points' => $points, 'nelson_compatible' => $nelson && $hasEstimableSigma];
    }

    /** @param list<string|null> $labels
     * @param  array{defects?: float, sample_size?: float, opportunities?: float}  $extra
     * @return SpcPoint
     */
    private function point(int $index, float $value, float $cl, float $lcl, float $ucl, float $sigma, array $labels, array $extra = []): array
    {
        $this->finite([$value, $cl, $lcl, $ucl, $sigma]);
        $label = isset($labels[$index]) && trim((string) $labels[$index]) !== '' ? trim((string) $labels[$index]) : 'S'.($index + 1);
        $zScore = $sigma > 0 ? ($value - $cl) / $sigma : 0.0;
        if (! is_finite($zScore)) {
            throw new InvalidArgumentException('Standardisasi statistik melampaui rentang numerik yang didukung.');
        }

        return ['label' => $label, 'value' => $value, 'cl' => $cl, 'lcl' => $lcl, 'ucl' => $ucl, 'sigma' => $sigma, 'z_score' => $zScore] + $extra;
    }

    /** @param list<SpcPoint> $points
     * @return list<array<string, int|string>>
     */
    private function nelsonRules(array $points): array
    {
        $z = array_column($points, 'z_score');
        $rules = [];
        $add = static function (int $rule, int $start, int $end, string $reason) use (&$rules, $points): void {
            $rules[] = ['rule' => $rule, 'start_point' => $points[$start]['label'], 'end_point' => $points[$end]['label'], 'start_index' => $start + 1, 'end_index' => $end + 1, 'reason' => $reason];
        };
        foreach ($z as $i => $v) {
            if (abs($v) > 3) {
                $add(1, $i, $i, 'Satu titik berada di luar batas 3σ.');
            }
        }
        for ($i = 0; $i + 8 < count($z); $i++) {
            if ($this->sameSide(array_slice($z, $i, 9))) {
                $add(2, $i, $i + 8, 'Sembilan titik berturut-turut berada pada sisi yang sama dari CL.');
            }
        }
        for ($i = 0; $i + 5 < count($z); $i++) {
            $s = array_slice($z, $i, 6);
            if ($this->strictTrend($s, true) || $this->strictTrend($s, false)) {
                $add(3, $i, $i + 5, 'Enam titik berturut-turut terus naik atau terus turun.');
            }
        }
        for ($i = 0; $i + 13 < count($z); $i++) {
            $s = array_slice($z, $i, 14);
            $alternates = true;
            for ($j = 2; $j < 14; $j++) {
                if (($s[$j] - $s[$j - 1]) * ($s[$j - 1] - $s[$j - 2]) >= 0) {
                    $alternates = false;
                }
            } if ($alternates) {
                $add(4, $i, $i + 13, 'Empat belas titik berturut-turut bergantian naik dan turun.');
            }
        }
        for ($i = 0; $i + 2 < count($z); $i++) {
            $s = array_slice($z, $i, 3);
            foreach ([1, -1] as $side) {
                if (count(array_filter($s, static fn ($v): bool => $side * $v > 2)) >= 2) {
                    $add(5, $i, $i + 2, 'Dua dari tiga titik berada lebih dari 2σ pada sisi CL yang sama.');
                    break;
                }
            }
        }
        for ($i = 0; $i + 4 < count($z); $i++) {
            $s = array_slice($z, $i, 5);
            foreach ([1, -1] as $side) {
                if (count(array_filter($s, static fn ($v): bool => $side * $v > 1)) >= 4) {
                    $add(6, $i, $i + 4, 'Empat dari lima titik berada lebih dari 1σ pada sisi CL yang sama.');
                    break;
                }
            }
        }
        for ($i = 0; $i + 14 < count($z); $i++) {
            if (count(array_filter(array_slice($z, $i, 15), static fn ($v): bool => abs($v) <= 1)) === 15) {
                $add(7, $i, $i + 14, 'Lima belas titik berturut-turut berada dalam zona ±1σ.');
            }
        }
        for ($i = 0; $i + 7 < count($z); $i++) {
            $s = array_slice($z, $i, 8);
            if (count(array_filter($s, static fn ($v): bool => $v > 1)) >= 1 && count(array_filter($s, static fn ($v): bool => $v < -1)) >= 1 && count(array_filter($s, static fn ($v): bool => abs($v) <= 1)) === 0) {
                $add(8, $i, $i + 7, 'Delapan titik berturut-turut berada di luar zona ±1σ pada kedua sisi CL.');
            }
        }

        return $rules;
    }

    /** @param list<float> $values */
    private function sameSide(array $values): bool
    {
        return count(array_filter($values, static fn ($v): bool => $v > 0)) === count($values) || count(array_filter($values, static fn ($v): bool => $v < 0)) === count($values);
    }

    /** @param list<float> $values */
    private function strictTrend(array $values, bool $increasing): bool
    {
        for ($i = 1; $i < count($values); $i++) {
            if ($increasing ? $values[$i] <= $values[$i - 1] : $values[$i] >= $values[$i - 1]) {
                return false;
            }
        }

        return true;
    }

    /** @return list<float> */
    private function numbers(mixed $values, string $label, int $min, int $max = 1000): array
    {
        if (! is_array($values) || count($values) < $min || count($values) > $max) {
            throw new InvalidArgumentException("{$label} harus berisi {$min} sampai {$max} nilai.");
        }
        $result = [];
        foreach (array_values($values) as $value) {
            if (! is_numeric($value) || ! is_finite((float) $value) || (float) $value < 0) {
                throw new InvalidArgumentException("{$label} harus berupa angka hingga dan tidak negatif.");
            } $result[] = (float) $value;
        }

        return $result;
    }

    /** @return list<array{defects: float, sample_size: float}> */
    private function countRows(mixed $rows, int $min, string $defectKey = 'defects', string $sizeKey = 'sample_size'): array
    {
        if (! is_array($rows) || count($rows) < $min || count($rows) > 1000) {
            throw new InvalidArgumentException('Data chart harus berisi 2 sampai 1000 titik.');
        }
        $normalized = [];
        foreach ($rows as $row) {
            if (! is_array($row)) {
                throw new InvalidArgumentException('Setiap titik chart harus berupa baris data yang valid.');
            }
            $d = $row[$defectKey] ?? null;
            $n = $row[$sizeKey] ?? null;
            if (! is_numeric($d) || ! is_numeric($n) || ! is_finite((float) $d) || ! is_finite((float) $n) || (float) $d < 0 || (float) $n <= 0 || floor((float) $d) !== (float) $d || floor((float) $n) !== (float) $n || (float) $d > (float) $n && $defectKey === 'defects' && $sizeKey === 'sample_size') {
                throw new InvalidArgumentException('Jumlah cacat dan ukuran sampel harus bilangan bulat valid; cacat tidak boleh melebihi sampel.');
            }
            $normalized[] = ['defects' => (float) $d, 'sample_size' => (float) $n];
        }

        return $normalized;
    }

    /** @param list<float> $values */
    private function finite(array $values): void
    {
        foreach ($values as $value) {
            if (! is_finite($value)) {
                throw new InvalidArgumentException('Perhitungan chart melampaui rentang numerik yang didukung.');
            }
        }
    }

    /** @return list<string|null> */
    private function labels(mixed $labels): array
    {
        if (! is_array($labels)) {
            throw new InvalidArgumentException('Label chart harus berupa daftar teks.');
        }

        $normalized = [];
        foreach ($labels as $label) {
            if ($label !== null && ! is_string($label)) {
                throw new InvalidArgumentException('Setiap label chart harus berupa teks.');
            }
            $normalized[] = $label;
        }

        return $normalized;
    }
}
