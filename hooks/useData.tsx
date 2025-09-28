
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Party, Crop, ChargeHead, BankAccount, Transaction } from '../types';
import { DEFAULT_PARTIES, DEFAULT_CROPS, DEFAULT_CHARGE_HEADS, DEFAULT_BANK_ACCOUNTS, DEFAULT_TRANSACTIONS } from '../constants';

interface DataContextType {
  parties: Party[];
  crops: Crop[];
  chargeHeads: ChargeHead[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  saveParty: (party: Party) => void;
  deleteParty: (partyId: string) => void;
  saveTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
};

const setToStorage = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [chargeHeads, setChargeHeads] = useState<ChargeHead[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const seedVersionKey = 'seeded_v2';
    if (!localStorage.getItem(seedVersionKey)) {
        setToStorage<Party[]>('parties', DEFAULT_PARTIES);
        setToStorage<Crop[]>('crops', DEFAULT_CROPS);
        setToStorage<ChargeHead[]>('chargeHeads', DEFAULT_CHARGE_HEADS);
        setToStorage<BankAccount[]>('bankAccounts', DEFAULT_BANK_ACCOUNTS);
        setToStorage<Transaction[]>('transactions', DEFAULT_TRANSACTIONS);
        localStorage.setItem(seedVersionKey, 'true');
        localStorage.removeItem('seeded');
    }
    
    setParties(getFromStorage<Party[]>('parties', []));
    setCrops(getFromStorage<Crop[]>('crops', []));
    setChargeHeads(getFromStorage<ChargeHead[]>('chargeHeads', []));
    setBankAccounts(getFromStorage<BankAccount[]>('bankAccounts', []));
    setTransactions(getFromStorage<Transaction[]>('transactions', []));
    
    setLoading(false);
  }, []);

  const saveParty = useCallback((party: Party) => {
    setParties(prevParties => {
      const existingIndex = prevParties.findIndex(p => p.id === party.id);
      let newParties;
      if (existingIndex > -1) {
        newParties = [...prevParties];
        newParties[existingIndex] = party;
      } else {
        newParties = [...prevParties, party];
      }
      setToStorage('parties', newParties);
      return newParties;
    });
  }, []);

  const deleteParty = useCallback((partyId: string) => {
    setParties(prevParties => {
      const newParties = prevParties.filter(p => p.id !== partyId);
      setToStorage('parties', newParties);
      return newParties;
    });
  }, []);

  const saveTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => {
        const existingIndex = prev.findIndex(t => t.id === transaction.id);
        let newTransactions;
        if(existingIndex > -1) {
            newTransactions = [...prev];
            newTransactions[existingIndex] = transaction;
        } else {
            newTransactions = [...prev, transaction];
        }
        setToStorage('transactions', newTransactions);
        return newTransactions;
    });
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => {
      const newTransactions = prev.filter(transaction => transaction.id !== transactionId);
      setToStorage('transactions', newTransactions);
      return newTransactions;
    });
  }, []);

  return (
    <DataContext.Provider value={{ parties, crops, chargeHeads, bankAccounts, transactions, saveParty, deleteParty, saveTransaction, deleteTransaction, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
