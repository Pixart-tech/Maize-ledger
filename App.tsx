import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { DataProvider } from './hooks/useData';
import Dashboard from './pages/Dashboard';
import PartyMaster from './pages/masters/PartyMaster';
import VoucherEntry from './pages/transactions/VoucherEntry';
import PartyLedgerReport from './pages/reports/PartyLedgerReport';
import TransactionsDashboard from './pages/transactions/TransactionsDashboard';
import { HomeIcon, UsersIcon, DocumentAddIcon, DocumentReportIcon, SunIcon, MoonIcon, MenuIcon, XIcon, TableIcon } from './components/Icons';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };
  
  const navLinkClasses = "flex items-center px-3 py-2 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 font-medium";
  const activeNavLinkClasses = "bg-indigo-500 text-white dark:bg-indigo-600";

  const NavLinks: React.FC = () => (
    <>
      <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`} end>
        <HomeIcon />
        <span className="ml-3">Dashboard</span>
      </NavLink>
      <NavLink to="/voucher/new" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
        <DocumentAddIcon />
        <span className="ml-3">New Voucher</span>
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
        <TableIcon />
        <span className="ml-3">Transactions</span>
      </NavLink>
      <NavLink to="/masters/parties" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
        <UsersIcon />
        <span className="ml-3">Parties Master</span>
      </NavLink>
      <NavLink to="/reports/party-ledger" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
        <DocumentReportIcon />
        <span className="ml-3">Party Ledger</span>
      </NavLink>
    </>
  );

  return (
    <DataProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <span className="font-extrabold text-2xl text-slate-800 dark:text-white">MaizeLedger</span>
                  <div className="hidden md:block ml-10">
                    <div className="flex items-baseline space-x-4">
                      <NavLinks />
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                    {isDarkMode ? <SunIcon /> : <MoonIcon />}
                  </button>
                  <div className="md:hidden ml-2">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                      {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {isMobileMenuOpen && (
              <div className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  <NavLinks />
                </div>
              </div>
            )}
          </header>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/masters/parties" element={<PartyMaster />} />
              <Route path="/voucher/new" element={<VoucherEntry />} />
              <Route path="/voucher/edit/:id" element={<VoucherEntry />} />
              <Route path="/transactions" element={<TransactionsDashboard />} />
              <Route path="/reports/party-ledger" element={<PartyLedgerReport />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </DataProvider>
  );
};

export default App;