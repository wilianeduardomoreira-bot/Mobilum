
import React, { useState, useEffect } from 'react';
import { Transaction, Employee, ActivityType } from '../../types';
import { Plus, Minus, Search, List, Lock, Clock, Unlock } from 'lucide-react';
import CashierClosingView from './CashierClosingView';

interface CashierViewProps {
  employees?: Employee[];
  isShiftOpen: boolean;
  shiftData: {
    operator: string;
    startingFloat: number;
    startTime: Date;
    shiftName: string;
  };
  onOpenShift: (operator: string, float: number, shiftName: string) => void;
  onCloseShift: () => void;
  addLog?: (type: ActivityType, action: string, description: string, user?: string) => void;
  transactions?: Transaction[];
  addTransaction?: (transaction: Transaction) => void;
}

const CashierView: React.FC<CashierViewProps> = ({ 
  employees = [], 
  isShiftOpen, 
  shiftData, 
  onOpenShift, 
  onCloseShift,
  addLog,
  transactions = [],
  addTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'control' | 'closing'>('control');
  const [currentShift, setCurrentShift] = useState('');
  const [isNavHovered, setIsNavHovered] = useState(false);
  
  // Shift Detection Logic for Display when closed
  useEffect(() => {
    const updateShift = () => {
      const hour = new Date().getHours();
      if (hour >= 7 && hour < 15) {
        setCurrentShift('Turno 1 (07h - 15h)');
      } else if (hour >= 15 && hour < 23) {
        setCurrentShift('Turno 2 (15h - 23h)');
      } else {
        setCurrentShift('Turno 3 (23h - 07h)');
      }
    };
    
    updateShift();
    const interval = setInterval(updateShift, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleInternalOpenShift = (operator: string, float: number, shiftName: string) => {
    onOpenShift(operator, float, shiftName);
    setActiveTab('control'); // Redirect to control view after opening
  };
  
  // Simple handler to simulate transaction entry for logging purposes
  const handleAddTransaction = (type: 'income' | 'expense') => {
      if (!isShiftOpen) return alert('O caixa precisa estar aberto.');
      const desc = prompt(`Descrição da ${type === 'income' ? 'Entrada' : 'Saída'}:`);
      if (!desc) return;
      const valStr = prompt('Valor (R$):');
      if (!valStr) return;
      const val = parseFloat(valStr);
      if (isNaN(val)) return alert('Valor inválido');

      if (addTransaction) {
          addTransaction({
              id: Date.now().toString(),
              description: desc,
              amount: val,
              type,
              date: new Date().toLocaleString(),
              category: 'Manual',
              paymentMethod: 'cash' // Default for manual
          });
      }
      
      if(addLog) addLog('FINANCIAL', type === 'income' ? 'REGISTRO_ENTRADA' : 'REGISTRO_SAIDA', `${type === 'income' ? 'Entrada' : 'Saída'} de R$ ${val.toFixed(2)} - ${desc}`, shiftData.operator);
  };

  const totalBalance = transactions.reduce((acc, curr) => 
    curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0
  ) + (isShiftOpen ? shiftData.startingFloat : 0);

  const renderControlView = () => (
    <div className="h-full flex flex-col">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fluxo de Caixa</h2>
              {isShiftOpen ? (
                 <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold flex items-center gap-1"><Unlock size={12} /> Caixa Aberto</span>
              ) : (
                 <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold flex items-center gap-1"><Lock size={12} /> Caixa Fechado</span>
              )}
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> {isShiftOpen ? shiftData.shiftName : currentShift}</span>
           </div>
           <p className="text-gray-500 dark:text-slate-400">{isShiftOpen ? `Operador: ${shiftData.operator} • Início: ${shiftData.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : 'Aguardando abertura de turno.'}</p>
        </div>
        <div className="w-full md:w-auto text-right bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:block">
            <span className="block text-sm text-gray-500 dark:text-slate-400">Saldo Atual (c/ Fundo)</span>
            <span className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {isShiftOpen ? (
      <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button onClick={() => handleAddTransaction('income')} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"><Plus size={20} /> Registrar Entrada</button>
            <button onClick={() => handleAddTransaction('expense')} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"><Minus size={20} /> Registrar Saída</button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">
                <Search className="text-gray-400" size={20} />
                <input type="text" placeholder="Buscar lançamentos..." className="flex-1 outline-none text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
            
            <div className="overflow-auto flex-1">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0"><tr><th className="p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th><th className="p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Categoria</th><th className="p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Data</th><th className="p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Valor</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                            <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">Abertura de Caixa (Fundo)</td>
                            <td className="p-4 text-sm text-gray-500 dark:text-slate-400"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-slate-800 text-indigo-800 dark:text-slate-200">Saldo Inicial</span></td>
                            <td className="p-4 text-sm text-gray-500 dark:text-slate-400">{shiftData.startTime.toLocaleString()}</td>
                            <td className="p-4 text-sm font-bold text-right text-indigo-600 dark:text-indigo-400">+ R$ {shiftData.startingFloat.toFixed(2)}</td>
                        </tr>
                        {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{t.description}</td>
                                <td className="p-4 text-sm text-gray-500 dark:text-slate-400"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200">{t.category}</span></td>
                                <td className="p-4 text-sm text-gray-500 dark:text-slate-400">{t.date}</td>
                                <td className={`p-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      </>
      ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6"><Lock size={40} className="text-gray-400 dark:text-slate-500" /></div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Caixa Fechado</h3>
              <p className="text-gray-500 dark:text-slate-400 max-w-md mb-8">Para iniciar as operações e registrar transações, é necessário realizar a abertura do turno.</p>
              <button onClick={() => setActiveTab('closing')} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"><Unlock size={20} /> Ir para Abertura de Caixa</button>
          </div>
      )}
    </div>
  );

  const tabs = [{ id: 'control', label: 'Fluxo de Caixa', icon: List }, { id: 'closing', label: 'Gestão de Turno', icon: Lock }];

  return (
    <div className="p-4 md:p-8 h-full">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gestão Financeira</h2>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-[calc(100%-80px)] overflow-hidden">
        <div 
          onMouseEnter={() => setIsNavHovered(true)}
          onMouseLeave={() => setIsNavHovered(false)}
          className={`w-full flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 shrink-0 transition-all duration-300 ease-in-out md:h-full
            ${isNavHovered ? 'md:w-64' : 'md:w-20'}
          `}
        >
           {tabs.map(tab => (
             <button 
               key={tab.id} 
               onClick={() => setActiveTab(tab.id as 'control' | 'closing')} 
               className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap 
                 ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-gray-200 dark:ring-slate-700' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}
                 ${!isNavHovered ? 'md:justify-center' : ''}
               `}
               title={!isNavHovered ? tab.label : ''}
             >
               <tab.icon size={20} className="shrink-0" />
               <span className={`transition-opacity duration-200 ${!isNavHovered ? 'md:hidden md:opacity-0 w-0' : 'opacity-100'}`}>{tab.label}</span>
             </button>
           ))}
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-slate-950/50 rounded-3xl p-4 md:p-6 border border-gray-200 dark:border-slate-800 overflow-y-auto">
           {activeTab === 'control' 
             ? renderControlView() 
             : <CashierClosingView isShiftOpen={isShiftOpen} onOpenShift={handleInternalOpenShift} onCloseShift={onCloseShift} startingFloat={shiftData.startingFloat} employees={employees} transactions={transactions} />
           }
        </div>
      </div>
    </div>
  );
};

export default CashierView;
