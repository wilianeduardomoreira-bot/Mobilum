
import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Mail, User, Lock, Phone } from 'lucide-react';
import { Employee } from '../../types';

interface LoginViewProps {
  employees: Employee[];
  onLogin: (user: Employee) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ employees, onLogin }) => {
  const [viewState, setViewState] = useState<'login' | 'forgot' | 'register'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email, 2: Success

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
      // 1. Check Master Admin
      if (username === 'admin' && password === '123') {
        const masterAdmin: Employee = {
          id: '0',
          name: 'Administrador Master',
          username: 'admin',
          email: 'admin@hotelrudge.com.br',
          phone: '',
          role: 'Administrador Master',
          permissions: { suites: true, dashboard: true, calendar: true, reports: true, maintenance: true, cashier: true, chat: true, settings: true }
        };
        onLogin(masterAdmin);
        setIsLoading(false);
        return;
      }

      // 2. Check Employees
      const foundUser = employees.find(emp => emp.username === username && emp.password === password);
      
      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Usuário ou senha incorretos.');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setIsLoading(true);
    setTimeout(() => {
      setRecoveryStep(2);
      setIsLoading(false);
    }, 1000);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      alert("Solicitação enviada ao Administrador. Aguarde a aprovação.");
      setViewState('login');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#4A4A4A] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Branding Header */}
      <div className="text-center mb-8 animate-in slide-in-from-top-5 duration-500">
        <div className="flex items-center justify-center gap-3 mb-2">
           <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              {/* Updated Login Logo to RR Branding */}
              <img src="https://ui-avatars.com/api/?name=RR&background=transparent&color=fff&size=64&rounded=true&bold=true&font-size=0.4" alt="Logo" className="w-8 h-8 object-contain" />
           </div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Hotel Rudge Ramos</h1>
        </div>
        <p className="text-gray-300 text-sm tracking-wide">Seu conforto, Nossa prioridade.</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* VIEW: LOGIN */}
        {viewState === 'login' && (
          <div className="p-8">
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A4A4A] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A4A4A] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#5A5A5A] hover:bg-[#404040] text-white font-bold py-3.5 rounded-lg shadow-lg transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-6 flex justify-between items-center text-sm font-medium">
              <button 
                onClick={() => { setViewState('forgot'); setError(''); }}
                className="text-gray-500 hover:text-gray-800 underline transition-colors"
              >
                Esqueceu a senha?
              </button>
              <button 
                onClick={() => { setViewState('register'); setError(''); }}
                className="text-gray-500 hover:text-gray-800 underline transition-colors"
              >
                Criar conta
              </button>
            </div>
          </div>
        )}

        {/* VIEW: FORGOT PASSWORD */}
        {viewState === 'forgot' && (
          <div className="p-8">
            <button onClick={() => { setViewState('login'); setRecoveryStep(1); }} className="flex items-center text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors">
              <ArrowLeft size={16} className="mr-1" /> Voltar
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">Recuperar Senha</h3>
            
            {recoveryStep === 1 ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-gray-500 text-sm mb-4">Digite seu e-mail para receber as instruções de redefinição.</p>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    placeholder="Seu e-mail cadastrado"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A4A4A] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#5A5A5A] hover:bg-[#404040] text-white font-bold py-3.5 rounded-lg shadow-lg transition-all active:scale-95 flex justify-center"
                >
                   {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Enviar Instruções'}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">E-mail Enviado!</h4>
                <p className="text-gray-500 text-sm mb-6">Verifique sua caixa de entrada (e spam) para redefinir sua senha.</p>
                <button
                  onClick={() => setViewState('login')}
                  className="text-[#4A4A4A] font-bold text-sm hover:underline"
                >
                  Voltar para Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: REGISTER */}
        {viewState === 'register' && (
          <div className="p-8">
            <button onClick={() => setViewState('login')} className="flex items-center text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors">
              <ArrowLeft size={16} className="mr-1" /> Voltar
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">Solicitar Acesso</h3>
            <p className="text-gray-500 text-sm mb-6">Preencha seus dados para solicitar uma conta ao administrador.</p>
            
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  placeholder="Nome Completo"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A4A4A] transition-all"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="E-mail"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A4A4A] transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="tel"
                  required
                  placeholder="Telefone / Celular"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A4A4A] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#5A5A5A] hover:bg-[#404040] text-white font-bold py-3.5 rounded-lg shadow-lg transition-all active:scale-95 flex justify-center"
              >
                 {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Solicitar Conta'}
              </button>
            </form>
          </div>
        )}

      </div>
      
      <p className="mt-8 text-gray-500 text-xs">© {new Date().getFullYear()} Hotel Rudge Ramos System. v2.5</p>
    </div>
  );
};

export default LoginView;
