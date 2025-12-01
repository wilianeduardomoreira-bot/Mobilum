
import React, { useState } from 'react';
import { MaintenanceTicket, Room, RoomStatus, ActivityType } from '../../types';
import { AlertTriangle, CheckCircle2, Clock, Plus, X, Save, ArrowRight, Wrench, Maximize2, History, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MaintenanceViewProps {
  rooms?: Room[]; // Received from App state
  setRooms?: React.Dispatch<React.SetStateAction<Room[]>>;
  tickets?: MaintenanceTicket[];
  setTickets?: React.Dispatch<React.SetStateAction<MaintenanceTicket[]>>;
  addLog?: (type: ActivityType, action: string, description: string, user?: string) => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ rooms = [], setRooms, tickets = [], setTickets, addLog }) => {
  // Modal States
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);

  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    roomId: '', // Store the ID or Number
    issue: '',
    priority: 'Média' as 'Baixa' | 'Média' | 'Alta',
    technician: ''
  });

  // Derived Stats
  const stats = [
    { name: 'Pendente', value: tickets.filter(t => t.status === 'Pendente').length, color: '#EF4444' },
    { name: 'Em Andamento', value: tickets.filter(t => t.status === 'Em Andamento').length, color: '#F59E0B' },
    { name: 'Concluído', value: tickets.filter(t => t.status === 'Concluído').length, color: '#10B981' },
  ];

  const handleCreateTicket = () => {
    if (!newTicket.roomId || !newTicket.issue) {
        alert("Preencha o quarto e o motivo.");
        return;
    }

    const room = rooms.find(r => r.number === newTicket.roomId);
    
    // Create Ticket
    const ticket: MaintenanceTicket = {
        id: Date.now().toString(),
        roomNumber: newTicket.roomId,
        issue: newTicket.issue,
        priority: newTicket.priority,
        status: 'Pendente',
        createdAt: new Date().toISOString()
    };

    if (setTickets) {
        setTickets(prev => [ticket, ...prev]);
    }

    // Update Room Status to MAINTENANCE
    if (room && setRooms) {
        setRooms(prev => prev.map(r => 
            r.number === newTicket.roomId ? { ...r, status: RoomStatus.MAINTENANCE } : r
        ));
    }

    if(addLog) addLog('MAINTENANCE', 'ABERTURA_CHAMADO', `Manutenção registrada para o quarto ${newTicket.roomId}. Motivo: ${newTicket.issue}`);

    setShowNewTicketModal(false);
    setNewTicket({ roomId: '', issue: '', priority: 'Média', technician: '' });
  };

  const handleResolveTicket = () => {
     if (!selectedTicket || !setTickets) return;

     // Mark ticket as Done and add ResolvedAt date
     setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'Concluído', resolvedAt: new Date().toISOString() } : t));

     // Automatically set room to DIRTY (Limpeza)
     if (setRooms) {
         setRooms(prev => prev.map(r => 
             r.number === selectedTicket.roomNumber ? { ...r, status: RoomStatus.DIRTY } : r
         ));
     }

     if(addLog) addLog('MAINTENANCE', 'CONCLUSAO_CHAMADO', `Manutenção concluída para o quarto ${selectedTicket.roomNumber}. Status alterado para Limpeza.`);

     setShowDetailModal(false);
     setSelectedTicket(null);
  };
  
  // ... Rest of the component logic ...
  const formatDate = (isoString?: string) => {
      if (!isoString) return '-';
      return new Date(isoString).toLocaleString('pt-BR', { 
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
  };

  const activeTickets = tickets.filter(t => t.status !== 'Concluído');
  const completedTickets = tickets.filter(t => t.status === 'Concluído');

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gestão de Manutenção</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Active Ticket List */}
        <div className="lg:col-span-2 space-y-6">
           {/* Section: Active */}
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                     <AlertTriangle size={18} className="text-amber-500"/> Ocorrências Pendentes / Em Andamento
                  </h3>
                  <button 
                    onClick={() => setShowNewTicketModal(true)}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                      <Plus size={16} /> Nova Ocorrência
                  </button>
               </div>
               
               {activeTickets.length === 0 ? (
                   <p className="text-sm text-gray-500 dark:text-slate-500 italic text-center py-8">Nenhuma ocorrência ativa no momento.</p>
               ) : (
                   <div className="space-y-4">
                      {activeTickets.map(ticket => (
                          <div 
                            key={ticket.id} 
                            onClick={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                     ${ticket.priority === 'Alta' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                      <Wrench size={20} />
                                  </div>
                                  <div>
                                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Quarto {ticket.roomNumber} - {ticket.issue}</p>
                                      <div className="flex gap-2 text-xs mt-1">
                                         <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1"><Clock size={10}/> {formatDate(ticket.createdAt)}</span>
                                         <span className="text-gray-500 dark:text-slate-400">•</span>
                                         <span className="text-gray-500 dark:text-slate-400">Prioridade: {ticket.priority}</span>
                                      </div>
                                  </div>
                              </div>
                              <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border
                                     ${ticket.status === 'Pendente' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/30' : 
                                       'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30'}`}>
                                    {ticket.status}
                                </span>
                              </div>
                          </div>
                      ))}
                   </div>
               )}
           </div>

           {/* Section: History Summary */}
           <div 
             className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
             onClick={() => setShowHistoryModal(true)}
           >
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-600"/> Histórico de Concluídas
                   </h3>
                   <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 hover:underline">
                      <Maximize2 size={14}/> Expandir Histórico
                   </button>
               </div>
               {completedTickets.length === 0 ? (
                   <p className="text-sm text-gray-500 dark:text-slate-500 italic text-center py-4">Nenhuma manutenção concluída.</p>
               ) : (
                   <div className="space-y-2">
                      {completedTickets.slice(0, 3).map(ticket => (
                          <div key={ticket.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-sm">
                              <span className="text-gray-600 dark:text-slate-400">Quarto {ticket.roomNumber} - <span className="text-gray-400 dark:text-slate-600">{ticket.issue}</span></span>
                              <span className="text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Concluído</span>
                          </div>
                      ))}
                      {completedTickets.length > 3 && (
                          <p className="text-xs text-center text-gray-400 pt-2">Ver mais {completedTickets.length - 3} itens...</p>
                      )}
                   </div>
               )}
           </div>
        </div>

        {/* Stats Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 flex flex-col items-center h-fit">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 self-start">Status Geral</h3>
            <div className="w-full h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={stats} innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={5}>
                            {stats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '12px'}} />
                    </PieChart>
                 </ResponsiveContainer>
            </div>
             <div className="w-full mt-4 space-y-2">
                {stats.map(s => (
                    <div key={s.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}}></span>
                            <span className="text-gray-600 dark:text-slate-300">{s.name}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{s.value}</span>
                    </div>
                ))}
             </div>
        </div>
      </div>

      {/* --- MODALS (New Ticket, Detail, History) --- */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
                {/* ... New Ticket Modal Content ... */}
                {/* Reusing existing logic but adding handlers */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2"><Plus size={20}/> Nova Ocorrência</h3>
                    <button onClick={() => setShowNewTicketModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* ... Inputs ... */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Selecione o Quarto</label>
                        <select value={newTicket.roomId} onChange={e => setNewTicket({...newTicket, roomId: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 outline-none">
                            <option value="">Selecione...</option>
                            {rooms.sort((a,b) => parseInt(a.number) - parseInt(b.number)).map(r => (<option key={r.id} value={r.number}>Quarto {r.number} - {r.type}</option>))}
                        </select>
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">Motivo</label>
                         <textarea value={newTicket.issue} onChange={e => setNewTicket({...newTicket, issue: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 outline-none h-24"/>
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">Prioridade</label>
                         <div className="flex gap-2">
                             {['Baixa', 'Média', 'Alta'].map(p => (
                                 <button key={p} onClick={() => setNewTicket({...newTicket, priority: p as any})} className={`flex-1 py-2 rounded-lg text-sm border ${newTicket.priority === p ? 'bg-slate-900 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>{p}</button>
                             ))}
                         </div>
                    </div>
                    <button onClick={handleCreateTicket} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Save size={18} /> Registrar Manutenção</button>
                </div>
            </div>
        </div>
      )}

      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800 relative overflow-hidden">
                <div className={`h-2 w-full ${selectedTicket.priority === 'Alta' ? 'bg-red-500' : selectedTicket.priority === 'Média' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quarto {selectedTicket.roomNumber}</h2><span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{selectedTicket.status}</span></div>
                        <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-6"><p className="text-gray-900 dark:text-white font-medium">{selectedTicket.issue}</p></div>
                    {selectedTicket.status !== 'Concluído' && (
                        <button onClick={handleResolveTicket} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Concluir e Liberar Limpeza</button>
                    )}
                </div>
             </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Manutenção</h2><button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button></div>
                <div className="flex-1 overflow-y-auto p-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase"><tr><th className="px-6 py-4">Quarto</th><th className="px-6 py-4">Problema</th><th className="px-6 py-4 text-center">Prioridade</th><th className="px-6 py-4 text-right">Data</th></tr></thead>
                        <tbody>
                            {completedTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold">{ticket.roomNumber}</td>
                                    <td className="px-6 py-4">{ticket.issue}</td>
                                    <td className="px-6 py-4 text-center">{ticket.priority}</td>
                                    <td className="px-6 py-4 text-right">{formatDate(ticket.resolvedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;
