import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { calculateTransactionTotals } from '../../services/calculationService';
import { formatDate, formatINR } from '../../utils/formatters';
import { Transaction, TransactionType } from '../../types';
import { exportVoucherPDF } from '../../services/voucherPdfService';
import { DownloadIcon, PencilIcon, TrashIcon } from '../../components/Icons';

const TransactionsDashboard: React.FC = () => {
  const { transactions, parties, chargeHeads, crops, bankAccounts, deleteTransaction, loading } = useData();
  const navigate = useNavigate();

  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    const loweredSearch = searchTerm.trim().toLowerCase();

    return transactions
      .filter(tx => {
        if (selectedPartyId && tx.party_id !== selectedPartyId) return false;
        if (selectedTransactionType && tx.type !== selectedTransactionType) return false;
        if (dateRange.start && tx.date < dateRange.start) return false;
        if (dateRange.end && tx.date > dateRange.end) return false;

        if (loweredSearch) {
          const partyName = parties.find(p => p.id === tx.party_id)?.name.toLowerCase() ?? '';
          const brokerName = tx.broker_id ? (parties.find(p => p.id === tx.broker_id)?.name.toLowerCase() ?? '') : '';
          const haystack = [
            tx.bill_no,
            tx.po_no,
            tx.lorry_no,
            tx.bilty_no,
            tx.permit_no,
            partyName,
            brokerName,
            tx.type
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(loweredSearch);
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPartyId, selectedTransactionType, dateRange, searchTerm, parties]);

  const handleDelete = (transactionId: string) => {
    const transaction = transactions.find(tx => tx.id === transactionId);
    const partyName = transaction ? parties.find(p => p.id === transaction.party_id)?.name : '';

    if (window.confirm(`Delete voucher ${transaction?.bill_no || ''}${partyName ? ` for ${partyName}` : ''}?`)) {
      deleteTransaction(transactionId);
    }
  };

  const handleExport = (transaction: Transaction) => {
    exportVoucherPDF(transaction, { parties, chargeHeads, crops, bankAccounts });
  };

  if (loading) {
    return <p className="text-center p-8">Loading transactions...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Transactions</h1>
        <button
          onClick={() => navigate('/voucher/new')}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
        >
          Create Voucher
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Party</label>
            <select
              value={selectedPartyId}
              onChange={event => setSelectedPartyId(event.target.value)}
              className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Parties</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Transaction Type</label>
            <select
              value={selectedTransactionType}
              onChange={event => setSelectedTransactionType(event.target.value)}
              className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              {Object.values(TransactionType).map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={event => setDateRange(prev => ({ ...prev, start: event.target.value }))}
              className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={event => setDateRange(prev => ({ ...prev, end: event.target.value }))}
              className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Search</label>
            <input
              type="text"
              value={searchTerm}
              placeholder="Search by bill number, party, broker, or reference"
              onChange={event => setSearchTerm(event.target.value)}
              className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
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
                <th className="p-4 font-semibold">Party</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-right">Subtotal</th>
                <th className="p-4 font-semibold text-right">Additions</th>
                <th className="p-4 font-semibold text-right">Deductions</th>
                <th className="p-4 font-semibold text-right">Grand Total</th>
                <th className="p-4 font-semibold text-right">Received</th>
                <th className="p-4 font-semibold text-right">Balance</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => {
                const party = parties.find(p => p.id === transaction.party_id);
                const totals = calculateTransactionTotals(transaction, chargeHeads, party);

                return (
                  <tr key={transaction.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 whitespace-nowrap">{formatDate(transaction.date)}</td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-200">{transaction.bill_no}</td>
                    <td className="p-4">{party?.name || '—'}</td>
                    <td className="p-4">{transaction.type}</td>
                    <td className="p-4 text-right font-mono">{formatINR(totals.subtotal)}</td>
                    <td className="p-4 text-right font-mono text-green-500">{formatINR(totals.total_additions)}</td>
                    <td className="p-4 text-right font-mono text-red-500">{formatINR(totals.total_deductions)}</td>
                    <td className="p-4 text-right font-mono font-semibold">{formatINR(totals.grand_total)}</td>
                    <td className="p-4 text-right font-mono">{formatINR(transaction.amount_received)}</td>
                    <td className="p-4 text-right font-mono">{formatINR(totals.balance)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleExport(transaction)}
                          className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/40"
                          title="Download Voucher PDF"
                        >
                          <DownloadIcon />
                        </button>
                        <button
                          onClick={() => navigate(`/voucher/edit/${transaction.id}`)}
                          className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-600/40"
                          title="Edit Voucher"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 rounded-md bg-rose-50 dark:bg-rose-600/20 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-600/40"
                          title="Delete Voucher"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <p className="text-center p-6 text-slate-500">No transactions found for the selected filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsDashboard;
