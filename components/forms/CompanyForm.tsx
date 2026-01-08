
import React, { useState } from 'react';
import type { Company, Currency, SubscriptionStatus } from '../../types';
import { CURRENCIES } from '../../constants';

export type CompanyFormData = Omit<Company, 'id' | 'subscriptionDueDate' | 'paymentHistory'> & { adminUser: { name: string; email: string; phone: string } };

export const CompanyForm: React.FC<{ 
    onSave: (data: CompanyFormData | Company) => Promise<void>;
    initialData?: Company;
}> = ({ onSave, initialData }) => {
    const [companyData, setCompanyData] = useState({
        name: initialData?.name || '',
        cnpj_cpf: initialData?.cnpj_cpf || '',
        subscriptionValue: initialData?.subscriptionValue.toString() || '',
        currency: initialData?.currency || 'BRL' as Currency,
        subscriptionStatus: initialData?.subscriptionStatus || 'Ativa' as SubscriptionStatus,
    });
    const [adminUserData, setAdminUserData] = useState({
        name: initialData?.contactName || '',
        email: initialData?.contactEmail || '',
        phone: initialData?.contactPhone || ''
    });

    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCompanyData(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleAdminUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAdminUserData(prev => ({...prev, [e.target.name]: e.target.value}));
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyData.name || !companyData.subscriptionValue || !adminUserData.name || !adminUserData.email) {
            setError('Dados da empresa e do administrador são obrigatórios.');
            return;
        }
        const value = parseFloat(companyData.subscriptionValue);
        if (isNaN(value) || value < 0) {
            setError('O valor da assinatura deve ser um número válido.');
            return;
        }

        setIsSaving(true);
        if (initialData) {
            const dataToSave: Company = {
                ...initialData,
                ...companyData,
                subscriptionValue: value,
                subscriptionStatus: companyData.subscriptionStatus,
                contactName: adminUserData.name,
                contactEmail: adminUserData.email,
                contactPhone: adminUserData.phone,
            };
            await onSave(dataToSave);
        } else {
             const dataToSave: CompanyFormData = {
                ...companyData,
                subscriptionValue: value,
                subscriptionStatus: companyData.subscriptionStatus,
                contactName: adminUserData.name,
                contactEmail: adminUserData.email,
                contactPhone: adminUserData.phone,
                adminUser: { ...adminUserData }
            };
            await onSave(dataToSave);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <h4 className="text-lg font-semibold text-text-primary border-b border-white/10 pb-2">Dados da Empresa</h4>
            <input type="text" name="name" placeholder="Nome da Empresa" value={companyData.name} onChange={handleCompanyChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="text" name="cnpj_cpf" placeholder="CNPJ" value={companyData.cnpj_cpf} onChange={handleCompanyChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            
            <div className="grid grid-cols-2 gap-4">
                <input type="number" name="subscriptionValue" placeholder="Valor da Assinatura" value={companyData.subscriptionValue} onChange={handleCompanyChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                <select name="currency" value={companyData.currency} onChange={handleCompanyChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            
            <select name="subscriptionStatus" value={companyData.subscriptionStatus} onChange={handleCompanyChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md">
                <option value="Ativa">Assinatura Ativa</option>
                <option value="Inativa">Assinatura Inativa</option>
            </select>

            <h4 className="text-lg font-semibold text-text-primary border-b border-white/10 pb-2 pt-4">Contato Principal / Admin</h4>
            <p className="text-xs text-text-secondary -mt-3">Ao criar uma nova empresa, estes dados também criarão o usuário administrador.</p>
            <input type="text" name="name" placeholder="Nome do Contato" value={adminUserData.name} onChange={handleAdminUserChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
            <input type="email" name="email" placeholder="Email do Contato" value={adminUserData.email} onChange={handleAdminUserChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
            <input type="tel" name="phone" placeholder="Telefone do Contato" value={adminUserData.phone} onChange={handleAdminUserChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />

            <div className="text-right pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : (initialData ? 'Atualizar Empresa' : 'Salvar Empresa')}
                </button>
            </div>
        </form>
    );
};
