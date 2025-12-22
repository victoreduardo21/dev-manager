
import React from 'react';

export type View = 'Dashboard' | 'CRM' | 'Captação' | 'Clientes' | 'Parceiros' | 'Projetos' | 'SaaS' | 'Financeiro' | 'Empresas' | 'Usuários' | 'Configuração' | 'Assinatura' | 'Gerenciar Assinaturas' | 'Relatórios';

export type Currency = 'BRL' | 'USD' | 'EUR';
export type ProjectStatus = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
/**
 * Represents the category of a project. 
 * Added 'Outro' to align with the values used in ProjectManager.tsx.
 */
export type ProjectCategory = 'Site' | 'Sistema' | 'App' | 'Marketing' | 'Consultoria' | 'Geral' | 'Outro';
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
    paidDate?: string; 
    status: TransactionStatus;
}

export interface Transaction {
    id: string;
    companyId: string;
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
    type: 'Receita' | 'Despesa';
    category: string; 
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
  category: ProjectCategory; 
  clientId: string;
  value: number;
  downPayment: number;
  installments: number;
  currency: Currency;
  firstPaymentDate?: string; 
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
    password?: string; 
    role: UserRole;
    phone?: string;
    cpf?: string;
}

export interface SubscriptionPayment {
    id: string;
    date: string;
    amount: number;
    paymentMethod?: string; 
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
    plan?: string; 
    billingCycle?: BillingCycle; 
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
    name: string; 
    email?: string;
    phone: string;
    address?: string;
    status: LeadStatus;
    source: string; 
    notes?: string;
    createdAt: string;
    messages: ChatMessage[];
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
    transactions: Transaction[]; 
    addClient: (client: Omit<Client, 'id' | 'companyId'>) => Promise<void>;
    addPartner: (partner: Omit<Partner, 'id' | 'isAvailable' | 'companyId'>) => Promise<void>;
    addProject: (project: Omit<Project, 'id' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>) => Promise<void>;
    addSaaSProduct: (product: Omit<SaaSProduct, 'id'| 'companyId'>) => Promise<void>;
    addCompany: (companyData: Omit<Company, 'id' | 'subscriptionDueDate' | 'paymentHistory'> & { adminUser: { name: string; email: string; phone: string } }) => Promise<void>;
    addUser: (user: Omit<User, 'id'>) => Promise<void>; 
    addLead: (lead: Omit<Lead, 'id' | 'companyId' | 'createdAt' | 'messages'> & { messages?: ChatMessage[] }) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'companyId'>) => Promise<void>; 
    updateClient: (client: Client) => Promise<void>;
    updatePartner: (partner: Partner) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    updateSaaSProduct: (product: SaaSProduct) => Promise<void>;
    updateCompany: (company: Company) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    updateLead: (lead: Lead) => Promise<void>;
    updateTransaction: (transaction: Transaction) => Promise<void>; 
    deleteClient: (id: string) => Promise<void>;
    deletePartner: (id: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    deleteSaaSProduct: (id: string) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>; 
    updatePaymentStatus: (projectId: string, paymentId: string, newStatus: TransactionStatus) => Promise<void>;
    paySubscription: (companyId: string, cardDetails?: { last4: string; expiry: string; }) => Promise<void>;
    recordSubscriptionPayment: (companyId: string) => Promise<void>;
    openModal: (title: string, content: React.ReactNode, maxWidth?: string) => void;
    closeModal: () => void;
    setActiveView: (view: View) => void;
    checkPlanLimits: (feature: 'projects' | 'users' | 'leadGen' | 'leads') => boolean;
}
