import React from 'react';
import { useData } from '../hooks/useData';
import { calculateTransactionTotals } from '../services/calculationService';
import { formatINR, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { DocumentAddIcon, UsersIcon, DocumentReportIcon } from '../components/Icons';

const Dashboard: React.FC = () => {
    const { transactions, parties, loading, chargeHeads } = useData();

    if (loading) {
        return <div className="text-center p-8">Loading dashboard data...</div>;
    }

    const today = new Date().toISOString().slice(0, 10);
    const todaysTransactions = transactions.filter(t => t.date === today);

    let totalOutstanding = 0;
    const partyBalances: { [key: string]: number } = {};

    transactions.forEach(tx => {
        const party = parties.find(p => p.id === tx.party_id);
        const totals = calculateTransactionTotals(tx, chargeHeads, party);
        if (!partyBalances[tx.party_id]) {
            partyBalances[tx.party_id] = 0;
        }
        partyBalances[tx.party_id] += totals.balance;
    });

    Object.values(partyBalances).forEach(balance => {
        if (balance > 0) {
            totalOutstanding += balance;
        }
    });

    const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const StatCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 ${color}`}>
            <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-300">{title}</h2>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{value}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Today's Vouchers" value={todaysTransactions.length} color="border-indigo-500" />
                <StatCard title="Total Parties" value={parties.length} color="border-green-500" />
                <StatCard title="Total Outstanding" value={formatINR(totalOutstanding)} color="border-amber-500" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Recent Transactions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300">
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Bill No</th>
                                <th className="p-4 font-semibold">Party</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map(tx => {
                                const party = parties.find(p => p.id === tx.party_id);
                                const totals = calculateTransactionTotals(tx, chargeHeads, party);
                                return (
                                    <tr key={tx.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4">{formatDate(tx.date)}</td>
                                        <td className="p-4">{tx.bill_no}</td>
                                        <td className="p-4 font-medium">{party?.name || 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.type === 'Sale' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono">{formatINR(totals.grand_total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {recentTransactions.length === 0 && <p className="text-center text-slate-500 py-6">No transactions found.</p>}
            </div>
        </div>
    );
};

export default Dashboard;