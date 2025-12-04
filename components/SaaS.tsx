import React, { useState } from 'react';
import type { SaaSProduct, SaaSPlan } from '../types';
import { CURRENCY_SYMBOLS } from '../constants';
import { useData } from '../context/DataContext';

const SaaSForm: React.FC<{ 
    // Fix: Correct the onSave prop type to reflect that new products don't have a companyId yet.
    onSave: (product: Omit<SaaSProduct, 'id' | 'companyId'> | SaaSProduct) => Promise<void>;
    initialData?: SaaSProduct;
}> = ({ onSave, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
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
            plans: plans.map((plan, index) => ({
                ...plan,
                id: (plan as SaaSPlan).id || `plan${Date.now()}${index}`, // Keep existing id if present
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
            <input type="text" placeholder="Nome do Produto SaaS" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            
            <div className="space-y-3">
                <h4 className="font-semibold">Planos</h4>
                {plans.map((plan, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-white/10 rounded-md">
                        <input type="text" placeholder="Nome do Plano" value={plan.name} onChange={e => handlePlanChange(index, 'name', e.target.value)} className="w-1/3 px-2 py-1 bg-background/50 border border-white/20 rounded" />
                        <input type="number" placeholder="Preço" value={plan.price} onChange={e => handlePlanChange(index, 'price', parseFloat(e.target.value))} className="w-1/4 px-2 py-1 bg-background/50 border border-white/20 rounded" />
                        <input type="number" placeholder="Clientes" value={plan.customerCount} onChange={e => handlePlanChange(index, 'customerCount', parseInt(e.target.value, 10))} className="w-1/4 px-2 py-1 bg-background/50 border border-white/20 rounded" />
                        {plans.length > 1 && <button type="button" onClick={() => removePlan(index)} className="text-red-500 hover:text-red-400">X</button>}
                    </div>
                ))}
                <button type="button" onClick={addPlan} className="text-sm text-primary hover:underline">+ Adicionar Plano</button>
            </div>
            
            <div className="text-right">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
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
        <button onClick={handleAddClick} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
          Adicionar Produto SaaS
        </button>
      </div>
      {saasProducts.length > 0 ? (
        <div className="space-y-6">
            {saasProducts.map((product) => (
            <div key={product.id} className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-text-primary">{product.name}</h3>
                    <button onClick={() => handleEditClick(product)} className="text-sm font-medium text-primary hover:underline">Editar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {product.plans.map((plan) => (
                    <div key={plan.id} className="bg-background/50 p-4 rounded-md border border-white/10">
                    <p className="font-bold text-lg text-text-primary">{plan.name}</p>
                    <p className="text-primary text-2xl font-semibold my-2">{`${CURRENCY_SYMBOLS.BRL} ${plan.price}/mês`}</p>
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