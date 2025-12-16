
import type { Currency, ProjectStatus } from "./types";

export const CURRENCIES: Currency[] = ['BRL', 'USD', 'EUR'];
export const PROJECT_STATUSES: ProjectStatus[] = ['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
};

export const PLANS = [
    {
        name: 'PRO',
        price: {
            monthly: 200.00,
            yearly: 2000.00
        },
        description: 'Ideal para profissionais que buscam crescimento.',
        features: [
            "CRM de Vendas Ilimitado",
            "Gestão de Projetos Ilimitada",
            "Até 3 Usuários",
            "Agenda Financeira",
            "Relatórios Avançados",
            "Sem Automação de WhatsApp"
        ],
        highlight: true,
        tag: 'Recomendado'
    },
    {
        name: 'VIP',
        price: {
            monthly: 500.00,
            yearly: 5000.00
        },
        description: 'Controle total e automação para sua empresa.',
        features: [
            "Tudo do plano PRO",
            "Usuários Ilimitados",
            "Automação WhatsApp API",
            "Captação de Leads Avançada",
            "Assistente Financeiro Inteligente",
            "Prioridade no Suporte"
        ],
        highlight: false,
        tag: 'Exclusivo'
    }
];
