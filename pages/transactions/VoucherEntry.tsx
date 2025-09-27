import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Transaction, TransactionLine, TransactionType, RateUnit, TransactionTotals, Party, ChargeKind, PartyType, PaymentType, ChargeHead } from '../../types';
import { calculateNetWeight, calculateLineAmount, calculateTransactionTotals } from '../../services/calculationService';
import { getTodayDateString, formatINR } from '../../utils/formatters';
import { TrashIcon } from '../../components/Icons';
import { QUINTAL_IN_KG } from '../../constants';

const initialLine: Omit<TransactionLine, 'id' | 'transaction_id'> = {
    crop_id: '',
    bags: 0,
    unloaded_weight_kg: 0,
    suite_percent: 0,
    net_weight_kg: 0,
    rate_value: 0,
    rate_unit: RateUnit.per_quintal,
    line_amount: 0,
};

const VoucherEntry: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { transactions, parties, crops, chargeHeads, bankAccounts, saveTransaction, loading } = useData();

    const [voucher, setVoucher] = useState<Transaction>({
        id: id || `tx_${new Date().getTime()}`,
        date: getTodayDateString(),
        type: TransactionType.Purchase,
        party_id: '',
        bill_no: '',
        lines: [],
        charges: [],
        amount_received: 0,
        payment_type: PaymentType.Received,
    });
    const [totals, setTotals] = useState<TransactionTotals>({ subtotal: 0, total_additions: 0, total_deductions: 0, tds_amount: 0, grand_total: 0, balance: 0 });
    const [selectedParty, setSelectedParty] = useState<Party | undefined>(undefined);

    const brokers = useMemo(() => parties.filter(p => p.type === PartyType.Broker), [parties]);
    
    const filteredParties = useMemo(() => {
        const purchaseTypes = [TransactionType.Purchase, TransactionType.Asami, TransactionType.ZeroDalal];
        if (purchaseTypes.includes(voucher.type)) {
            return parties.filter(p => p.type === PartyType.Supplier);
        }
        if (voucher.type === TransactionType.Sale) {
            return parties.filter(p => p.type === PartyType.Customer);
        }
        return parties.filter(p => p.type !== PartyType.Broker);
    }, [parties, voucher.type]);

    const isSpecialPurchase = useMemo(() =>
        voucher.type === TransactionType.Asami || voucher.type === TransactionType.ZeroDalal,
        [voucher.type]
    );

    const amountReceivedLabel = useMemo(() =>
        isSpecialPurchase ? 'Cash Paid' : 'Amount Received',
        [isSpecialPurchase]
    );

    useEffect(() => {
        if (id) {
            const existingVoucher = transactions.find(t => t.id === id);
            if (existingVoucher) {
                setVoucher(existingVoucher);
            }
        }
    }, [id, transactions]);

    useEffect(() => {
        const party = parties.find(p => p.id === voucher.party_id);
        setSelectedParty(party);

        if ([TransactionType.Payment, TransactionType.Sale].includes(voucher.type) || voucher.lines.length === 0) {
             if(voucher.charges.length > 0) setVoucher(prev => ({...prev, charges: []}));
             return;
        }
        
        let relevantChargeHeads: ChargeHead[] = [];
        switch (voucher.type) {
            case TransactionType.Asami:
                relevantChargeHeads = chargeHeads.filter(ch => ch.name === 'Hamali' || ch.name === 'Dalali');
                break;
            case TransactionType.ZeroDalal:
                 relevantChargeHeads = []; // For Zero Dalal, charges are handled by checkboxes
                 break;
            case TransactionType.Purchase:
                relevantChargeHeads = chargeHeads.filter(ch => ch.is_default);
                break;
        }

        const newCharges = relevantChargeHeads.map(ch => ({
            id: `tc_${ch.id}_${voucher.id}`,
            transaction_id: voucher.id,
            charge_head_id: ch.id,
            computed_amount: 0,
        }));
        
        const currentChargeIds = voucher.charges.map(c => c.charge_head_id).sort();
        const newChargeIds = newCharges.map(c => c.charge_head_id).sort();

        if (JSON.stringify(currentChargeIds) !== JSON.stringify(newChargeIds)) {
             setVoucher(prev => ({ ...prev, charges: newCharges }));
        }

    }, [voucher.party_id, voucher.type, voucher.lines.length, parties, chargeHeads, voucher.id]);


    useEffect(() => {
        if(voucher.type === TransactionType.Payment) {
            setTotals({ subtotal: 0, total_additions: 0, total_deductions: 0, tds_amount: 0, grand_total: 0, balance: 0 });
            return;
        };
        const party = parties.find(p => p.id === voucher.party_id);
        const newTotals = calculateTransactionTotals(voucher, chargeHeads, party);
        setTotals(newTotals);
    }, [voucher, chargeHeads, parties]);
    
    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setVoucher(prev => {
            const newVoucher = { ...prev, [name]: value };
            if (name === 'type') {
                newVoucher.party_id = '';
                newVoucher.lines = [];
                newVoucher.charges = [];
                newVoucher.amount_received = 0;
            }
            return newVoucher;
        });
    };

    const handleLineChange = (index: number, field: keyof TransactionLine | 'unloaded_weight_quintal', value: string) => {
        const newLines = [...voucher.lines];
        const line = { ...newLines[index] };
        
        let customLine: Partial<TransactionLine> = {};
        
        if (field === 'unloaded_weight_quintal') {
            customLine.unloaded_weight_kg = (parseFloat(value) || 0) * QUINTAL_IN_KG;
        } else {
            // @ts-ignore
            customLine[field] = value;
        }

        const updatedLine = { ...line, ...customLine };

        const numericLine = {
            ...updatedLine,
            bags: parseFloat(String(updatedLine.bags)) || 0,
            unloaded_weight_kg: parseFloat(String(updatedLine.unloaded_weight_kg)) || 0,
            suite_percent: voucher.type === TransactionType.Sale ? 0 : (parseFloat(String(updatedLine.suite_percent)) || 0),
            rate_value: parseFloat(String(updatedLine.rate_value)) || 0,
        };
        
        const net_weight_kg = calculateNetWeight(numericLine, voucher.type);
        const line_amount = calculateLineAmount({ ...numericLine, net_weight_kg });
        
        newLines[index] = { ...numericLine, net_weight_kg, line_amount };

        setVoucher(prev => ({ ...prev, lines: newLines }));
    };

    const handleZeroDalalChargeToggle = (chargeName: 'Hamali' | 'Dalali') => {
        const chargeHead = chargeHeads.find(ch => ch.name === chargeName);
        if (!chargeHead) return;
    
        setVoucher(prev => {
            const chargeExists = prev.charges.some(c => c.charge_head_id === chargeHead.id);
            let newCharges;
    
            if (chargeExists) {
                newCharges = prev.charges.filter(c => c.charge_head_id !== chargeHead.id);
            } else {
                newCharges = [
                    ...prev.charges,
                    {
                        id: `tc_${chargeHead.id}_${prev.id}`,
                        transaction_id: prev.id,
                        charge_head_id: chargeHead.id,
                        computed_amount: 0,
                    },
                ];
            }
            return { ...prev, charges: newCharges };
        });
    };
    
    const handleAddLine = () => {
        const crop = crops.length > 0 ? crops[0] : undefined;
        setVoucher(prev => ({
            ...prev,
            lines: [
                ...prev.lines,
                { ...initialLine, crop_id: crop?.id || '', id: `line_${new Date().getTime()}`, transaction_id: voucher.id }
            ]
        }));
    };

    const handleRemoveLine = (index: number) => {
        setVoucher(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));
    };
    
    const handleSave = () => {
        if (!voucher.party_id) {
            alert('Please select a party.');
            return;
        }
        if (voucher.type === TransactionType.Payment) {
            saveTransaction({
                ...voucher,
                lines: [],
                charges: [],
                bill_no: voucher.payment_type === PaymentType.Received ? 'Receipt' : 'Payment',
            });
        } else {
            const finalTotals = calculateTransactionTotals(voucher, chargeHeads, selectedParty);
            const finalVoucher = {
                ...voucher,
                ...finalTotals,
            };
            saveTransaction(finalVoucher);
        }
        navigate('/');
    };
    
    if (loading) return <p>Loading...</p>;

    const isPurchaseLike = [TransactionType.Purchase, TransactionType.Asami, TransactionType.ZeroDalal].includes(voucher.type);
    const billNoLabel = voucher.type === TransactionType.Asami ? 'Patti No.' : 'Bill No.';
    
    let grandTotalLabel = 'Grand Total';
    if(voucher.type === TransactionType.Asami) grandTotalLabel = 'Patti Amount';
    if(voucher.type === TransactionType.ZeroDalal) grandTotalLabel = 'Zero Dalal Bill Amount';

    const tableHeaders = isPurchaseLike
        ? ['Crop', 'Bags', 'Unloaded Wt. (Qtl)', 'Suite (%)', 'Net Wt.', 'Rate', 'Unit', 'Amount', '']
        : ['Crop', 'Bags', 'Loaded Wt. (Qtl)', 'Rate', 'Unit', 'Amount', ''];

    const renderInputField = (value: number | string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, className = "w-full") => (
        <input 
            type="number" 
            value={value || ''} 
            onChange={onChange}
            className={`block rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 ${className}`}
        />
    );

    const renderSelectField = (value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {key: string, value: string}[]) => (
        <select value={value} onChange={onChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">
            {options.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
        </select>
    );

    if (voucher.type === TransactionType.Payment) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-2xl mx-auto">
                <div className="p-6 border-b dark:border-slate-700">
                    <h1 className="text-2xl font-bold">New Payment Voucher</h1>
                </div>
                <div className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium">Type</label><select name="type" value={voucher.type} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600">{Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="block text-sm font-medium">Payment Type</label><select name="payment_type" value={voucher.payment_type} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600">{Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="block text-sm font-medium">Date</label><input type="date" name="date" value={voucher.date} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600" /></div>
                    <div>
                        <label className="block text-sm font-medium">Party</label>
                        <select name="party_id" value={voucher.party_id} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600">
                            <option value="">Select Party</option>
                            {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Bank Name</label>
                        <select name="bank_account_id" value={voucher.bank_account_id || ''} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600">
                            <option value="">Select Bank</option>
                            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Amount</label>
                        <input type="number" name="amount_received" value={voucher.amount_received || ''} onChange={e => setVoucher(p => ({...p, amount_received: parseFloat(e.target.value) || 0}))} className="w-full mt-1 dark:bg-slate-600 rounded-md shadow-sm border-slate-300 dark:border-slate-500 font-mono text-right" />
                    </div>
                </div>
                <div className="flex justify-end p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg space-x-4">
                    <button onClick={() => navigate('/')} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 font-medium">Cancel</button>
                    <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">Save Payment</button>
                </div>
            </div>
        );
    }

    return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{id ? 'Edit' : 'New'} Voucher</h1>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div><label className="block text-sm font-medium">Type</label><select name="type" value={voucher.type} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600">{Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-medium">Date</label><input type="date" name="date" value={voucher.date} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600" /></div>
                <div><label className="block text-sm font-medium">{billNoLabel}</label><input type="text" name="bill_no" value={voucher.bill_no} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600" /></div>
                
                <div>
                    <label className="block text-sm font-medium">Party</label>
                    <select name="party_id" value={voucher.party_id} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600">
                        <option value="">Select Party</option>
                        {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {!isSpecialPurchase && (
                    <>
                        <div>
                            <label className="block text-sm font-medium">Broker</label>
                            <select name="broker_id" value={voucher.broker_id || ''} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600">
                                <option value="">Select Broker</option>
                                {brokers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        
                        <div><label className="block text-sm font-medium">PO Number</label><input type="text" name="po_no" value={voucher.po_no || ''} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600" /></div>
                        <div><label className="block text-sm font-medium">Payment Days</label><input type="number" name="payment_terms" value={voucher.payment_terms || ''} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600" /></div>
                        <div><label className="block text-sm font-medium">Destination</label><input type="text" name="destination" value={voucher.destination || ''} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600" /></div>
                        <div><label className="block text-sm font-medium">Lorry No.</label><input type="text" name="lorry_no" value={voucher.lorry_no || ''} onChange={handleHeaderChange} className="mt-1 w-full dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600" /></div>
                    </>
                )}
            </div>
        </div>
      </div>
      
      {/* Lines */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            <div className="overflow-x-auto -mx-6">
                <table className="min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            {tableHeaders.map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {voucher.lines.map((line, index) => {
                            const selectedCrop = crops.find(c => c.id === line.crop_id);
                            return (
                            <tr key={line.id}>
                                <td className="p-2 w-48">
                                    {renderSelectField(line.crop_id, e => handleLineChange(index, 'crop_id', e.target.value), [{key: "", value: "Select Crop"}, ...crops.map(c => ({key: c.id, value: c.name}))])}
                                    {selectedCrop?.hsn_code && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">HSN: {selectedCrop.hsn_code}</div>}
                                </td>
                                <td className="p-2 w-24">{renderInputField(line.bags, e => handleLineChange(index, 'bags', e.target.value))}</td>
                                <td className="p-2 w-32">{renderInputField(line.unloaded_weight_kg / QUINTAL_IN_KG, e => handleLineChange(index, 'unloaded_weight_quintal', e.target.value))}</td>
                                {isPurchaseLike && <td className="p-2 w-24">{renderInputField(line.suite_percent, e => handleLineChange(index, 'suite_percent', e.target.value))}</td>}
                                {isPurchaseLike && <td className="p-2 w-28 font-mono text-right">{line.net_weight_kg.toFixed(2)}</td>}
                                <td className="p-2 w-28">{renderInputField(line.rate_value, e => handleLineChange(index, 'rate_value', e.target.value))}</td>
                                <td className="p-2 w-36">{renderSelectField(line.rate_unit, e => handleLineChange(index, 'rate_unit', e.target.value as RateUnit), Object.values(RateUnit).map(u => ({key: u, value: u})))}</td>
                                <td className="p-2 w-40 font-mono text-right">{formatINR(line.line_amount)}</td>
                                <td className="p-2"><button onClick={() => handleRemoveLine(index)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button></td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            {voucher.lines.length === 0 && <p className="text-center text-slate-500 py-6">No items added yet.</p>}
            <button onClick={handleAddLine} className="mt-4 px-4 py-2 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 font-medium">Add Line</button>
        </div>
      </div>

      {/* Totals & Charges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-3">
            <h3 className="font-semibold text-lg border-b dark:border-slate-700 pb-2">Charges</h3>
            
            {voucher.type === TransactionType.ZeroDalal && (
                <div className="space-y-2 pt-2">
                    <div className="flex items-center">
                        <input id="hamali_toggle" type="checkbox" checked={voucher.charges.some(c => c.charge_head_id === 'ch_hamali')} onChange={() => handleZeroDalalChargeToggle('Hamali')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"/>
                        <label htmlFor="hamali_toggle" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">Apply Hamali</label>
                    </div>
                    <div className="flex items-center">
                        <input id="dalali_toggle" type="checkbox" checked={voucher.charges.some(c => c.charge_head_id === 'ch_dalali')} onChange={() => handleZeroDalalChargeToggle('Dalali')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"/>
                        <label htmlFor="dalali_toggle" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">Apply Dalali</label>
                    </div>
                </div>
            )}
            
            {voucher.charges.map(charge => {
                const head = chargeHeads.find(h => h.id === charge.charge_head_id);
                if(!head) return null;
                return (
                    <div key={charge.id} className="flex justify-between items-center text-sm">
                        <span className={head.kind === ChargeKind.Addition ? 'text-green-600' : 'text-slate-600 dark:text-slate-300'}>{head.name}</span>
                        <span className="font-mono">{formatINR(charge.computed_amount)}</span>
                    </div>
                );
            })}
             {voucher.charges.length === 0 && voucher.type !== TransactionType.ZeroDalal && <p className="text-sm text-slate-500 pt-2">No charges applied.</p>}
        </div>
        <div className="space-y-3 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between font-medium"><p>Subtotal</p><p className="font-mono">{formatINR(totals.subtotal)}</p></div>
            <div className="flex justify-between text-green-600"><p>Additions</p><p className="font-mono">{formatINR(totals.total_additions)}</p></div>
            <div className={`flex justify-between ${!isPurchaseLike && 'text-red-600'}`}><p>{isPurchaseLike ? 'Expenses' : 'Deductions'}</p><p className="font-mono">{formatINR(totals.total_deductions)}</p></div>
            <div className="border-t dark:border-slate-700 my-2"></div>
            <div className="flex justify-between text-xl font-bold"><p>{grandTotalLabel}</p><p className="font-mono">{formatINR(totals.grand_total)}</p></div>
            <div className="flex items-center justify-between pt-2"><label className="font-medium">{amountReceivedLabel}</label><input type="number" value={voucher.amount_received || ''} onChange={e => setVoucher(p => ({...p, amount_received: parseFloat(e.target.value) || 0}))} className="w-36 dark:bg-slate-700 rounded-md shadow-sm border-slate-300 dark:border-slate-600 font-mono text-right" /></div>
            <div className="flex justify-between text-lg font-semibold text-indigo-500"><p>Balance</p><p className="font-mono">{formatINR(totals.balance)}</p></div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end mt-6 space-x-4">
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 font-medium">Cancel</button>
        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold shadow-sm">Save Voucher</button>
      </div>
    </div>
    );
};

export default VoucherEntry;