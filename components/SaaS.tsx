
import React, { useState } from 'react';
import type { SaaSProduct, SaaSPlan, Currency } from '../types';
import { CURRENCY_SYMBOLS, CURRENCIES } from '../constants';
import { useData } from '../context/DataContext';

const SaaSForm: React.FC<{ 
    onSave: (product: Omit<SaaSProduct, 'id' | 'companyId'> | SaaSProduct) => Promise<void>;
    initialData?: SaaSProduct;
}> = ({ onSave, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [currency, setCurrency] = useState<Currency>(initialData?.currency || 'BRL');
    const [plans, setPlans] = useState<Omit<SaaSPlan, 'id'>[]>(initialData?.plans || [{ name: '', price: 0, customerCount: 0 }]);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handlePlanChange = (index: number, field: keyof Omit<SaaSPlan, 'id'>, value: string | number) => {
        const newPlans = [...plans];
        (newPlans[index] as any)[field] = value;
        setPlans(newPlans);
    };

    const addPlan = () => {
        setPlans([...plans, { name: '', price: 0, customerCount: 0 }]);
    };
    
    const removePlan = (index: number) => {
        const newPlans = plans.filter((_, i) => i !== index);
        setPlans(newPlans);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || plans.some(p => !p.name || p.price <= 0)) {
            setError('Nome do produto e nome/preço válido para todos os planos são obrigatórios.');
            return;
        }
        setIsSaving(true);
        const productData = {
            name,
            currency,
            plans: plans.map((plan, index) => ({
                ...plan,
                id: (plan as SaaSPlan).id || `plan${Date.now()}${index}`,
                price: Number(plan.price),
                customerCount: Number(plan.customerCount)
            }))
        };
        
        if (initialData) {
            await onSave({ ...initialData, ...productData });
        } else {
            await onSave(productData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome do Produto</label>
                    <input type="text" placeholder="Ex: Nexus CRM" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Moeda</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="space-y-3">
                <h4 className="font-semibold">Planos</h4>
                {plans.map((plan, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-white/10 rounded-md bg-slate-50">
                        <input type="text" placeholder="Nome do Plano" value={plan.name} onChange={e => handlePlanChange(index, 'name', e.target.value)} className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded" />
                        <div className="flex items-center w-1/4">
                            <span className="mr-1 text-xs text-slate-400">{CURRENCY_SYMBOLS[currency]}</span>
                            <input type="number" placeholder="Preço" value={plan.price} onChange={e => handlePlanChange(index, 'price', parseFloat(e.target.value))} className="w-full px-2 py-1 bg-white border border-slate-200 rounded" />
                        </div>
                        <input type="number" placeholder="Qtd. Clientes" value={plan.customerCount} onChange={e => handlePlanChange(index, 'customerCount', parseInt(e.target.value, 10))} className="w-1/4 px-2 py-1 bg-white border border-slate-200 rounded" />
                        {plans.length > 1 && <button type="button" onClick={() => removePlan(index)} className="text-red-500 hover:text-red-400 p-1">X</button>}
                    </div>
                ))}
                <button type="button" onClick={addPlan} className="text-sm text-primary hover:underline font-bold">+ Adicionar Plano</button>
            </div>
            
            <div className="text-right pt-4">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary-hover disabled:opacity-50 font-bold"
                >
                  {isSaving ? 'Salvando...' : (initialData ? 'Atualizar Produto' : 'Salvar Produto')}
                </button>
            </div>
        </form>
    );
};


const SaaS: React.FC = () => {
  const { saasProducts, addSaaSProduct, updateSaaSProduct, openModal } = useData();
  
  const handleAddClick = () => {
    openModal('Adicionar Novo Produto SaaS', <SaaSForm onSave={addSaaSProduct} />);
  };

  const handleEditClick = (product: SaaSProduct) => {
    openModal('Editar Produto SaaS', <SaaSForm onSave={updateSaaSProduct} initialData={product} />);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">SaaS</h2>
        <button onClick={handleAddClick} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors font-bold">
          Adicionar Produto SaaS
        </button>
      </div>
      {saasProducts.length > 0 ? (
        <div className="space-y-6">
            {saasProducts.map((product) => (
            <div key={product.id} className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-text-primary">{product.name}</h3>
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">{product.currency}</span>
                    </div>
                    <button onClick={() => handleEditClick(product)} className="text-sm font-medium text-primary hover:underline">Editar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {product.plans.map((plan) => (
                    <div key={plan.id} className="bg-background/50 p-4 rounded-md border border-white/10">
                        <p className="font-bold text-lg text-text-primary">{plan.name}</p>
                        <p className="text-primary text-2xl font-semibold my-2">{`${CURRENCY_SYMBOLS[product.currency]} ${plan.price}/mês`}</p>
                        <p className="text-text-secondary">{`${plan.customerCount} clientes`}</p>
                    </div>
                ))}
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-surface rounded-lg border border-dashed border-white/20">
            <p className="text-text-secondary">Nenhum produto SaaS cadastrado ainda.</p>
            <p className="text-sm text-text-secondary/80 mt-1">Clique em "Adicionar Produto SaaS" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default SaaS;
