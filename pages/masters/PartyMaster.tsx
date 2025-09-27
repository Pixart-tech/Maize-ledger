import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { Party, PartyType } from '../../types';
import { PencilIcon, TrashIcon } from '../../components/Icons';

const PartyModal: React.FC<{ party: Partial<Party> | null, onClose: () => void, onSave: (party: Party) => void }> = ({ party, onClose, onSave }) => {
    if (!party) return null;

    const [formData, setFormData] = useState<Partial<Party>>(party);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: formData.id || `party_${new Date().getTime()}`,
            name: formData.name || '',
            type: formData.type || PartyType.Customer,
            mobile: formData.mobile || '',
            address: formData.address || '',
            is_zero_dalal: formData.is_zero_dalal || false,
            tds_applicable: formData.tds_applicable || false,
            tds_rate_percent: Number(formData.tds_rate_percent) || 1,
            asami_flag: formData.asami_flag || false,
            asami_commission_percent: Number(formData.asami_commission_percent) || 0,
            ...formData,
        });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{formData.id ? 'Edit Party' : 'Add New Party'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                            <select name="type" value={formData.type || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">
                                {Object.values(PartyType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile</label>
                            <input type="text" name="mobile" value={formData.mobile || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">GSTIN</label>
                            <input type="text" name="gstin" value={formData.gstin || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                        <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <input id="tds_applicable" name="tds_applicable" type="checkbox" checked={formData.tds_applicable || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded mt-1" />
                            <div className="ml-3 text-sm">
                                <label htmlFor="tds_applicable" className="font-medium text-slate-700 dark:text-slate-300">TDS Applicable</label>
                            </div>
                        </div>
                        {formData.tds_applicable && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">TDS Rate %</label>
                                <input type="number" step="0.01" name="tds_rate_percent" value={formData.tds_rate_percent || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                        )}
                        <div className="flex items-start">
                            <input id="is_zero_dalal" name="is_zero_dalal" type="checkbox" checked={formData.is_zero_dalal || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded mt-1" />
                            <div className="ml-3 text-sm">
                                <label htmlFor="is_zero_dalal" className="font-medium text-slate-700 dark:text-slate-300">Zero Dalal</label>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">Save Party</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PartyMaster: React.FC = () => {
    const { parties, saveParty, deleteParty, loading } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedParty, setSelectedParty] = useState<Partial<Party> | null>(null);

    const handleAddNew = () => {
        setSelectedParty({});
        setIsModalOpen(true);
    };

    const handleEdit = (party: Party) => {
        setSelectedParty(party);
        setIsModalOpen(true);
    };

    const handleDelete = (partyId: string) => {
        if (window.confirm('Are you sure you want to delete this party?')) {
            deleteParty(partyId);
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Parties Master</h1>
                <button onClick={handleAddNew} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm">Add New Party</button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300">
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Mobile</th>
                                <th className="p-4 font-semibold">Address</th>
                                <th className="p-4 font-semibold text-center">TDS</th>
                                <th className="p-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan={6} className="text-center p-6">Loading parties...</td></tr>) :
                             parties.map(party => (
                                <tr key={party.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4 font-medium">{party.name}</td>
                                    <td className="p-4">{party.type}</td>
                                    <td className="p-4">{party.mobile}</td>
                                    <td className="p-4 max-w-xs truncate">{party.address}</td>
                                    <td className="p-4 text-center">{party.tds_applicable ? `${party.tds_rate_percent}%` : 'No'}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleEdit(party)} className="text-indigo-500 hover:text-indigo-700 mr-2 p-1"><PencilIcon /></button>
                                        <button onClick={() => handleDelete(party.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <PartyModal party={selectedParty} onClose={() => setIsModalOpen(false)} onSave={saveParty} />}
        </div>
    );
};

export default PartyMaster;