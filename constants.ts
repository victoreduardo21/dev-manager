
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
        name: 'Starter',
        price: { monthly: 97.00, yearly: 970.00 },
        description: 'A base sólida para quem está começando agora.',
        limits: {
            users: 1,
            leads: 50,
            hasWhatsApp: false,
            hasLeadGen: false,
            hasAdvancedReports: false
        },
        features: [
            "CRM de Vendas (Até 50 Leads/Semana)",
            "Gestão de Projetos Básica",
            "1 Usuário Admin",
            "Relatórios Financeiros Simples",
            "Suporte via Email"
        ],
        highlight: false
    },
    {
        name: 'PRO',
        price: { monthly: 200.00, yearly: 2000.00 },
        description: 'Potência máxima para profissionais em ascensão.',
        limits: {
            users: 3,
            leads: 999999,
            hasWhatsApp: false,
            hasLeadGen: false,
            hasAdvancedReports: true
        },
        features: [
            "CRM de Vendas Ilimitado",
            "Gestão de Projetos Completa",
            "Até 3 Usuários na Equipe",
            "Agenda Financeira & Fluxo de Caixa",
            "Relatórios de Performance Avançados",
            "Prioridade no Suporte"
        ],
        highlight: true,
        tag: 'Mais Vendido'
    },
    {
        name: 'VIP',
        price: { monthly: 1000.00, yearly: 10000.00 },
        description: 'A solução definitiva para escalar e automatizar.',
        limits: {
            users: 999999,
            leads: 999999,
            hasWhatsApp: true,
            hasLeadGen: true,
            hasAdvancedReports: true
        },
        features: [
            "Tudo do plano PRO",
            "Equipe Ilimitada",
            "Automação WhatsApp API Nativa",
            "Captação de Leads IA (Deep Search)",
            "Gerente de Contas Dedicado",
            "Acesso Antecipado a Recursos"
        ],
        highlight: false,
        tag: 'Elite'
    }
];
