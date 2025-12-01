import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, CreditCard, BedDouble } from 'lucide-react';

const DashboardView: React.FC = () => {
  const data = [
    { name: 'Seg', ocupacao: 40, receita: 2400 },
    { name: 'Ter', ocupacao: 45, receita: 2800 },
    { name: 'Qua', ocupacao: 55, receita: 3200 },
    { name: 'Qui', ocupacao: 65, receita: 4100 },
    { name: 'Sex', ocupacao: 85, receita: 6500 },
    { name: 'Sab', ocupacao: 95, receita: 7800 },
    { name: 'Dom', ocupacao: 70, receita: 4900 },
  ];

  const pieData = [
    { name: 'Standard', value: 400 },
    { name: 'Luxo', value: 300 },
    { name: 'Master', value: 100 },
  ];

  // Updated Colors: Slate-600, Gray-400, Slate-800
  const COLORS = ['#475569', '#94a3b8', '#1e293b'];

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Geral</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Receita Total (Mês)</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">R$ 142.300</h3>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600 dark:text-green-400">
            <ArrowUpRight size={16} className="mr-1" />
            <span className="font-medium">12.5%</span>
            <span className="text-gray-400 dark:text-slate-500 ml-1">vs mês anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Taxa de Ocupação</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">78%</h3>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
              <BedDouble size={20} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600 dark:text-green-400">
            <ArrowUpRight size={16} className="mr-1" />
            <span className="font-medium">5.2%</span>
            <span className="text-gray-400 dark:text-slate-500 ml-1">vs semana anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Check-ins Hoje</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">24</h3>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-red-500 dark:text-red-400">
            <ArrowDownRight size={16} className="mr-1" />
            <span className="font-medium">2.1%</span>
            <span className="text-gray-400 dark:text-slate-500 ml-1">vs ontem</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Receita Semanal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:opacity-10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="receita" stroke="#1e293b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Distribuição por Categoria</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px'}} />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex flex-row sm:flex-col flex-wrap gap-2 sm:ml-4 mt-4 sm:mt-0 justify-center">
                {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index]}}></span>
                        <span className="text-gray-600 dark:text-slate-300">{entry.name}</span>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;