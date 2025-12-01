
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  QrCode,
  Save,
  Printer,
  Clock,
  Unlock,
  User,
  X,
  FileText
} from 'lucide-react';
import { Employee, Transaction } from '../../types';

interface CashierClosingViewProps {
  isShiftOpen?: boolean;
  onOpenShift?: (operator: string, float: number, shiftName: string) => void;
  onCloseShift?: () => void;
  startingFloat?: number;
  employees?: Employee[];
  transactions?: Transaction[];
}

const CashierClosingView: React.FC<CashierClosingViewProps> = ({ 
  isShiftOpen = false, 
  onOpenShift, 
  onCloseShift,
  startingFloat = 0,
  employees = [],
  transactions = []
}) => {
  // Common State
  const [selectedShift, setSelectedShift] = useState('Turno 1');

  // --- OPENING STATE ---
  const [openingOperator, setOpeningOperator] = useState('');
  const [openingFloat, setOpeningFloat] = useState('');

  // --- CLOSING STATE ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Calculate Totals Dynamically from Transactions
  const systemTotals = useMemo(() => {
     let cash = 0;
     let credit = 0;
     let debit = 0;
     let pix = 0;
     let expenses = 0;
     
     // Breakdown for Report
     let accommodationTotal = 0;
     let consumptionTotal = 0;

     transactions.forEach(t => {
         if (t.type === 'expense') {
             expenses += t.amount;
         } else {
             // Payment Method Totals
             switch (t.paymentMethod) {
                 case 'credit': credit += t.amount; break;
                 case 'debit': debit += t.amount; break;
                 case 'pix': pix += t.amount; break;
                 case 'cash': default: cash += t.amount; break;
             }

             // Category Totals
             if (t.category === 'Hospedagem') {
                 accommodationTotal += t.amount;
             } else if (['Frigobar', 'Consumo', 'Restaurante'].includes(t.category)) {
                 consumptionTotal += t.amount;
             }
         }
     });

     // Cash balance = Starting Float + Cash Sales - Cash Expenses
     const totalCashInDrawer = startingFloat + cash - expenses;
     
     return {
        cash: totalCashInDrawer,
        credit,
        debit,
        pix,
        expenses,
        balance: totalCashInDrawer + credit + debit + pix,
        accommodationTotal,
        consumptionTotal
     };
  }, [transactions, startingFloat]);

  // Filter Transactions for Report Listing (Suites/Consumption)
  const reportTransactions = useMemo(() => {
      return transactions.filter(t => t.type === 'income').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // State for Physical Count (What the receptionist counts)
  const [physicalCount, setPhysicalCount] = useState({
    cash: '',
    credit: '',
    debit: '',
    pix: ''
  });

  const [observations, setObservations] = useState('');
  const [isClosedSuccess, setIsClosedSuccess] = useState(false);

  // Auto-detect shift on mount
  useEffect(() => {
    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    const isEarly = minutes < 30;

    let targetShift = 'Turno 1';

    if (hour >= 7 && hour < 15) {
      targetShift = (hour === 7 && isEarly) ? 'Turno 3' : 'Turno 1';
    } else if (hour >= 15 && hour < 23) {
      targetShift = (hour === 15 && isEarly) ? 'Turno 1' : 'Turno 2';
    } else {
      targetShift = (hour === 23 && isEarly) ? 'Turno 2' : 'Turno 3';
    }
    
    setSelectedShift(targetShift);
  }, []);

  const handleOpenClick = () => {
     if (!openingOperator) return alert("Informe o operador.");
     if (onOpenShift) {
         onOpenShift(openingOperator, parseFloat(openingFloat) || 0, selectedShift);
     }
  };

  // Helper Calculations
  const getNumeric = (val: string) => parseFloat(val) || 0;
  
  const cashDiff = getNumeric(physicalCount.cash) - systemTotals.cash;
  const creditDiff = getNumeric(physicalCount.credit) - systemTotals.credit;
  const debitDiff = getNumeric(physicalCount.debit) - systemTotals.debit;
  const pixDiff = getNumeric(physicalCount.pix) - systemTotals.pix;

  const totalDiff = cashDiff + creditDiff + debitDiff + pixDiff;

  const getDiffColor = (diff: number) => {
    if (Math.abs(diff) < 0.01) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
    if (diff < 0) return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
    return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
  };

  const handleCloseDay = () => {
    if (Math.abs(totalDiff) > 10 && !observations) {
        alert("Há uma diferença significativa de valores. Por favor, justifique nas observações.");
        return;
    }
    // Instead of confirming directly, show the review modal
    setShowReviewModal(true);
  };

  const handleConfirmClose = () => {
      setShowReviewModal(false);
      setIsClosedSuccess(true);
      if (onCloseShift) onCloseShift();
  };

  const handlePrintReport = () => {
      const printContent = document.getElementById('printable-shift-report');
      if (printContent) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '1px'; // Minimum size but not zero to avoid browser issues
        iframe.style.height = '1px';
        iframe.style.border = 'none';
        iframe.style.left = '-9999px'; // Position off-screen
        document.body.appendChild(iframe);
        
        // Use onload logic on script tag for reliable execution
        const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Relatório de Fechamento - ${selectedShift}</title>
                <meta charset="UTF-8">
                <style>
                  body { 
                    font-family: sans-serif; 
                    padding: 20px; 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                    font-size: 12px;
                  }
                  #printable-shift-report { max-width: 100%; margin: 0 auto; }
                  .no-print { display: none !important; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { padding: 4px; border-bottom: 1px solid #eee; }
                  .border-b { border-bottom: 1px solid #000; }
                  .text-right { text-align: right; }
                  .font-bold { font-weight: bold; }
                  .uppercase { text-transform: uppercase; }
                  .text-xs { font-size: 10px; }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
                <script src="https://cdn.tailwindcss.com" onload="setTimeout(() => { window.focus(); window.print(); }, 1000);"></script>
              </body>
            </html>
        `;

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(htmlContent);
          doc.close();
        }
  
        // Clean up after a delay
        setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
        }, 10000); 
      }
  };

  // RENDER: OPENING MODE (If shift is closed)
  if (!isShiftOpen && !isClosedSuccess) {
      return (
        <div className="p-4 md:p-8 h-full flex flex-col justify-center max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Unlock size={40} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Abertura de Caixa</h2>
                <p className="text-gray-500 dark:text-slate-400">Inicie o turno registrando o operador e o fundo de troco.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
                
                {/* Shift Selection Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Turno</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <select
                           className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white appearance-none"
                           value={selectedShift}
                           onChange={(e) => setSelectedShift(e.target.value)}
                        >
                           <option value="Turno 1">Turno 1 (07h - 15h)</option>
                           <option value="Turno 2">Turno 2 (15h - 23h)</option>
                           <option value="Turno 3">Turno 3 (23h - 07h)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Operador Responsável</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <select
                           className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white appearance-none"
                           value={openingOperator}
                           onChange={(e) => setOpeningOperator(e.target.value)}
                        >
                           <option value="">Selecione um funcionário...</option>
                           {employees.map(emp => (
                               <option key={emp.id} value={emp.name}>{emp.name} - {emp.role}</option>
                           ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Fundo de Troco (Saldo Inicial)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400 font-bold">R$</span>
                        <input 
                            type="number" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            placeholder="0.00"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-1">Valor em dinheiro presente na gaveta ao iniciar.</p>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleOpenClick}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <Unlock size={20} /> Confirmar Abertura
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="text-slate-900 dark:text-white" size={24} />
            Fechamento de Caixa
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Conferência e encerramento do turno.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <Clock size={16} className="text-gray-400"/>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{selectedShift}</span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm text-right hidden sm:block">
                <p className="text-xs text-gray-400 uppercase font-bold">Data</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</p>
            </div>
        </div>
      </div>

      {isClosedSuccess ? (
         <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in duration-500">
             <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Caixa Fechado com Sucesso!</h3>
             <p className="text-gray-500 dark:text-slate-400 max-w-md mb-2">Relatório do <strong>{selectedShift}</strong> gerado.</p>
             <p className="text-gray-500 dark:text-slate-400 max-w-md mb-8">Enviado para a administração. O turno foi encerrado.</p>
             <button onClick={() => window.print()} className="bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-lg">
                 <Printer size={20} /> Imprimir Comprovante
             </button>
             <button onClick={() => setIsClosedSuccess(false)} className="mt-4 text-gray-500 hover:text-gray-900 text-sm underline">
                 Voltar para Abertura
             </button>
         </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: System Data */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Calculator size={18} /> Resumo do Sistema ({selectedShift})
            </h3>
            
            <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-gray-600 dark:text-slate-300 text-sm flex items-center gap-2"><Banknote size={16}/> Dinheiro em Caixa</span>
                    <div className="text-right">
                        <span className="block font-bold text-gray-900 dark:text-white">R$ {systemTotals.cash.toFixed(2)}</span>
                        <div className="flex flex-col text-xs">
                           <span className="text-indigo-500">Incluso Fundo: R$ {startingFloat.toFixed(2)}</span>
                           <span className="text-red-500">- R$ {systemTotals.expenses.toFixed(2)} (Saídas)</span>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-gray-600 dark:text-slate-300 text-sm flex items-center gap-2"><CreditCard size={16}/> Cartão Crédito</span>
                    <span className="font-bold text-gray-900 dark:text-white">R$ {systemTotals.credit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-gray-600 dark:text-slate-300 text-sm flex items-center gap-2"><CreditCard size={16}/> Cartão Débito</span>
                    <span className="font-bold text-gray-900 dark:text-white">R$ {systemTotals.debit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-gray-600 dark:text-slate-300 text-sm flex items-center gap-2"><QrCode size={16}/> PIX</span>
                    <span className="font-bold text-gray-900 dark:text-white">R$ {systemTotals.pix.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white uppercase">Total Geral</span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">R$ {systemTotals.balance.toFixed(2)}</span>
                </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
             <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Lembretes</h4>
             <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                 <li>Confira as notas de R$ 100 e R$ 50 contra luz UV.</li>
                 <li>Anexe os comprovantes da máquina de cartão (Batch Close).</li>
                 <li>Separe o fundo de troco para o próximo turno.</li>
             </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Physical Input */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-bl-full -mr-10 -mt-10 z-0"></div>
             <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                <CheckCircle2 size={18} /> Conferência Física
             </h3>

             <div className="space-y-6 relative z-10">
                {/* Cash Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-300">Dinheiro (Gaveta)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                        <input 
                           type="number" 
                           className={`w-full pl-8 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors ${getDiffColor(cashDiff)} bg-white dark:bg-slate-800 text-slate-900 dark:text-white`}
                           placeholder="0.00"
                           value={physicalCount.cash}
                           onChange={e => setPhysicalCount({...physicalCount, cash: e.target.value})}
                        />
                        {Math.abs(cashDiff) > 0.01 && (
                            <span className={`text-[10px] absolute -bottom-4 right-0 font-bold ${cashDiff < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {cashDiff < 0 ? 'Falta' : 'Sobra'}: {cashDiff.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Credit Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-300">Total Maquininha (Crédito)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                        <input 
                           type="number" 
                           className={`w-full pl-8 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors ${getDiffColor(creditDiff)} bg-white dark:bg-slate-800 text-slate-900 dark:text-white`}
                           placeholder="0.00"
                           value={physicalCount.credit}
                           onChange={e => setPhysicalCount({...physicalCount, credit: e.target.value})}
                        />
                    </div>
                </div>

                {/* Debit Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-300">Total Maquininha (Débito)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                        <input 
                           type="number" 
                           className={`w-full pl-8 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors ${getDiffColor(debitDiff)} bg-white dark:bg-slate-800 text-slate-900 dark:text-white`}
                           placeholder="0.00"
                           value={physicalCount.debit}
                           onChange={e => setPhysicalCount({...physicalCount, debit: e.target.value})}
                        />
                    </div>
                </div>

                {/* Pix Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-300">Comprovantes Pix</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                        <input 
                           type="number" 
                           className={`w-full pl-8 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors ${getDiffColor(pixDiff)} bg-white dark:bg-slate-800 text-slate-900 dark:text-white`}
                           placeholder="0.00"
                           value={physicalCount.pix}
                           onChange={e => setPhysicalCount({...physicalCount, pix: e.target.value})}
                        />
                    </div>
                </div>

                {/* Observations */}
                <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-300 block mb-2">Observações / Justificativas</label>
                    <textarea 
                        className="w-full border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        rows={3}
                        placeholder="Digite aqui qualquer divergência encontrada..."
                        value={observations}
                        onChange={e => setObservations(e.target.value)}
                    ></textarea>
                </div>
             </div>
           </div>

           {/* Total Diff Summary */}
           <div className={`rounded-xl p-4 border flex justify-between items-center ${getDiffColor(totalDiff)}`}>
               <span className="font-bold">Diferença Total</span>
               <span className="font-bold text-xl">{totalDiff > 0 ? '+' : ''} R$ {totalDiff.toFixed(2)}</span>
           </div>

           <button 
             onClick={handleCloseDay}
             className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-400 dark:shadow-none transition-all active:scale-95 flex justify-center items-center gap-2"
           >
               <Save size={20} />
               Finalizar Fechamento ({selectedShift})
           </button>
        </div>

      </div>
      )}

      {/* --- REVIEW & PRINT MODAL --- */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
              
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center no-print shrink-0">
                  <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> Conferência de Fechamento</h3>
                  <button onClick={() => setShowReviewModal(false)} className="hover:bg-slate-700 p-1.5 rounded-full"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-slate-950 flex justify-center">
                  <div id="printable-shift-report" className="bg-white w-full max-w-lg shadow-md p-6 text-sm text-gray-800 border border-gray-200">
                      
                      {/* Report Header */}
                      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                          <h2 className="font-bold text-xl uppercase">Relatório de Fechamento</h2>
                          <h3 className="text-lg font-medium">{selectedShift}</h3>
                          <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-300 text-left text-xs">
                             <p><strong>Operador:</strong> {employees[0]?.name || 'Usuário Atual'}</p> 
                             <p><strong>Fundo Inicial:</strong> R$ {startingFloat.toFixed(2)}</p>
                          </div>
                      </div>

                      {/* Summary Table */}
                      <div className="mb-6">
                          <h4 className="font-bold border-b border-gray-300 mb-2 pb-1">Conferência de Valores</h4>
                          <div className="grid grid-cols-4 gap-2 text-xs font-bold border-b border-gray-200 pb-1 mb-1 text-gray-500 uppercase">
                             <span>Tipo</span>
                             <span className="text-right">Sistema</span>
                             <span className="text-right">Físico</span>
                             <span className="text-right">Dif.</span>
                          </div>
                          
                          {/* Rows */}
                          <div className="space-y-1 text-xs">
                             <div className="grid grid-cols-4 gap-2">
                                <span>Dinheiro</span>
                                <span className="text-right">{(systemTotals.cash).toFixed(2)}</span>
                                <span className="text-right">{getNumeric(physicalCount.cash).toFixed(2)}</span>
                                <span className={`text-right font-bold ${cashDiff < 0 ? 'text-red-600' : cashDiff > 0 ? 'text-blue-600' : 'text-gray-800'}`}>{cashDiff.toFixed(2)}</span>
                             </div>
                             <div className="grid grid-cols-4 gap-2">
                                <span>Crédito</span>
                                <span className="text-right">{systemTotals.credit.toFixed(2)}</span>
                                <span className="text-right">{getNumeric(physicalCount.credit).toFixed(2)}</span>
                                <span className={`text-right font-bold ${creditDiff < 0 ? 'text-red-600' : creditDiff > 0 ? 'text-blue-600' : 'text-gray-800'}`}>{creditDiff.toFixed(2)}</span>
                             </div>
                             <div className="grid grid-cols-4 gap-2">
                                <span>Débito</span>
                                <span className="text-right">{systemTotals.debit.toFixed(2)}</span>
                                <span className="text-right">{getNumeric(physicalCount.debit).toFixed(2)}</span>
                                <span className={`text-right font-bold ${debitDiff < 0 ? 'text-red-600' : debitDiff > 0 ? 'text-blue-600' : 'text-gray-800'}`}>{debitDiff.toFixed(2)}</span>
                             </div>
                             <div className="grid grid-cols-4 gap-2">
                                <span>PIX</span>
                                <span className="text-right">{systemTotals.pix.toFixed(2)}</span>
                                <span className="text-right">{getNumeric(physicalCount.pix).toFixed(2)}</span>
                                <span className={`text-right font-bold ${pixDiff < 0 ? 'text-red-600' : pixDiff > 0 ? 'text-blue-600' : 'text-gray-800'}`}>{pixDiff.toFixed(2)}</span>
                             </div>
                          </div>
                      </div>

                      {/* NEW SECTION: SUITE & CONSUMPTION MOVEMENTS */}
                      <div className="mb-6">
                          <h4 className="font-bold border-b border-gray-300 mb-2 pb-1">Detalhamento de Receita</h4>
                          <table className="w-full text-xs">
                              <tbody>
                                  <tr>
                                      <td className="py-1">Hospedagem (Diárias/Adiantamentos)</td>
                                      <td className="text-right font-medium">R$ {systemTotals.accommodationTotal.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                      <td className="py-1">Consumo (Frigobar/Extras)</td>
                                      <td className="text-right font-medium">R$ {systemTotals.consumptionTotal.toFixed(2)}</td>
                                  </tr>
                              </tbody>
                          </table>

                          <h5 className="font-bold text-[10px] text-gray-500 uppercase mt-4 mb-2">Extrato de Movimentações (Suítes/Consumo)</h5>
                          <table className="w-full text-[10px]">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="text-left font-semibold py-1">Hora</th>
                                        <th className="text-left font-semibold py-1">Descrição</th>
                                        <th className="text-left font-semibold py-1">Cat.</th>
                                        <th className="text-right font-semibold py-1">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportTransactions.map((t) => (
                                        <tr key={t.id} className="border-b border-dashed border-gray-100">
                                            <td className="py-1">{new Date(t.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                            <td className="py-1">{t.description}</td>
                                            <td className="py-1">{t.category}</td>
                                            <td className="py-1 text-right">R$ {t.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {reportTransactions.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-2 italic text-gray-400">Nenhuma movimentação registrada.</td></tr>
                                    )}
                                </tbody>
                          </table>
                      </div>
                      
                      {/* Total Difference */}
                      <div className="border-t-2 border-gray-800 pt-2 mb-6">
                         <div className="flex justify-between items-center text-sm">
                            <span className="font-bold">Diferença Total de Caixa:</span>
                            <span className={`font-bold text-lg ${totalDiff < 0 ? 'text-red-600' : totalDiff > 0 ? 'text-blue-600' : 'text-gray-800'}`}>
                               {totalDiff > 0 ? '+' : ''} R$ {totalDiff.toFixed(2)}
                            </span>
                         </div>
                      </div>

                      {/* Observations */}
                      <div className="border border-gray-200 p-2 rounded bg-gray-50 min-h-[60px]">
                         <p className="text-xs font-bold text-gray-500 mb-1">Observações:</p>
                         <p className="text-xs italic text-gray-800">{observations || 'Sem observações.'}</p>
                      </div>

                      <div className="mt-8 pt-4 border-t border-dashed border-gray-400 flex justify-between gap-8">
                         <div className="border-t border-gray-800 flex-1 pt-2 text-center text-xs">Assinatura Operador</div>
                         <div className="border-t border-gray-800 flex-1 pt-2 text-center text-xs">Assinatura Gerente</div>
                      </div>

                  </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 no-print shrink-0">
                   <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium">Voltar</button>
                   <button onClick={handlePrintReport} className="px-6 py-2 rounded-lg border border-slate-900 dark:border-slate-500 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium flex items-center justify-center gap-2">
                      <Printer size={18} /> Imprimir Relatório
                   </button>
                   <button onClick={handleConfirmClose} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-none">
                      <Lock size={18} /> Confirmar Fechamento
                   </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CashierClosingView;
