import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import {
  BankAccount,
  ChargeHead,
  Crop,
  Party,
  Transaction,
  TransactionType,
} from '../types';
import { calculateTransactionTotals } from './calculationService';
import { amountToWords, formatDate, formatINR } from '../utils/formatters';

interface TransactionPdfContext {
  parties: Party[];
  crops: Crop[];
  chargeHeads: ChargeHead[];
  bankAccounts: BankAccount[];
}

const FIRM_HEADER_LINES = [
  'Virupaksheshwara Traders',
  'No. 12, APMC Yard Road, Gangavathi - 583227, Koppal (KA)',
  'Phone: +91 94480 12345 | Email: virupaksheshwaratraders@example.com',
  'GSTIN: 29ABCDE1234F1Z5',
];

const MARGIN_X = 14;

const renderTable = (doc: jsPDF, options: UserOptions): number => {
  const table = autoTable(doc, options);
  const finalY = (table as unknown as { finalY?: number }).finalY;
  if (typeof finalY === 'number') {
    return finalY;
  }
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return lastTable ? lastTable.finalY : (options.startY as number) ?? MARGIN_X;
};

const getCropName = (cropId: string, crops: Crop[]): string => {
  const crop = crops.find(item => item.id === cropId);
  if (!crop) return '—';
  return crop.grade ? `${crop.name} (${crop.grade})` : crop.name;
};

const getBankAccountLabel = (bankAccountId: string | undefined, bankAccounts: BankAccount[]): string => {
  if (!bankAccountId) return '—';
  const account = bankAccounts.find(item => item.id === bankAccountId);
  if (!account) return '—';
  const parts = [account.bank_name, account.branch].filter(Boolean);
  const header = parts.length > 0 ? parts.join(' - ') : account.bank_name;
  const accountDetails = [`A/C ${account.account_no}`];
  if (account.ifsc) {
    accountDetails.push(`IFSC ${account.ifsc}`);
  }
  if (account.upi_id) {
    accountDetails.push(`UPI ${account.upi_id}`);
  }
  return `${header}\n${accountDetails.join(' | ')}`;
};

