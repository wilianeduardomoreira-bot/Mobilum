
import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Plus, X, User, CheckCircle2, ChevronLeft, ChevronRight, LayoutGrid, Columns, Clock, CalendarDays, Phone, Trash2, Edit, MapPin } from 'lucide-react';
import { Room, ActivityType } from '../../types';

interface CalendarViewProps {
  rooms?: Room[];
  addLog?: (type: ActivityType, action: string, description: string, user?: string) => void;
}

interface CalendarBooking {
  id: string;
  room: string;
  guest: string;
  phone?: string;
  startDay: number; // Day of month (1-31) or Month Index (0-11) for year view
  duration: number; // in days or months
  color: 'indigo' | 'green' | 'amber' | 'blue';
  month?: number; // Specific month for this booking (0-11)
  year?: number; // Specific year
  startTime?: string; // HH:mm for mobile agenda simulation
  endTime?: string; // HH:mm
}

type ViewMode = 'day' | 'week' | 'month' | 'year';

const CalendarView: React.FC<CalendarViewProps> = ({ rooms = [], addLog }) => {
  const roomNumbers = rooms.length > 0 ? rooms.map(r => r.number) : ['25', '26', '27', '28'];

  // --- STATE ---
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [hoveredColumn, setHoveredColumn] = useState<number | string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Selection States
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  // Swipe States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Mock bookings updated
  const [bookings, setBookings] = useState<CalendarBooking[]>([
    { id: '1', room: '25', guest: 'Ana Silva', phone: '11999999999', startDay: 2, duration: 4, color: 'indigo', month: currentDate.getMonth(), year: currentDate.getFullYear(), startTime: '10:00', endTime: '12:00' },
    { id: '2', room: '41', guest: 'Empresa XYZ', startDay: 8, duration: 5, color: 'green', month: currentDate.getMonth(), year: currentDate.getFullYear(), startTime: '14:00', endTime: '18:00' },
    { id: '3', room: '62', guest: 'Carlos Oliveira', startDay: 15, duration: 2, color: 'amber', month: currentDate.getMonth(), year: currentDate.getFullYear(), startTime: '09:00', endTime: '11:00' },
    { id: '4', room: '25', guest: 'Day Use', startDay: 20, duration: 1, color: 'blue', month: currentDate.getMonth(), year: currentDate.getFullYear(), startTime: '13:00', endTime: '17:00' }
  ]);

  // Scroll ref for mobile timeline
  const mobileTimelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to 8 AM on mount for mobile day view
    if (viewMode === 'day' && mobileTimelineRef.current) {
        mobileTimelineRef.current.scrollTop = 480; // approx 8am * 60px/hr
    }
  }, [viewMode]);

  const getTodayString = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    room: '',
    guest: '',
    phone: '',
    startDate: getTodayString(),
    duration: 1
  });

  // --- NAVIGATION HELPERS ---
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day': newDate.setDate(newDate.getDate() - 1); break;
      case 'week': newDate.setDate(newDate.getDate() - 7); break;
      case 'month': newDate.setMonth(newDate.getMonth() - 1); break;
      case 'year': newDate.setFullYear(newDate.getFullYear() - 1); break;
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day': newDate.setDate(newDate.getDate() + 1); break;
      case 'week': newDate.setDate(newDate.getDate() + 7); break;
      case 'month': newDate.setMonth(newDate.getMonth() + 1); break;
      case 'year': newDate.setFullYear(newDate.getFullYear() + 1); break;
    }
    setCurrentDate(newDate);
  };

  // Specific handlers for Mobile Header to change MONTHS regardless of view
  const handleMobilePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleMobileNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // --- SWIPE HANDLERS ---
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swiped Left -> Go Next (Future)
      handleNext();
    }
    if (isRightSwipe) {
      // Swiped Right -> Go Prev (Past)
      handlePrev();
    }
  };

  const getGridConfig = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    switch (viewMode) {
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start Sunday
        const days = [];
        for(let i=0; i<7; i++) {
           const d = new Date(startOfWeek);
           d.setDate(d.getDate() + i);
           days.push(d);
        }
        return {
          columns: days.map(d => d.getDate()),
          label: (col: number, idx: number) => {
             const d = days[idx];
             return `${d.getDate()} (${d.toLocaleDateString('pt-BR', {weekday: 'short'}).slice(0,3)})`;
          },
          totalSlots: 7
        };
      case 'day':
        return { columns: Array.from({ length: 24 }, (_, i) => i), label: (col: number) => `${String(col).padStart(2, '0')}:00`, totalSlots: 24 };
      case 'year':
        return { columns: Array.from({ length: 12 }, (_, i) => i), label: (col: number) => new Date(0, col).toLocaleDateString('pt-BR', { month: 'short' }), totalSlots: 12 };
      case 'month':
      default:
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { columns: Array.from({ length: daysInMonth }, (_, i) => i + 1), label: (col: number) => `${col}`, totalSlots: daysInMonth };
    }
  };

  const config = getGridConfig();

  // --- HANDLERS ---
  const handleCellClick = (room: string, col: number, idx: number) => {
    let targetDate = new Date(currentDate);
    
    if (viewMode === 'month') {
        targetDate.setDate(col);
    } else if (viewMode === 'week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        targetDate = new Date(startOfWeek);
        targetDate.setDate(targetDate.getDate() + idx);
    } else if (viewMode === 'year') {
        targetDate.setMonth(col);
        targetDate.setDate(1);
    }
    // Day view keeps currentDate

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    setEditingBookingId(null);
    setFormData({
      room,
      guest: '',
      phone: '',
      startDate: `${year}-${month}-${day}`,
      duration: 1
    });
    setIsModalOpen(true);
  };

  const handleNewBookingClick = () => {
    setEditingBookingId(null);
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    setFormData({
      room: roomNumbers[0],
      guest: '',
      phone: '',
      startDate: `${year}-${month}-${day}`, // Defaults to currently viewed date
      duration: 1
    });
    setIsModalOpen(true);
  };

  const handleBookingBarClick = (e: React.MouseEvent, booking: CalendarBooking) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleEditBooking = () => {
      if (!selectedBooking) return;
      
      const month = String((selectedBooking.month || 0) + 1).padStart(2, '0');
      const day = String(selectedBooking.startDay).padStart(2, '0');
      const year = selectedBooking.year || currentDate.getFullYear();

      setFormData({
          room: selectedBooking.room,
          guest: selectedBooking.guest,
          phone: selectedBooking.phone || '',
          startDate: `${year}-${month}-${day}`,
          duration: selectedBooking.duration
      });

      setEditingBookingId(selectedBooking.id);
      setShowDetailModal(false);
      setIsModalOpen(true);
  };

  const handleDeleteBooking = () => {
      if (!selectedBooking) return;
      setBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      if(addLog) addLog('RESERVATION', 'EXCLUSAO_RESERVA', `Reserva de ${selectedBooking.guest} no quarto ${selectedBooking.room} removida.`);
      setShowDetailModal(false);
      setSelectedBooking(null);
  };

  const handleSaveBooking = () => {
    if (!formData.guest || !formData.room) return alert('Preencha os dados obrigatórios');
    const [y, m, d] = formData.startDate.split('-').map(Number);

    if (editingBookingId) {
        setBookings(prev => prev.map(b => b.id === editingBookingId ? {
            ...b,
            room: formData.room,
            guest: formData.guest,
            phone: formData.phone,
            startDay: d,
            month: m - 1,
            year: y,
            duration: Number(formData.duration)
        } : b));
        if(addLog) addLog('RESERVATION', 'ATUALIZACAO_RESERVA', `Reserva atualizada para ${formData.guest} no quarto ${formData.room}`);
    } else {
        const newBooking: CalendarBooking = {
            id: Date.now().toString(),
            room: formData.room,
            guest: formData.guest,
            phone: formData.phone,
            startDay: d,
            duration: Number(formData.duration),
            color: 'blue',
            month: m - 1,
            year: y,
            startTime: '12:00', // Default for now
            endTime: '13:00'
        };
        setBookings(prev => [...prev, newBooking]);
        if(addLog) addLog('RESERVATION', 'NOVA_RESERVA', `Nova reserva criada para ${formData.guest} no quarto ${formData.room}`);
    }

    setIsModalOpen(false);
    setEditingBookingId(null);
  };

  const getHeaderLabel = () => {
    const ptBR = 'pt-BR';
    switch (viewMode) {
      case 'day': return currentDate.toLocaleDateString(ptBR, { weekday: 'long', day: 'numeric', month: 'long' });
      case 'week': return currentDate.toLocaleDateString(ptBR, { month: 'long' });
      case 'month': return currentDate.toLocaleDateString(ptBR, { month: 'long', year: 'numeric' });
      case 'year': return currentDate.getFullYear().toString();
      default: return '';
    }
  };

  // --- MOBILE RENDER HELPERS ---
  
  const getMobileWeekDays = () => {
    const start = new Date(currentDate);
    // Adjust to show current week around selected date
    const day = start.getDay(); 
    const diff = start.getDate() - day; // Adjust when day is Sunday
    const weekStart = new Date(start.setDate(diff));
    
    const days = [];
    for(let i=0; i<7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        days.push(d);
    }
    return days;
  };

  const renderMobileMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    
    const days = [];
    // Empty slots for previous month
    for(let i=0; i<firstDay; i++) days.push(null);
    // Days
    for(let i=1; i<=daysInMonth; i++) days.push(i);

    return (
        <div className="grid grid-cols-7 gap-1 p-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
            {days.map((day, idx) => {
                if(!day) return <div key={`empty-${idx}`} />;
                
                const hasEvent = bookings.some(b => b.month === month && b.year === year && b.startDay === day);
                const isSelected = day === currentDate.getDate();
                const isToday = day === new Date().getDate() && month === new Date().getMonth();

                return (
                    <div 
                        key={day} 
                        onClick={() => {
                            const newD = new Date(currentDate);
                            newD.setDate(day);
                            setCurrentDate(newD);
                            setViewMode('day'); // Switch to day view on click
                        }}
                        className={`h-10 flex flex-col items-center justify-center rounded-full cursor-pointer relative
                            ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : ''}
                            ${!isSelected && isToday ? 'text-blue-600 font-bold' : ''}
                        `}
                    >
                        <span className="text-sm">{day}</span>
                        {hasEvent && !isSelected && <div className="w-1 h-1 bg-gray-400 rounded-full mt-0.5" />}
                    </div>
                );
            })}
        </div>
    );
  };

  const renderMobileTimeline = () => {
    const hours = Array.from({length: 24}, (_, i) => i);
    const dayBookings = bookings.filter(b => 
        b.startDay === currentDate.getDate() && 
        b.month === currentDate.getMonth() && 
        b.year === currentDate.getFullYear()
    );

    return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative" ref={mobileTimelineRef}>
            {/* Current Time Line */}
            <div className="absolute left-14 right-0 border-t-2 border-red-500 z-10" style={{top: `${(new Date().getHours() * 60 + new Date().getMinutes())}px`}}>
                <div className="w-2 h-2 bg-red-500 rounded-full -mt-[5px] -ml-[5px]"></div>
            </div>

            {hours.map(hour => (
                <div key={hour} className="flex h-[60px] border-b border-gray-100 dark:border-slate-800/50">
                    <div className="w-14 shrink-0 text-xs text-gray-400 text-right pr-3 pt-2 -mt-2.5 bg-white dark:bg-slate-900 z-10">
                        {hour !== 0 ? `${hour}:00` : ''}
                    </div>
                    <div className="flex-1 relative border-l border-gray-100 dark:border-slate-800/50">
                        {/* Render event blocks */}
                        {dayBookings.map(booking => {
                            // Mocking time logic if not present
                            const startH = booking.startTime ? parseInt(booking.startTime.split(':')[0]) : 12; // Default
                            const endH = booking.endTime ? parseInt(booking.endTime.split(':')[0]) : 13;
                            
                            if (startH === hour) {
                                const height = (endH - startH) * 60;
                                return (
                                    <div 
                                        key={booking.id}
                                        onClick={(e) => handleBookingBarClick(e, booking)}
                                        className="absolute left-1 right-1 rounded-md p-2 text-xs border-l-4 bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-900 dark:text-indigo-200 cursor-pointer overflow-hidden shadow-sm"
                                        style={{ height: `${height}px`, top: '2px', zIndex: 20 }}
                                    >
                                        <div className="font-bold">{booking.guest}</div>
                                        <div className="text-[10px] opacity-80">Quarto {booking.room} • {booking.startTime || '12:00'} - {booking.endTime || '13:00'}</div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const isHovered = (room: string, col: number) => hoveredRoom === room || hoveredColumn === col;
  const isCrosshairCenter = (room: string, col: number) => hoveredRoom === room && hoveredColumn === col;

  return (
    <div className="md:p-8 h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">
       {/* --- DESKTOP HEADER (Hidden on Mobile) --- */}
       <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda de Reservas</h2><p className="text-sm text-gray-500 dark:text-slate-400">Gerenciamento visual de ocupação</p></div>
        <div className="flex flex-col xl:flex-row gap-3 w-full md:w-auto items-start xl:items-center">
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg self-start">
               <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'}`}><Clock size={14} /> Diária</button>
               <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'}`}><Columns size={14} /> Semanal</button>
               <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'}`}><LayoutGrid size={14} /> Mensal</button>
               <button onClick={() => setViewMode('year')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'year' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'}`}><CalendarDays size={14} /> Anual</button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="flex bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-1 items-center flex-1 sm:flex-none justify-between sm:justify-start">
                   <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md text-gray-500 dark:text-slate-400"><ChevronLeft size={16}/></button>
                   <span className="text-xs sm:text-sm font-medium px-3 text-gray-900 dark:text-white min-w-[120px] text-center capitalize">{getHeaderLabel()}</span>
                   <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md text-gray-500 dark:text-slate-400"><ChevronRight size={16}/></button>
                </div>
                <button onClick={handleNewBookingClick} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 rounded-lg text-sm font-medium text-white shadow-sm hover:bg-slate-800 dark:hover:bg-slate-600 flex items-center gap-2 whitespace-nowrap"><Plus size={16}/> Novo</button>
            </div>
        </div>
      </div>

      {/* --- MOBILE HEADER (Google Calendar Style) --- */}
      <div className="md:hidden flex flex-col bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-30">
          <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-2">
                  <button onClick={handleMobilePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ChevronLeft size={20} className="text-gray-600 dark:text-slate-300"/>
                  </button>
                  <span className="text-xl font-bold text-gray-900 dark:text-white capitalize min-w-[160px] text-center">
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleMobileNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ChevronRight size={20} className="text-gray-600 dark:text-slate-300"/>
                  </button>
              </div>
              <div className="flex gap-4 items-center">
                  <button onClick={goToToday} className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-full"><CalendarDays size={18} className="text-gray-600 dark:text-slate-300" /></button>
                  <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
                      <button onClick={() => setViewMode('day')} className={`p-1.5 rounded-md ${viewMode === 'day' ? 'bg-white shadow dark:bg-slate-700' : 'text-gray-400'}`}><LayoutGrid size={16}/></button>
                      <button onClick={() => setViewMode('month')} className={`p-1.5 rounded-md ${viewMode === 'month' ? 'bg-white shadow dark:bg-slate-700' : 'text-gray-400'}`}><CalendarIcon size={16}/></button>
                  </div>
              </div>
          </div>
          
          {/* Week Strip (Always Visible like Google Calendar unless in Month view) */}
          {viewMode !== 'month' && (
              <div className="grid grid-cols-7 text-center pb-2">
                  {getMobileWeekDays().map((d, i) => {
                      const isSelected = d.getDate() === currentDate.getDate();
                      const isToday = d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth();
                      return (
                          <div key={i} onClick={() => { setCurrentDate(d); setViewMode('day'); }} className="flex flex-col items-center gap-1 cursor-pointer">
                              <span className={`text-[10px] font-medium uppercase ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0,1)}</span>
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : isToday ? 'text-blue-600 bg-blue-50' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {d.getDate()}
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>
      
      {/* --- DESKTOP GRID RENDERING (Hidden on Mobile) --- */}
      <div className="hidden md:flex flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex-col relative z-0">
        <div className="flex border-b border-gray-200 dark:border-slate-800">
            <div className="w-16 md:w-20 p-3 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 shrink-0 z-20 relative flex items-center justify-center">
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Quarto</span>
            </div>
            <div className={`flex-1 flex relative ${viewMode === 'month' || viewMode === 'year' || viewMode === 'week' ? 'overflow-hidden w-full' : 'overflow-x-auto no-scrollbar'}`}>
                {config.columns.map((col, idx) => (
                    <div key={col} className={`border-r border-gray-100 dark:border-slate-800/50 p-2 text-center transition-colors duration-150 flex items-center justify-center ${viewMode === 'month' ? 'flex-1 min-w-0 px-0' : 'min-w-[50px] flex-1'} ${hoveredColumn === col ? 'bg-indigo-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>
                        <span className={`text-[10px] md:text-xs font-medium truncate ${hoveredColumn === col ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-slate-500'}`}>{config.label(col, idx)}</span>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {roomNumbers.map(room => (
                <div key={room} className="flex border-b border-gray-100 dark:border-slate-800/50 h-14 relative group">
                     <div className={`w-16 md:w-20 p-3 border-r border-gray-200 dark:border-slate-800 shrink-0 flex items-center justify-center z-10 relative transition-colors duration-150 ${hoveredRoom === room ? 'bg-indigo-50 dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-950'}`}>
                        <span className={`font-semibold text-sm ${hoveredRoom === room ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-slate-300'}`}>{room}</span>
                    </div>
                    <div className={`flex-1 flex relative ${viewMode === 'month' || viewMode === 'year' || viewMode === 'week' ? 'w-full' : ''}`}>
                        {config.columns.map((col, idx) => {
                            const highlighted = isHovered(room, col);
                            const center = isCrosshairCenter(room, col);
                            return (
                                <div key={col} onMouseEnter={() => { setHoveredColumn(col); setHoveredRoom(room); }} onMouseLeave={() => { setHoveredColumn(null); setHoveredRoom(null); }} onClick={() => handleCellClick(room, col, idx)} className={`border-r border-gray-50 dark:border-slate-800/30 cursor-pointer transition-all duration-75 ${viewMode === 'month' ? 'flex-1 min-w-0' : 'min-w-[50px] flex-1'} ${center ? 'bg-indigo-100 dark:bg-slate-700' : highlighted ? 'bg-gray-50 dark:bg-slate-800/50' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}></div>
                            );
                        })}
                        {bookings.filter(b => b.room === room).map(booking => {
                            let leftPos = 0; let width = 0; let show = true;
                            if ((viewMode === 'month' || viewMode === 'week') && (booking.month !== currentDate.getMonth() || booking.year !== currentDate.getFullYear())) { show = false; }
                            if (viewMode === 'year' && booking.year !== currentDate.getFullYear()) { show = false; }
                            if (show) {
                                if (viewMode === 'day') { leftPos = 0; width = 100; } 
                                else if (viewMode === 'week') {
                                   if (booking.startDay <= 7) { leftPos = (booking.startDay - 1) * 100 / 7; width = (booking.duration) * 100 / 7; } else { show = false; }
                                } else if (viewMode === 'year') {
                                   if (booking.month !== undefined) { leftPos = (booking.month) * 100 / 12; width = (1) * 100 / 12; }
                                } else {
                                   const daysInMonth = config.totalSlots;
                                   leftPos = (booking.startDay - 1) * 100 / daysInMonth;
                                   width = (booking.duration) * 100 / daysInMonth;
                                }
                            }
                            if (!show) return null;
                            const colorClasses = { indigo: 'bg-indigo-100 border-indigo-500 text-indigo-900', green: 'bg-green-100 border-green-500 text-green-900', amber: 'bg-amber-100 border-amber-500 text-amber-900', blue: 'bg-blue-100 border-blue-500 text-blue-900' };
                            return (
                                <div key={booking.id} onClick={(e) => handleBookingBarClick(e, booking)} className={`absolute top-2 h-10 border-l-4 rounded-r-md flex items-center px-1 md:px-2 cursor-pointer shadow-sm hover:brightness-95 transition-all z-10 ${colorClasses[booking.color]}`} style={{ left: `calc(${leftPos}% + 1px)`, width: `calc(${width}% - 2px)` }} title={`Hóspede: ${booking.guest}`}>
                                    <span className="text-[10px] font-semibold truncate">{booking.guest}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- MOBILE CONTENT RENDERING (Agenda/Month) --- */}
      <div 
        className="md:hidden flex-1 flex flex-col overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
          {viewMode === 'month' ? renderMobileMonth() : renderMobileTimeline()}
          
          {/* Floating Action Button for Mobile */}
          <button 
            onClick={handleNewBookingClick}
            className="absolute bottom-6 right-6 w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-105 transition-transform"
          >
              <Plus size={28} />
          </button>
      </div>

      {/* --- FORM MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2"><CalendarIcon size={20}/> {editingBookingId ? 'Editar Reserva' : 'Nova Reserva'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* ... fields ... */}
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Nome do Hóspede</label><div className="relative"><User size={16} className="absolute left-3 top-2.5 text-gray-400"/><input type="text" value={formData.guest} onChange={e => setFormData({...formData, guest: e.target.value})} className="w-full pl-9 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base md:text-sm px-3 py-2 outline-none"/></div></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label><div className="relative"><Phone size={16} className="absolute left-3 top-2.5 text-gray-400"/><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-9 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base md:text-sm px-3 py-2 outline-none"/></div></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Quarto</label><select value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base md:text-sm px-3 py-2 outline-none"><option value="">Selecione</option>{roomNumbers.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">Início</label><input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base md:text-sm px-3 py-2 outline-none"/></div>
                    </div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Duração (Dias)</label><input type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 1})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base md:text-sm px-3 py-2 outline-none"/></div>
                    <button onClick={handleSaveBooking} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle2 size={18} /> {editingBookingId ? 'Atualizar Reserva' : 'Confirmar Reserva'}</button>
                </div>
            </div>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6"><div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBooking.guest}</h2><p className="text-sm text-gray-500">Reserva Confirmada</p></div><button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button></div>
                    {/* ... details ... */}
                    <div className="space-y-4 bg-gray-50 dark:bg-slate-950 p-4 rounded-xl mb-6">
                         <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500 text-sm">Quarto</span><span className="font-semibold text-gray-900 dark:text-white">Nº {selectedBooking.room}</span></div>
                         <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500 text-sm">Início</span><span className="font-semibold text-gray-900 dark:text-white">{selectedBooking.startDay}/{String((selectedBooking.month || 0)+1).padStart(2,'0')}/{selectedBooking.year}</span></div>
                         <div className="flex justify-between"><span className="text-gray-500 text-sm">Contato</span><span className="font-semibold text-gray-900 dark:text-white">{selectedBooking.phone || '-'}</span></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDeleteBooking} className="flex-1 py-3 border border-red-200 text-red-600 bg-red-50 rounded-xl font-bold flex items-center justify-center gap-2"><Trash2 size={18} /> Excluir</button>
                        <button onClick={handleEditBooking} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Edit size={18} /> Editar</button>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
