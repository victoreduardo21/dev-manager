
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Company } from '../types';
import { CURRENCY_SYMBOLS } from '../constants';
import { CompanyForm } from './forms/CompanyForm';
// Fix: Import missing RocketLaunchIcon from Icons
import { RocketLaunchIcon } from './Icons';


const AdminSubscriptionManager: React.FC = () => {
    // Garantimos que 'allCompanies' seja usado para o SuperAdmin ver tudo
    const { allCompanies, recordSubscriptionPayment, updateCompany, openModal, currentUser } = useData();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const isGlobalAdmin = currentUser?.email === 'gtsglobaltech01@gmail.com';
    
    // Se for o mestre, mostra todas as empresas. Caso contrário, apenas as da conta atual (raro nesta tela, mas seguro)
    const displayCompanies = isGlobalAdmin ? allCompanies : allCompanies.filter(c => c.id !== 'comp-nexus');

    const getStatus = (company: Company): { text: string; color: string } => {
        const isOverdue = new Date(company.subscriptionDueDate) < new Date() && company.subscriptionStatus === 'Ativa';
        if (isOverdue) return { text: 'Vencida', color: 'bg-orange-500/20 text-orange-400' };
        if (company.subscriptionStatus === 'Ativa') return { text: 'Ativa', color: 'bg-green-500/20 text-green-400' };
        return { text: 'Inativa', color: 'bg-red-500/20 text-red-400' };
    };

    const handleRecordPayment = async (companyId: string) => {
        setIsLoading(companyId);
        await recordSubscriptionPayment(companyId);
        setIsLoading(null);
    };

    const handleEdit = (company: Company) => {
        openModal(`Editar Assinatura: ${company.name}`, <CompanyForm onSave={updateCompany} initialData={company} />);
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary uppercase tracking-tighter">Gerenciar Assinaturas Global</h2>
                {isGlobalAdmin && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">Acesso Master GTS</span>}
            </div>

            <div className="bg-surface rounded-lg shadow-lg border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="p-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Empresa</th>
                                <th className="p-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Vencimento</th>
                                <th className="p-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Investimento</th>
                                <th className="p-4 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayCompanies.map(company => {
                                const status = getStatus(company);
                                return (
                                    <tr key={company.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-text-primary font-black uppercase text-sm tracking-tight">{company.name}</span>
                                                <span className="text-[10px] text-text-secondary font-bold">{company.contactEmail}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td className="p-4 text-text-primary text-xs font-mono whitespace-nowrap">{new Date(company.subscriptionDueDate).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-text-primary whitespace-nowrap font-black">
                                            {`${CURRENCY_SYMBOLS[company.currency] || 'R$'} ${Number(company.subscriptionValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                            <span className="text-[9px] text-text-secondary ml-1 font-bold uppercase">/ {company.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}</span>
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleRecordPayment(company.id)} 
                                                disabled={isLoading === company.id}
                                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                {isLoading === company.id ? '...' : 'Registrar Pago'}
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(company)}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                 {displayCompanies.length === 0 && (
                    <div className="text-center py-20 grayscale opacity-20">
                        <RocketLaunchIcon className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhum assinante ativo no banco de dados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSubscriptionManager;
