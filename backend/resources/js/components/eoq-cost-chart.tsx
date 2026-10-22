import type { EoqChartPoint } from '@/types/project';

type Props = {
    points: EoqChartPoint[];
    eoq: number;
    totalAtEoq: number;
    currency: string;
};

const bounds = {
    left: 78,
    right: 740,
    top: 24,
    bottom: 248,
};

function compactNumber(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

export function EoqCostChart({ points, eoq, totalAtEoq, currency }: Props) {
    const maximumQuantity = points.at(-1)?.quantity ?? eoq;
    const maximumCost = Math.max(...points.map((point) => point.total_cost));
    const x = (quantity: number) =>
        bounds.left +
        (quantity / maximumQuantity) * (bounds.right - bounds.left);
    const y = (cost: number) =>
        bounds.bottom - (cost / maximumCost) * (bounds.bottom - bounds.top);
    const makePath = (key: 'ordering_cost' | 'holding_cost' | 'total_cost') =>
        points
            .map(
                (point, index) =>
                    `${index === 0 ? 'M' : 'L'} ${x(point.quantity).toFixed(2)} ${y(point[key]).toFixed(2)}`,
            )
            .join(' ');
    return (
        <div className="overflow-x-auto border border-line bg-surface p-4 sm:p-6">
            <svg
                role="img"
                aria-labelledby="eoq-chart-title eoq-chart-description"
                viewBox="0 0 780 330"
                className="w-full min-w-[700px]"
            >
                <title id="eoq-chart-title">Kurva biaya persediaan EOQ</title>
                <desc id="eoq-chart-description">
                    Biaya pemesanan menurun dan biaya penyimpanan meningkat
                    seiring kuantitas pesanan. Garis total menunjukkan jumlah
                    keduanya; garis vertikal menandai EOQ {compactNumber(eoq)}{' '}
                    unit.
                </desc>
                {[0, 1, 2, 3, 4].map((tick) => {
                    const value = (maximumCost * tick) / 4;
                    const position = y(value);

                    return (
                        <g key={tick}>
                            <line
                                x1={bounds.left}
                                y1={position}
                                x2={bounds.right}
                                y2={position}
                                stroke="var(--chart-grid)"
                                strokeWidth="1"
                            />
                            <text
                                x={bounds.left - 10}
                                y={position + 4}
                                fill="var(--muted)"
                                fontSize="12"
                                textAnchor="end"
                            >
                                {compactNumber(value)}
                            </text>
                        </g>
                    );
                })}
                <line
                    x1={bounds.left}
                    y1={bounds.top}
                    x2={bounds.left}
                    y2={bounds.bottom}
                    stroke="var(--chart-axis)"
                />
                <line
                    x1={bounds.left}
                    y1={bounds.bottom}
                    x2={bounds.right}
                    y2={bounds.bottom}
                    stroke="var(--chart-axis)"
                />
                <path
                    d={makePath('ordering_cost')}
                    fill="none"
                    stroke="var(--chart-ordering)"
                    strokeWidth="2.5"
                />
                <path
                    d={makePath('holding_cost')}
                    fill="none"
                    stroke="var(--chart-holding)"
                    strokeWidth="2.5"
                />
                <path
                    d={makePath('total_cost')}
                    fill="none"
                    stroke="var(--chart-total)"
                    strokeWidth="3"
                />
                {points.map((point) => (
                    <circle
                        key={point.quantity}
                        cx={x(point.quantity)}
                        cy={y(point.total_cost)}
                        r="6"
                        fill="transparent"
                    >
                        <title>
                            Kuantitas: {compactNumber(point.quantity)} unit ·
                            Pemesanan: {compactNumber(point.ordering_cost)} ·
                            Penyimpanan: {compactNumber(point.holding_cost)} ·
                            Total: {compactNumber(point.total_cost)}
                        </title>
                    </circle>
                ))}
                <line
                    x1={x(eoq)}
                    y1={bounds.top}
                    x2={x(eoq)}
                    y2={bounds.bottom}
                    stroke="var(--ink)"
                    strokeDasharray="5 5"
                    strokeWidth="1.5"
                />
                <circle
                    cx={x(eoq)}
                    cy={y(totalAtEoq)}
                    r="4"
                    fill="var(--surface)"
                    stroke="var(--ink)"
                    strokeWidth="2"
                />
                <text x={bounds.left} y="272" fill="var(--muted)" fontSize="12">
                    0
                </text>
                <text
                    x={bounds.right}
                    y="272"
                    fill="var(--muted)"
                    fontSize="12"
                    textAnchor="end"
                >
                    {compactNumber(maximumQuantity)} unit
                </text>
                <text
                    x="409"
                    y="301"
                    fill="var(--ink)"
                    fontSize="13"
                    textAnchor="middle"
                >
                    Kuantitas pesanan (unit)
                </text>
                <text
                    x="17"
                    y="136"
                    fill="var(--ink)"
                    fontSize="13"
                    textAnchor="middle"
                    transform="rotate(-90 17 136)"
                >
                    Biaya tahunan ({currency})
                </text>
                <g
                    transform="translate(94 320)"
                    fontSize="12"
                    fill="var(--ink)"
                >
                    <line
                        x1="0"
                        y1="-4"
                        x2="18"
                        y2="-4"
                        stroke="var(--chart-ordering)"
                        strokeWidth="2.5"
                    />
                    <text x="24" y="0">
                        Pemesanan
                    </text>
                    <line
                        x1="120"
                        y1="-4"
                        x2="138"
                        y2="-4"
                        stroke="var(--chart-holding)"
                        strokeWidth="2.5"
                    />
                    <text x="144" y="0">
                        Penyimpanan
                    </text>
                    <line
                        x1="262"
                        y1="-4"
                        x2="280"
                        y2="-4"
                        stroke="var(--chart-total)"
                        strokeWidth="3"
                    />
                    <text x="286" y="0">
                        Total relevan
                    </text>
                    <line
                        x1="406"
                        y1="-4"
                        x2="424"
                        y2="-4"
                        stroke="var(--ink)"
                        strokeDasharray="4 3"
                    />
                    <text x="430" y="0">
                        EOQ {compactNumber(eoq)} unit
                    </text>
                </g>
            </svg>
        </div>
    );
}
