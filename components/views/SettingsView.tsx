
import React, { useState, useEffect } from 'react';
import { Tag, Users, Shield, Bed, Package, Edit, Trash2, Eye, EyeOff, Save, CheckCircle2, Plus, Clock, DollarSign, BedDouble, X, Search, Barcode, AlertTriangle } from 'lucide-react';
import { Employee, Role, ActivityType, Product } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface RoomConfig {
  id: string;
  category: 'Standard' | 'Luxo' | 'Master';
  bedType: 'Casal' | 'Duplo' | 'Triplo';
  price4h: number;
  price12h: number;
  price24h: number;
}

interface SettingsViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  products?: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  addLog?: (type: ActivityType, action: string, description: string, user?: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ employees, setEmployees, products = [], setProducts, addLog }) => {
  const [activeTab, setActiveTab] = useState('valores');

  // --- STATE FOR PRODUCTS (Managed by App via Props) ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE FOR ROOM CONFIGURATION ---
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([]);
  const [editingRoomConfig, setEditingRoomConfig] = useState<RoomConfig | null>(null);

  // Load Room Configs from Supabase
  useEffect(() => {
    const loadConfigs = async () => {
        const { data } = await supabase.from('room_configs').select('*');
        if (data) {
            const mapped = data.map((c: any) => ({
                id: c.id,
                category: c.category,
                bedType: c.bed_type,
                price4h: c.price_4h,
                price12h: c.price_12h,
                price24h: c.price_24h
            }));
            setRoomConfigs(mapped);
        }
    };
    if (activeTab === 'quartos' || activeTab === 'valores') loadConfigs();
  }, [activeTab]);

  // Form State
  const initialFormState: Omit<Employee, 'id'> = {
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'Recepcionista',
    permissions: { suites: true, dashboard: false, calendar: true, reports: false, maintenance: true, cashier: true, chat: true, settings: false }
  };

  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const roles: Role[] = ['Arrumadeira', 'Recepcionista', 'Manutenção', 'Gerente', 'Administrador', 'Administrador Master'];

