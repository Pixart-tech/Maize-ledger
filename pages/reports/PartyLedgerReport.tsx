import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { calculateTransactionTotals } from '../../services/calculationService';
import { formatDate, formatINR } from '../../utils/formatters';
import { PaymentType, TransactionType } from '../../types';

declare const jsPDF: any;
declare const XLSX: any;

const PartyLedgerReport: React.FC = () => {
    const { parties, transactions, chargeHeads, loading } = useData();
    const [selectedPartyId, setSelectedPartyId] = useState<string>('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const filteredTransactions = useMemo(() => {
        if (!selectedPartyId) return [];
        return transactions
            .filter(tx => tx.party_id === selectedPartyId)
            .filter(tx => {
                if (!dateRange.start || !dateRange.end) return true;
                return tx.date >= dateRange.start && tx.date <= dateRange.end;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedPartyId, transactions, dateRange]);

    const ledgerData = useMemo(() => {
        let balance = 0;
        return filteredTransactions.map(tx => {
            let debit = 0;
            let credit = 0;
            let narrative: string = tx.type;

            if (tx.type === TransactionType.Payment) {
                if (tx.payment_type === PaymentType.Paid) {
                    debit = tx.amount_received;
                    narrative = 'Payment (Paid)';
                } else {
                    credit = tx.amount_received;
                    narrative = 'Payment (Received)';
                }
            } else if (tx.type === TransactionType.Cash) {
                debit = tx.amount_received;
                const cashDetails = [tx.cash_payment_purpose, tx.cash_description?.trim()].filter(Boolean).join(' – ');
                narrative = 'Cash Payment';
                if (cashDetails) {
                    narrative += ` - ${cashDetails}`;
                }
            } else {
                const party = parties.find(p => p.id === tx.party_id);
                const totals = calculateTransactionTotals(tx, chargeHeads, party);
                debit = totals.grand_total;
                credit = tx.amount_received;
            }

            balance += (debit - credit);

            return {
                id: tx.id,
                date: tx.date,
                bill_no: tx.bill_no,
                type: narrative,
                debit,
                credit,
                balance,
            };
        });
    }, [filteredTransactions, parties, chargeHeads]);

    const handleExportExcel = () => {
        const selectedParty = parties.find(p => p.id === selectedPartyId);
        const dataToExport = ledgerData.map(item => ({
            Date: formatDate(item.date),
            'Bill No': item.bill_no,
            Type: item.type,
            Debit: item.debit,
            Credit: item.credit,
            Balance: item.balance
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Party Ledger");
        XLSX.writeFile(workbook, `${selectedParty?.name || 'Party'}_Ledger.xlsx`);
    };
    
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const selectedParty = parties.find(p => p.id === selectedPartyId);

        if (typeof doc.autoTable !== 'function') {
            window?.alert?.('PDF export is currently unavailable. Please try again later.');
            console.error('jsPDF autoTable plugin is not loaded.');
            return;
        }

        doc.setFontSize(18);
        doc.text(`Ledger for ${selectedParty?.name || 'N/A'}`, 14, 22);
        
        doc.autoTable({
            startY: 30,
            head: [['Date', 'Bill No', 'Type', 'Debit', 'Credit', 'Balance']],
            body: ledgerData.map(item => [
                formatDate(item.date),
                item.bill_no,
                item.type,
                formatINR(item.debit),
                formatINR(item.credit),
                formatINR(item.balance)
            ]),
            styles: { halign: 'right' },
            columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' }, 2: { halign: 'left' } }
        });

        doc.save(`${selectedParty?.name || 'Party'}_Ledger.pdf`);
    };

    if (loading) return <p className="text-center p-8">Loading report...</p>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Party Ledger Report</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium">Party</label>
                        <select value={selectedPartyId} onChange={e => setSelectedPartyId(e.target.value)} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="">Select a Party</option>
                            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Start Date</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">End Date</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportExcel} disabled={!selectedPartyId || ledgerData.length === 0} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400 font-medium">Export Excel</button>
                        <button onClick={handleExportPDF} disabled={!selectedPartyId || ledgerData.length === 0} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-slate-400 font-medium">Export PDF</button>
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300">
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Bill No</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold text-right">Debit</th>
                                <th className="p-4 font-semibold text-right">Credit</th>
                                <th className="p-4 font-semibold text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledgerData.map(item => (
                                <tr key={item.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">{formatDate(item.date)}</td>
                                    <td className="p-4">{item.bill_no}</td>
                                    <td className="p-4">{item.type}</td>
                                    <td className="p-4 text-right font-mono text-red-500">{formatINR(item.debit)}</td>
                                    <td className="p-4 text-right font-mono text-green-500">{formatINR(item.credit)}</td>
                                    <td className="p-4 text-right font-mono">{formatINR(item.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {!selectedPartyId && <p className="text-center p-6 text-slate-500">Please select a party to view the ledger.</p>}
                     {selectedPartyId && ledgerData.length === 0 && <p className="text-center p-6 text-slate-500">No transactions found for the selected party in this period.</p>}
                </div>
            </div>
        </div>
    );
};

export default PartyLedgerReport;