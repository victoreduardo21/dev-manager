import React from 'react';
import type { Company } from '../types';
import { CURRENCY_SYMBOLS } from '../constants';
import { useData } from '../context/DataContext';
import { CompanyForm } from './forms/CompanyForm';

const CompanyCard: React.FC<{ company: Company; onEdit: (company: Company) => void; onImpersonate: (company: Company) => void; }> = ({ company, onEdit, onImpersonate }) => {
    const isOverdue = new Date(company.subscriptionDueDate) < new Date() && company.subscriptionStatus === 'Ativa';

    const statusText = isOverdue ? 'Vencida' : company.subscriptionStatus;
    const statusColor = isOverdue ? 'bg-orange-500/20 text-orange-400' 
                      : company.subscriptionStatus === 'Ativa' ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400';

    return (
    <div className="bg-surface rounded-lg shadow-lg border border-white/10 p-5 flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-text-primary">{company.name}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                    {statusText}
                </span>
            </div>
             <p className="text-sm text-text-secondary mt-2">{company.contactEmail}</p>
            <div className="flex justify-between items-baseline mt-2">
                <p className="text-lg font-semibold text-primary">
                    {`${CURRENCY_SYMBOLS[company.currency]} ${company.subscriptionValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}/mês`}
                </p>
                <div className="text-right">
                    <p className="text-xs text-text-secondary">Vencimento</p>
                    <p className="text-sm font-medium">{new Date(company.subscriptionDueDate).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end items-center gap-4">
            <button onClick={() => onImpersonate(company)} className="text-sm font-medium text-yellow-400 hover:underline">Acessar como</button>
            <button onClick={() => onEdit(company)} className="text-sm font-medium text-primary hover:underline">Gerenciar</button>
        </div>
    </div>
    );
};


const Companies: React.FC<{ onImpersonate: (company: Company) => void; }> = ({ onImpersonate }) => {
  const { companies, addCompany, updateCompany, openModal } = useData();

  const handleAddClick = () => {
    openModal('Adicionar Nova Empresa', <CompanyForm onSave={addCompany as any} />);
  };

  const handleEditClick = (company: Company) => {
    openModal('Editar Empresa', <CompanyForm onSave={updateCompany as any} initialData={company} />);
  };

  const clientCompanies = companies.filter(c => c.id !== 'comp-nexus');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">Empresas</h2>
        <button onClick={handleAddClick} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
          Adicionar Empresa
        </button>
      </div>
      {clientCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} onEdit={handleEditClick} onImpersonate={onImpersonate}/>
            ))}
        </div>
      ) : (
         <div className="text-center py-10 bg-surface rounded-lg border border-dashed border-white/20">
            <p className="text-text-secondary">Nenhuma empresa cliente cadastrada ainda.</p>
            <p className="text-sm text-text-secondary/80 mt-1">Clique em "Adicionar Empresa" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default Companies;
