import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../../services/geminiService';
import { Bot, Sparkles, Send, Trash2, Bed, AlertTriangle } from 'lucide-react';
import { Room, MaintenanceTicket } from '../../types';

interface AIMessage {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantViewProps {
  rooms?: Room[];
  tickets?: MaintenanceTicket[];
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ rooms = [], tickets = [] }) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'model', text: 'Olá! Sou seu assistente virtual do Hotel Rudge Ramos. Tenho acesso ao status de todos os quartos e manutenções em tempo real. Como posso ajudar com reservas ou informações?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Function to create a text representation of the current hotel state
  const getHotelContext = () => {
    let context = "--- STATUS ATUAL DOS QUARTOS ---\n";
    
    // Group rooms by status count
    const availableRooms = rooms.filter(r => r.status === 'Disponível').map(r => `Quarto ${r.number} (${r.type})`);
    const occupiedRooms = rooms.filter(r => r.status === 'Ocupado').map(r => `Quarto ${r.number} (${r.type}): Hóspede ${r.guestName || 'Desconhecido'}`);
    const maintenanceRooms = rooms.filter(r => r.status === 'Manutenção').map(r => `Quarto ${r.number}`);
    const dirtyRooms = rooms.filter(r => r.status === 'Limpeza').map(r => `Quarto ${r.number}`);

    context += `DISPONÍVEIS (${availableRooms.length}): ${availableRooms.join(', ') || 'Nenhum'}\n`;
    context += `OCUPADOS (${occupiedRooms.length}): ${occupiedRooms.join(' | ') || 'Nenhum'}\n`;
    context += `EM LIMPEZA (${dirtyRooms.length}): ${dirtyRooms.join(', ') || 'Nenhum'}\n`;
    context += `EM MANUTENÇÃO (${maintenanceRooms.length}): ${maintenanceRooms.join(', ') || 'Nenhum'}\n`;

    context += "\n--- OCORRÊNCIAS DE MANUTENÇÃO ATIVAS ---\n";
    const activeTickets = tickets.filter(t => t.status !== 'Concluído');
    if (activeTickets.length > 0) {
      context += activeTickets.map(t => `- Quarto ${t.roomNumber}: ${t.issue} (Prioridade: ${t.priority}, Status: ${t.status})`).join('\n');
    } else {
      context += "Nenhuma ocorrência ativa.";
    }

    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    // Get live context
    const contextData = getHotelContext();
    const response = await sendMessageToGemini(userMsg, contextData);

    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role: 'model', text: 'Chat limpo. Em que posso ajudar agora?' }]);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-indigo-600 dark:to-purple-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-gray-300 dark:shadow-indigo-900/20 mb-4">
           <Sparkles className="text-white w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hotel Rudge Ramos AI</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">Assistente de reservas e gestão operacional.</p>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'user' ? 'bg-gray-200 dark:bg-slate-700' : 'bg-slate-900 dark:bg-indigo-600'}`}>
                    {msg.role === 'user' ? <div className="text-gray-600 dark:text-slate-200 text-xs font-bold">VC</div> : <Bot className="text-white w-5 h-5" />}
                 </div>
                 <div className={`p-3 md:p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                   msg.role === 'user' 
                     ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200 rounded-tr-none' 
                     : 'bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 rounded-tl-none border border-gray-100 dark:border-slate-800'
                 }`}>
                   {msg.text}
                 </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="flex max-w-[80%] gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="text-white w-5 h-5 animate-pulse" />
                   </div>
                   <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                   </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900">
          
          {/* Quick Suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-1">
             <button onClick={() => handleQuickPrompt("Quais quartos estão disponíveis hoje?")} className="shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                <Bed size={12}/> Disponibilidade
             </button>
             <button onClick={() => handleQuickPrompt("Quem está hospedado no quarto 25?")} className="shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Hóspede Q.25
             </button>
             <button onClick={() => handleQuickPrompt("Liste os quartos em manutenção e os motivos.")} className="shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                <AlertTriangle size={12}/> Manutenções
             </button>
             <button onClick={() => handleQuickPrompt("Gostaria de fazer uma reserva para casal.")} className="shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Nova Reserva
             </button>
          </div>

          <div className="relative flex gap-2">
            <input
              type="text"
              className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-4 pl-4 pr-12 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-sm text-gray-900 dark:text-white"
              placeholder="Pergunte sobre quartos, hóspedes ou manutenções..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="w-14 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send size={20} />
            </button>
            <button
               onClick={clearChat}
               className="w-10 bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
               title="Limpar Chat"
            >
               <Trash2 size={18} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 dark:text-slate-500 mt-2">
            O assistente tem acesso aos dados em tempo real do hotel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantView;