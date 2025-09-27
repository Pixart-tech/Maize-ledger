import { Transaction, TransactionLine, RateUnit, ChargeHead, ChargeKind, ChargeCalcType, Party, TransactionType } from '../types';
import { QUINTAL_IN_KG } from '../constants';

export const calculateNetWeight = (line: TransactionLine, transaction_type: TransactionType): number => {
  if (transaction_type === TransactionType.Sale) {
    return line.unloaded_weight_kg;
  }
  
  const { unloaded_weight_kg, suite_percent } = line;
  
  const suiteDeduction = (unloaded_weight_kg * suite_percent) / 100;
  const netWeight = unloaded_weight_kg - suiteDeduction;
  
  return netWeight > 0 ? netWeight : 0;
};

export const calculateLineAmount = (line: TransactionLine): number => {
  const { net_weight_kg, rate_value, rate_unit, bags } = line;
  
  if (rate_value <= 0) return 0;

  switch (rate_unit) {
    case RateUnit.per_kg:
      return net_weight_kg * rate_value;
    case RateUnit.per_quintal:
      return (net_weight_kg / QUINTAL_IN_KG) * rate_value;
    case RateUnit.per_bag:
      return bags * rate_value;
    default:
      return 0;
  }
};

export const calculateTransactionTotals = (
    transaction: Transaction,
    chargeHeads: ChargeHead[],
    party?: Party
) => {
    const subtotal = transaction.lines.reduce((acc, line) => acc + line.line_amount, 0);

    // Step 1: Calculate computed_amount for all charges based on their type and conditions
    transaction.charges.forEach(charge => {
        const head = chargeHeads.find(h => h.id === charge.charge_head_id);
        if (!head) return;

        // --- Special Cases First ---
        if (head.name.toLowerCase() === 'dalali' && party?.is_zero_dalal) {
            charge.computed_amount = 0;
            return;
        }
        if (head.name === 'Asami Commission') {
            charge.computed_amount = (party?.asami_flag && party.asami_commission_percent)
                ? (subtotal * party.asami_commission_percent) / 100
                : 0;
            return;
        }
        if (head.name === 'TDS') {
            // Per user request, TDS is removed from all transactions.
            charge.computed_amount = 0;
            return;
        }

        // --- Standard Calculation Logic ---
        const rate = charge.rate_value_override ?? head.rate_value;
        let amount = 0;
        switch (head.calc_type) {
            case ChargeCalcType.Flat:
                amount = rate;
                break;
            case ChargeCalcType.PerKg:
                const totalNetWeight = transaction.lines.reduce((sum, l) => sum + l.net_weight_kg, 0);
                amount = totalNetWeight * rate;
                break;
            case ChargeCalcType.PerQtl:
                const totalQuintals = transaction.lines.reduce((sum, l) => sum + l.net_weight_kg, 0) / QUINTAL_IN_KG;
                amount = totalQuintals * rate;
                break;
            case ChargeCalcType.PerBag:
                const totalBags = transaction.lines.reduce((sum, l) => sum + (Number(l.bags) || 0), 0);
                amount = totalBags * rate;
                break;
            case ChargeCalcType.PercentOfSubtotal:
                amount = (subtotal * rate) / 100;
                break;
        }
        charge.computed_amount = amount;
    });

    // Step 2: Sum up totals based on the final computed_amounts
    let total_additions = 0;
    let total_deductions = 0;
    let tds_amount = 0;
    
    transaction.charges.forEach(charge => {
        const head = chargeHeads.find(h => h.id === charge.charge_head_id);
        if (!head) return;

        if (head.kind === ChargeKind.Addition) {
            total_additions += charge.computed_amount;
        } else {
            total_deductions += charge.computed_amount;
        }
        if (head.name === 'TDS') {
            tds_amount = charge.computed_amount;
        }
    });

    const grand_total = transaction.type === TransactionType.Purchase
        ? subtotal + total_additions + total_deductions // For purchase, expenses (deductions) are added to cost
        : subtotal + total_additions - total_deductions; // For sale, deductions are subtracted

    const balance = grand_total - transaction.amount_received;

    return {
        subtotal,
        total_additions,
        total_deductions,
        tds_amount,
        grand_total,
        balance,
    };
};