import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { Send, User } from 'lucide-react';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Recepção', text: 'O quarto 104 pediu toalhas extras.', timestamp: new Date(), isMe: false },
    { id: '2', sender: 'Governança', text: 'Ok, já estou enviando a camareira.', timestamp: new Date(), isMe: true },
    { id: '3', sender: 'Manutenção', text: 'Ar condicionado do 205 consertado.', timestamp: new Date(), isMe: false },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Eu',
      text: inputText,
      timestamp: new Date(),
      isMe: true
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
         <h2 className="text-lg font-bold text-gray-800">Chat da Equipe</h2>
         <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">5 Online</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[70%] gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <User size={14} className="text-gray-500" />
               </div>
               <div>
                   <div className={`p-3 rounded-2xl text-sm ${
                     msg.isMe 
                       ? 'bg-indigo-600 text-white rounded-br-none shadow-md' 
                       : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                   }`}>
                     <p>{msg.text}</p>
                   </div>
                   <p className={`text-[10px] text-gray-400 mt-1 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                      {msg.sender} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input 
            type="text" 
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Digite sua mensagem para a equipe..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
