export type SpcChartType = 'imr' | 'xbar_r' | 'p' | 'np' | 'c' | 'u';

export type SpcInputs = {
    analysis_name: string;
    characteristic: string;
    unit: string;
    chart_type: SpcChartType;
    observations?:
        | number[]
        | { defects: number; sample_size?: number; opportunities?: number }[];
    subgroups?: number[][];
    labels?: string[];
};

export type SpcPoint = {
    index: number;
    label: string;
    value: number;
    cl: number;
    lcl: number;
    ucl: number;
    sigma: number;
    z_score: number;
    outside_control_limits: boolean;
    defects?: number;
    sample_size?: number;
    opportunities?: number;
};

export type SpcChart = {
    key: string;
    label: string;
    center_line: number;
    ucl: number | null;
    lcl: number | null;
    points: SpcPoint[];
    nelson_compatible: boolean;
};

export type SpcResults = {
    chart_type: SpcChartType;
    charts: SpcChart[];
    outside_points: {
        chart: string;
        point: string;
        value: number;
        lcl: number;
        ucl: number;
    }[];
    nelson_violations: {
        rule: number;
        chart: string;
        start_point: string;
        end_point: string;
        start_index: number;
        end_index: number;
        reason: string;
    }[];
    status: 'in_control' | 'out_of_control';
    interpretation: string;
    assumptions: string[];
    formula_note: string;
    nelson_note: string;
};
