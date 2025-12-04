import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CURRENCY_SYMBOLS } from '../constants';
import PaymentForm from './PaymentForm';
import { CreditCardIcon } from './Icons';

const Subscription: React.FC = () => {
    const { currentUser, companies, paySubscription, openModal } = useData();
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
        await paySubscription(myCompany.id); // No card details, just pays
        setIsPaying(false);
    };


    return (
        <div>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Assinatura</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Subscription Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                        <h3 className="text-xl font-semibold mb-4 text-text-primary">Seu Plano</h3>
                        <div className="space-y-3">
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
                        <p className="text-text-secondary">Valor Mensal</p>
                        <p className="text-4xl font-bold text-primary my-2">
                            {CURRENCY_SYMBOLS[myCompany.currency]} {myCompany.subscriptionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {myCompany.subscriptionStatus === 'Ativa' && (
                            myCompany.savedCard ? (
                                <div className="mt-4">
                                    <div className="bg-background/50 p-3 rounded-md border border-white/10 text-left mb-4">
                                        <p className="text-sm text-text-secondary">Pagar com cartão salvo:</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center">
                                                <CreditCardIcon className="w-6 h-6 text-text-secondary" />
                                                <span className="font-semibold text-text-primary ml-3">
                                                    **** **** **** {myCompany.savedCard.last4}
                                                </span>
                                            </div>
                                            <span className="text-sm text-text-secondary">{myCompany.savedCard.expiry}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePayWithSavedCard}
                                        disabled={isPaying}
                                        className="w-full bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-wait"
                                    >
                                        {isPaying ? 'Processando...' : 'Pagar Agora'}
                                    </button>
                                    <button onClick={openPaymentModal} className="mt-2 text-sm text-primary hover:underline">
                                        Usar outro cartão
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={openPaymentModal}
                                    className="mt-4 w-full bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                                >
                                    Pagar com Cartão
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Payment History */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                    <h3 className="text-xl font-semibold mb-4 text-text-primary">Histórico de Pagamentos</h3>
                    {myCompany.paymentHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="p-3 text-sm font-semibold text-text-secondary">Data</th>
                                        <th className="p-3 text-sm font-semibold text-text-secondary">Valor</th>
                                        <th className="p-3 text-sm font-semibold text-text-secondary text-right">Recibo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myCompany.paymentHistory.map(payment => (
                                        <tr key={payment.id} className="border-b border-white/10 last:border-0">
                                            <td className="p-3 text-text-primary whitespace-nowrap">{new Date(payment.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-3 text-text-primary whitespace-nowrap">{CURRENCY_SYMBOLS[myCompany.currency]} {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right">
                                                <a href="#" className="text-primary hover:underline text-sm">Baixar</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <div className="text-center py-10">
                            <p className="text-text-secondary">Nenhum pagamento registrado.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subscription;