  const getDefaultPermissions = (role: Role) => {
     const allTrue = { suites: true, dashboard: true, calendar: true, reports: true, maintenance: true, cashier: true, chat: true, settings: true };
     const allFalse = { suites: false, dashboard: false, calendar: false, reports: false, maintenance: false, cashier: false, chat: false, settings: false };
     switch (role) {
       case 'Administrador Master': case 'Administrador': case 'Gerente': return allTrue;
       case 'Recepcionista': return { ...allTrue, dashboard: false, reports: false, settings: false };
       case 'Manutenção': return { ...allFalse, maintenance: true, chat: true, suites: true };
       case 'Arrumadeira': return { ...allFalse, suites: true, chat: true };
       default: return allFalse;
     }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'role') {
        const newRole = value as Role;
        setFormData(prev => ({ ...prev, role: newRole, permissions: getDefaultPermissions(newRole) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePermissionChange = (key: keyof typeof formData.permissions) => {
    setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        username: employee.username,
        password: employee.password || '',
        role: employee.role,
        permissions: employee.permissions
    });
    if (activeTab === 'equipe') setActiveTab('acesso');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
        const emp = employees.find(e => e.id === id);
        
        // Optimistic UI
        setEmployees(prev => prev.filter(e => e.id !== id));
        if (editingId === id) handleResetForm();
        
        // Supabase
        await supabase.from('employees').delete().eq('id', id);

        if(addLog) addLog('ACCESS', 'REMOCAO_FUNCIONARIO', `Funcionário ${emp?.name} removido do sistema.`);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowPassword(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.username) return alert('Nome e Usuário são obrigatórios');

    if (editingId) {
        // Update Local
        setEmployees(prev => prev.map(e => e.id === editingId ? { ...formData, id: editingId } : e));
        
        // Update DB
        await supabase.from('employees').update({
            name: formData.name, email: formData.email, phone: formData.phone, 
            username: formData.username, password: formData.password, 
            role: formData.role, permissions: formData.permissions
        }).eq('id', editingId);

        if(addLog) addLog('ACCESS', 'ATUALIZACAO_FUNCIONARIO', `Dados do funcionário ${formData.name} atualizados.`);
    } else {
        // Create DB
        const { data } = await supabase.from('employees').insert({
            name: formData.name, email: formData.email, phone: formData.phone, 
            username: formData.username, password: formData.password, 
            role: formData.role, permissions: formData.permissions
        }).select();

        if (data) {
            setEmployees(prev => [...prev, data[0] as Employee]);
        }
        
        if(addLog) addLog('ACCESS', 'NOVO_FUNCIONARIO', `Novo funcionário cadastrado: ${formData.name} (${formData.role}).`);
    }
    handleResetForm();
  };

  // --- PRODUCT HANDLERS ---
  const handleSaveProduct = async () => {
    if (!editingProduct || !setProducts) return;
    if (!editingProduct.name || !editingProduct.price) return alert("Nome e Preço são obrigatórios.");

    if (editingProduct.id === 'new') {
       const { id, ...newProd } = editingProduct; 
       // DB Insert
       const { data } = await supabase.from('products').insert(newProd).select();
       
       if (data) {
           setProducts(prev => [...prev, data[0] as Product]);
           if(addLog) addLog('SYSTEM', 'NOVO_PRODUTO', `Produto adicionado: ${data[0].name} (${data[0].code})`);
       }
    } else {
       // DB Update
       await supabase.from('products').update(editingProduct).eq('id', editingProduct.id);
       setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
       if(addLog) addLog('SYSTEM', 'ATUALIZACAO_PRODUTO', `Produto atualizado: ${editingProduct.name}`);
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
     if(window.confirm("Deseja excluir este produto do catálogo?") && setProducts) {
        const prod = products.find(p => p.id === id);
        setProducts(prev => prev.filter(p => p.id !== id));
        await supabase.from('products').delete().eq('id', id);
        if(addLog) addLog('SYSTEM', 'REMOCAO_PRODUTO', `Produto removido: ${prod?.name}`);
     }
  };

  // --- ROOM CONFIG HANDLERS ---
  const handleSaveRoomConfig = async () => {
    if (!editingRoomConfig) return;
    
    const dbPayload = {
        category: editingRoomConfig.category,
        bed_type: editingRoomConfig.bedType,
        price_4h: editingRoomConfig.price4h,
        price_12h: editingRoomConfig.price12h,
        price_24h: editingRoomConfig.price24h
    };

    if (editingRoomConfig.id === 'new') {
        const { data } = await supabase.from('room_configs').insert(dbPayload).select();
        if (data) {
            const newConfig = { ...editingRoomConfig, id: data[0].id };
            setRoomConfigs(prev => [...prev, newConfig]);
            if(addLog) addLog('SYSTEM', 'NOVA_CONFIG_QUARTO', `Nova configuração criada: ${newConfig.category} - ${newConfig.bedType}`);
        }
    } else {
        await supabase.from('room_configs').update(dbPayload).eq('id', editingRoomConfig.id);
        setRoomConfigs(prev => prev.map(c => c.id === editingRoomConfig.id ? editingRoomConfig : c));
        if(addLog) addLog('SYSTEM', 'ATUALIZACAO_CONFIG_QUARTO', `Configuração atualizada: ${editingRoomConfig.category} - ${editingRoomConfig.bedType}`);
    }
    setEditingRoomConfig(null);
  };

  const handleDeleteRoomConfig = async (id: string) => {
    if (window.confirm('Excluir esta configuração de quarto?')) {
        setRoomConfigs(prev => prev.filter(c => c.id !== id));
        await supabase.from('room_configs').delete().eq('id', id);
        setEditingRoomConfig(null);
        if(addLog) addLog('SYSTEM', 'REMOCAO_CONFIG_QUARTO', `Configuração de quarto removida.`);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'valores':
        return (
          <div className="space-y-4">
             {/* ... Value Table ... */}
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Tabela de Valores por Período</h3>
                {/* Note: This table is currently static for display purposes in the prototype, but reflects the room configs below */}
            </div>
             <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[500px]">
                 <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700"><tr><th className="p-4 font-medium">Categoria</th><th className="p-4 font-medium">Tipo Cama</th><th className="p-4 font-medium">4 Horas</th><th className="p-4 font-medium">12 Horas</th><th className="p-4 font-medium">24 Horas</th></tr></thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                   {roomConfigs.map(conf => (
                       <tr key={conf.id}>
                           <td className="p-4">{conf.category}</td>
                           <td className="p-4">{conf.bedType}</td>
                           <td className="p-4">R$ {conf.price4h.toFixed(2)}</td>
                           <td className="p-4">R$ {conf.price12h.toFixed(2)}</td>
                           <td className="p-4">R$ {conf.price24h.toFixed(2)}</td>
                       </tr>
                   ))}
                   {roomConfigs.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">Nenhuma configuração encontrada.</td></tr>}
                 </tbody>
               </table>
            </div>
          </div>
        );
      case 'produtos': 
        return (
           <div className="h-full flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Catálogo de Produtos</h3>
                    <p className="text-xs text-gray-500">Gerenciamento de itens do Frigobar, Bar e Restaurante.</p>
                 </div>
                 <button 
                    onClick={() => setEditingProduct({ id: 'new', code: '', name: '', category: 'Frigobar', price: 0, stock: 0, minStock: 5 })}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                 >
                    <Plus size={16} /> Novo Produto
                 </button>
              </div>

              {/* Search Bar */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center gap-2">
                 <Search size={20} className="text-gray-400 ml-2" />
                 <input 
                    type="text" 
                    placeholder="Buscar por nome ou código..." 
                    className="flex-1 bg-transparent outline-none p-2 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              {/* Product List */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 overflow-y-auto shadow-sm">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
                        <tr>
                           <th className="p-4 font-semibold text-gray-500 dark:text-slate-400">Código</th>
                           <th className="p-4 font-semibold text-gray-500 dark:text-slate-400">Produto</th>
                           <th className="p-4 font-semibold text-gray-500 dark:text-slate-400">Categoria</th>
                           <th className="p-4 font-semibold text-gray-500 dark:text-slate-400 text-right">Preço</th>
                           <th className="p-4 font-semibold text-gray-500 dark:text-slate-400 text-center">Estoque</th>
                           <th className="p-4 font-semibold text-gray-500 dark:text-slate-400 text-right">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.code && p.code.includes(searchTerm))).map(prod => (
                           <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{prod.code || '-'}</td>
                              <td className="p-4 font-medium text-gray-900 dark:text-white">{prod.name}</td>
                              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">{prod.category}</span></td>
                              <td className="p-4 text-right font-medium text-gray-900 dark:text-white">R$ {prod.price.toFixed(2)}</td>
                              <td className="p-4 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <span className={`font-medium ${prod.stock <= prod.minStock ? 'text-red-500' : 'text-gray-700 dark:text-slate-300'}`}>{prod.stock}</span>
                                    {prod.stock <= prod.minStock && (
                                       <div title="Estoque Baixo">
                                          <AlertTriangle size={14} className="text-red-500" />
                                       </div>
                                    )}
                                 </div>
                              </td>
                              <td className="p-4 text-right">
                                 <div className="flex justify-end gap-1">
                                    <button onClick={() => setEditingProduct(prod)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteProduct(prod.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
              </div>

              {/* Edit/Create Modal */}
              {editingProduct && (
                 <div className="absolute inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                       <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950">
                          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                             {editingProduct.id === 'new' ? <Plus size={18}/> : <Edit size={18}/>}
                             {editingProduct.id === 'new' ? 'Cadastrar Produto' : 'Editar Produto'}
                          </h4>
                          <button onClick={() => setEditingProduct(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full"><X size={18}/></button>
                       </div>
                       <div className="p-6 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Código / SKU</label>
                                <div className="relative">
                                   <Barcode className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                   <input 
                                      type="text" 
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                      value={editingProduct.code}
                                      onChange={(e) => setEditingProduct({...editingProduct, code: e.target.value})}
                                      placeholder="0000"
                                   />
                                </div>
                             </div>
                             <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Produto <span className="text-red-500">*</span></label>
                                <input 
                                   type="text" 
                                   className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                   value={editingProduct.name}
                                   onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                   placeholder="Ex: Água 500ml"
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                                <select 
                                   className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                   value={editingProduct.category}
                                   onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value as any})}
                                >
                                   <option value="Frigobar">Frigobar</option>
                                   <option value="Restaurante">Restaurante</option>
                                   <option value="Bar">Bar</option>
                                   <option value="Recepção">Recepção</option>
                                   <option value="Outros">Outros</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Preço de Venda <span className="text-red-500">*</span></label>
                                <div className="relative">
                                   <span className="absolute left-3 top-2.5 text-gray-400 text-xs">R$</span>
                                   <input 
                                      type="number" 
                                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                      value={editingProduct.price}
                                      onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                                   />
                                </div>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Estoque Atual</label>
                                <input 
                                   type="number" 
                                   className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                   value={editingProduct.stock}
                                   onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})}
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Estoque Mínimo (Alerta)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                   value={editingProduct.minStock}
                                   onChange={(e) => setEditingProduct({...editingProduct, minStock: parseInt(e.target.value) || 0})}
                                />
                             </div>
                          </div>

                          <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Descrição (Opcional)</label>
                             <textarea 
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white h-20 resize-none"
                                value={editingProduct.description || ''}
                                onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                                placeholder="Detalhes do produto..."
                             />
                          </div>
                          
                          <div className="flex justify-end gap-3 pt-2">
                             <button onClick={() => setEditingProduct(null)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 text-sm font-medium">Cancelar</button>
                             <button onClick={handleSaveProduct} className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-bold shadow-lg flex items-center gap-2">
                                <Save size={16}/> Salvar Produto
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        );
      case 'equipe': return <div className="space-y-6"><div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Nossa Equipe</h3><button onClick={() => setActiveTab('acesso')} className="text-sm text-indigo-600 hover:underline">Gerenciar Acessos</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{employees.map(emp => (<div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center"><div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-800 mb-4 overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} className="w-full h-full object-cover" /></div><h4 className="font-bold">{emp.name}</h4><span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 rounded-full text-xs font-medium mt-2">{emp.role}</span><div className="mt-4 w-full pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-500"><p>{emp.email}</p><p>{emp.phone}</p></div><button onClick={() => handleEdit(emp)} className="mt-4 w-full py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Editar Perfil</button></div>))}</div></div>;
      case 'acesso': return (
        <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
             <div className="lg:w-1/3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950"><h4 className="font-bold">Usuários</h4><button onClick={handleResetForm} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={18}/></button></div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">{employees.map(emp => (<div key={emp.id} onClick={() => handleEdit(emp)} className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center ${editingId === emp.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20' : 'bg-white border-transparent hover:bg-gray-50 dark:bg-slate-900'}`}><div><p className="font-bold text-sm">{emp.name}</p><p className="text-xs text-gray-500">{emp.role}</p></div></div>))}</div>
             </div>
             <div className="lg:w-2/3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 dark:bg-slate-950 flex justify-between items-center"><h4 className="font-bold flex items-center gap-2">{editingId ? <><Edit size={18}/> Editando Usuário</> : <><Plus size={18}/> Novo Usuário</>}</h4>{editingId && (<button onClick={() => handleDelete(editingId)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18}/></button>)}</div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4"><h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Dados Pessoais</h5><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 outline-none"/></div>{/* ... more fields ... */}</div></div>
                    {/* ... Credencials ... */}
                     <div className="space-y-4 pt-4 border-t border-gray-100"><h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Credenciais e Função</h5><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-gray-600 mb-1">Usuário</label><input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 outline-none"/></div><div><label className="block text-xs font-medium text-gray-600 mb-1">Senha</label><div className="relative"><input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 outline-none pr-10"/><button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div><div className="md:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label><select name="role" value={formData.role} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 outline-none">{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div></div></div>
                    {/* ... Permissions ... */}
                     <div className="space-y-4 pt-4 border-t border-gray-100"><h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Permissões</h5><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Object.entries(formData.permissions).map(([key, val]) => (<div key={key} onClick={() => handlePermissionChange(key as keyof typeof formData.permissions)} className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-sm capitalize ${val ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-gray-50 border-gray-200 opacity-60 dark:bg-slate-800'}`}><span className="font-medium text-gray-700 dark:text-slate-300">{key}</span>{val && <CheckCircle2 size={16} className="text-green-600"/>}</div>))}</div></div>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-slate-950 flex justify-end gap-3"><button onClick={handleResetForm} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-200 text-sm font-medium">Cancelar</button><button onClick={handleSave} className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-bold flex items-center gap-2"><Save size={18}/> Salvar Usuário</button></div>
             </div>
        </div>
      );
      case 'quartos':
        return (
          <div className="h-full flex flex-col gap-6 relative">
            <div className="flex justify-between items-center"><div><h3 className="font-semibold text-lg">Configuração de Quartos e Tarifas</h3><p className="text-xs text-gray-500">Defina os tipos de suítes e seus valores por período.</p></div><button onClick={() => setEditingRoomConfig({ id: 'new', category: 'Standard', bedType: 'Casal', price4h: 0, price12h: 0, price24h: 0 })} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Plus size={16} /> Nova Configuração</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
               {roomConfigs.map(config => (
                 <div key={config.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                       <div className="p-3 bg-indigo-50 dark:bg-slate-800 text-indigo-600 rounded-xl">{config.bedType === 'Casal' ? <BedDouble size={24}/> : <div className="flex -space-x-1"><Bed size={20}/><Bed size={20}/></div>}</div>
                       <div className="flex gap-1"><button onClick={() => setEditingRoomConfig(config)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"><Edit size={16}/></button><button onClick={() => handleDeleteRoomConfig(config.id)} className="p-2 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>
                    </div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{config.category}</span><h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{config.category} - {config.bedType}</h4><div className="space-y-2 text-sm"><div className="flex justify-between border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500">4 Horas</span><span className="font-semibold text-gray-900 dark:text-white">R$ {config.price4h.toFixed(2)}</span></div><div className="flex justify-between border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500">Pernoite (12h)</span><span className="font-semibold text-gray-900 dark:text-white">R$ {config.price12h.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-gray-500">Diária (24h)</span><span className="font-semibold text-gray-900 dark:text-white">R$ {config.price24h.toFixed(2)}</span></div></div></div>
                 </div>
               ))}
            </div>
            {editingRoomConfig && (
               <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950"><h4 className="font-bold text-gray-900 dark:text-white">{editingRoomConfig.id === 'new' ? 'Nova Configuração' : 'Editar Configuração'}</h4><button onClick={() => setEditingRoomConfig(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full"><X size={18}/></button></div>
                     <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label><select value={editingRoomConfig.category} onChange={e => setEditingRoomConfig({...editingRoomConfig, category: e.target.value as any})} className="w-full rounded-lg border border-gray-300 bg-white text-sm px-3 py-2 outline-none dark:bg-slate-800 dark:border-slate-700"><option value="Standard">Standard</option><option value="Luxo">Luxo</option><option value="Master">Master</option></select></div><div><label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Cama</label><select value={editingRoomConfig.bedType} onChange={e => setEditingRoomConfig({...editingRoomConfig, bedType: e.target.value as any})} className="w-full rounded-lg border border-gray-300 bg-white text-sm px-3 py-2 outline-none dark:bg-slate-800 dark:border-slate-700"><option value="Casal">Casal</option><option value="Duplo">Duplo</option><option value="Triplo">Triplo</option></select></div></div>
                        <div className="pt-2 border-t border-gray-100"><label className="block text-xs font-bold text-gray-400 uppercase mb-3">Tabela de Preços</label><div className="space-y-3"><div><label className="block text-xs text-gray-500 mb-1">4 Horas</label><div className="relative"><span className="absolute left-3 top-2 text-gray-400 text-xs">R$</span><input type="number" value={editingRoomConfig.price4h} onChange={e => setEditingRoomConfig({...editingRoomConfig, price4h: parseFloat(e.target.value) || 0})} className="w-full pl-8 pr-3 py-2 rounded-lg border-gray-300 bg-white text-sm outline-none dark:bg-slate-800 dark:border-slate-700"/></div></div>{/* ... 12h, 24h ... */}<div><label className="block text-xs text-gray-500 mb-1">Pernoite (12h)</label><div className="relative"><span className="absolute left-3 top-2 text-gray-400 text-xs">R$</span><input type="number" value={editingRoomConfig.price12h} onChange={e => setEditingRoomConfig({...editingRoomConfig, price12h: parseFloat(e.target.value) || 0})} className="w-full pl-8 pr-3 py-2 rounded-lg border-gray-300 bg-white text-sm outline-none dark:bg-slate-800 dark:border-slate-700"/></div></div><div><label className="block text-xs text-gray-500 mb-1">Diária (24h)</label><div className="relative"><span className="absolute left-3 top-2 text-gray-400 text-xs">R$</span><input type="number" value={editingRoomConfig.price24h} onChange={e => setEditingRoomConfig({...editingRoomConfig, price24h: parseFloat(e.target.value) || 0})} className="w-full pl-8 pr-3 py-2 rounded-lg border-gray-300 bg-white text-sm outline-none dark:bg-slate-800 dark:border-slate-700"/></div></div></div></div>
                        <div className="pt-4 flex justify-end gap-3"><button onClick={() => setEditingRoomConfig(null)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium">Cancelar</button><button onClick={handleSaveRoomConfig} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-bold shadow-lg">Salvar Configuração</button></div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        );
      default: return <div className="p-8 text-center text-gray-400">Configuração em desenvolvimento.</div>;
    }
  };

  const tabs = [{ id: 'valores', label: 'Valores', icon: Tag }, { id: 'produtos', label: 'Catálogo', icon: Package }, { id: 'acesso', label: 'Acesso', icon: Shield }, { id: 'equipe', label: 'Equipe', icon: Users }, { id: 'quartos', label: 'Quartos', icon: Bed }];

  return (
    <div className="p-4 md:p-8 h-full">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configurações do Sistema</h2>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-[calc(100%-80px)] overflow-hidden">
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 shrink-0">
           {tabs.map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-gray-200 dark:ring-slate-800' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}`}><tab.icon size={18} />{tab.label}</button>
           ))}
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-slate-950/50 rounded-3xl p-4 md:p-6 border border-gray-200 dark:border-slate-800 overflow-y-auto">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
    