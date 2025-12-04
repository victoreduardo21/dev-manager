import React, { useState } from 'react';
import type { Partner } from '../types';
import { CURRENCY_SYMBOLS } from '../constants';
import { useData } from '../context/DataContext';

const PartnerForm: React.FC<{
    // Fix: Correct the onSave prop type to align with addPartner and updatePartner signatures.
    onSave: (partner: Omit<Partner, 'id' | 'isAvailable' | 'companyId'> | Partner) => Promise<void>; 
    initialData?: Partner 
}> = ({ onSave, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [role, setRole] = useState(initialData?.role || '');
    const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate.toString() || '');
    const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !role || !hourlyRate) {
            setError('Todos os campos são obrigatórios.');
            return;
        }
        const rate = parseFloat(hourlyRate);
        if (isNaN(rate) || rate <= 0) {
            setError('O valor por hora deve ser um número positivo.');
            return;
        }
        setIsSaving(true);
        
        // Fix: Pass the correct data shape for new vs. existing partners.
        if(initialData) {
            const partnerData = { name, role, hourlyRate: rate, isAvailable };
            await onSave({ ...initialData, ...partnerData });
        } else {
            const partnerData = { name, role, hourlyRate: rate };
            await onSave(partnerData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="text" placeholder="Cargo (ex: Desenvolvedor Full-Stack)" value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="number" placeholder="Valor por Hora (BRL)" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
             {initialData && (
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isAvailable" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
                    <label htmlFor="isAvailable">Disponível para novos projetos</label>
                </div>
             )}
            <div className="text-right">
                 <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : (initialData ? 'Atualizar Parceiro' : 'Salvar Parceiro')}
                </button>
            </div>
        </form>
    );
};


const PartnerCard: React.FC<{ partner: Partner; onEdit: (partner: Partner) => void; }> = ({ partner, onEdit }) => (
  <div className="bg-surface rounded-lg shadow-lg border border-white/10 p-5">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-bold text-text-primary">{partner.name}</h3>
        <p className="text-sm text-text-secondary">{partner.role}</p>
      </div>
       <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          partner.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
        {partner.isAvailable ? 'Disponível' : 'Ocupado'}
      </span>
    </div>
    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <p className="text-primary font-bold text-lg">{`${CURRENCY_SYMBOLS.BRL} ${partner.hourlyRate.toFixed(2)}/hora`}</p>
        <button onClick={() => onEdit(partner)} className="text-sm font-medium text-primary hover:underline">Editar</button>
    </div>
  </div>
);

const Partners: React.FC = () => {
  const { partners, addPartner, updatePartner, openModal } = useData();

  const handleAddClick = () => {
    openModal('Adicionar Novo Parceiro', <PartnerForm onSave={addPartner} />);
  };

  const handleEditClick = (partner: Partner) => {
    openModal('Editar Parceiro', <PartnerForm onSave={updatePartner} initialData={partner} />);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">Parceiros</h2>
        <button
          onClick={handleAddClick}
          className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors duration-300">
          Adicionar Parceiro
        </button>
      </div>
      {partners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} onEdit={handleEditClick} />
            ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-surface rounded-lg border border-dashed border-white/20">
            <p className="text-text-secondary">Nenhum parceiro cadastrado ainda.</p>
            <p className="text-sm text-text-secondary/80 mt-1">Clique em "Adicionar Parceiro" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default Partners;