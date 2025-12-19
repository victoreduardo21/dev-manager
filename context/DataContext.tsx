import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import type { Client, Partner, Project, SaaSProduct, User, Company, Payment, DataContextType, View, SubscriptionPayment, Lead, ChatMessage, WhatsAppConfig, Transaction } from '../types';
import { api } from '../services/api';
import { PLANS } from '../constants';
import { RocketLaunchIcon, LockClosedIcon } from '../components/Icons';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

const PasswordDisplay: React.FC<{ user: User }> = ({ user }) => (
    <div className="text-center">
        <p className="text-text-primary mb-2 font-bold">Usuário criado com sucesso!</p>
        <div className="bg-background/50 border border-white/20 rounded-md p-4 my-4 text-left">
            <p><strong className="text-text-secondary">Email:</strong> {user.email}</p>
            <p><strong className="text-text-secondary">Senha temporária:</strong> <span className="font-mono bg-black/30 px-2 py-1 rounded text-primary">{user.password}</span></p>
        </div>
        <p className="text-xs text-text-secondary italic">Peça para o usuário alterar a senha no primeiro acesso.</p>
    </div>
);

export const DataProvider: React.FC<{ children: React.ReactNode, currentUser: User | null, impersonatedCompany: Company | null, setActiveView: (v: View) => void }> = ({ currentUser: initialUser, impersonatedCompany, children, setActiveView }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
    
    // Estados brutos (contêm todos os dados vindos da API)
    const [rawUsers, setRawUsers] = useState<User[]>([]);
    const [rawCompanies, setRawCompanies] = useState<Company[]>([]);
    const [rawClients, setRawClients] = useState<Client[]>([]);
    const [rawPartners, setRawPartners] = useState<Partner[]>([]);
    const [rawProjects, setRawProjects] = useState<Project[]>([]);
    const [rawSaaSProducts, setRawSaaSProducts] = useState<SaaSProduct[]>([]);
    const [rawLeads, setRawLeads] = useState<Lead[]>([]);
    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
    
    const [whatsappConfig, setWhatsappConfigState] = useState<WhatsAppConfig>({ apiUrl: '', apiToken: '', instanceName: '', isConnected: false });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMaxWidth, setModalMaxWidth] = useState('max-w-md');

    const openModal = useCallback((title: string, content: React.ReactNode, maxWidth: string = 'max-w-md') => {
        setModalTitle(title); setModalContent(content); setModalMaxWidth(maxWidth); setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false); setModalContent(null); setModalTitle('');
    }, []);

    useEffect(() => {
        if (initialUser) setCurrentUser(initialUser);
    }, [initialUser]);

    const load = useCallback(async () => {
        const db = await api.fetchData();
        if (db) {
            setRawUsers(db.users || []);
            setRawCompanies(db.companies || []);
            setRawClients(db.clients || []);
            setRawPartners(db.partners || []);
            setRawProjects([...(db.projects || []), ...(db.sites || [])]);
            setRawSaaSProducts(db.saasProducts || []);
            setRawLeads(db.leads || []);
            setRawTransactions(db.transactions || []);
        }
    }, []);

    useEffect(() => {
        if (currentUser) load();
    }, [currentUser, load]);

    // Lógica de Identidade de Empresa
    const activeCompanyId = impersonatedCompany?.id || currentUser?.companyId;
    const isSuperAdmin = currentUser?.role === 'SuperAdmin';
    const isImpersonating = !!impersonatedCompany;

    // --- FILTROS DE MULTI-TENANCY ---
    // Se for SuperAdmin e não estiver personificando, vê tudo. Caso contrário, vê apenas o da empresa ativa.
    const filterByCompany = <T extends { companyId?: string; id?: string }>(data: T[]): T[] => {
        if (isSuperAdmin && !isImpersonating) return data;
        return data.filter(item => item.companyId === activeCompanyId);
    };

    const clients = useMemo(() => filterByCompany(rawClients), [rawClients, activeCompanyId, isSuperAdmin, isImpersonating]);
    const partners = useMemo(() => filterByCompany(rawPartners), [rawPartners, activeCompanyId, isSuperAdmin, isImpersonating]);
    const projects = useMemo(() => filterByCompany(rawProjects), [rawProjects, activeCompanyId, isSuperAdmin, isImpersonating]);
    const saasProducts = useMemo(() => filterByCompany(rawSaaSProducts), [rawSaaSProducts, activeCompanyId, isSuperAdmin, isImpersonating]);
    const users = useMemo(() => filterByCompany(rawUsers), [rawUsers, activeCompanyId, isSuperAdmin, isImpersonating]);
    const leads = useMemo(() => filterByCompany(rawLeads), [rawLeads, activeCompanyId, isSuperAdmin, isImpersonating]);
    const transactions = useMemo(() => filterByCompany(rawTransactions), [rawTransactions, activeCompanyId, isSuperAdmin, isImpersonating]);
    
    // Empresas: SuperAdmin vê todas, User vê apenas a sua
    const companies = useMemo(() => {
        if (isSuperAdmin) return rawCompanies;
        return rawCompanies.filter(c => c.id === currentUser?.companyId);
    }, [rawCompanies, currentUser, isSuperAdmin]);

    const myCompany = useMemo(() => rawCompanies.find(c => c.id === activeCompanyId), [rawCompanies, activeCompanyId]);
    const activeCompanyName = myCompany?.name || 'Nexus';

    const checkPlanLimits = useCallback((feature: 'projects' | 'users' | 'whatsapp' | 'leadGen' | 'leads'): boolean => {
        if (isSuperAdmin && !isImpersonating) return true;
        
        const currentPlanName = myCompany?.plan || 'Starter';
        const planConfig = PLANS.find(p => p.name === currentPlanName);
        
        if (!planConfig) return true;

        switch (feature) {
            case 'users':
                if (users.length >= planConfig.limits.users) {
                    alert(`Seu plano ${currentPlanName} permite apenas ${planConfig.limits.users} usuário(s). Faça upgrade para adicionar mais.`);
                    return false;
                }
                break;
            case 'leads':
                if (leads.length >= planConfig.limits.leads) {
                    alert(`Seu plano ${currentPlanName} atingiu o limite de ${planConfig.limits.leads} leads. Faça upgrade agora.`);
                    return false;
                }
                break;
            case 'whatsapp':
                if (!planConfig.limits.hasWhatsApp) {
                    alert(`A automação de WhatsApp está disponível apenas no plano VIP.`);
                    return false;
                }
                break;
            case 'leadGen':
                if (!planConfig.limits.hasLeadGen) {
                    alert(`A Captação Inteligente está disponível apenas no plano VIP.`);
                    return false;
                }
                break;
        }
        return true;
    }, [myCompany, users.length, leads.length, isSuperAdmin, isImpersonating]);

    const addProject = useCallback(async (data: any) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `proj${Date.now()}`, companyId: activeCompanyId, status: 'Pendente', progress: 0, activities: [] };
        await api.saveItem('projects', newItem); setRawProjects(prev => [...prev, newItem]); closeModal();
    }, [activeCompanyId, closeModal]);

    const addClient = useCallback(async (data: any) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `cli${Date.now()}`, companyId: activeCompanyId };
        await api.saveItem('clients', newItem); setRawClients(prev => [...prev, newItem]); closeModal();
    }, [activeCompanyId, closeModal]);

    const addPartner = useCallback(async (data: any) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `par${Date.now()}`, companyId: activeCompanyId, isAvailable: true };
        await api.saveItem('partners', newItem); setRawPartners(prev => [...prev, newItem]); closeModal();
    }, [activeCompanyId, closeModal]);

    const addUser = useCallback(async (data: any) => {
        const target = data.companyId || activeCompanyId;
        const pass = data.password || Math.random().toString(36).slice(-8);
        const newItem = { ...data, id: `user${Date.now()}`, companyId: target, password: pass };
        await api.saveItem('users', newItem); setRawUsers(prev => [...prev, newItem]);
        openModal('Usuário Criado', <PasswordDisplay user={newItem} />);
    }, [activeCompanyId, openModal]);

    const addLead = useCallback(async (data: any) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `lead${Date.now()}`, companyId: activeCompanyId, createdAt: new Date().toISOString(), messages: data.messages || [] };
        await api.saveItem('leads', newItem); setRawLeads(prev => [...prev, newItem]); closeModal();
    }, [activeCompanyId, closeModal]);

    const addTransaction = useCallback(async (data: any) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `tr${Date.now()}`, companyId: activeCompanyId };
        await api.saveItem('transactions', newItem); setRawTransactions(prev => [...prev, newItem]); closeModal();
    }, [activeCompanyId, closeModal]);

    const updateGeneric = async (coll: string, item: any, setter: any) => {
        await api.updateItem(coll, item);
        setter((prev: any[]) => prev.map(i => i.id === item.id ? item : i));
    };

    const value: DataContextType = {
        currentUser, activeCompanyName, activeCompanyId,
        clients, partners, projects, saasProducts, users, companies, leads, transactions,
        addClient, addPartner, addProject, addSaaSProduct: async () => {}, addCompany: async () => {}, addUser, addLead, addTransaction,
        updateClient: (i: any) => updateGeneric('clients', i, setRawClients).then(closeModal),
        updatePartner: (i: any) => updateGeneric('partners', i, setRawPartners).then(closeModal),
        updateProject: (i: any) => updateGeneric('projects', i, setRawProjects).then(closeModal),
        updateSaaSProduct: async () => {},
        updateCompany: (i: any) => updateGeneric('companies', i, setRawCompanies).then(closeModal),
        updateUser: (i: any) => updateGeneric('users', i, setRawUsers).then(closeModal),
        updateLead: (i: any) => updateGeneric('leads', i, setRawLeads),
        updateTransaction: (i: any) => updateGeneric('transactions', i, setRawTransactions).then(closeModal),
        deleteClient: async () => {}, deletePartner: async () => {}, 
        deleteProject: (id: string) => api.deleteItem('projects', id).then(() => setRawProjects(p => p.filter(x => x.id !== id))),
        deleteSaaSProduct: async () => {}, deleteUser: async () => {}, 
        deleteLead: (id: string) => api.deleteItem('leads', id).then(() => setRawLeads(l => l.filter(x => x.id !== id))),
        deleteTransaction: (id: string) => api.deleteItem('transactions', id).then(() => setRawTransactions(t => t.filter(x => x.id !== id))),
        updatePaymentStatus: async () => {}, paySubscription: async () => {}, recordSubscriptionPayment: async () => {},
        openModal, closeModal, setActiveView, whatsappConfig, setWhatsappConfig: (c: any) => setWhatsappConfigState(c),
        sendWhatsAppMessage: async () => true, checkPlanLimits
    };

    return <DataContext.Provider value={value}>{children}<Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle} maxWidth={modalMaxWidth}>{modalContent}</Modal></DataContext.Provider>;
}