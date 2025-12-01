
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { ActivityLog, ActivityType } from '../../types';
import { ClipboardList, Filter, Calendar as CalendarIcon, PieChart as PieIcon, TrendingUp, DollarSign, Wrench } from 'lucide-react';

interface ReportsViewProps {
  activityLogs?: ActivityLog[];
}

type ReportType = 'OCCUPANCY' | 'ROOM_TYPES' | 'PERIODS' | 'FINANCIAL' | 'MAINTENANCE';

const ReportsView: React.FC<ReportsViewProps> = ({ activityLogs = [] }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'audit'>('performance');
  
  // Filter States
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], // Last 7 days
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<ReportType>('OCCUPANCY');
  const [auditFilterType, setAuditFilterType] = useState<ActivityType | 'ALL'>('ALL');

  // --- MOCK DATA GENERATORS BASED ON DATE RANGE ---
  const reportData = useMemo(() => {
    // In a real app, this would fetch from backend using dateRange.start and dateRange.end
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
    
    switch (selectedReport) {
      case 'OCCUPANCY':
        return days.map(day => ({
          name: day,
          ocupacao: Math.floor(Math.random() * (95 - 40) + 40), // 40-95%
          checkins: Math.floor(Math.random() * 20)
        }));
      case 'ROOM_TYPES':
        return [
          { name: 'Standard', value: 145 },
          { name: 'Luxo', value: 89 },
          { name: 'Master', value: 34 },
        ];
      case 'PERIODS':
        return [
          { name: '4 Horas', value: 210 },
          { name: 'Pernoite (12h)', value: 120 },
          { name: 'Diária (24h)', value: 85 },
        ];
      case 'FINANCIAL':
        return days.map(day => ({
          name: day,
          receita: Math.floor(Math.random() * (5000 - 2000) + 2000),
          consumo: Math.floor(Math.random() * (1500 - 500) + 500)
        }));
      case 'MAINTENANCE':
        return [
          { name: 'Elétrica', value: 12 },
          { name: 'Hidráulica', value: 8 },
          { name: 'Ar Cond.', value: 15 },
          { name: 'Mobiliário', value: 5 },
          { name: 'Outros', value: 3 },
        ];
      default:
        return [];
    }
  }, [selectedReport, dateRange]);

  // Colors for Charts
  const COLORS = ['#1e293b', '#64748b', '#94a3b8', '#cbd5e1', '#475569'];
  const FINANCIAL_COLORS = { revenue: '#10b981', consumption: '#3b82f6' };

  // --- RENDER HELPERS ---
  const renderChart = () => {
    if (selectedReport === 'OCCUPANCY') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={reportData}>
            <defs>
              <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e293b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} unit="%" />
            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            <Legend verticalAlign="top" height={36}/>
            <Area type="monotone" dataKey="ocupacao" name="Taxa de Ocupação" stroke="#1e293b" strokeWidth={3} fillOpacity={1} fill="url(#colorOcupacao)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (selectedReport === 'ROOM_TYPES' || selectedReport === 'PERIODS') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={reportData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {reportData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{borderRadius: '12px'}} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (selectedReport === 'FINANCIAL') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
            <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} cursor={{fill: 'transparent'}} />
            <Legend verticalAlign="top" height={36}/>
            <Bar dataKey="receita" name="Receita Total" fill={FINANCIAL_COLORS.revenue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="consumo" name="Consumo (Frigobar)" fill={FINANCIAL_COLORS.consumption} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (selectedReport === 'MAINTENANCE') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={reportData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
            <Tooltip contentStyle={{borderRadius: '12px'}} cursor={{fill: 'transparent'}} />
            <Bar dataKey="value" name="Ocorrências" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={30}>
               {/* Label on top */}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };

  const getReportTitle = () => {
    switch(selectedReport) {
      case 'OCCUPANCY': return 'Taxa de Ocupação Diária';
      case 'ROOM_TYPES': return 'Distribuição por Tipo de Suíte';
      case 'PERIODS': return 'Preferência de Períodos (4h vs 12h vs 24h)';
      case 'FINANCIAL': return 'Receita vs Consumo';
      case 'MAINTENANCE': return 'Ocorrências por Categoria';
      default: return 'Relatório';
    }
  };

  const getActionColor = (type: ActivityType) => {
    switch(type) {
      case 'CHECK_IN': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'CHECK_OUT': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'FINANCIAL': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'MAINTENANCE': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Filter Logs for Audit
  const filteredLogs = activityLogs.filter(log => auditFilterType === 'ALL' || log.type === auditFilterType).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios e Auditoria</h2>
        
        {/* Main Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'performance' 
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={16}/> Performance
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'audit' 
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList size={16}/> Auditoria / Logs
          </button>
        </div>
      </div>

      {activeTab === 'performance' ? (
        <div className="space-y-6">
           {/* Filters Bar */}
           <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
              
              <div className="flex-1 w-full">
                 <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Tipo de Relatório</label>
                 <div className="relative">
                    <PieIcon className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                    <select 
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500 appearance-none"
                    >
                       <option value="OCCUPANCY">Ocupação Geral</option>
                       <option value="ROOM_TYPES">Tipos de Quarto Alugado</option>
                       <option value="PERIODS">Tipos de Período (4h/12h/24h)</option>
                       <option value="FINANCIAL">Receita e Consumo</option>
                       <option value="MAINTENANCE">Manutenções e Ocorrências</option>
                    </select>
                 </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Data Inicial</label>
                    <div className="relative">
                       <CalendarIcon className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                       <input 
                         type="date" 
                         value={dateRange.start} 
                         onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                         className="pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500 text-sm" 
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Data Final</label>
                    <div className="relative">
                       <CalendarIcon className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                       <input 
                         type="date" 
                         value={dateRange.end} 
                         onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                         className="pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500 text-sm" 
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Chart Area */}
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white">{getReportTitle()}</h3>
                 <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                 </span>
              </div>
              <div className="h-80 w-full">
                 {renderChart()}
              </div>
           </div>

           {/* Summary Cards Example */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                 <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total no Período</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">142 Reservas</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                 <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Média Diária</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">R$ 4.250,00</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                 <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Ticket Médio</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">R$ 210,00</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                 <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Cancelamentos</p>
                 <p className="text-xl font-bold text-red-500">2.4%</p>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ClipboardList className="text-indigo-600 dark:text-indigo-400"/> Registro de Atividades
            </h3>
            
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400"/>
              <select 
                value={auditFilterType} 
                onChange={(e) => setAuditFilterType(e.target.value as any)}
                className="bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm p-2 outline-none text-gray-700 dark:text-slate-300"
              >
                <option value="ALL">Todos os Registros</option>
                <option value="CHECK_IN">Check-in</option>
                <option value="CHECK_OUT">Check-out</option>
                <option value="FINANCIAL">Financeiro / Caixa</option>
                <option value="MAINTENANCE">Manutenção</option>
                <option value="RESERVATION">Reservas</option>
                <option value="ACCESS">Acesso / Equipe</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 uppercase text-xs">
                   <tr>
                      <th className="p-4 rounded-tl-xl">Data/Hora</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Usuário</th>
                      <th className="p-4">Ação</th>
                      <th className="p-4 rounded-tr-xl">Descrição</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                   {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">{log.timestamp.toLocaleString()}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${getActionColor(log.type)}`}>
                               {log.type}
                            </span>
                         </td>
                         <td className="p-4 font-medium text-gray-900 dark:text-white">{log.user}</td>
                         <td className="p-4 text-gray-700 dark:text-slate-300 font-medium">{log.action}</td>
                         <td className="p-4 text-gray-600 dark:text-slate-400">{log.description}</td>
                      </tr>
                   ))}
                   {filteredLogs.length === 0 && (
                      <tr>
                         <td colSpan={5} className="p-8 text-center text-gray-400 dark:text-slate-500 italic">
                            Nenhum registro encontrado para este filtro.
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
