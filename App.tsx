
import React, { useState, useEffect } from 'react';
import { View, Employee, Room, RoomStatus, BookingData, MaintenanceTicket, ActivityLog, ActivityType, Transaction, Product } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import SuitesView from './components/views/SuitesView';
import CalendarView from './components/views/CalendarView';
import ReportsView from './components/views/ReportsView';
import MaintenanceView from './components/views/MaintenanceView';
import CashierView from './components/views/CashierView';
import ChatView from './components/views/ChatView';
import AIAssistantView from './components/views/AIAssistantView';
import SettingsView from './components/views/SettingsView';
import LoginView from './components/views/LoginView';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  const [currentView, setCurrentView] = useState<View>(View.SUITES);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- GLOBAL ROOM STATE ---
  const [rooms, setRooms] = useState<Room[]>([]);

  // --- GLOBAL PRODUCTS STATE ---
  const [products, setProducts] = useState<Product[]>([
    { id: '1', code: '001', name: 'Água Mineral s/ Gás', category: 'Frigobar', price: 6.00, stock: 50, minStock: 10 },
    { id: '2', code: '002', name: 'Refrigerante Cola', category: 'Frigobar', price: 8.00, stock: 35, minStock: 10 },
    { id: '3', code: '003', name: 'Cerveja Long Neck', category: 'Frigobar', price: 14.00, stock: 24, minStock: 6 },
    { id: '4', code: '101', name: 'Sanduíche Misto', category: 'Restaurante', price: 25.00, stock: 100, minStock: 0 },
    { id: '5', code: '201', name: 'Kit Banho Premium', category: 'Recepção', price: 35.00, stock: 15, minStock: 5 },
  ]);

  // --- GLOBAL LOGS STATE ---
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const addLog = (type: ActivityType, action: string, description: string, user: string = 'Sistema') => {
    const newLog: ActivityLog = {
      id: Date.now().toString() + Math.random(),
      type,
      action,
      description,
      user,
      timestamp: new Date()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // --- GLOBAL TRANSACTIONS STATE (FINANCIAL) ---
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', description: 'Diária Quarto 25', amount: 250.00, type: 'income', date: new Date().toLocaleString(), category: 'Hospedagem', paymentMethod: 'cash' },
    { id: '2', description: 'Consumo Frigobar 42', amount: 45.90, type: 'income', date: new Date(Date.now() - 3600000).toLocaleString(), category: 'Frigobar', paymentMethod: 'credit' },
    { id: '3', description: 'Pagamento Fornecedor', amount: 1200.00, type: 'expense', date: new Date(Date.now() - 7200000).toLocaleString(), category: 'Fornecedores', paymentMethod: 'pix' },
  ]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  // --- GLOBAL MAINTENANCE TICKETS STATE ---
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([
    { 
      id: '1', 
      roomNumber: '102', 
      issue: 'Ar condicionado vazando', 
      priority: 'Alta', 
      status: 'Pendente',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    { 
      id: '2', 
      roomNumber: '25', 
      issue: 'Lâmpada banheiro queimada', 
      priority: 'Baixa', 
      status: 'Concluído',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      resolvedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    { 
      id: '3', 
      roomNumber: '304', 
      issue: 'Fechadura eletrônica falhando', 
      priority: 'Alta', 
      status: 'Em Andamento',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
    },
  ]);

  // --- GLOBAL CASHIER STATE ---
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [shiftData, setShiftData] = useState({
    operator: '',
    startingFloat: 0,
    startTime: new Date(),
    shiftName: '' // Added shiftName
  });

  const handleOpenShift = (operator: string, float: number, shiftName: string) => {
    setShiftData({
      operator,
      startingFloat: float,
      startTime: new Date(),
      shiftName
    });
    setIsShiftOpen(true);
    addLog('FINANCIAL', 'ABERTURA_CAIXA', `Caixa aberto por ${operator} (${shiftName}) com fundo de R$ ${float.toFixed(2)}`, operator);
  };

  const handleCloseShift = () => {
    addLog('FINANCIAL', 'FECHAMENTO_CAIXA', `Caixa fechado (${shiftData.shiftName}). Operador: ${shiftData.operator}`, shiftData.operator);
    setIsShiftOpen(false);
    setShiftData({
      operator: '',
      startingFloat: 0,
      startTime: new Date(),
      shiftName: ''
    });
  };

  // Room Generation Logic (Lifted from SuitesView)
  useEffect(() => {
    const floorConfig = [
      { name: '1º Andar', range: [25, 38], type: 'Standard', basePrice: 250 },
      { name: '2º Andar', range: [41, 59], type: 'Luxo', basePrice: 400 },
      { name: '3º Andar', range: [61, 79], type: 'Master', basePrice: 750 },
    ];

    const generatedRooms: Room[] = [];
    
    floorConfig.forEach(floor => {
      for (let i = floor.range[0]; i <= floor.range[1]; i++) {
        const roomNum = i;
        let status = RoomStatus.AVAILABLE;
        let guest = undefined;
        
        // Bed Logic Assignment
        let bedType: 'casal' | 'duplo' | 'triplo' = 'casal';
        if (floor.type === 'Standard') {
           bedType = i % 2 === 0 ? 'casal' : 'duplo';
        } else if (floor.type === 'Luxo') {
           bedType = i % 2 === 0 ? 'casal' : 'triplo';
        } else {
           bedType = 'casal';
        }

        const rand = Math.random();
        // Reduced random occupation for cleaner demo start
        if (rand > 0.80) {
          status = RoomStatus.OCCUPIED;
          guest = `Hóspede ${roomNum}`;
        } else if (rand > 0.75) {
          status = RoomStatus.DIRTY;
        } else if (rand > 0.95) {
          status = RoomStatus.MAINTENANCE;
        }

        generatedRooms.push({
          id: i,
          number: roomNum.toString(),
          type: floor.type as 'Standard' | 'Luxo' | 'Master',
          status,
          guestName: guest,
          bedType
        });
      }
    });

    setRooms(generatedRooms);
  }, []);

  // Lifted Employee State
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'Carlos Silva',
      email: 'carlos.gerente@hotel.com',
      phone: '(11) 99999-1234',
      username: 'carlos.silva',
      password: '123',
      role: 'Gerente',
      permissions: { suites: true, dashboard: true, calendar: true, reports: true, maintenance: true, cashier: true, chat: true, settings: true }
    },
    {
      id: '2',
      name: 'Ana Souza',
      email: 'ana.recep@hotel.com',
      phone: '(11) 98888-5678',
      username: 'ana.souza',
      password: '123',
      role: 'Recepcionista',
      permissions: { suites: true, dashboard: false, calendar: true, reports: false, maintenance: true, cashier: true, chat: true, settings: false }
    },
    {
      id: '3',
      name: 'Maria Oliveira',
      email: 'maria.limpeza@hotel.com',
      phone: '(11) 97777-1111',
      username: 'maria.o',
      password: '123',
      role: 'Arrumadeira',
      permissions: { suites: true, dashboard: false, calendar: false, reports: false, maintenance: false, cashier: false, chat: true, settings: false }
    },
    {
      id: '4',
      name: 'Joana Santos',
      email: 'joana.limpeza@hotel.com',
      phone: '(11) 97777-2222',
      username: 'joana.s',
      password: '123',
      role: 'Arrumadeira',
      permissions: { suites: true, dashboard: false, calendar: false, reports: false, maintenance: false, cashier: false, chat: true, settings: false }
    }
  ]);

  // Initialize Dark Mode from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false); // Close mobile menu on selection
  };

  // --- AUTH HANDLERS ---
  const handleLogin = (user: Employee) => {
    setCurrentUser(user);
    addLog('SYSTEM', 'LOGIN_REALIZADO', `Usuário ${user.username} realizou login.`, user.name);
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog('SYSTEM', 'LOGOUT_REALIZADO', `Usuário ${currentUser.username} realizou logout.`, currentUser.name);
    }
    setCurrentUser(null);
    setCurrentView(View.SUITES); // Reset view
  };

  // IF NOT AUTHENTICATED, SHOW LOGIN VIEW
  if (!currentUser) {
    return <LoginView employees={employees} onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD: return <DashboardView />;
      case View.SUITES: 
        return (
          <SuitesView 
            employees={employees} 
            rooms={rooms} 
            setRooms={setRooms} 
            tickets={tickets} 
            setTickets={setTickets} 
            products={products}
            addLog={addLog}
            addTransaction={addTransaction} 
          />
        );
      case View.CALENDAR: return <CalendarView rooms={rooms} addLog={addLog} />;
      case View.REPORTS: return <ReportsView activityLogs={activityLogs} />;
      case View.MAINTENANCE: return <MaintenanceView rooms={rooms} setRooms={setRooms} tickets={tickets} setTickets={setTickets} addLog={addLog} />;
      case View.CASHIER: 
        return (
          <CashierView 
            employees={employees} 
            isShiftOpen={isShiftOpen}
            shiftData={shiftData}
            onOpenShift={handleOpenShift}
            onCloseShift={handleCloseShift}
            addLog={addLog}
            transactions={transactions}
            addTransaction={addTransaction}
          />
        );
      case View.CHAT: return <ChatView />;
      case View.AI_ASSISTANT: return <AIAssistantView rooms={rooms} tickets={tickets} />;
      case View.SETTINGS: return <SettingsView employees={employees} setEmployees={setEmployees} products={products} setProducts={setProducts} addLog={addLog} />;
      default: return <SuitesView employees={employees} rooms={rooms} setRooms={setRooms} tickets={tickets} setTickets={setTickets} products={products} addLog={addLog} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] dark:bg-slate-950 overflow-hidden font-sans text-gray-900 dark:text-slate-100 flex-col md:flex-row transition-colors duration-300">
      
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30 transition-colors duration-300">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
           {/* Updated Mobile Logo to RR */}
           <img src="https://ui-avatars.com/api/?name=RR&background=4A4A4A&color=fff&size=64&rounded=true&bold=true&font-size=0.4" alt="Hotel Rudge Ramos" className="h-8 md:h-12 w-auto object-contain dark:hidden" />
           <img src="https://ui-avatars.com/api/?name=RR&background=0f172a&color=fff&size=64&rounded=true&bold=true&font-size=0.4" alt="Hotel Rudge Ramos" className="h-8 md:h-12 w-auto object-contain hidden dark:block" />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container - Responsive */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out h-full
        md:relative md:translate-x-0 md:block
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-auto'}
      `}>
        <Sidebar 
          currentView={currentView} 
          onChangeView={handleViewChange} 
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      </div>
      
      <main className="flex-1 h-full overflow-hidden relative w-full">
        <div className="h-full w-full">
           {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
