import type { SpcChart } from '@/types/spc';

const numberFormat = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 3,
});

export function SpcControlChart({
    chart,
    unit,
}: {
    chart: SpcChart;
    unit: string;
}) {
    const width = 760;
    const height = 270;
    const left = 48;
    const right = 730;
    const top = 22;
    const bottom = 214;
    const allValues = chart.points.flatMap((point) => [
        point.value,
        point.lcl,
        point.ucl,
        point.cl,
    ]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min || Math.max(Math.abs(max) * 0.1, 1)) * 0.12;
    const low = min - padding;
    const high = max + padding;
    const x = (index: number) =>
        left + (index * (right - left)) / Math.max(chart.points.length - 1, 1);
    const y = (value: number) =>
        bottom - ((value - low) / (high - low || 1)) * (bottom - top);
    const line = (get: (point: SpcChart['points'][number]) => number) =>
        chart.points
            .map((point, index) => `${x(index)},${y(get(point))}`)
            .join(' ');

    return (
        <div
            className="overflow-x-auto"
            role="region"
            aria-label={`${chart.label} control chart`}
            tabIndex={0}
        >
            <svg
                role="img"
                aria-label={`${chart.label}: statistik, CL, UCL, dan LCL`}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full min-w-[620px]"
            >
                <title>{chart.label}</title>
                <desc>
                    Grafik statistik terhadap batas kontrol. Garis spesifikasi
                    tidak ditampilkan.
                </desc>
                {[0, 1, 2, 3].map((step) => {
                    const yy = top + (step * (bottom - top)) / 3;
                    const value = high - (step * (high - low)) / 3;
                    return (
                        <g key={step}>
                            <line
                                x1={left}
                                y1={yy}
                                x2={right}
                                y2={yy}
                                stroke="var(--chart-grid)"
                                strokeDasharray="3 5"
                            />
                            <text
                                x="4"
                                y={yy + 4}
                                fill="var(--color-muted)"
                                fontSize="10"
                            >
                                {numberFormat.format(value)}
                            </text>
                        </g>
                    );
                })}
                <polyline
                    points={line((point) => point.ucl)}
                    fill="none"
                    stroke="var(--chart-ordering)"
                    strokeWidth="2"
                />
                <polyline
                    points={line((point) => point.cl)}
                    fill="none"
                    stroke="var(--chart-holding)"
                    strokeWidth="2"
                    strokeDasharray="7 4"
                />
                <polyline
                    points={line((point) => point.lcl)}
                    fill="none"
                    stroke="var(--chart-ordering)"
                    strokeWidth="2"
                />
                <polyline
                    points={line((point) => point.value)}
                    fill="none"
                    stroke="var(--chart-total)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />
                {chart.points.map((point, index) => (
                    <circle
                        key={`${point.label}-${index}`}
                        cx={x(index)}
                        cy={y(point.value)}
                        r={point.outside_control_limits ? 5 : 3.5}
                        fill={
                            point.outside_control_limits
                                ? 'var(--danger)'
                                : 'var(--chart-total)'
                        }
                    >
                        <title>{`${point.label}: ${numberFormat.format(point.value)} ${unit}; CL ${numberFormat.format(point.cl)}, LCL ${numberFormat.format(point.lcl)}, UCL ${numberFormat.format(point.ucl)}`}</title>
                    </circle>
                ))}
                <text
                    x={left}
                    y={height - 12}
                    fill="var(--color-muted)"
                    fontSize="11"
                >
                    {chart.points[0]?.label}
                </text>
                <text
                    x={right}
                    y={height - 12}
                    textAnchor="end"
                    fill="var(--color-muted)"
                    fontSize="11"
                >
                    {chart.points.at(-1)?.label}
                </text>
            </svg>
            <div
                className="flex flex-wrap gap-x-5 gap-y-2 px-2 pb-2 text-sm text-muted"
                aria-label="Legenda grafik"
            >
                <span>
                    <i
                        className="mr-2 inline-block h-0.5 w-5 align-middle"
                        style={{ background: 'var(--chart-total)' }}
                    />
                    Statistik ({unit})
                </span>
                <span>
                    <i
                        className="mr-2 inline-block h-0.5 w-5 align-middle"
                        style={{ background: 'var(--chart-holding)' }}
                    />
                    CL
                </span>
                <span>
                    <i
                        className="mr-2 inline-block h-0.5 w-5 align-middle"
                        style={{ background: 'var(--chart-ordering)' }}
                    />
                    UCL / LCL
                </span>
                <span>
                    <i
                        className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                        style={{ background: 'var(--danger)' }}
                    />
                    Di luar batas
                </span>
            </div>
        </div>
    );
}
