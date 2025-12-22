
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { RocketLaunchIcon } from './Icons';
import { CURRENCY_SYMBOLS } from '../constants';
import UpgradeModal from './UpgradeModal';
import type { Company, BillingCycle } from '../types';

const Settings: React.FC = () => {
    const { currentUser, updateUser, companies, openModal, closeModal, updateCompany } = useData();
    
    const myCompany = companies.find(c => c.id === currentUser?.companyId);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                cpf: currentUser.cpf || ''
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
                cpf: formData.cpf
            });
            setSuccessMsg('Dados atualizados com sucesso!');
        } catch (error) {
            setSuccessMsg('Erro ao atualizar.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Subscription Logic ---
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

    const isOverdue = myCompany && new Date(myCompany.subscriptionDueDate) < new Date() && myCompany.subscriptionStatus === 'Ativa';

    return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Configurações</h2>
      <div className="max-w-4xl space-y-8">
        
        {/* === SEÇÃO MEU PLANO === */}
        {myCompany && (
            <div className="bg-[#0f172a] p-8 rounded-lg shadow-lg border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <RocketLaunchIcon className="w-32 h-32 text-white" />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <RocketLaunchIcon className="w-6 h-6 text-blue-500" />
                            Plano Atual: <span className="text-blue-400">{myCompany.plan || 'Starter'}</span>
                        </h3>
                        <p className="text-sm text-slate-400">Ciclo de faturamento: {myCompany.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}</p>
                    </div>
                    <button 
                        onClick={openUpgradeModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                    >
                        Fazer Upgrade
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {isOverdue ? 'Vencido' : 'Ativo'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Valor</p>
                        <p className="text-lg font-bold text-white">
                            {CURRENCY_SYMBOLS[myCompany.currency]} {myCompany.subscriptionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Próximo Vencimento</p>
                        <p className="text-lg font-bold text-white">
                            {new Date(myCompany.subscriptionDueDate).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* === CARD PERFIL === */}
        <div className="bg-surface p-8 rounded-lg shadow-lg border border-white/10">
          <div className="flex items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-400/30 text-white font-bold text-3xl shadow-xl shrink-0">
                {getInitials(formData.name || currentUser.name)}
            </div>
            <div className="ml-6">
                <h3 className="text-2xl font-bold text-text-primary">{formData.name || currentUser.name}</h3>
                <p className="text-text-secondary">{formData.email || currentUser.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                     <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/20 text-blue-400 uppercase tracking-wider border border-blue-400/30">
                        {currentUser.role}
                     </span>
                     {myCompany?.plan && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 uppercase tracking-wider border border-amber-600/30">
                            PLANO {myCompany.plan}
                        </span>
                     )}
                </div>
            </div>
          </div>
          
          <div className="space-y-6">
             <h4 className="text-lg font-semibold text-text-primary border-b border-white/10 pb-2">Dados Cadastrais</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-blue-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-blue-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Telefone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-blue-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">CPF</label>
                  <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-blue-500 outline-none transition-colors" />
                </div>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-6">
                <button onClick={handleSaveUserProfile} disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50">
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                {successMsg && <span className="text-sm text-green-500 font-bold animate-fade-in">{successMsg}</span>}
             </div>
          </div>
        </div>
      </div>
    </div>
    );
};

export default Settings;
