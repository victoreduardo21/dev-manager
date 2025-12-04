import React, { useState } from 'react';

interface PaymentFormProps {
    amount: number;
    currencySymbol: string;
    onPay: (cardDetails?: { last4: string; expiry: string; }) => Promise<void>;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, currencySymbol, onPay }) => {
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [saveCard, setSaveCard] = useState(true);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        }
        return value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/[^0-9]/gi, '');
        if (v.length >= 3) {
            return `${v.slice(0, 2)} / ${v.slice(2, 4)}`;
        }
        return v;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cardName || cardNumber.length < 19 || expiry.length < 7 || cvc.length < 3) {
            setError('Por favor, preencha todos os campos corretamente.');
            return;
        }
        setError('');
        setIsProcessing(true);

        let cardDetailsToSave: { last4: string; expiry: string; } | undefined = undefined;
        if (saveCard) {
            cardDetailsToSave = {
                last4: cardNumber.replace(/\s/g, '').slice(-4),
                expiry: expiry
            };
        }

        await onPay(cardDetailsToSave);
        // The modal will be closed by the context after payment
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <div>
                <label htmlFor="cardName" className="block text-sm font-medium text-text-secondary">Nome no Cartão</label>
                <input type="text" id="cardName" value={cardName} onChange={e => setCardName(e.target.value)} className="mt-1 w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            </div>

            <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-text-secondary">Número do Cartão</label>
                <input type="text" id="cardNumber" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} placeholder="0000 0000 0000 0000" className="mt-1 w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-text-secondary">Validade</label>
                    <input type="text" id="expiry" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} maxLength={7} placeholder="MM / AA" className="mt-1 w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-text-secondary">CVC</label>
                    <input type="text" id="cvc" value={cvc} onChange={e => setCvc(e.target.value.replace(/[^0-9]/gi, ''))} maxLength={4} placeholder="123" className="mt-1 w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="saveCard" 
                    checked={saveCard} 
                    onChange={e => setSaveCard(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary bg-surface" 
                />
                <label htmlFor="saveCard" className="text-sm text-text-secondary">Salvar cartão para pagamentos futuros</label>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-wait"
                >
                    {isProcessing ? 'Processando...' : `Pagar ${currencySymbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </button>
            </div>
        </form>
    );
};

export default PaymentForm;