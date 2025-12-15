
// Fix: Import React to resolve "Cannot find namespace 'React'" error.
import React from 'react';

export type View = 'Dashboard' | 'CRM' | 'Captação' | 'Clientes' | 'Parceiros' | 'Projetos' | 'SaaS' | 'Financeiro' | 'Empresas' | 'Usuários' | 'Configuração' | 'Assinatura' | 'Gerenciar Assinaturas';

export type Currency = 'BRL' | 'USD' | 'EUR';
export type ProjectStatus = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
export type ProjectCategory = 'Site' | 'Sistema' | 'App' | 'Marketing' | 'Consultoria' | 'Outro';
export type UserRole = 'SuperAdmin' | 'Admin' | 'User';
export type SubscriptionStatus = 'Ativa' | 'Inativa';
export type LeadStatus = 'Novo' | 'Contatado' | 'Qualificado' | 'Proposta' | 'Ganho' | 'Perdido';
export type BillingCycle = 'monthly' | 'yearly';
export type TransactionStatus = 'Pago' | 'Pendente' | 'Atrasado';

export interface Client {
  id: string;
  companyId: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj: string;
}

export interface Partner {
  id: string;
  companyId: string;
  name: string;
  role: string;
  hourlyRate: number;
  isAvailable: boolean;
}

export interface Payment {
    id: string;
    amount: number;
    dueDate: string;
    paidDate?: string; // Data real do recebimento
    status: TransactionStatus;
}

// Transações Manuais (Novas Entradas)
export interface Transaction {
    id: string;
    companyId: string;
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
    category: string; // Ex: 'Atualização', 'Manutenção', 'Consultoria Avulsa'
}

export interface Activity {
  id: string;
  date: string;
  description: string;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description: string;
  category: ProjectCategory; // Novo campo para diferenciar Site de Sistema, etc.
  clientId: string;
  value: number;
  downPayment: number;
  installments: number;
  currency: Currency;
  firstPaymentDate?: string; // Nova data escolhida manualmente para o primeiro vencimento
  hasRetainer: boolean;
  retainerValue?: number;
  assignedPartnerIds: string[];
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  payments: Payment[];
  activities: Activity[];
}

// Site type removed as it is merged into Project

export interface SaaSPlan {
  id: string;
  name: string;
  price: number;
  customerCount: number;
}

export interface SaaSProduct {
  id: string;
  companyId: string;
  name: string;
  plans: SaaSPlan[];
}

export interface User {
    id: string;
    companyId: string;
    name: string;
    email: string;
    password?: string; // Should not be sent to client in real app
    role: UserRole;
    phone?: string;
    cpf?: string;
}

export interface SubscriptionPayment {
    id: string;
    date: string;
    amount: number;
    paymentMethod?: string; // Optional info
}

export interface Company {
    id: string;
    name: string;
    cnpj_cpf: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    subscriptionValue: number;
    currency: Currency;
    subscriptionStatus: SubscriptionStatus;
    subscriptionDueDate: string;
    plan?: string; // Novo campo para armazenar o nome do plano (Starter, Professional, etc)
    billingCycle?: BillingCycle; // Mensal ou Anual
    paymentHistory: SubscriptionPayment[];
    savedCard?: {
        last4: string;
        expiry: string;
    };
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'lead';
    timestamp: string;
}

export interface Lead {
    id: string;
    companyId: string;
    name: string; // Name of the business or contact
    email?: string;
    phone: string;
    address?: string;
    status: LeadStatus;
    source: string; // e.g., "Google Maps", "Manual", "Indicação"
    notes?: string;
    createdAt: string;
    messages: ChatMessage[];
}

export interface WhatsAppConfig {
    apiUrl: string;
    apiToken: string;
    instanceName: string;
    isConnected: boolean;
}

export interface DataContextType {
    currentUser: User | null;
    activeCompanyName: string;
    activeCompanyId?: string;
    clients: Client[];
    partners: Partner[];
    projects: Project[];
    saasProducts: SaaSProduct[];
    users: User[];
    companies: Company[];
    leads: Lead[];
    transactions: Transaction[]; // Nova lista
    whatsappConfig: WhatsAppConfig;
    setWhatsappConfig: (config: WhatsAppConfig) => void;
    addClient: (client: Omit<Client, 'id' | 'companyId'>) => Promise<void>;
    addPartner: (partner: Omit<Partner, 'id' | 'isAvailable' | 'companyId'>) => Promise<void>;
    addProject: (project: Omit<Project, 'id' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>) => Promise<void>;
    addSaaSProduct: (product: Omit<SaaSProduct, 'id'| 'companyId'>) => Promise<void>;
    addCompany: (companyData: Omit<Company, 'id' | 'subscriptionDueDate' | 'paymentHistory'> & { adminUser: { name: string; email: string; phone: string } }) => Promise<void>;
    addUser: (user: Omit<User, 'id'>) => Promise<void>; // Removido 'password' do Omit para permitir envio
    addLead: (lead: Omit<Lead, 'id' | 'companyId' | 'createdAt' | 'messages'> & { messages?: ChatMessage[] }) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'companyId'>) => Promise<void>; // Nova função
    updateClient: (client: Client) => Promise<void>;
    updatePartner: (partner: Partner) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    updateSaaSProduct: (product: SaaSProduct) => Promise<void>;
    updateCompany: (company: Company) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    updateLead: (lead: Lead) => Promise<void>;
    updateTransaction: (transaction: Transaction) => Promise<void>; // Nova função
    deleteClient: (id: string) => Promise<void>;
    deletePartner: (id: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    deleteSaaSProduct: (id: string) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>; // Nova função
    updatePaymentStatus: (projectId: string, paymentId: string, newStatus: 'Pago' | 'Pendente' | 'Atrasado') => Promise<void>;
    paySubscription: (companyId: string, cardDetails?: { last4: string; expiry: string; }) => Promise<void>;
    recordSubscriptionPayment: (companyId: string) => Promise<void>;
    openModal: (title: string, content: React.ReactNode, maxWidth?: string) => void;
    closeModal: () => void;
    setActiveView: (view: View) => void;
    sendWhatsAppMessage: (phone: string, message: string) => Promise<boolean>;
    checkPlanLimits: (feature: 'projects' | 'users' | 'whatsapp' | 'leadGen' | 'leads') => boolean;
}
