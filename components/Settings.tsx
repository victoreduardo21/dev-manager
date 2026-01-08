
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { RocketLaunchIcon, UsersIcon, PhoneIcon, MailIcon, WhatsAppIcon, ChartBarIcon, ShieldCheckIcon } from './Icons';
import { CURRENCY_SYMBOLS } from '../constants';
import UpgradeModal from './UpgradeModal';
import type { Company, BillingCycle, User } from '../types';

const Settings: React.FC = () => {
    const { currentUser, updateUser, companies, allCompanies, allUsers, openModal, closeModal, updateCompany, users: teamUsers } = useData();
    
    // Identifica se o usuário logado é o SuperAdmin Global (GTS)
    const isGlobalAdmin = currentUser?.email === 'gtsglobaltech01@gmail.com';
    
    // Define qual lista exibir: se for Master, mostra todos. Se for comum, mostra equipe.
    const displayUsers = isGlobalAdmin ? allUsers : teamUsers;
    
    const myCompany = companies.find(c => c.id === currentUser?.companyId);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnpj: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                cnpj: currentUser.cnpj || ''
            });
        }
    }, [currentUser]);

    if (!currentUser) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUserProfile = async () => {
        setIsSaving(true);
        setSuccessMsg('');
        try {
            await updateUser({
                ...currentUser,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                cnpj: formData.cnpj
            });
            setSuccessMsg('Dados atualizados com sucesso!');
        } catch (error) {
            setSuccessMsg('Erro ao atualizar.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpgradePlan = async (newPlanName: string, newPrice: number, newCycle: BillingCycle) => {
        if (!myCompany) return;
        closeModal();
        const updatedCompany: Company = {
            ...myCompany,
            plan: newPlanName,
            subscriptionValue: newPrice,
            billingCycle: newCycle
        };
        await updateCompany(updatedCompany);
        alert(`Plano atualizado para ${newPlanName}!`);
    };

    const openUpgradeModal = () => {
        openModal(
            'Atualize seu Plano',
            <UpgradeModal 
                currentPlan={myCompany?.plan || 'Starter'} 
                onConfirm={handleUpgradePlan}
                onCancel={closeModal}
            />,
            'max-w-5xl'
        );
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    // Função crucial: Busca o plano do usuário cruzando com o ID da empresa dele
    const getUserPlan = (user: User) => {
        const company = allCompanies.find(c => c.id === user.companyId);
        return company?.plan || 'N/A';
    };

    const isOverdue = myCompany && new Date(myCompany.subscriptionDueDate) < new Date() && myCompany.subscriptionStatus === 'Ativa';

    return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Configurações</h2>
            <p className="text-[11px] text-slate-400 font-black mt-1 uppercase tracking-[0.3em]">Gestão de Perfil e Sistema</p>
          </div>
      </div>

      <div className="max-w-7xl space-y-10">
        
        {/* === SEÇÃO MEU PLANO (Escondida se for o dono do sistema) === */}
        {!isGlobalAdmin && myCompany && (
            <div className="bg-[#020617] p-10 rounded-[40px] shadow-2xl relative overflow-hidden text-white border border-white/5">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <RocketLaunchIcon className="w-48 h-48" />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Sua Assinatura Atual</p>
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter">
                            Plano {myCompany.plan || 'Starter'}
                        </h3>
                    </div>
                    <button 
                        onClick={openUpgradeModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        Trocar de Plano
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-white/10 relative z-10">
                    <div>
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Status do Ciclo</p>
                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {isOverdue ? 'Pagamento Pendente' : 'Conta Regularizada'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Investimento {myCompany.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}</p>
                        <p className="text-2xl font-black text-white">
                            {CURRENCY_SYMBOLS[myCompany.currency]} {myCompany.subscriptionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Próxima Renovação</p>
                        <p className="text-2xl font-black text-white">
                            {new Date(myCompany.subscriptionDueDate).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* === COLUNA MEU PERFIL === */}
            <div className="xl:col-span-1 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-fit sticky top-6">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center border-4 border-blue-50 shadow-2xl text-white font-black text-4xl mb-6 relative">
                        {getInitials(formData.name || currentUser.name)}
                        {isGlobalAdmin && (
                            <div className="absolute -top-2 -right-2 bg-amber-400 p-1.5 rounded-xl border-4 border-white shadow-lg" title="Super Admin">
                                <ShieldCheckIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{formData.name || currentUser.name}</h3>
                    <p className="text-slate-400 text-xs font-bold">{formData.email || currentUser.email}</p>
                    <div className="mt-6">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isGlobalAdmin ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'}`}>
                            {isGlobalAdmin ? 'Master Admin Global' : `Nível: ${currentUser.role}`}
                         </span>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                        <input type="text" name="cnpj" value={formData.cnpj} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-500 outline-none" />
                    </div>
                    <button onClick={handleSaveUserProfile} disabled={isSaving} className="w-full bg-blue-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 mt-4">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    {successMsg && <p className="text-center text-[10px] font-black text-emerald-600 uppercase mt-2">{successMsg}</p>}
                </div>
            </div>

            {/* === COLUNA DIRETÓRIO (Visão de todos os usuários do sistema) === */}
            <div className="xl:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col min-h-[600px]">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                {isGlobalAdmin ? 'Todos os Clientes do Sistema' : 'Membros da Equipe'}
                            </h3>
                            {isGlobalAdmin && <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Painel de Controle GTS</p>}
                        </div>
                    </div>
                    {isGlobalAdmin && (
                        <div className="flex gap-2">
                             <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100 uppercase">
                                {displayUsers.length} Cadastros
                             </span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Nome / E-mail</th>
                                <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Plano Atual</th>
                                <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contato</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xs border border-slate-200 uppercase">
                                                {getInitials(user.name)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                getUserPlan(user) === 'VIP' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' :
                                                getUserPlan(user) === 'PRO' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                                'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                {getUserPlan(user)}
                                            </span>
                                            {isGlobalAdmin && (
                                                <span className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter">
                                                    ID: {String(user.companyId).replace('comp-', '')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <p className="text-[10px] font-mono font-bold text-slate-600">{user.phone || 'N/A'}</p>
                                                {isGlobalAdmin && user.role === 'Admin' && <span className="text-[8px] font-black text-blue-400 uppercase">Dono da Conta</span>}
                                            </div>
                                            {user.phone && (
                                                <a 
                                                    href={`https://wa.me/${String(user.phone).replace(/\D/g, '')}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {displayUsers.length === 0 && (
                        <div className="text-center py-32 grayscale opacity-20">
                            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Aguardando novos cadastros no Nexus.</p>
                        </div>
                    )}
                </div>

                {isGlobalAdmin && (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nexus Database Manager • v3.8</p>
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                            Sincronizar Banco de Dados
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
    );
};

export default Settings;
