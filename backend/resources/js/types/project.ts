export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export type Project = {
    id: number;
    name: string;
    industry: string | null;
    description: string | null;
    status: ProjectStatus;
    created_at: string;
    analysis_runs_count?: number;
};

export type AnalysisRun = {
    id: number;
    type: 'eoq';
    inputs: EoqInputs;
    results: EoqResults;
    created_at: string;
};

export type EoqInputs = {
    annual_demand: number;
    order_cost: number;
    holding_cost: number;
    currency_code: string;
    comparison_quantity: number | null;
};

export type EoqChartPoint = {
    quantity: number;
    ordering_cost: number;
    holding_cost: number;
    total_cost: number;
};

export type EoqResults = {
    eoq: number;
    orders_per_year: number;
    interval_days: number;
    annual_ordering_cost: number;
    annual_holding_cost: number;
    total_relevant_cost: number;
    comparison: {
        quantity: number;
        ordering_cost: number;
        holding_cost: number;
        total_cost: number;
    } | null;
    chart: EoqChartPoint[];
};

export type FlashMessages = {
    success?: string;
    error?: string;
};
