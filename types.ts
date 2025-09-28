export enum PartyType {
  Supplier = 'Supplier',
  Customer = 'Customer',
  Broker = 'Broker',
  Employee = 'Employee',
  Other = 'Other',
}

export interface BankAccount {
  id: string;
  bank_name: string;
  branch: string;
  ifsc: string;
  account_no: string;
  upi_id?: string;
}

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  gstin?: string;
  pan?: string;
  mobile: string;
  address: string;
  is_zero_dalal: boolean;
  tds_applicable: boolean;
  tds_rate_percent: number;
  asami_flag: boolean;
  asami_commission_percent?: number;
  payment_terms?: string;
  bank_account_id?: string;
}

export interface Crop {
  id: string;
  name: string;
  grade?: string;
  default_bag_weight_kg: number;
  hsn_code?: string;
}

export enum TransactionType {
  Purchase = 'Purchase',
  Sale = 'Sale',
  Asami = 'Asami',
  ZeroDalal = 'Zero Dalal',
  Payment = 'Payment',
  Cash = 'Cash',
}

export enum PaymentType {
  Paid = 'Paid',
  Received = 'Received',
}

export enum CashPaymentPurpose {
  Salary = 'Salary',
  LorryFreight = 'Lorry Freight',
  NSG = 'NSG',
  Pada = 'Pada',
  Other = 'Other',
}

export enum RateUnit {
  per_kg = 'per_kg',
  per_quintal = 'per_quintal',
  per_bag = 'per_bag',
}

export interface TransactionLine {
  id: string;
  transaction_id: string;
  crop_id: string;
  bags: number;
  unloaded_weight_kg: number;
  suite_percent: number;
  net_weight_kg: number; // Calculated
  rate_value: number;
  rate_unit: RateUnit;
  line_amount: number; // Calculated
}

export enum ChargeKind {
  Addition = 'Addition',
  Deduction = 'Deduction',
}

export enum ChargeCalcType {
  Flat = 'Flat',
  PerKg = 'PerKg',
  PerQtl = 'PerQtl',
  PercentOfSubtotal = 'PercentOfSubtotal',
  PerBag = 'PerBag',
}

export interface ChargeHead {
  id: string;
  name: string;
  kind: ChargeKind;
  calc_type: ChargeCalcType;
  rate_value: number;
  is_default: boolean;
}

export interface TransactionCharge {
  id: string;
  transaction_id: string;
  charge_head_id: string;
  rate_value_override?: number;
  computed_amount: number; // Calculated
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  party_id: string;
  broker_id?: string;

  bill_no: string;
  po_no?: string;
  lorry_no?: string;
  bilty_no?: string;
  permit_no?: string;
  
  payment_terms?: string; // For days
  destination?: string;
  remarks?: string;
  
  lines: TransactionLine[];
  charges: TransactionCharge[];
  
  amount_received: number;

  // Payment Voucher specific fields
  payment_type?: PaymentType;
  bank_account_id?: string;
  cash_payment_purpose?: CashPaymentPurpose;
  cash_description?: string;
}

// For UI state and calculations, not persisted directly
export interface TransactionTotals {
    subtotal: number;
    total_additions: number;
    total_deductions: number;
    tds_amount: number;
    grand_total: number;
    balance: number;
}