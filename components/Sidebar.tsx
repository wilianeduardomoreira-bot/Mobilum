
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarDays, 
  BarChart3, 
  Wrench, 
  Wallet, 
  MessageSquare, 
  Bot, 
  Settings,
  LogOut,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { View, Employee } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  onCloseMobile?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  onLogout?: () => void;
  currentUser?: Employee | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  onCloseMobile, 
  isDarkMode, 
  toggleTheme, 
  onLogout,
  currentUser 
}) => {
  
  // Collapse submenus when navigating away from them
  const [isCashierExpanded, setIsCashierExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (currentView !== View.CASHIER) {
      setIsCashierExpanded(false);
    } else {
      setIsCashierExpanded(true);
    }
  }, [currentView]);

  const menuItems = [
    { id: View.SUITES, icon: BedDouble, label: 'Suítes' },
    { id: View.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { id: View.CALENDAR, icon: CalendarDays, label: 'Calendário' },
    { id: View.REPORTS, icon: BarChart3, label: 'Relatórios' },
    { id: View.MAINTENANCE, icon: Wrench, label: 'Manutenção' },
    { id: View.CASHIER, icon: Wallet, label: 'Caixa' },
  ];

  const footerItems = [
    { id: View.CHAT, icon: MessageSquare, label: 'Chat Interno' },
    { id: View.AI_ASSISTANT, icon: Bot, label: 'Assistente IA' },
    { id: View.SETTINGS, icon: Settings, label: 'Configurações' },
  ];

  // Helper to determine text visibility classes for smooth transition
  const getTextClasses = (show: boolean) => {
    return `whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] 
      ${show 
        ? 'opacity-100 max-w-[200px] translate-x-0' 
        : 'md:opacity-0 md:max-w-0 md:-translate-x-2 opacity-100 max-w-[200px]' // On mobile, always show. On desktop, animate.
      }`;
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-slate-800 
        flex flex-col justify-between shadow-xl md:shadow-sm z-50 
        transition-[width] duration-500 ease-[cubic-bezier(0.2,0,0,1)] will-change-[width] overflow-hidden
        ${isHovered ? 'w-64' : 'w-64 md:w-24'} 
        p-4 pb-6
      `}
    >
      <div>
        {/* Header / Logo */}
        <div className="flex items-center mb-8 mt-2 h-12 relative overflow-hidden shrink-0">
           <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] absolute left-0 flex items-center gap-3 ${isHovered ? 'pl-2' : 'pl-2 md:pl-4'}`}>
              <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                 {/* Updated Logo: Using RR Monogram to match the new abstract knot style */}
                 <img src="https://ui-avatars.com/api/?name=RR&background=4A4A4A&color=fff&size=128&rounded=true&bold=true&font-size=0.4" alt="Logo" className="w-10 h-10 object-contain dark:hidden" />
                 <img src="https://ui-avatars.com/api/?name=RR&background=334155&color=fff&size=128&rounded=true&bold=true&font-size=0.4" alt="Logo" className="w-10 h-10 object-contain hidden dark:block" />
              </div>
              <div className={getTextClasses(isHovered)}>
                 <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                    Seu conforto, Nossa prioridade.
                 </p>
              </div>
           </div>
          
          {/* Mobile Close Button */}
          <button 
            onClick={onCloseMobile} 
            className="md:hidden p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg absolute right-0 top-1"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-1.5">
          {/* Main Items */}
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`
                  w-full flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 ease-out relative overflow-hidden group
                  ${isActive 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-700' 
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title={!isHovered ? item.label : ''}
              >
                {/* Icon Container - Stabilized Position */}
                <div className={`shrink-0 w-16 flex items-center justify-center transition-all duration-500 ${isHovered ? 'pl-0' : ''}`}>
                   <item.icon size={22} className={`transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                </div>
                
                {/* Text Label - Smooth Reveal */}
                <span className={getTextClasses(isHovered)}>
                   {item.label}
                </span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-6 border-t border-gray-100 dark:border-slate-800 mx-2"></div>

          {/* Footer Items */}
          {footerItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`
                  w-full flex items-center h-12 rounded-xl text-sm font-medium transition-all duration-300 ease-out relative overflow-hidden group
                  ${isActive 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-slate-700' 
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title={!isHovered ? item.label : ''}
              >
                <div className="shrink-0 w-16 flex items-center justify-center">
                   <item.icon size={22} className={`transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                </div>
                <span className={getTextClasses(isHovered)}>
                   {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-2">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className={`
            w-full flex items-center h-11 rounded-xl text-sm font-medium transition-colors mb-2 overflow-hidden
            text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800
          `}
          title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
        >
          <div className="shrink-0 w-16 flex items-center justify-center">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </div>
          <span className={getTextClasses(isHovered)}>
             {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center h-12 mb-2 overflow-hidden relative">
          <div className="shrink-0 w-16 flex items-center justify-center">
             <img 
               src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`} 
               alt="User" 
               className="w-9 h-9 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm"
             />
          </div>
          <div className={`${getTextClasses(isHovered)} flex flex-col justify-center`}>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">{currentUser?.name || 'Usuário'}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-500 truncate leading-tight uppercase tracking-wider">{currentUser?.role || 'Visitante'}</p>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className={`
            w-full flex items-center h-11 rounded-xl text-sm font-medium transition-colors overflow-hidden
            text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
          `}
          title="Sair"
        >
          <div className="shrink-0 w-16 flex items-center justify-center">
             <LogOut size={20} />
          </div>
          <span className={getTextClasses(isHovered)}>
             Sair do Sistema
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
