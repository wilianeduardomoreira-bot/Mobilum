
import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomStatus, Employee, BookingData, CheckInForm, MaintenanceTicket, ActivityType, Transaction, Product } from '../../types';
import { 
  User, ShieldCheck, Wrench, X, Car, 
  CreditCard, Calendar, Clock, Bell, Calculator,
  CheckCircle2, Plus, Coffee, LogOut, Save, Search, Printer, FileText, ArrowRight, ArrowLeft,
  BellRing, Maximize2, Minimize2, BedDouble, Bed, AlertTriangle, Lock, Sparkles
} from 'lucide-react';

interface SuitesViewProps {
  employees?: Employee[];
  rooms?: Room[]; // Received from App
  setRooms?: React.Dispatch<React.SetStateAction<Room[]>>; // Received from App
  tickets?: MaintenanceTicket[];
  setTickets?: React.Dispatch<React.SetStateAction<MaintenanceTicket[]>>;
  products?: Product[]; // Received from App
  addLog?: (type: ActivityType, action: string, description: string, user?: string) => void;
  addTransaction?: (transaction: Transaction) => void;
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SuitesView: React.FC<SuitesViewProps> = ({ employees = [], rooms = [], setRooms, tickets = [], setTickets, products = [], addLog, addTransaction }) => {
  // rooms are now props, not state here
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false); // The Final Invoice/Print Modal
  const [showStatementModal, setShowStatementModal] = useState(false); // The Intermediate Statement Modal
  const [showAlarmModal, setShowAlarmModal] = useState(false); // The Alarm Ringing Modal
  const [showCleanModal, setShowCleanModal] = useState(false); // The Clean Room Modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false); // New Maintenance Detail Modal
  const [isMaximized, setIsMaximized] = useState(false); // Maximize Occupied Modal
  
  // State to store active bookings (keyed by room ID)
  const [activeBookings, setActiveBookings] = useState<Record<number, BookingData>>({});
  
  // State for Ringing Rooms
  const [ringingRooms, setRingingRooms] = useState<number[]>([]);

  // Audio Reference for Alarm
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State for Cleaning
  const [selectedHousekeeper, setSelectedHousekeeper] = useState<string>('');

  // Form states
  const initialFormState: CheckInForm = {
    guestName: '',
    documentType: 'CPF',
    document: '',
    phone: '',
    email: '',
    guestsCount: 2,
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlate: '',
    checkInDate: getLocalDateString(),
    checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    expectedCheckout: getLocalDateString(new Date(Date.now() + 86400000)),
    dailyRate: 250,
    initialPayment: 0,
    initialPaymentMethod: 'pix',
    wakeUpEnabled: false,
    wakeUpDate: getLocalDateString(),
    wakeUpCall: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    notes: ''
  };

  const [checkInFormData, setCheckInFormData] = useState<CheckInForm>(initialFormState);
  
  // Temporary state for Occupied Modal actions
  const [newConsumptionItem, setNewConsumptionItem] = useState({ name: '', price: '', quantity: 1 });
  const [newPayment, setNewPayment] = useState({ amount: '', method: 'pix' });
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Floor configuration needed for pricing lookup
  const floorConfig = [
    { name: '1º Andar', range: [25, 38], type: 'Standard', basePrice: 250 },
    { name: '2º Andar', range: [41, 59], type: 'Luxo', basePrice: 400 },
    { name: '3º Andar', range: [61, 79], type: 'Master', basePrice: 750 },
  ];

  // Initialize Audio
  useEffect(() => {
    // Using a stable, relaxing gentle bell sound from Mixkit
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1119/1119-preview.mp3');
    audioRef.current.loop = true; // Loop the alarm sound
    audioRef.current.volume = 0.7; // Set volume to 70%
    audioRef.current.crossOrigin = "anonymous";
  }, []);

  const stopAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // --- ALARM LOGIC ---
  useEffect(() => {
    // Check every 1 second to be precise
    const interval = setInterval(() => {
      const now = new Date();
      // Manually format to HH:mm to match HTML input type="time"
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      const currentDate = getLocalDateString(now);

      const newRinging: number[] = [];
      
      Object.values(activeBookings).forEach((booking: unknown) => {
        const b = booking as BookingData;
        // Only trigger if enabled, date/time match, and NOT already ringing
        if (b.wakeUpEnabled && 
            b.wakeUpDate === currentDate && 
            b.wakeUpCall === currentTime &&
            !ringingRooms.includes(b.roomId)) {
          newRinging.push(b.roomId);
        }
      });

      if (newRinging.length > 0) {
        setRingingRooms(prev => [...prev, ...newRinging]);
        // Play Sound immediately when a new alarm triggers
        if (audioRef.current && audioRef.current.paused) {
           audioRef.current.play().catch(e => console.error('Audio play blocked. User interaction required first.', e));
        }
      }
    }, 1000); 

    return () => clearInterval(interval);
  }, [activeBookings, ringingRooms]);

  // Initial Bookings Generation (Run once based on incoming rooms props)
  useEffect(() => {
    // Only generate if we have rooms but no active bookings yet (first load)
    if (rooms.length > 0 && Object.keys(activeBookings).length === 0) {
        const initialBookings: Record<number, BookingData> = {};
        
        rooms.forEach(room => {
            if (room.status === RoomStatus.OCCUPIED) {
                 // Determine price based on type
                 const floor = floorConfig.find(f => f.type === room.type);
                 initialBookings[room.id] = {
                    ...initialFormState,
                    guestName: room.guestName || `Hóspede ${room.number}`,
                    roomId: room.id,
                    documentType: 'CPF',
                    document: '000.000.000-00',
                    vehicleModel: 'Modelo Aleatório',
                    vehiclePlate: 'ABC-1234',
                    dailyRate: floor ? floor.basePrice : 250,
                    consumption: [
                      { id: '1', item: 'Água Mineral', unitPrice: 8.00, quantity: 1, totalPrice: 8.00, timestamp: new Date() },
                    ],
                    payments: [
                      { id: '1', amount: (floor ? floor.basePrice : 250) * 0.5, method: 'pix', timestamp: new Date() }
                    ]
                  };
            }
        });
        setActiveBookings(initialBookings);
    }
  }, [rooms]);

  const handleRoomClick = (room: Room) => {
    // 1. Check if room is Ringing -> Open Alarm Modal
    if (ringingRooms.includes(room.id)) {
      setSelectedRoom(room);
      setShowAlarmModal(true);
      return;
    }

    if (room.status === RoomStatus.BLOCKED) {
        // Blocked room - maybe show a simple alert or do nothing for now
        alert(`Suíte ${room.number} está bloqueada.`);
        return;
    }

    if (room.status === RoomStatus.DIRTY) {
       setSelectedRoom(room);
       setShowCleanModal(true);
       setSelectedHousekeeper(''); // Reset selection
       return;
    }

    if (room.status === RoomStatus.MAINTENANCE) {
       setSelectedRoom(room);
       setShowMaintenanceModal(true);
       return;
    }

    if (room.status === RoomStatus.AVAILABLE) {
      // Setup Check-in
      const floor = floorConfig.find(f => f.type === room.type);
      const now = new Date();
      // Helper for formatting time "HH:mm"
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setCheckInFormData({
        ...initialFormState,
        dailyRate: floor ? floor.basePrice : 250,
        checkInDate: getLocalDateString(now),
        checkInTime: `${hours}:${minutes}`,
        wakeUpDate: getLocalDateString(now),
        wakeUpCall: `${hours}:${minutes}`,
      });
      setSelectedRoom(room);
    } else if (room.status === RoomStatus.OCCUPIED) {
      // Open Occupied Modal
      setSelectedRoom(room);
      setShowCheckoutModal(false);
      setShowStatementModal(false);
      setShowAlarmModal(false);
      setShowCleanModal(false);
      setShowMaintenanceModal(false);
      setIsMaximized(false); // Default to normal size
      
      // Ensure we have booking data (fallback if missing)
      if (!activeBookings[room.id]) {
        setActiveBookings(prev => ({
           ...prev,
           [room.id]: {
             ...initialFormState,
             roomId: room.id,
             guestName: room.guestName || 'Hóspede',
             consumption: [],
             payments: []
           }
        }));
      }
    }
  };

