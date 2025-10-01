import { BankAccount, ChargeHead, ChargeKind, Crop, Party, PaymentType, Transaction, TransactionType } from '../types';
import { calculateTransactionTotals } from './calculationService';
import { formatDate, formatINRPdfSafe } from '../utils/formatters';

const JsPDFConstructor = typeof window !== 'undefined' ? (window as any)?.jspdf?.jsPDF : undefined;

interface VoucherPdfContext {
  parties: Party[];
  chargeHeads: ChargeHead[];
  crops: Crop[];
  bankAccounts: BankAccount[];
}

const toTitleCase = (value?: string | null): string => {
  if (!value) return '—';
  return value
    .split(' ')
    .map(word => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
};

const getBankLabel = (bankAccount?: BankAccount): string => {
  if (!bankAccount) return '—';
  const parts = [bankAccount.bank_name, bankAccount.branch].filter(Boolean);
  return parts.join(' – ');
};

export const exportVoucherPDF = (
  transaction: Transaction,
  context: VoucherPdfContext
) => {
  const JsPDF = JsPDFConstructor ?? (typeof window !== 'undefined' ? (window as any)?.jspdf?.jsPDF : undefined);

  if (typeof JsPDF !== 'function') {
    window?.alert?.('PDF export is currently unavailable. Please try again later.');
    console.error('jsPDF constructor is not available.');
    return;
  }

  const doc = new JsPDF();

  if (typeof (doc as any).autoTable !== 'function') {
    window?.alert?.('PDF export is currently unavailable. Please try again later.');
    console.error('jsPDF autoTable plugin is not loaded.');
    return;
  }

  const { parties, chargeHeads, crops, bankAccounts } = context;
  const party = parties.find(p => p.id === transaction.party_id);
  const broker = transaction.broker_id ? parties.find(p => p.id === transaction.broker_id) : undefined;
  const bankAccount = transaction.bank_account_id
    ? bankAccounts.find(account => account.id === transaction.bank_account_id)
    : undefined;
  const totals = calculateTransactionTotals(transaction, chargeHeads, party);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(`${transaction.type} Voucher`, 14, 18);

  doc.setFontSize(10);
  doc.text(`Bill No: ${transaction.bill_no || '—'}`, 14, 26);
  doc.text(`Date: ${formatDate(transaction.date) || '—'}`, pageWidth - 14, 26, { align: 'right' });

  let cursorY = 36;
  doc.setFont(undefined, 'bold');
  doc.text('Party Details', 14, cursorY);
  doc.setFont(undefined, 'normal');
  cursorY += 6;

  const partyDetails: string[] = [
    `Name: ${party?.name || '—'}`,
    `Address: ${party?.address || '—'}`,
    `Mobile: ${party?.mobile || '—'}`,
  ];

  if (party?.gstin) {
    partyDetails.push(`GSTIN: ${party.gstin}`);
  }

  partyDetails.forEach(line => {
    doc.text(line, 14, cursorY);
    cursorY += 5;
  });

  if (broker) {
    doc.text(`Broker: ${broker.name}`, 14, cursorY);
    cursorY += 5;
  }

  if (transaction.destination) {
    doc.text(`Destination: ${transaction.destination}`, 14, cursorY);
    cursorY += 5;
  }

  if (transaction.remarks) {
    doc.text(`Remarks: ${transaction.remarks}`, 14, cursorY);
    cursorY += 5;
  }

  if (transaction.type === TransactionType.Payment) {
    cursorY += 3;
    doc.setFont(undefined, 'bold');
    doc.text('Payment Details', 14, cursorY);
    doc.setFont(undefined, 'normal');
    cursorY += 6;

    const paymentLines = [
      `Payment Type: ${transaction.payment_type ? toTitleCase(transaction.payment_type) : '—'}`,
      `Amount: ${formatINRPdfSafe(transaction.amount_received)}`,
      `Mode: ${bankAccount ? 'Bank Transfer' : 'Cash'}`,
    ];

    if (bankAccount) {
      paymentLines.push(`Bank: ${getBankLabel(bankAccount)}`);
      paymentLines.push(`Account No: ${bankAccount.account_no}`);
      if (bankAccount.ifsc) {
        paymentLines.push(`IFSC: ${bankAccount.ifsc}`);
      }
    }

    paymentLines.forEach(line => {
      doc.text(line, 14, cursorY);
      cursorY += 5;
    });
  } else if (transaction.type === TransactionType.Cash) {
    cursorY += 3;
    doc.setFont(undefined, 'bold');
    doc.text('Cash Payment Details', 14, cursorY);
    doc.setFont(undefined, 'normal');
    cursorY += 6;

    const cashLines = [
      `Purpose: ${toTitleCase(transaction.cash_payment_purpose)}`,
      `Amount: ${formatINRPdfSafe(transaction.amount_received)}`,
    ];

    if (transaction.cash_description) {
      cashLines.push(`Description: ${transaction.cash_description}`);
    }

    cashLines.forEach(line => {
      doc.text(line, 14, cursorY);
      cursorY += 5;
    });
  }

  const isLineVoucher = transaction.lines.length > 0;
  if (isLineVoucher) {
    cursorY += 4;
    (doc as any).autoTable({
      startY: cursorY,
      head: [['Item', 'Bags', 'Net Wt (kg)', 'Rate', 'Amount']],
      body: transaction.lines.map(line => {
        const crop = crops.find(c => c.id === line.crop_id);
        const rateLabel = `${formatINRPdfSafe(line.rate_value)} / ${line.rate_unit
          .replace('per_', '')
          .replace('_', ' ')}`;
        return [
          crop?.name || '—',
          line.bags,
          line.net_weight_kg.toFixed(2),
          rateLabel,
          formatINRPdfSafe(line.line_amount),
        ];
      }),
      styles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (transaction.charges.length > 0) {
    (doc as any).autoTable({
      startY: cursorY,
      head: [['Charge', 'Type', 'Amount']],
      body: transaction.charges.map(charge => {
        const head = chargeHeads.find(h => h.id === charge.charge_head_id);
        const typeLabel = head?.kind === ChargeKind.Addition ? 'Addition' : 'Deduction';
        return [
          head?.name || '—',
          typeLabel,
          formatINRPdfSafe(charge.computed_amount || 0),
        ];
      }),
      styles: { fontSize: 9 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'left' },
        2: { halign: 'right' },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;
  }

  const summaryRows: Array<[string, string]> = [];

  if (isLineVoucher) {
    summaryRows.push(['Subtotal', formatINRPdfSafe(totals.subtotal)]);
    summaryRows.push(['Total Additions', formatINRPdfSafe(totals.total_additions)]);
    summaryRows.push(['Total Deductions', formatINRPdfSafe(totals.total_deductions)]);
    summaryRows.push(['Grand Total', formatINRPdfSafe(totals.grand_total)]);
    summaryRows.push(['Amount Received', formatINRPdfSafe(transaction.amount_received)]);
    summaryRows.push(['Balance', formatINRPdfSafe(totals.balance)]);
  } else if (transaction.type === TransactionType.Payment) {
    summaryRows.push(['Payment Type', transaction.payment_type ? toTitleCase(transaction.payment_type) : '—']);
    summaryRows.push(['Amount', formatINRPdfSafe(transaction.amount_received)]);
    summaryRows.push([
      'Balance Impact',
      transaction.payment_type === PaymentType.Paid
        ? formatINRPdfSafe(transaction.amount_received)
        : formatINRPdfSafe(-transaction.amount_received),
    ]);
  } else if (transaction.type === TransactionType.Cash) {
    summaryRows.push(['Amount', formatINRPdfSafe(transaction.amount_received)]);
    if (transaction.cash_payment_purpose) {
      summaryRows.push(['Purpose', toTitleCase(transaction.cash_payment_purpose)]);
    }
  }

  if (summaryRows.length > 0) {
    (doc as any).autoTable({
      startY: cursorY,
      body: summaryRows.map(row => [row[0], row[1]]),
      theme: 'plain',
      styles: { fontSize: 10, halign: 'right' },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;
  }

  doc.save(`${transaction.bill_no || transaction.id}.pdf`);
};
