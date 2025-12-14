
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CURRENCY_SYMBOLS } from '../constants';
import PaymentForm from './PaymentForm';
import { CreditCardIcon, CheckBadgeIcon, RocketLaunchIcon, CurrencyDollarIcon } from './Icons';
import type { Company } from '../types';

// Definição dos Planos Disponíveis
const PLANS = [
    {
        name: 'Starter',
        price: 97,
        features: [
            "CRM de Vendas Básico",
            "Gestão de até 5 Projetos",
            "1 Usuário Admin",
            "Controle Financeiro Simples"
        ]
    },
    {
        name: 'Professional',
        price: 197,
        features: [
            "CRM de Vendas Ilimitado",
            "Projetos Ilimitados",
            "Até 5 Usuários",
            "Automação WhatsApp API",
            "Captação de Leads com IA"
        ],
        isPopular: true
    },
    {
        name: 'Business',
        price: 497,
        features: [
            "Tudo do Professional",
            "Usuários Ilimitados",
            "API Aberta para Integrações",
            "Gestão Multi-Empresas",
            "Gerente de Conta Dedicado"
        ]
    }
];

const UpgradeModal: React.FC<{ 
    currentPlan: string; 
    onSelectPlan: (planName: string, price: number) => void;
    onCancel: () => void;
}> = ({ currentPlan, onSelectPlan, onCancel }) => {
    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-text-primary mb-2">Escolha o plano ideal</h3>
                <p className="text-text-secondary">Faça o upgrade para desbloquear mais recursos.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {PLANS.map(plan => {
                    const isCurrent = plan.name === currentPlan;
                    
                    return (
                        <div 
                            key={plan.name} 
                            className={`relative border rounded-xl p-6 flex flex-col justify-between transition-all duration-300 ${
                                isCurrent 
                                ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500' 
                                : plan.isPopular
                                    ? 'border-blue-500 bg-white shadow-xl transform scale-105 z-10'
                                    : 'border-white/20 bg-surface hover:border-primary/50'
                            }`}
                        >
                            {plan.isPopular && !isCurrent && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wide">
                                    Popular
                                </div>
                            )}
                            
                            {isCurrent && (
                                <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wide">
                                    Atual
                                </div>
                            )}

                            <div>
                                <h4 className={`font-bold text-xl ${isCurrent ? 'text-green-600' : 'text-text-primary'}`}>
                                    {plan.name}
                                </h4>
                                <div className="flex items-baseline gap-1 my-4">
                                    <span className="text-3xl font-bold text-text-primary">R$ {plan.price}</span>
                                    <span className="text-sm text-text-secondary">/mês</span>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                            <CheckBadgeIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? 'text-green-500' : 'text-primary'}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={() => !isCurrent && onSelectPlan(plan.name, plan.price)}
                                disabled={isCurrent}
                                className={`w-full py-3 rounded-lg text-sm font-bold transition-all shadow-md ${
                                    isCurrent 
                                    ? 'bg-transparent text-green-600 border border-green-500 cursor-default opacity-80' 
                                    : 'bg-primary text-white hover:bg-primary-hover hover:-translate-y-1'
                                }`}
                            >
                                {isCurrent ? 'Seu Plano Atual' : 'Selecionar Plano'}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div className="text-center mt-8 pt-4 border-t border-white/10">
                <button onClick={onCancel} className="text-text-secondary hover:text-text-primary text-sm font-medium px-6 py-2 rounded hover:bg-white/5">
                    Cancelar
                </button>
            </div>
        </div>
    );
};

const Subscription: React.FC = () => {
    const { currentUser, companies, paySubscription, openModal, updateCompany, closeModal } = useData();
    const [isPaying, setIsPaying] = useState(false);

    const myCompany = companies.find(c => c.id === currentUser?.companyId);

    if (!myCompany) {
        return (
            <div>
                <h2 className="text-3xl font-bold text-text-primary mb-6">Assinatura</h2>
                <div className="text-center py-10 bg-surface rounded-lg border border-dashed border-white/20">
                    <p className="text-text-secondary">Não foi possível carregar os dados da sua assinatura.</p>
                </div>
            </div>
        );
    }

    const isOverdue = new Date(myCompany.subscriptionDueDate) < new Date() && myCompany.subscriptionStatus === 'Ativa';
    const statusText = isOverdue ? 'Vencida' : myCompany.subscriptionStatus;
    const statusColor = isOverdue ? 'bg-orange-500/20 text-orange-400'
        : myCompany.subscriptionStatus === 'Ativa' ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400';

    const currentPlanName = myCompany.plan || 'Starter';

    const openPaymentModal = () => {
        openModal(
            'Pagamento da Assinatura',
            <PaymentForm
                amount={myCompany.subscriptionValue}
                currencySymbol={CURRENCY_SYMBOLS[myCompany.currency]}
                onPay={(cardDetails) => paySubscription(myCompany.id, cardDetails)}
            />
        );
    };

    const handlePayWithSavedCard = async () => {
        setIsPaying(true);
        await paySubscription(myCompany.id); 
        setIsPaying(false);
    };

    const handleUpgradePlan = async (newPlanName: string, newPrice: number) => {
        // Fecha o modal de seleção primeiro
        closeModal();

        // Atualiza a empresa
        const updatedCompany: Company = {
            ...myCompany,
            plan: newPlanName,
            subscriptionValue: newPrice
        };
        
        await updateCompany(updatedCompany);
        
        // Abre modal de sucesso
        openModal(
            'Plano Atualizado!', 
            <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckBadgeIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Parabéns!</h3>
                <p className="text-text-secondary mb-6">
                    Sua empresa migrou para o plano <span className="text-primary font-bold">{newPlanName}</span> com sucesso.
                </p>
                <button 
                    onClick={() => closeModal()}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover"
                >
                    Continuar
                </button>
            </div>
        );
    };

    const openUpgradeModal = () => {
        openModal(
            'Mudar de Plano',
            <UpgradeModal 
                currentPlan={currentPlanName} 
                onSelectPlan={handleUpgradePlan}
                onCancel={closeModal}
            />,
            'max-w-6xl'
        );
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary">Minha Assinatura</h2>
                <button 
                    onClick={openUpgradeModal}
                    className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-hover transition-colors flex items-center gap-2 font-bold animate-pulse"
                >
                    <RocketLaunchIcon className="w-5 h-5" />
                    Mudar de Plano / Fazer Upgrade
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Subscription Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <RocketLaunchIcon className="w-24 h-24 text-primary" />
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-6 text-text-primary relative z-10">Detalhes do Plano</h3>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="flex flex-col gap-1">
                                <span className="text-text-secondary text-xs uppercase font-bold tracking-wider">Plano Atual</span>
                                <span className="text-2xl font-bold text-primary">{currentPlanName}</span>
                            </div>
                            
                            <div className="h-px bg-white/10"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Empresa</span>
                                <span className="font-semibold text-text-primary">{myCompany.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Status</span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                    {statusText}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Próximo Vencimento</span>
                                <span className="font-semibold text-text-primary">
                                    {new Date(myCompany.subscriptionDueDate).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10 text-center">
                        <p className="text-text-secondary uppercase text-xs font-bold tracking-wider mb-2">Valor Mensal</p>
                        <p className="text-4xl font-bold text-text-primary mb-6">
                            {CURRENCY_SYMBOLS[myCompany.currency]} {myCompany.subscriptionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        
                        {myCompany.subscriptionStatus === 'Ativa' && (
                            myCompany.savedCard ? (
                                <div className="mt-4">
                                    <div className="bg-background/50 p-3 rounded-md border border-white/10 text-left mb-4 flex items-center gap-3">
                                        <div className="bg-white p-2 rounded">
                                            <CreditCardIcon className="w-6 h-6 text-slate-800" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">Cartão Final {myCompany.savedCard.last4}</p>
                                            <p className="text-xs text-text-secondary">Expira em {myCompany.savedCard.expiry}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePayWithSavedCard}
                                        disabled={isPaying}
                                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-wait font-bold"
                                    >
                                        {isPaying ? 'Processando...' : 'Pagar Fatura Agora'}
                                    </button>
                                    <button onClick={openPaymentModal} className="mt-3 text-sm text-text-secondary hover:text-white underline">
                                        Usar outro cartão
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={openPaymentModal}
                                    className="w-full bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:bg-primary-hover transition-colors font-bold"
                                >
                                    Adicionar Forma de Pagamento
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Payment History */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                    <h3 className="text-xl font-semibold mb-6 text-text-primary">Histórico Financeiro</h3>
                    {myCompany.paymentHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-text-secondary text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4 rounded-l-lg">Data</th>
                                        <th className="p-4">Descrição</th>
                                        <th className="p-4">Valor</th>
                                        <th className="p-4 rounded-r-lg text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {myCompany.paymentHistory.map(payment => (
                                        <tr key={payment.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-text-primary whitespace-nowrap">{new Date(payment.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-4 text-text-secondary">Mensalidade - Plano {currentPlanName}</td>
                                            <td className="p-4 text-text-primary font-mono whitespace-nowrap">{CURRENCY_SYMBOLS[myCompany.currency]} {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td className="p-4 text-right">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <CheckBadgeIcon className="w-3 h-3" /> Pago
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <div className="text-center py-16 bg-background/30 rounded-lg border border-dashed border-white/10">
                            <CurrencyDollarIcon className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
                            <p className="text-text-secondary font-medium">Nenhum pagamento registrado.</p>
                            <p className="text-sm text-text-secondary/60">Seu histórico financeiro aparecerá aqui.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subscription;