  const closeModal = () => {
    setSelectedRoom(null);
    setShowCheckoutModal(false);
    setShowStatementModal(false);
    setShowAlarmModal(false);
    setShowCleanModal(false);
    setShowMaintenanceModal(false);
    setIsMaximized(false);
    setNewConsumptionItem({ name: '', price: '', quantity: 1 });
    setNewPayment({ amount: '', method: 'pix' });
    setShowSuggestions(false);
  };

  // --- CLEANING LOGIC ---
  const handleCleanRoom = () => {
    if (!selectedRoom || !selectedHousekeeper || !setRooms) return;
    
    // Logic to clean room - update Global state
    setRooms(prev => prev.map(r => 
      r.id === selectedRoom.id ? { ...r, status: RoomStatus.AVAILABLE } : r
    ));
    
    // Log
    const housekeeperName = employees.find(e => e.id === selectedHousekeeper)?.name || 'Desconhecido';
    if(addLog) addLog('CLEANING', 'LIMPEZA_CONCLUIDA', `Quarto ${selectedRoom.number} limpo por ${housekeeperName}`, 'Governança');

    closeModal();
  };

  // --- MAINTENANCE RESOLUTION LOGIC ---
  const handleResolveMaintenance = () => {
    if (!selectedRoom || !setRooms || !setTickets) return;

    // 1. Find the active ticket for this room
    const activeTicket = tickets.find(t => t.roomNumber === selectedRoom.number && t.status !== 'Concluído');

    if (activeTicket) {
      // Mark Ticket as Done
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: 'Concluído' } : t));
    }

    // 2. Change Room Status to DIRTY (Limpeza)
    setRooms(prev => prev.map(r => 
       r.id === selectedRoom.id ? { ...r, status: RoomStatus.DIRTY } : r
    ));

    if(addLog) addLog('MAINTENANCE', 'MANUTENCAO_CONCLUIDA', `Manutenção concluída no quarto ${selectedRoom.number}. Status alterado para Limpeza.`);

    closeModal();
  };

  // --- ALARM ACTIONS ---
  const snoozeAlarm = () => {
    if (!selectedRoom) return;
    stopAlarmSound(); // STOP SOUND IMMEDIATELY

    const booking = activeBookings[selectedRoom.id];
    
    // Add 10 minutes
    const [h, m] = booking.wakeUpCall.split(':').map(Number);
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m + 10);
    
    const newH = String(date.getHours()).padStart(2, '0');
    const newM = String(date.getMinutes()).padStart(2, '0');
    const newTime = `${newH}:${newM}`;

    // Update booking
    setActiveBookings(prev => ({
      ...prev,
      [selectedRoom.id]: { ...booking, wakeUpCall: newTime }
    }));

    // Remove from ringing
    setRingingRooms(prev => prev.filter(id => id !== selectedRoom.id));
    closeModal();
  };

  const dismissAlarm = () => {
    if (!selectedRoom) return;
    stopAlarmSound(); // STOP SOUND IMMEDIATELY

    const booking = activeBookings[selectedRoom.id];
    
    // Disable alarm
    setActiveBookings(prev => ({
      ...prev,
      [selectedRoom.id]: { ...booking, wakeUpEnabled: false }
    }));

    // Remove from ringing
    setRingingRooms(prev => prev.filter(id => id !== selectedRoom.id));
    closeModal();
  };

  // --- CHECK-IN LOGIC ---

  const handleCheckInInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCheckInFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleWakeUpCheckIn = () => {
    setCheckInFormData(prev => ({ ...prev, wakeUpEnabled: !prev.wakeUpEnabled }));
  };

  const confirmCheckIn = () => {
    if (!selectedRoom || !setRooms) return;

    // Validation
    if (!checkInFormData.guestName.trim()) {
      alert("Por favor, preencha o Nome Completo do hóspede.");
      return;
    }
    if (!checkInFormData.document.trim()) {
      alert("Por favor, preencha o Documento (RG/CPF/CNH) do hóspede.");
      return;
    }

    const initialAmount = Number(checkInFormData.initialPayment);
    const initialMethod = checkInFormData.initialPaymentMethod as any;

    const newBooking: BookingData = {
      ...checkInFormData,
      roomId: selectedRoom.id,
      consumption: [],
      payments: initialAmount > 0 ? [{
        id: Date.now().toString(),
        amount: initialAmount,
        method: initialMethod,
        timestamp: new Date()
      }] : []
    };

    setActiveBookings(prev => ({ ...prev, [selectedRoom.id]: newBooking }));
    
    // Register initial payment in Finance
    if (initialAmount > 0 && addTransaction) {
        addTransaction({
           id: Date.now().toString(),
           description: `Adiantamento Check-in - Quarto ${selectedRoom.number} (${checkInFormData.guestName})`,
           amount: initialAmount,
           type: 'income',
           date: new Date().toLocaleString(),
           category: 'Hospedagem',
           paymentMethod: initialMethod
        });
    }

    // Update global room status
    setRooms(prev => prev.map(r => 
      r.id === selectedRoom.id ? { ...r, status: RoomStatus.OCCUPIED, guestName: checkInFormData.guestName } : r
    ));
    
    if(addLog) addLog('CHECK_IN', 'CHECK_IN_REALIZADO', `Check-in realizado para ${checkInFormData.guestName} no quarto ${selectedRoom.number}`);

    closeModal();
  };

  const checkInTotals = () => {
    const start = new Date(checkInFormData.checkInDate);
    const end = new Date(checkInFormData.expectedCheckout);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 
    const total = diffDays * checkInFormData.dailyRate;
    return { days: diffDays, total, remaining: total - checkInFormData.initialPayment };
  };

  // --- OCCUPIED ROOM LOGIC ---

  const getActiveBooking = () => selectedRoom ? activeBookings[selectedRoom.id] : null;

  const handleConsumptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewConsumptionItem(prev => ({ ...prev, name: value }));
    
    if (value.length > 0) {
      // Use products from props instead of static constant
      const matches = products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
      setProductSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectProductSuggestion = (product: Product) => {
    setNewConsumptionItem(prev => ({ ...prev, name: product.name, price: product.price.toFixed(2) }));
    setShowSuggestions(false);
  };

  const handleAddConsumption = () => {
    if (!selectedRoom || !newConsumptionItem.name || !newConsumptionItem.price) return;
    
    const unitPrice = parseFloat(newConsumptionItem.price);
    const qty = newConsumptionItem.quantity || 1;
    const booking = activeBookings[selectedRoom.id];
    
    const updatedBooking = {
      ...booking,
      consumption: [...booking.consumption, {
        id: Date.now().toString(),
        item: newConsumptionItem.name,
        unitPrice: unitPrice,
        quantity: qty,
        totalPrice: unitPrice * qty,
        timestamp: new Date()
      }]
    };

    setActiveBookings(prev => ({ ...prev, [selectedRoom.id]: updatedBooking }));
    setNewConsumptionItem({ name: '', price: '', quantity: 1 });
  };

  const handleAddPayment = () => {
    if (!selectedRoom || !newPayment.amount) return;
    
    const amountVal = parseFloat(newPayment.amount);
    const methodVal = newPayment.method as any;

    const booking = activeBookings[selectedRoom.id];
    const updatedBooking = {
      ...booking,
      payments: [...booking.payments, {
        id: Date.now().toString(),
        amount: amountVal,
        method: methodVal,
        timestamp: new Date()
      }]
    };

    // Register in Finance
    if (addTransaction) {
        addTransaction({
           id: Date.now().toString(),
           description: `Adiantamento - Quarto ${selectedRoom.number} (${booking.guestName})`,
           amount: amountVal,
           type: 'income',
           date: new Date().toLocaleString(),
           category: 'Hospedagem',
           paymentMethod: methodVal
        });
    }

    setActiveBookings(prev => ({ ...prev, [selectedRoom.id]: updatedBooking }));
    setNewPayment({ amount: '', method: 'pix' });
  };

  const toggleWakeUpOccupied = () => {
    if (!selectedRoom) return;
    const booking = activeBookings[selectedRoom.id];
    setActiveBookings(prev => ({
      ...prev,
      [selectedRoom.id]: { ...booking, wakeUpEnabled: !booking.wakeUpEnabled }
    }));
  };

  const updateBookingField = (field: keyof BookingData, value: any) => {
    if (!selectedRoom) return;
    setActiveBookings(prev => ({
      ...prev,
      [selectedRoom.id]: { ...prev[selectedRoom.id], [field]: value }
    }));
  };

  // Navigates from Occupied Details -> Statement
  const handleOpenStatement = () => {
    setShowStatementModal(true);
  };

  // Navigates from Statement -> Invoice
  const handleProceedToInvoice = () => {
    setShowStatementModal(false);
    setShowCheckoutModal(true);
  };

  const handlePrintReceipt = () => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const printContent = document.getElementById('printable-receipt');
      if (!printContent || !iframe.contentWindow) return;

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Comprovante</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 4px; border-bottom: 1px solid #ddd; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .uppercase { text-transform: uppercase; }
              .no-print { display: none; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script src="https://cdn.tailwindcss.com" onload="setTimeout(() => { window.focus(); window.print(); }, 500);"></script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
  };

  const handleFinishCheckout = () => {
      if (!selectedRoom || !setRooms) return;
      
      // Execute Checkout Logic (Clear Room)
      setRooms(prev => prev.map(r => 
        r.id === selectedRoom.id ? { ...r, status: RoomStatus.DIRTY, guestName: undefined } : r
      ));
      
      const guestName = activeBookings[selectedRoom.id]?.guestName || 'Desconhecido';
      const total = occupiedTotals().balance + occupiedTotals().paidTotal; // Approx total value

      if (activeBookings[selectedRoom.id]) {
        const { [selectedRoom.id]: _, ...remaining } = activeBookings;
        setActiveBookings(remaining);
      }
      
      if(addLog) addLog('CHECK_OUT', 'CHECK_OUT_REALIZADO', `Checkout do hóspede ${guestName} no quarto ${selectedRoom.number}. Total: R$ ${total.toFixed(2)}`);

      closeModal();
  };

  const occupiedTotals = () => {
    const booking = getActiveBooking();
    if (!booking) return { days: 0, roomTotal: 0, consumptionTotal: 0, paidTotal: 0, balance: 0 };

    const start = new Date(booking.checkInDate);
    const end = new Date(booking.expectedCheckout);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    const roomTotal = days * booking.dailyRate;
    const consumptionTotal = booking.consumption.reduce((sum, item) => sum + item.totalPrice, 0);
    const paidTotal = booking.payments.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      days,
      roomTotal,
      consumptionTotal,
      paidTotal,
      balance: (roomTotal + consumptionTotal) - paidTotal
    };
  };
  
  const formatCurrency = (val: number) => `R$ ${val.toFixed(2)}`;

  // --- UI HELPERS ---

  const getStatusStyles = (room: Room) => {
    // Priority: Ringing
    if (ringingRooms.includes(room.id)) {
      return {
        bg: 'bg-red-100 animate-pulse',
        border: 'border-red-500 ring-2 ring-red-400',
        text: 'text-red-800',
        icon: <BellRing size={16} className="text-red-600 animate-bounce" />,
        indicator: 'bg-red-600'
      };
    }

    switch (room.status) {
      case RoomStatus.AVAILABLE: 
        return { 
          bg: 'bg-green-50/50 hover:bg-green-100/50 dark:bg-green-900/20 dark:hover:bg-green-900/30', 
          border: 'border-green-200/50 dark:border-green-800/30', 
          text: 'text-gray-700 dark:text-green-100', 
          icon: <ShieldCheck size={14} className="text-green-600 dark:text-green-400" />,
          indicator: 'bg-green-500'
        };
      case RoomStatus.OCCUPIED: 
        return { 
          bg: 'bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700', 
          border: 'border-slate-800 dark:border-slate-700', 
          text: 'text-white', 
          icon: <User size={14} className="text-white/80" />,
          indicator: 'bg-slate-900 dark:bg-white'
        };
      case RoomStatus.DIRTY: 
        return { 
          bg: 'bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30', 
          border: 'border-amber-200/50 dark:border-amber-800/30', 
          text: 'text-gray-700 dark:text-amber-100', 
          icon: <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />,
          indicator: 'bg-amber-500'
        };
      case RoomStatus.MAINTENANCE: 
        return { 
          bg: 'bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 dark:hover:bg-red-900/30', 
          border: 'border-red-200/50 dark:border-red-800/30', 
          text: 'text-gray-700 dark:text-red-100', 
          icon: <Wrench size={14} className="text-red-600 dark:text-red-400" />,
          indicator: 'bg-red-500'
        };
      case RoomStatus.BLOCKED:
        return {
          bg: 'bg-black text-gray-300 hover:bg-gray-900',
          border: 'border-gray-800',
          text: 'text-gray-300',
          icon: <Lock size={14} className="text-gray-400" />,
          indicator: 'bg-gray-700'
        };
      default:
         return { bg: '', border: '', text: '', icon: null, indicator: '' };
    }
  };

  // Render Bed Icons based on room config - Resized for compact view
  const renderBedIcon = (type: string, isOccupied: boolean) => {
    const colorClass = isOccupied ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500';
    // Use consistent sizing class instead of size prop for better responsiveness
    const iconSizeClass = "w-3 h-3 md:w-4 md:h-4";
    
    if (type === 'casal') {
      return <BedDouble className={`${iconSizeClass} ${colorClass}`} />; 
    } else if (type === 'duplo') {
      return (
        <div className={`flex -space-x-1 ${colorClass}`}>
          <Bed className={iconSizeClass} />
          <Bed className={iconSizeClass} />
        </div>
      );
    } else { // triplo
      return (
        <div className={`flex -space-x-2 ${colorClass}`}>
          <Bed className={iconSizeClass} />
          <Bed className={iconSizeClass} />
          <Bed className={iconSizeClass} />
        </div>
      );
    }
  };

  const getRoomsByFloor = (start: number, end: number) => {
    return rooms.filter(r => {
      const num = parseInt(r.number);
      return num >= start && num <= end;
    });
  };

  const totals = checkInTotals();
  const occTotals = occupiedTotals();
  const housekeepers = employees.filter(e => e.role === 'Arrumadeira');
  const activeBooking = getActiveBooking();

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 shrink-0 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mapa de Suítes</h2>
          <p className="text-gray-500 dark:text-slate-400 text-xs md:text-sm mt-0.5">Visão geral das 52 unidades.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-4 text-xs font-medium bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="hidden sm:inline">Disponível</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-500"></span><span className="hidden sm:inline">Ocupado</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="hidden sm:inline">Limpeza</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="hidden sm:inline">Manutenção</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-black"></span><span className="hidden sm:inline">Bloqueado</span></div>
        </div>
      </div>

      {/* Main Grid Container - Fits Screen on Desktop, Scrolls on Mobile */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto md:overflow-hidden">
        {floorConfig.map((floor) => (
          <div key={floor.name} className="h-auto md:flex-1 flex flex-col min-h-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-2 md:p-3 border border-gray-200/80 dark:border-slate-700/80 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-800/80 shrink-0">
            <div className="flex justify-between items-center mb-2 px-1 shrink-0">
              <h3 className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{floor.name}</h3>
              <span className="text-[9px] md:text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 rounded-full font-medium">{floor.type}</span>
            </div>
            
            {/* Grid expands to fill remaining height on desktop, stacks on mobile */}
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-10 gap-2 h-full content-stretch">
              {getRoomsByFloor(floor.range[0], floor.range[1]).map((room) => {
                const styles = getStatusStyles(room);
                const isOccupied = room.status === RoomStatus.OCCUPIED;
                const booking = activeBookings[room.id];
                const hasActiveAlarm = booking?.wakeUpEnabled;

                return (
                  <div 
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className={`
                      relative flex flex-col justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer group h-full 
                      min-h-[90px] md:min-h-[60px] 
                      ${styles.bg} ${styles.border} ${styles.text} hover:scale-105 hover:shadow-md dark:shadow-none
                    `}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold text-xs md:text-sm tracking-tight">{room.number}</span>
                      <div className="flex items-center gap-0.5 md:gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {hasActiveAlarm && !ringingRooms.includes(room.id) && (
                           <div title={`Despertador: ${booking.wakeUpCall}`} className="text-indigo-400 dark:text-indigo-300">
                              <Clock size={12} className="md:w-3.5 md:h-3.5" />
                           </div>
                        )}
                        {/* Wrapper to control icon size specifically */}
                        <div className="w-3 h-3 md:w-3.5 md:h-3.5 flex items-center justify-center">
                           {styles.icon}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bed Drawing / Type Indicator - Centered */}
                    <div className="flex-1 flex items-center justify-center my-1">
                       {renderBedIcon(room.bedType, isOccupied)}
                    </div>
                    
                    <div className="mt-auto">
                      {room.guestName ? (
                        <p className="text-[8px] md:text-[9px] font-medium truncate opacity-90 leading-tight">{room.guestName}</p>
                      ) : (
                        <p className="text-[8px] md:text-[9px] opacity-50 font-medium capitalize truncate leading-tight">{room.bedType}</p>
                      )}
                    </div>

                    {room.status !== RoomStatus.OCCUPIED && room.status !== RoomStatus.BLOCKED && (
                      <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${styles.indicator} opacity-30`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- MODALS --- */}
      {selectedRoom && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity ${isMaximized ? 'p-0' : 'p-2 md:p-4'}`}>
          
          {/* ... (Existing Alarm, Maintenance, Clean Modals) ... */}
          {showAlarmModal && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ring-4 ring-red-100 dark:ring-red-900/20 m-4">
              <div className="bg-red-500 px-6 py-6 text-white text-center">
                 <BellRing size={48} className="mx-auto mb-2 animate-bounce" />
                 <h2 className="text-2xl font-bold">Alarme Disparando!</h2>
                 <p className="opacity-90">Suíte {selectedRoom.number}</p>
              </div>
              <div className="p-6 text-center">
                 <p className="text-gray-600 dark:text-slate-300 mb-6">O despertador programado para o hóspede <span className="font-bold text-gray-900 dark:text-white">{selectedRoom.guestName}</span> está tocando.</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={snoozeAlarm} className="py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-700">
                      <Clock size={20} />
                      Soneca (10m)
                    </button>
                    <button onClick={dismissAlarm} className="py-3 px-4 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none">
                      <Bell size={20} className="line-through" />
                      Desligar
                    </button>
                 </div>
              </div>
            </div>
          )}

          {showMaintenanceModal && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ring-4 ring-red-100 dark:ring-red-900/20 m-4 border border-red-200 dark:border-red-900/50">
              <div className="bg-red-600 px-6 py-6 text-white flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Wrench size={24}/> Em Manutenção</h2>
                    <p className="opacity-90">Suíte {selectedRoom.number} Indisponível</p>
                 </div>
                 <button onClick={closeModal} className="p-1 hover:bg-red-700 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6">
                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Ocorrência Ativa</p>
                    {(() => {
                        const ticket = tickets.find(t => t.roomNumber === selectedRoom.number && t.status !== 'Concluído');
                        return ticket ? (
                            <>
                                <p className="text-gray-900 dark:text-white font-medium mb-2">{ticket.issue}</p>
                                <div className="flex gap-2 text-xs">
                                   <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-red-200 dark:border-red-800 text-gray-600 dark:text-slate-300">Prioridade: {ticket.priority}</span>
                                   <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-red-200 dark:border-red-800 text-gray-600 dark:text-slate-300">Status: {ticket.status}</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 italic text-sm">Nenhuma ocorrência registrada no sistema, mas o quarto consta como manutenção.</p>
                        );
                    })()}
                 </div>

                 <p className="text-gray-600 dark:text-slate-300 mb-4 text-sm">Deseja concluir a manutenção e liberar o quarto para limpeza?</p>

                 <button 
                   onClick={handleResolveMaintenance}
                   className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all"
                 >
                   <CheckCircle2 size={20} />
                   Tirar da Manutenção (Ir p/ Limpeza)
                 </button>
              </div>
            </div>
          )}

          {showCleanModal && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ring-4 ring-amber-100 dark:ring-amber-900/20 m-4">
              <div className="bg-amber-500 px-6 py-6 text-white flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles size={24}/> Limpeza do Quarto</h2>
                    <p className="opacity-90">Liberar Suíte {selectedRoom.number}</p>
                 </div>
                 <button onClick={closeModal} className="p-1 hover:bg-amber-600 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6">
                 <p className="text-gray-600 dark:text-slate-300 mb-4 text-sm">Para alterar o status de <strong>Limpeza</strong> para <strong>Disponível</strong>, identifique o funcionário responsável.</p>
                 
                 <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Arrumadeira Responsável</label>
                    <select 
                      value={selectedHousekeeper} 
                      onChange={(e) => setSelectedHousekeeper(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                    >
                       <option value="">Selecione...</option>
                       {housekeepers.map(h => (
                         <option key={h.id} value={h.id}>{h.name}</option>
                       ))}
                    </select>
                 </div>

                 <button 
                   onClick={handleCleanRoom}
                   disabled={!selectedHousekeeper}
                   className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-200 dark:shadow-none transition-all"
                 >
                   <CheckCircle2 size={20} />
                   Confirmar e Liberar
                 </button>
              </div>
            </div>
          )}
          
          {selectedRoom.status === RoomStatus.AVAILABLE && !showAlarmModal && !showCleanModal && !showMaintenanceModal && (
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
               {/* ... (Check-in Modal Content - Identical to previous) ... */}
               <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-800 dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-gray-300 dark:shadow-none shadow-lg text-white font-bold text-lg">
                     {selectedRoom.number}
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">Novo Check-in</h3>
                     <p className="text-xs text-gray-500 dark:text-slate-400">Suíte {selectedRoom.type} • {selectedRoom.bedType.toUpperCase()}</p>
                   </div>
                 </div>
                 <button onClick={closeModal} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-slate-400"><X size={20} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-slate-900">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                   <div className="md:col-span-8 space-y-6">
                     <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
                       <div className="flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-200">
                         <User size={18} />
                         <h4 className="font-semibold text-sm">Dados do Hóspede</h4>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="md:col-span-2">
                           <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                           <input type="text" name="guestName" value={checkInFormData.guestName} onChange={handleCheckInInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-slate-500 outline-none" placeholder="Ex: João da Silva" />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Documento <span className="text-red-500">*</span></label>
                           <div className="flex gap-2">
                             <select
                               name="documentType"
                               value={checkInFormData.documentType}
                               onChange={handleCheckInInputChange}
                               className="w-20 rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-2 py-2 text-base md:text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                             >
                               <option value="CPF">CPF</option>
                               <option value="RG">RG</option>
                               <option value="CNH">CNH</option>
                             </select>
                             <input type="text" name="document" value={checkInFormData.document} onChange={handleCheckInInputChange} className="flex-1 rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-slate-500 outline-none" placeholder="Número" />
                           </div>
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Celular</label>
                           <input type="text" name="phone" value={checkInFormData.phone} onChange={handleCheckInInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm focus:ring-2 focus:ring-slate-500 outline-none" placeholder="(00) 00000-0000" />
                         </div>
                       </div>
                     </div>

                     <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
                       <div className="flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-200">
                         <Car size={18} />
                         <h4 className="font-semibold text-sm">Veículo</h4>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <input type="text" name="vehicleModel" value={checkInFormData.vehicleModel} onChange={handleCheckInInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm outline-none" placeholder="Modelo" />
                         <input type="text" name="vehicleColor" value={checkInFormData.vehicleColor} onChange={handleCheckInInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm outline-none" placeholder="Cor" />
                         <input type="text" name="vehiclePlate" value={checkInFormData.vehiclePlate} onChange={handleCheckInInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm outline-none" placeholder="Placa" />
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
                           <div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200">
                             <div className="flex items-center gap-2"><Bell size={18} /><h4 className="font-semibold text-sm">Despertador</h4></div>
                             <button onClick={toggleWakeUpCheckIn} className={`w-10 h-5 rounded-full flex items-center px-1 shadow-inner transition-colors ${checkInFormData.wakeUpEnabled ? 'bg-green-500 justify-end' : 'bg-gray-300 dark:bg-slate-600'}`}><div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div></button>
                           </div>
                           <div className="space-y-2">
                             <input type="date" name="wakeUpDate" value={checkInFormData.wakeUpDate} onChange={handleCheckInInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm outline-none mb-2" />
                             <input type="time" name="wakeUpCall" value={checkInFormData.wakeUpCall} onChange={handleCheckInInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm outline-none" />
                           </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
                           <textarea name="notes" value={checkInFormData.notes} onChange={handleCheckInInputChange} className="w-full h-24 resize-none rounded-lg border-gray-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white border px-3 py-2 text-base md:text-sm outline-none" placeholder="Observações..."></textarea>
                        </div>
                     </div>
                   </div>

                   <div className="md:col-span-4 space-y-6">
                     <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm ring-1 ring-slate-50 dark:ring-transparent">
                       <div className="flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-200"><Calendar size={18} /><h4 className="font-semibold text-sm">Período</h4></div>
                       <div className="space-y-3">
                         <div className="flex gap-2"><input type="date" name="checkInDate" value={checkInFormData.checkInDate} onChange={handleCheckInInputChange} className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-base md:text-sm" /><input type="time" name="checkInTime" value={checkInFormData.checkInTime} onChange={handleCheckInInputChange} className="w-20 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-base md:text-sm" /></div>
                         <div><label className="text-xs text-gray-500 dark:text-slate-400">Saída</label><input type="date" name="expectedCheckout" value={checkInFormData.expectedCheckout} onChange={handleCheckInInputChange} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-base md:text-sm" /></div>
                         <div className="flex justify-between pt-2"><span className="text-sm text-gray-600 dark:text-slate-400">Diárias</span><span className="font-bold text-slate-800 dark:text-white">{totals.days}</span></div>
                       </div>
                     </div>

                     <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-5 text-white shadow-lg">
                       <div className="flex items-center gap-2 mb-4 text-slate-300"><Calculator size={18} /><h4 className="font-semibold text-sm">Valores</h4></div>
                       <div className="space-y-3 text-sm">
                         <div className="flex justify-between"><span className="text-gray-400">Total Diárias</span><span className="font-medium">R$ {totals.total.toFixed(2)}</span></div>
                         <div className="pt-2 border-t border-gray-700">
                           <div className="flex justify-between mb-2"><span className="text-slate-300">Adiantamento</span><input type="number" name="initialPayment" value={checkInFormData.initialPayment} onChange={handleCheckInInputChange} className="w-20 bg-gray-800 border-none rounded text-right p-1 text-green-400 font-bold text-sm" /></div>
                           <select name="initialPaymentMethod" value={checkInFormData.initialPaymentMethod} onChange={handleCheckInInputChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg text-xs p-1.5 outline-none"><option value="pix">PIX</option><option value="credit">Crédito</option><option value="debit">Débito</option><option value="cash">Dinheiro</option></select>
                         </div>
                         <div className="flex justify-between pt-3 mt-2 border-t border-gray-700 text-lg font-bold"><span>Restante</span><span className="text-green-400">R$ {totals.remaining.toFixed(2)}</span></div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex flex-col sm:flex-row justify-end gap-3">
                 <button onClick={closeModal} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 w-full sm:w-auto">Cancelar</button>
                 <button onClick={confirmCheckIn} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 shadow-lg shadow-gray-400 dark:shadow-none flex items-center justify-center gap-2 w-full sm:w-auto"><CheckCircle2 size={18} /> Confirmar Check-in</button>
               </div>
             </div>
          )}

          {/* OCCUPIED DETAILS - RENDERED AS IS, NO CHANGES NEEDED HERE FOR GRID FIX */}
          {selectedRoom.status === RoomStatus.OCCUPIED && activeBooking && !showCheckoutModal && !showStatementModal && !showAlarmModal && !showCleanModal && !showMaintenanceModal && (
            <div className={`bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 ${isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh] rounded-2xl'}`}>
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                {/* ... (Header content unchanged) ... */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
                    {selectedRoom.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeBooking.guestName}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1 flex-wrap">
                       <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">Hospedado</span>
                       <span className="hidden sm:inline">•</span>
                       <span className="hidden sm:inline">Entrada: {new Date(activeBooking.checkInDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400 hidden md:block">
                    {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button onClick={closeModal} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400"><X size={20} /></button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden p-4 md:p-6 bg-gray-50/50 dark:bg-slate-950/50">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full overflow-y-auto lg:overflow-hidden">
                  
                  {/* LEFT COL: Guest, Financials, Wake Up */}
                  <div className="lg:col-span-5 flex flex-col gap-4 h-auto lg:h-full lg:overflow-y-auto pr-0 lg:pr-2">
                    
                    {/* Guest Summary Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm shrink-0">
                       <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-slate-200 border-b border-gray-50 dark:border-slate-800 pb-2">
                         <User size={18} className="text-slate-600 dark:text-slate-400"/>
                         <h4 className="font-semibold text-sm">Detalhes do Hóspede</h4>
                       </div>
                       <div className="space-y-3 text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div><p className="text-xs text-gray-400 dark:text-slate-500">Documento</p><p className="font-medium text-gray-700 dark:text-slate-300">{activeBooking.documentType} {activeBooking.document || '-'}</p></div>
                             <div><p className="text-xs text-gray-400 dark:text-slate-500">Celular</p><p className="font-medium text-gray-700 dark:text-slate-300">{activeBooking.phone || '-'}</p></div>
                          </div>
                          <div><p className="text-xs text-gray-400 dark:text-slate-500">Veículo</p><p className="font-medium text-gray-700 dark:text-slate-300">{activeBooking.vehicleModel} - {activeBooking.vehiclePlate}</p></div>
                          <div><p className="text-xs text-gray-400 dark:text-slate-500">Observações</p><p className="text-gray-600 dark:text-slate-400 italic text-xs">{activeBooking.notes || 'Nenhuma observação.'}</p></div>
                       </div>
                    </div>

                    {/* Financial Summary & Payment */}
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex-col lg:flex-1 min-h-[300px] flex">
                       <div className="absolute top-0 right-0 p-3 opacity-10"><Calculator size={100} /></div>
                       <div className="relative z-10 flex flex-col h-full">
                          
                          <h4 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><CreditCard size={18}/> Extrato da Conta</h4>
                          
                          {/* Financial Breakdown */}
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between text-gray-400"><span>Hospedagem ({occTotals.days}d)</span><span>R$ {occTotals.roomTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-400"><span>Total Consumo</span><span>R$ {occTotals.consumptionTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-green-400 font-medium"><span>Total Pago</span><span>- R$ {occTotals.paidTotal.toFixed(2)}</span></div>
                            <div className="border-b border-gray-700 my-2"></div>
                            <div className="flex justify-between font-bold text-xl"><span>Saldo Devedor</span><span>R$ {occTotals.balance.toFixed(2)}</span></div>
                          </div>

                          {/* Payment History List */}
                          <div className="flex-1 bg-gray-800/40 rounded-xl mb-4 p-3 overflow-y-auto border border-gray-700 max-h-40 lg:max-h-none">
                             <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Histórico de Pagamentos</p>
                             {activeBooking.payments.length > 0 ? (
                               <div className="space-y-1.5">
                                 {activeBooking.payments.map((p) => (
                                   <div key={p.id} className="flex justify-between text-xs text-gray-300 bg-gray-800 p-1.5 rounded border border-gray-700/50">
                                      <span>{new Date(p.timestamp).toLocaleDateString()} - <span className="uppercase text-slate-300">{p.method}</span></span>
                                      <span className="font-medium text-green-400">R$ {p.amount.toFixed(2)}</span>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <p className="text-xs text-gray-600 italic text-center py-2">Nenhum pagamento registrado.</p>
                             )}
                          </div>

                          {/* New Payment Input */}
                          <div className="mt-auto shrink-0">
                            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                              <label className="text-xs text-gray-400 block mb-2">Novo Adiantamento</label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                  <input type="number" placeholder="Valor" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="w-full sm:w-24 bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-white outline-none focus:border-green-500 text-sm" />
                                  <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-white outline-none focus:border-green-500 text-sm">
                                    <option value="pix">PIX</option>
                                    <option value="credit">Crédito</option>
                                    <option value="debit">Débito</option>
                                    <option value="cash">Dinheiro</option>
                                  </select>
                                  <button onClick={handleAddPayment} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-xs uppercase tracking-wide w-full sm:w-auto">Lançar</button>
                              </div>
                            </div>
                          </div>

                       </div>
                    </div>

                    {/* Wake Up */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm shrink-0 mb-4 lg:mb-0">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 text-gray-800 dark:text-slate-200">
                             <Clock size={18} className="text-slate-600 dark:text-slate-400"/>
                             <h4 className="font-semibold text-sm">Despertador</h4>
                           </div>
                           <button onClick={toggleWakeUpOccupied} className={`w-10 h-5 rounded-full flex items-center px-1 shadow-inner transition-colors ${activeBooking.wakeUpEnabled ? 'bg-green-500 justify-end' : 'bg-gray-300 dark:bg-slate-600'}`}><div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <input type="date" value={activeBooking.wakeUpDate} onChange={(e) => updateBookingField('wakeUpDate', e.target.value)} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm" />
                           <input type="time" value={activeBooking.wakeUpCall} onChange={(e) => updateBookingField('wakeUpCall', e.target.value)} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm" />
                        </div>
                    </div>

                  </div>

                  {/* RIGHT COL: Consumption (Full Height) */}
                  <div className="lg:col-span-7 h-auto lg:h-full flex flex-col min-h-[400px]">
                    
                    {/* Consumption / Orders */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                       <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-2 font-semibold text-sm text-gray-800 dark:text-slate-200"><Coffee size={18} className="text-amber-600"/> Consumo & Pedidos</div>
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-gray-200 dark:border-slate-700">Total: R$ {occTotals.consumptionTotal.toFixed(2)}</span>
                       </div>
                       
                       {/* Add Item Bar */}
                       <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 shrink-0 relative z-20">
                          {/* ... Autocomplete and input logic ... */}
                          <div className="flex-1 relative">
                             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><Search size={14} /></div>
                             <input 
                               type="text" 
                               placeholder="Item..." 
                               value={newConsumptionItem.name} 
                               onChange={handleConsumptionInputChange} 
                               className="w-full pl-9 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 text-base md:text-sm outline-none focus:border-slate-500 focus:border-slate-500 focus:ring-1 focus:ring-slate-500" 
                             />
                             {/* Autocomplete Dropdown */}
                             {showSuggestions && productSuggestions.length > 0 && (
                               <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                                 {productSuggestions.map((product, idx) => (
                                   <div 
                                     key={idx}
                                     className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center text-sm border-b border-gray-50 dark:border-slate-700 last:border-none"
                                     onClick={() => selectProductSuggestion(product)}
                                   >
                                     <span className="text-gray-700 dark:text-slate-200 font-medium">{product.name}</span>
                                     <span className="text-slate-800 dark:text-white font-bold">R$ {product.price.toFixed(2)}</span>
                                   </div>
                                 ))}
                               </div>
                             )}
                          </div>
                          <div className="flex gap-2">
                             <div className="flex items-center gap-1 w-20">
                                <span className="text-xs text-gray-400">Qtd</span>
                                <input type="number" min="1" value={newConsumptionItem.quantity} onChange={e => setNewConsumptionItem({...newConsumptionItem, quantity: parseInt(e.target.value) || 1})} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-2 text-base md:text-sm outline-none focus:border-slate-500" />
                             </div>
                             <div className="flex items-center gap-1 w-24">
                                <span className="text-xs text-gray-400">R$</span>
                                <input type="number" readOnly placeholder="Preço" value={newConsumptionItem.price} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 px-2 py-2 text-base md:text-sm outline-none text-gray-500 dark:text-slate-400" />
                             </div>
                             <button onClick={handleAddConsumption} className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none"><Plus size={20}/></button>
                          </div>
                       </div>

                       <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-slate-900">
                          <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50/50 dark:bg-slate-800/50 sticky top-0 text-xs text-gray-500 dark:text-slate-400 uppercase">
                               <tr><th className="px-4 py-2">Item</th><th className="px-4 py-2 text-center">Qtd</th><th className="px-4 py-2 text-right">Unit.</th><th className="px-4 py-2 text-right">Total</th></tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                               {activeBooking.consumption.map((c) => (
                                 <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                   <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{c.item}</td>
                                   <td className="px-4 py-3 text-center text-gray-600 dark:text-slate-400">{c.quantity}</td>
                                   <td className="px-4 py-3 text-right text-gray-500 dark:text-slate-500 text-xs">R$ {c.unitPrice.toFixed(2)}</td>
                                   <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">R$ {c.totalPrice.toFixed(2)}</td>
                                 </tr>
                               ))}
                               {activeBooking.consumption.length === 0 && (
                                 <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2"><Coffee size={24} className="opacity-20"/>Nenhum consumo registrado.</td></tr>
                               )}
                             </tbody>
                          </table>
                       </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-3">
                 {/* Left: Check-out Trigger */}
                 <button onClick={handleOpenStatement} className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none transition-all flex items-center justify-center gap-2 transform active:scale-95">
                    <LogOut size={18} />
                    Finalizar Conta / Check-out
                 </button>

                 {/* Right: Save */}
                 <button onClick={closeModal} className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 shadow-lg shadow-gray-400 dark:shadow-none flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                    <Save size={18}/> Salvar Alterações
                 </button>
              </div>

            </div>
          )}

          {/* ... (Statement and Checkout Modals - kept as is) ... */}
          {selectedRoom.status === RoomStatus.OCCUPIED && activeBooking && showStatementModal && !showAlarmModal && (
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
               {/* ... Full content of statement modal ... */}
               {/* Header */}
               <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg"><FileText size={20} /></div>
                    <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Extrato de Conta - Conferência</h3><p className="text-xs text-gray-500 dark:text-slate-400">Detalhes completos para fechamento</p></div>
                  </div>
                  <button onClick={() => setShowStatementModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-slate-400"><X size={20} /></button>
               </div>
               
               {/* Detailed Body */}
               <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900 space-y-6">
                  
                  {/* Guest Info Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Hóspede</p>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">{activeBooking.guestName}</p>
                      </div>
                      <div className="mt-2 sm:mt-0 text-right">
                          <p className="text-xs text-gray-500 dark:text-slate-400">Quarto <span className="font-bold text-gray-900 dark:text-white text-sm">{selectedRoom.number}</span></p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Permanência: <span className="font-bold text-gray-900 dark:text-white text-sm">{occTotals.days} dias</span></p>
                      </div>
                  </div>

                  {/* Section 1: Accommodation */}
                  <div>
                      <h4 className="font-bold text-gray-800 dark:text-white mb-3 border-b border-gray-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wide flex items-center gap-2"><BedDouble size={16}/> Hospedagem</h4>
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase">
                              <tr>
                                  <th className="px-3 py-2 rounded-l-lg">Entrada</th>
                                  <th className="px-3 py-2">Saída (Prevista)</th>
                                  <th className="px-3 py-2 text-center">Dias</th>
                                  <th className="px-3 py-2 text-right">Diária</th>
                                  <th className="px-3 py-2 text-right rounded-r-lg">Total</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                              <tr>
                                  <td className="px-3 py-3 text-gray-700 dark:text-slate-300">{new Date(activeBooking.checkInDate).toLocaleDateString()}</td>
                                  <td className="px-3 py-3 text-gray-700 dark:text-slate-300">{new Date(activeBooking.expectedCheckout).toLocaleDateString()}</td>
                                  <td className="px-3 py-3 text-center text-gray-700 dark:text-slate-300">{occTotals.days}</td>
                                  <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-300">R$ {activeBooking.dailyRate.toFixed(2)}</td>
                                  <td className="px-3 py-3 text-right font-bold text-gray-900 dark:text-white">R$ {occTotals.roomTotal.toFixed(2)}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  {/* Section 2: Consumption */}
                  <div>
                      <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2 mb-3">
                          <h4 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2"><Coffee size={16}/> Consumo e Frigobar</h4>
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Total: R$ {occTotals.consumptionTotal.toFixed(2)}</span>
                      </div>
                      {activeBooking.consumption.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-3 py-2 rounded-l-lg">Item</th>
                                        <th className="px-3 py-2 text-center">Qtd</th>
                                        <th className="px-3 py-2 text-right">Valor Unit.</th>
                                        <th className="px-3 py-2 text-right rounded-r-lg">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {activeBooking.consumption.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="px-3 py-2 text-gray-700 dark:text-slate-300">{item.item}</td>
                                            <td className="px-3 py-2 text-center text-gray-600 dark:text-slate-400">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right text-gray-600 dark:text-slate-400">R$ {item.unitPrice.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">R$ {item.totalPrice.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                      ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-500 italic py-2">Nenhum consumo registrado.</p>
                      )}
                  </div>

                  {/* Section 3: Payments */}
                  <div>
                      <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2 mb-3">
                          <h4 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2"><CreditCard size={16}/> Pagamentos / Adiantamentos</h4>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">Total Pago: R$ {occTotals.paidTotal.toFixed(2)}</span>
                      </div>
                      {activeBooking.payments.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="px-3 py-2 rounded-l-lg">Data</th>
                                    <th className="px-3 py-2">Forma Pagto.</th>
                                    <th className="px-3 py-2 text-right rounded-r-lg">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {activeBooking.payments.map((p, idx) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-2 text-gray-700 dark:text-slate-300">{new Date(p.timestamp).toLocaleDateString()} {new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="px-3 py-2 text-gray-700 dark:text-slate-300 uppercase">{p.method}</td>
                                        <td className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400">R$ {p.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-500 italic py-2">Nenhum pagamento antecipado.</p>
                      )}
                  </div>

                  {/* Summary Totals */}
                  <div className="mt-6 bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                       <div className="flex justify-between text-sm">
                           <span className="text-gray-600 dark:text-slate-400">Total Hospedagem</span>
                           <span className="font-medium text-gray-900 dark:text-white">R$ {occTotals.roomTotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                           <span className="text-gray-600 dark:text-slate-400">Total Consumo</span>
                           <span className="font-medium text-gray-900 dark:text-white">R$ {occTotals.consumptionTotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm border-b border-gray-200 dark:border-slate-700 pb-2">
                           <span className="text-gray-600 dark:text-slate-400">Total Pago (Adiantamentos)</span>
                           <span className="font-medium text-green-600 dark:text-green-400">- R$ {occTotals.paidTotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2">
                           <span className="font-bold text-lg text-gray-900 dark:text-white uppercase">Saldo Final a Pagar</span>
                           <span className="font-bold text-2xl text-slate-900 dark:text-white">R$ {occTotals.balance.toFixed(2)}</span>
                       </div>
                  </div>

               </div>
               
               {/* Footer */}
               <div className="bg-slate-900 dark:bg-slate-950 text-white p-6">
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => setShowStatementModal(false)} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors flex items-center justify-center gap-2"><ArrowLeft size={18} /> Voltar</button>
                    <button onClick={handleProceedToInvoice} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">Ir para Fechamento <ArrowRight size={18} /></button>
                 </div>
               </div>
             </div>
          )}

          {selectedRoom.status === RoomStatus.OCCUPIED && activeBooking && showCheckoutModal && !showAlarmModal && !showCleanModal && (
             // ... Checkout Modal Code ...
             <div className="bg-gray-100 dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                <div className="bg-slate-800 dark:bg-slate-950 text-white px-6 py-4 flex justify-between items-center no-print">
                    <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> Fechamento de Conta</h3>
                    <button onClick={() => setShowCheckoutModal(false)} className="hover:bg-slate-700 p-1.5 rounded-full"><X size={18}/></button>
                </div>
                {/* Print content area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-200 dark:bg-slate-800 flex justify-center">
                   <div id="printable-receipt" className="bg-white w-full max-w-md shadow-sm p-8 text-sm font-mono text-gray-700 border border-gray-300">
                      
                      {/* Header */}
                      <div className="text-center border-b border-gray-300 pb-4 mb-4">
                          <h2 className="font-bold text-xl text-gray-900 uppercase tracking-widest">Hotel Rudge Ramos</h2>
                          <p className="text-xs text-gray-500 mt-1">Seu conforto, Nossa prioridade.</p>
                          <div className="mt-4 text-left grid grid-cols-2 gap-2 text-xs">
                             <div><span className="text-gray-500">Quarto:</span> <span className="font-bold text-gray-900">{selectedRoom.number}</span></div>
                             <div><span className="text-gray-500">Tipo:</span> <span className="font-bold text-gray-900">{selectedRoom.type}</span></div>
                             <div><span className="text-gray-500">Check-in:</span> <span className="font-bold text-gray-900">{new Date(activeBooking.checkInDate).toLocaleDateString()} {activeBooking.checkInTime}</span></div>
                             <div><span className="text-gray-500">Check-out:</span> <span className="font-bold text-gray-900">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                          </div>
                          <div className="mt-2 text-left text-xs">
                             <span className="text-gray-500">Hóspede:</span> <span className="font-bold text-gray-900 uppercase">{activeBooking.guestName}</span>
                             <br/>
                             <span className="text-gray-500">Doc:</span> {activeBooking.document || '-'}
                          </div>
                      </div>

                      {/* Section 1: Accommodations */}
                      <div className="mb-4">
                        <h4 className="font-bold text-xs uppercase border-b border-gray-800 mb-2">Hospedagem</h4>
                        <table className="w-full text-xs">
                           <tbody>
                             <tr>
                               <td className="py-1">Diárias ({occTotals.days} dias)</td>
                               <td className="text-right py-1">R$ {activeBooking.dailyRate.toFixed(2)} un.</td>
                               <td className="text-right py-1 font-bold">R$ {occTotals.roomTotal.toFixed(2)}</td>
                             </tr>
                           </tbody>
                        </table>
                      </div>

                      {/* Section 2: Consumption */}
                      {activeBooking.consumption.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-bold text-xs uppercase border-b border-gray-800 mb-2">Consumo / Frigobar</h4>
                          <table className="w-full text-xs">
                             <tbody>
                               {activeBooking.consumption.map((c, i) => (
                                 <tr key={i}>
                                   <td className="py-1">{c.item}</td>
                                   <td className="text-center py-1">x{c.quantity}</td>
                                   <td className="text-right py-1">R$ {c.totalPrice.toFixed(2)}</td>
                                 </tr>
                               ))}
                             </tbody>
                          </table>
                          <div className="text-right text-xs font-bold mt-1 pt-1 border-t border-dashed border-gray-300">
                             Total Consumo: R$ {occTotals.consumptionTotal.toFixed(2)}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Payments */}
                      {activeBooking.payments.length > 0 && (
                         <div className="mb-4">
                            <h4 className="font-bold text-xs uppercase border-b border-gray-800 mb-2">Histórico de Pagamentos</h4>
                            <table className="w-full text-xs">
                               <tbody>
                                 {activeBooking.payments.map((p, i) => (
                                   <tr key={i}>
                                     <td className="py-1">{new Date(p.timestamp).toLocaleDateString()}</td>
                                     <td className="text-center py-1 uppercase">{p.method}</td>
                                     <td className="text-right py-1">- R$ {p.amount.toFixed(2)}</td>
                                   </tr>
                                 ))}
                               </tbody>
                            </table>
                         </div>
                      )}

                      {/* Final Summary */}
                      <div className="mt-6 border-t-2 border-gray-900 pt-2">
                          <div className="flex justify-between text-xs mb-1">
                             <span>Subtotal (Hosp. + Consumo):</span>
                             <span>R$ {(occTotals.roomTotal + occTotals.consumptionTotal).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs mb-2">
                             <span>Total Pago:</span>
                             <span>- R$ {occTotals.paidTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-lg font-bold border-t border-dashed border-gray-400 pt-2">
                             <span>SALDO FINAL:</span>
                             <span>{formatCurrency(occTotals.balance)}</span>
                          </div>
                      </div>

                      {/* Signature */}
                      <div className="mt-12 pt-2 border-t border-gray-400 text-center">
                          <p className="text-xs text-gray-500 uppercase">Assinatura do Hóspede</p>
                      </div>
                      
                      <div className="mt-8 text-center text-[10px] text-gray-400">
                         Obrigado pela preferência!
                      </div>

                   </div>
                </div>
                {/* Actions */}
                <div className="bg-white dark:bg-slate-900 p-4 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3 no-print">
                   <button onClick={() => setShowCheckoutModal(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium w-full sm:w-auto">Cancelar</button>
                   <button onClick={handleFinishCheckout} className="px-6 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-400 dark:shadow-none w-full sm:w-auto"><CheckCircle2 size={18} /> Finalizar Check-out</button>
                </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default SuitesView;
