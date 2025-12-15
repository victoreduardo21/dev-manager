
import React, { useState } from 'react';
import { PLANS } from '../constants';
import { CheckBadgeIcon, LockClosedIcon } from './Icons';
import type { BillingCycle } from '../types';

interface UpgradeModalProps {
    currentPlan: string;
    onConfirm: (planName: string, price: number, cycle: BillingCycle) => void;
    onCancel: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ currentPlan, onConfirm, onCancel }) => {
    // Default to VIP if on PRO, otherwise null or PRO
    const [selectedPlan, setSelectedPlan] = useState<string | null>(
        currentPlan === 'PRO' ? 'VIP' : 'PRO'
    );
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

    const handleSelect = (planName: string) => {
        if (planName !== currentPlan) {
            setSelectedPlan(planName);
        }
    };

    const getSelectedPrice = () => {
        const p = PLANS.find(p => p.name === selectedPlan);
        return p ? (billingCycle === 'yearly' ? p.price.yearly : p.price.monthly) : 0;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-text-secondary">Escolha o nível de controle que você deseja.</p>
                
                {/* Toggle Switch inside Modal */}
                <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-full border border-slate-200">
                     <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Mensal
                     </button>
                     <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Anual <span className={`${billingCycle === 'yearly' ? 'text-white/90' : 'text-green-600'}`}>17% OFF</span>
                     </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-2">
                {PLANS.map((plan) => {
                    const isCurrent = plan.name === currentPlan;
                    const isSelected = selectedPlan === plan.name;
                    const isVip = plan.name === 'VIP';
                    const displayPrice = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
                    
                    return (
                        <div 
                            key={plan.name}
                            onClick={() => !isCurrent && handleSelect(plan.name)}
                            className={`
                                relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col h-full
                                ${isCurrent 
                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-default' 
                                    : isSelected 
                                        ? 'border-primary bg-white shadow-xl scale-[1.02] ring-4 ring-primary/10' 
                                        : 'border-slate-200 bg-white hover:border-primary/50 hover:shadow-md'
                                }
                            `}
                        >
                            {plan.name === 'PRO' && (
                                <div className="absolute top-4 left-4 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                                    !
                                </div>
                            )}
                             {isVip && (
                                <div className="absolute top-4 left-4 bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                    EXCLUSIVO
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-2 mt-6">
                                <h4 className="text-2xl font-bold text-slate-900">{`Plano ${plan.name}`}</h4>
                                {isCurrent ? (
                                     <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                         <CheckBadgeIcon className="w-4 h-4" />
                                     </div>
                                ) : (
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300'}
                                    `}>
                                        {isSelected && <CheckBadgeIcon className="w-4 h-4" />}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-extrabold text-slate-900">R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <span className="text-sm text-slate-500 font-medium">{billingCycle === 'yearly' ? '/ano' : '/mês'}</span>
                            </div>

                            <div className="h-px bg-slate-100 mb-6"></div>

                            <ul className="space-y-3 text-sm text-slate-600 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        {feature.includes('Sem Automação') ? (
                                             <LockClosedIcon className="w-5 h-5 shrink-0 text-slate-300" />
                                        ) : isVip ? (
                                             <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                                                 <CheckBadgeIcon className="w-3 h-3 text-purple-600" />
                                             </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                                 <CheckBadgeIcon className="w-3 h-3 text-green-600" />
                                             </div>
                                        )}
                                        <span className={`font-medium ${feature.includes('Sem Automação') ? 'text-slate-400' : ''}`}>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200 flex justify-end gap-3 items-center">
                <button 
                    onClick={onCancel}
                    className="px-6 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors font-bold"
                >
                    Cancelar
                </button>
                <button 
                    onClick={() => selectedPlan && onConfirm(selectedPlan, getSelectedPrice(), billingCycle)}
                    disabled={!selectedPlan}
                    className={`
                        px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform hover:scale-105
                        ${selectedPlan 
                            ? 'bg-primary hover:bg-primary-hover' 
                            : 'bg-slate-300 cursor-not-allowed opacity-70'
                        }
                    `}
                >
                    {selectedPlan ? `Confirmar Upgrade` : 'Selecione um plano'}
                </button>
            </div>
        </div>
    );
};

export default UpgradeModal;
