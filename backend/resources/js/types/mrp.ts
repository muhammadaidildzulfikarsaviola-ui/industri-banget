export type MrpItem = {
    id: number;
    project_id: number;
    code: string;
    name: string;
    unit: string;
    lead_time_periods: number;
    initial_on_hand: number;
    lot_sizing_policy: 'lot_for_lot' | 'fixed_order_quantity';
    fixed_order_quantity: number | null;
};

export type MrpBomLine = {
    id: number;
    project_id: number;
    parent_item_id: number;
    component_item_id: number;
    quantity_per: number;
    parent_item: MrpItem;
    component_item: MrpItem;
};

export type MrpInputs = {
    plan_name: string;
    period_count: number;
    mps: { item_id: number; period: string; quantity: number }[];
    scheduled_receipts: { item_id: number; period: string; quantity: number }[];
    item_snapshots: MrpItem[];
    bom_snapshots: {
        parent_item_id: number;
        component_item_id: number;
        quantity_per: number;
    }[];
};

export type MrpPeriodRow = {
    period: string;
    gross_requirements: number;
    scheduled_receipts: number;
    projected_on_hand: number;
    net_requirements: number;
    planned_order_receipts: number;
    planned_order_releases: number;
};

export type MrpResults = {
    periods: string[];
    records: { item: Omit<MrpItem, 'project_id'>; periods: MrpPeriodRow[] }[];
    warnings: {
        type: string;
        item_code: string;
        item_name: string;
        message: string;
        quantity: number;
    }[];
    lot_sizing_notes: Record<string, string>;
    lead_time_note: string;
};
