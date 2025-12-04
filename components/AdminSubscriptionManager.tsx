import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Company } from '../types';
import { CURRENCY_SYMBOLS } from '../constants';
import { CompanyForm } from './forms/CompanyForm';


const AdminSubscriptionManager: React.FC = () => {
    const { companies, recordSubscriptionPayment, updateCompany, openModal } = useData();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const clientCompanies = companies.filter(c => c.id !== 'comp-nexus');

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
                <h2 className="text-3xl font-bold text-text-primary">Gerenciar Assinaturas</h2>
            </div>

            <div className="bg-surface rounded-lg shadow-lg border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Empresa</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Status</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Vencimento</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Valor Mensal</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientCompanies.map(company => {
                                const status = getStatus(company);
                                return (
                                    <tr key={company.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-text-primary font-medium whitespace-nowrap">{company.name}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td className="p-4 text-text-primary whitespace-nowrap">{new Date(company.subscriptionDueDate).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-text-primary whitespace-nowrap">{`${CURRENCY_SYMBOLS[company.currency]} ${company.subscriptionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleRecordPayment(company.id)} 
                                                disabled={isLoading === company.id}
                                                className="bg-primary/20 text-primary px-3 py-1 rounded-md text-sm hover:bg-primary/40 disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {isLoading === company.id ? '...' : 'Registrar Pagamento'}
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(company)}
                                                className="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-md text-sm hover:bg-gray-500/40"
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
                 {clientCompanies.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-text-secondary">Nenhuma empresa cliente cadastrada para gerenciar assinaturas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSubscriptionManager;
