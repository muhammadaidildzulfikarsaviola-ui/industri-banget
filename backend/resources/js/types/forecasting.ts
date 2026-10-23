export type ForecastMethod =
    | 'naive'
    | 'moving_average'
    | 'weighted_moving_average'
    | 'single_exponential_smoothing'
    | 'linear_trend';

export type ForecastInputs = {
    analysis_name: string;
    unit: string;
    interval: 'daily' | 'weekly' | 'monthly';
    horizon: number;
    methods: ForecastMethod[];
    history: { period: string; actual: number }[];
    moving_average_window: number;
    weighted_moving_average_weights: number[];
    alpha: number;
};

export type ForecastResults = {
    historical: { period: string; actual: number }[];
    evaluation: {
        scheme: string;
        holdout_count: number;
        training_count: number;
        periods: string[];
        rows: Partial<
            Record<
                ForecastMethod,
                {
                    period: string;
                    actual: number;
                    forecast: number;
                    error: number;
                }[]
            >
        >;
        mape_note: string;
    };
    methods: Partial<
        Record<
            ForecastMethod,
            {
                label: string;
                parameters: Record<string, number | number[]>;
                forecast_available: boolean;
                evaluation_available: boolean;
                reason: string | null;
                metrics: {
                    mae: number;
                    mse: number;
                    rmse: number;
                    mape: number | null;
                    mape_reason: string | null;
                } | null;
            }
        >
    >;
    projections: Partial<
        Record<ForecastMethod, { period: string; forecast: number }[]>
    >;
    recommended_method: ForecastMethod | null;
    interpretation: string;
};
