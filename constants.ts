import {
    ChargeHead,
    ChargeKind,
    ChargeCalcType,
    Crop,
    Party,
    PartyType,
    BankAccount,
    Transaction,
    TransactionType,
    TransactionLine,
    RateUnit,
    PaymentType,
    CashPaymentPurpose,
} from './types';

export const DEFAULT_TDS_RATE = 1.0;
export const QUINTAL_IN_KG = 100;

export const DEFAULT_CHARGE_HEADS: ChargeHead[] = [
    { id: 'ch_hamali', name: 'Hamali', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.PerBag, rate_value: 4, is_default: true },
    { id: 'ch_dalali', name: 'Dalali', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.PercentOfSubtotal, rate_value: 2, is_default: true },
    { id: 'ch_market_fees', name: 'Market Fees', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.PercentOfSubtotal, rate_value: 0.6, is_default: true },
    { id: 'ch_chintal_fees', name: 'Chintal Fees', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.PerBag, rate_value: 0.3, is_default: true },
    { id: 'ch_tds', name: 'TDS', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.PercentOfSubtotal, rate_value: DEFAULT_TDS_RATE, is_default: false },
    { id: 'ch_asami_commission', name: 'Asami Commission', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.PercentOfSubtotal, rate_value: 1, is_default: false },
    { id: 'ch_gunny_bag', name: 'Gunny Bag', kind: ChargeKind.Addition, calc_type: ChargeCalcType.Flat, rate_value: 20, is_default: false },
    { id: 'ch_insurance', name: 'Insurance', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.Flat, rate_value: 100, is_default: false },
    { id: 'ch_ledger_maintenance', name: 'Ledger Maintenance', kind: ChargeKind.Deduction, calc_type: ChargeCalcType.Flat, rate_value: 50, is_default: false },
];

export const DEFAULT_CROPS: Crop[] = [
    { id: 'crop_maize', name: 'Maize', grade: 'A', default_bag_weight_kg: 0.550, hsn_code: '10059000' },
    { id: 'crop_wheat', name: 'Wheat', grade: 'Standard', default_bag_weight_kg: 0.500, hsn_code: '10019910' },
    { id: 'crop_bajra', name: 'Bajra', default_bag_weight_kg: 0.500, hsn_code: '10089000' },
];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
    { id: 'bank_sbi_1', bank_name: 'State Bank of India', branch: 'Main Branch', ifsc: 'SBIN0000001', account_no: '12345678901' },
    { id: 'bank_icici_165', bank_name: 'ICICI 165', branch: 'Branch A', ifsc: 'ICIC0000165', account_no: '00012345678' },
    { id: 'bank_icici_199', bank_name: 'ICICI 199', branch: 'Branch B', ifsc: 'ICIC0000199', account_no: '00098765432' },
    { id: 'bank_suco_1', bank_name: 'SUCO', branch: 'Main Branch', ifsc: 'SUCO0000001', account_no: '11122233344' },
];

export const DEFAULT_PARTIES: Party[] = [
    { id: 'party_cust_1', name: 'Ram Traders', type: PartyType.Customer, mobile: '9876543210', address: '123 Market Road', is_zero_dalal: false, tds_applicable: true, tds_rate_percent: 1, asami_flag: false, bank_account_id: 'bank_sbi_1' },
    { id: 'party_supp_1', name: 'Kisan Agro', type: PartyType.Supplier, mobile: '8765432109', address: '456 Farm Lane', is_zero_dalal: false, tds_applicable: false, tds_rate_percent: 1, asami_flag: false },
    { id: 'party_brok_1', name: 'Shyam Brokerage', type: PartyType.Broker, mobile: '7654321098', address: '789 Broker Street', is_zero_dalal: false, tds_applicable: true, tds_rate_percent: 5, asami_flag: false },
    { id: 'party_supp_2_asami', name: 'Govind Farms (Asami)', type: PartyType.Supplier, mobile: '6543210987', address: '901 Village Path', is_zero_dalal: false, tds_applicable: true, tds_rate_percent: 1, asami_flag: true, asami_commission_percent: 1.5 },
];

