
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CURRENCY_SYMBOLS } from '../constants';
import PaymentForm from './PaymentForm';
import { CreditCardIcon, CheckBadgeIcon, RocketLaunchIcon, CurrencyDollarIcon } from './Icons';
import type { Company } from '../types';
import UpgradeModal from './UpgradeModal';


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
        closeModal();

        const updatedCompany: Company = {
            ...myCompany,
            plan: newPlanName,
            subscriptionValue: newPrice
        };
        
        await updateCompany(updatedCompany);
        
        openModal(
            'Plano Atualizado!', 
            <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckBadgeIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Parabéns!</h3>
                <p className="text-text-secondary mb-6">
                    Sua empresa migrou para o plano <span className="text-primary font-bold">{newPlanName}</span> com sucesso.
                    Novos recursos foram desbloqueados.
                </p>
                <button 
                    onClick={() => closeModal()}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover font-bold"
                >
                    Continuar
                </button>
            </div>
        );
    };

    const openUpgradeModal = () => {
        openModal(
            'Atualize seu Plano',
            <UpgradeModal 
                currentPlan={currentPlanName} 
                onConfirm={handleUpgradePlan}
                onCancel={closeModal}
            />,
            'max-w-5xl'
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
