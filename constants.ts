import { ChargeHead, ChargeKind, ChargeCalcType, Crop, Party, PartyType, BankAccount } from './types';

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