const purchaseLines: TransactionLine[] = [
    {
        id: 'line_purchase_001',
        transaction_id: 'txn_purchase_001',
        crop_id: 'crop_maize',
        bags: 50,
        unloaded_weight_kg: 5200,
        suite_percent: 1.5,
        net_weight_kg: 5122,
        rate_value: 2100,
        rate_unit: RateUnit.per_quintal,
        line_amount: 107562,
    },
];

const saleLines: TransactionLine[] = [
    {
        id: 'line_sale_001',
        transaction_id: 'txn_sale_001',
        crop_id: 'crop_wheat',
        bags: 40,
        unloaded_weight_kg: 3800,
        suite_percent: 0,
        net_weight_kg: 3800,
        rate_value: 2400,
        rate_unit: RateUnit.per_quintal,
        line_amount: 91200,
    },
];

const asamiLines: TransactionLine[] = [
    {
        id: 'line_asami_001',
        transaction_id: 'txn_asami_001',
        crop_id: 'crop_maize',
        bags: 35,
        unloaded_weight_kg: 3500,
        suite_percent: 1.25,
        net_weight_kg: 3456.25,
        rate_value: 2050,
        rate_unit: RateUnit.per_quintal,
        line_amount: 70851.125,
    },
];

const zeroDalalLines: TransactionLine[] = [
    {
        id: 'line_zero_dalal_001',
        transaction_id: 'txn_zero_dalal_001',
        crop_id: 'crop_maize',
        bags: 25,
        unloaded_weight_kg: 2500,
        suite_percent: 0.8,
        net_weight_kg: 2480,
        rate_value: 2150,
        rate_unit: RateUnit.per_quintal,
        line_amount: 53320,
    },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
    {
        id: 'txn_purchase_001',
        date: '2024-12-01',
        type: TransactionType.Purchase,
        party_id: 'party_supp_1',
        broker_id: 'party_brok_1',
        bill_no: 'PUR-001',
        po_no: 'PO-2024-11',
        lorry_no: 'KA01AB1234',
        payment_terms: '15',
        destination: 'Main Warehouse',
        remarks: 'Opening season purchase',
        lines: purchaseLines,
        charges: [
            { id: 'charge_purchase_hamali', transaction_id: 'txn_purchase_001', charge_head_id: 'ch_hamali', computed_amount: 200 },
            { id: 'charge_purchase_dalali', transaction_id: 'txn_purchase_001', charge_head_id: 'ch_dalali', computed_amount: 2151.24 },
            { id: 'charge_purchase_market', transaction_id: 'txn_purchase_001', charge_head_id: 'ch_market_fees', computed_amount: 645.372 },
            { id: 'charge_purchase_chintal', transaction_id: 'txn_purchase_001', charge_head_id: 'ch_chintal_fees', computed_amount: 15 },
        ],
        amount_received: 50000,
    },
    {
        id: 'txn_sale_001',
        date: '2024-12-05',
        type: TransactionType.Sale,
        party_id: 'party_cust_1',
        broker_id: 'party_brok_1',
        bill_no: 'SAL-045',
        lorry_no: 'KA05CD5678',
        destination: 'Hyderabad',
        remarks: 'Sale to Ram Traders',
        lines: saleLines,
        charges: [
            { id: 'charge_sale_hamali', transaction_id: 'txn_sale_001', charge_head_id: 'ch_hamali', computed_amount: 160 },
            { id: 'charge_sale_dalali', transaction_id: 'txn_sale_001', charge_head_id: 'ch_dalali', computed_amount: 1824 },
            { id: 'charge_sale_market', transaction_id: 'txn_sale_001', charge_head_id: 'ch_market_fees', computed_amount: 547.2 },
            { id: 'charge_sale_gunny', transaction_id: 'txn_sale_001', charge_head_id: 'ch_gunny_bag', computed_amount: 20 },
        ],
        amount_received: 60000,
    },
    {
        id: 'txn_asami_001',
        date: '2024-12-08',
        type: TransactionType.Asami,
        party_id: 'party_supp_2_asami',
        broker_id: 'party_brok_1',
        bill_no: 'ASA-012',
        lorry_no: 'KA09EF9012',
        destination: 'Commission Yard',
        remarks: 'Asami purchase with commission',
        lines: asamiLines,
        charges: [
            { id: 'charge_asami_hamali', transaction_id: 'txn_asami_001', charge_head_id: 'ch_hamali', computed_amount: 140 },
            { id: 'charge_asami_dalali', transaction_id: 'txn_asami_001', charge_head_id: 'ch_dalali', computed_amount: 1417.0225 },
            { id: 'charge_asami_market', transaction_id: 'txn_asami_001', charge_head_id: 'ch_market_fees', computed_amount: 425.10675 },
            { id: 'charge_asami_chintal', transaction_id: 'txn_asami_001', charge_head_id: 'ch_chintal_fees', computed_amount: 10.5 },
            { id: 'charge_asami_commission', transaction_id: 'txn_asami_001', charge_head_id: 'ch_asami_commission', computed_amount: 1062.766875 },
        ],
        amount_received: 25000,
    },
    {
        id: 'txn_zero_dalal_001',
        date: '2024-12-10',
        type: TransactionType.ZeroDalal,
        party_id: 'party_cust_1',
        broker_id: 'party_brok_1',
        bill_no: 'ZD-007',
        lorry_no: 'KA07GH3456',
        destination: 'Local Market',
        remarks: 'Zero dalal arrangement',
        lines: zeroDalalLines,
        charges: [
            { id: 'charge_zero_hamali', transaction_id: 'txn_zero_dalal_001', charge_head_id: 'ch_hamali', computed_amount: 100 },
            { id: 'charge_zero_dalali', transaction_id: 'txn_zero_dalal_001', charge_head_id: 'ch_dalali', rate_value_override: 0, computed_amount: 0 },
            { id: 'charge_zero_market', transaction_id: 'txn_zero_dalal_001', charge_head_id: 'ch_market_fees', computed_amount: 319.92 },
            { id: 'charge_zero_ledger', transaction_id: 'txn_zero_dalal_001', charge_head_id: 'ch_ledger_maintenance', computed_amount: 50 },
        ],
        amount_received: 30000,
    },
    {
        id: 'txn_payment_received_001',
        date: '2024-12-12',
        type: TransactionType.Payment,
        party_id: 'party_cust_1',
        bill_no: 'PAY-REC-001',
        payment_terms: 'Immediate',
        remarks: 'Partial receipt towards sale',
        lines: [],
        charges: [],
        amount_received: 45000,
        payment_type: PaymentType.Received,
        bank_account_id: 'bank_icici_165',
    },
    {
        id: 'txn_payment_paid_001',
        date: '2024-12-14',
        type: TransactionType.Payment,
        party_id: 'party_supp_1',
        bill_no: 'PAY-PD-001',
        payment_terms: 'Immediate',
        remarks: 'Advance paid to supplier',
        lines: [],
        charges: [],
        amount_received: 28000,
        payment_type: PaymentType.Paid,
        bank_account_id: 'bank_sbi_1',
    },
    {
        id: 'txn_cash_001',
        date: '2024-12-15',
        type: TransactionType.Cash,
        party_id: 'party_supp_1',
        bill_no: 'CASH-2024-01',
        remarks: 'Cash advance for logistics',
        lines: [],
        charges: [],
        amount_received: 12000,
        cash_payment_purpose: CashPaymentPurpose.LorryFreight,
        cash_description: 'Advance for transport booking',
    },
];