export const downloadTransactionPdf = (
  transaction: Transaction,
  context: TransactionPdfContext,
): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(FIRM_HEADER_LINES[0], MARGIN_X, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  FIRM_HEADER_LINES.slice(1).forEach((line, index) => {
    doc.text(line, MARGIN_X, 26 + index * 5);
  });

  const headerBottom = 26 + (FIRM_HEADER_LINES.length - 1) * 5;
  doc.setDrawColor(180);
  doc.line(MARGIN_X, headerBottom + 2, pageWidth - MARGIN_X, headerBottom + 2);

  let currentY = headerBottom + 10;

  const party = context.parties.find(item => item.id === transaction.party_id);
  const broker = transaction.broker_id
    ? context.parties.find(item => item.id === transaction.broker_id)
    : undefined;
  const bankAccountLabel = getBankAccountLabel(transaction.bank_account_id, context.bankAccounts);

  const totals = calculateTransactionTotals(transaction, context.chargeHeads, party);

  const metadataRows = [
    ['Voucher type', transaction.type],
    ['Voucher number', transaction.bill_no || '—'],
    ['Voucher date', transaction.date ? formatDate(transaction.date) : '—'],
    ['Party', party?.name ?? '—'],
    ['Broker', broker?.name ?? '—'],
    ['PO number', transaction.po_no || '—'],
    ['Lorry number', transaction.lorry_no || '—'],
    ['Bilty number', transaction.bilty_no || '—'],
    ['Permit number', transaction.permit_no || '—'],
    ['Destination', transaction.destination || '—'],
    ['Payment terms', transaction.payment_terms || '—'],
  ];

  currentY = renderTable(doc, {
    head: [['Field', 'Details']],
    body: metadataRows,
    startY: currentY,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, textColor: '#1e293b' },
    headStyles: { fontStyle: 'bold', textColor: '#0f172a' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  }) + 8;

  if (transaction.lines.length > 0) {
    const lineRows = transaction.lines.map((line, index) => {
      const bags = line.bags === undefined || line.bags === null ? '—' : String(line.bags);
      const netWeight =
        line.net_weight_kg === undefined || line.net_weight_kg === null
          ? '—'
          : `${line.net_weight_kg.toFixed(2)} kg`;
      const rateValue =
        line.rate_value === undefined || line.rate_value === null
          ? '—'
          : `${line.rate_value.toFixed(2)} / ${line.rate_unit.replace('per_', '')}`;

      return [
        String(index + 1),
        getCropName(line.crop_id, context.crops),
        bags,
        netWeight,
        rateValue,
        formatINR(line.line_amount ?? 0),
      ];
    });

    currentY = renderTable(doc, {
      head: [['#', 'Crop', 'Bags', 'Net weight', 'Rate', 'Amount']],
      body: lineRows,
      startY: currentY,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'right', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 30 },
      },
    }) + 8;
  } else {
    const paymentRows: string[][] = [
      ['Voucher amount', formatINR(transaction.amount_received || 0)],
      ['Payment terms', transaction.payment_terms || '—'],
      ['Bank account / Cash details', bankAccountLabel],
    ];

    if (transaction.type === TransactionType.Payment) {
      paymentRows.splice(1, 0, ['Payment type', transaction.payment_type ?? '—']);
    }

    if (transaction.type === TransactionType.Cash) {
      paymentRows.push(['Purpose', transaction.cash_payment_purpose || '—']);
      paymentRows.push(['Description', transaction.cash_description || '—']);
    }

    currentY = renderTable(doc, {
      head: [['Payment details', '']],
      body: paymentRows,
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2, textColor: '#1e293b' },
      headStyles: { fontStyle: 'bold', textColor: '#0f172a' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    }) + 8;
  }

  if (transaction.charges.length > 0) {
    const chargeRows = transaction.charges.map(charge => {
      const head = context.chargeHeads.find(item => item.id === charge.charge_head_id);
      const name = head?.name ?? 'Charge';
      const kind = head?.kind ?? '—';
      const amount = charge.computed_amount ?? 0;
      return [name, kind, formatINR(amount)];
    });

    currentY = renderTable(doc, {
      head: [['Charge head', 'Kind', 'Amount']],
      body: chargeRows,
      startY: currentY,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      columnStyles: {
        1: { halign: 'center', cellWidth: 28 },
        2: { halign: 'right', cellWidth: 30 },
      },
    }) + 8;
  }

  const amountReceivedLabel = transaction.type === TransactionType.Payment || transaction.type === TransactionType.Cash
    ? 'Amount paid / received'
    : 'Amount received';

  const summaryRows = [
    ['Subtotal', formatINR(totals.subtotal)],
    ['Total additions', formatINR(totals.total_additions)],
    ['Total deductions', formatINR(totals.total_deductions)],
    ['Grand total', formatINR(totals.grand_total)],
    [amountReceivedLabel, formatINR(transaction.amount_received)],
    ['Balance', formatINR(totals.balance)],
  ];

  currentY = renderTable(doc, {
    head: [['Summary', 'Amount']],
    body: summaryRows,
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
  }) + 8;

  const amountReference = transaction.lines.length > 0 ? totals.grand_total : transaction.amount_received;
  const amountWords = amountToWords(amountReference);
  const amountInWordsLabel = `Amount in words: ${amountWords || '—'}`;
  const wrappedAmountLines = doc.splitTextToSize(amountInWordsLabel, pageWidth - MARGIN_X * 2);

  doc.setFont('helvetica', 'italic');
  doc.text(wrappedAmountLines, MARGIN_X, currentY);
  currentY += wrappedAmountLines.length * 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Remarks', MARGIN_X, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const remarksText = transaction.remarks?.trim() || '—';
  const wrappedRemarks = doc.splitTextToSize(remarksText, pageWidth - MARGIN_X * 2);
  doc.text(wrappedRemarks, MARGIN_X, currentY + 12);

  const filename = `${transaction.bill_no || transaction.id || 'transaction'}-${transaction.date || 'voucher'}.pdf`;
  doc.save(filename);
};
