
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import type { Client, Partner, Project, SaaSProduct, User, Company, Payment, DataContextType, View, Lead, Transaction, TransactionStatus } from '../types';
import { api } from '../services/api';
import { PLANS } from '../constants';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

export const DataProvider: React.FC<{ children: React.ReactNode, currentUser: User | null, impersonatedCompany: Company | null, setActiveView: (v: View) => void }> = ({ currentUser: initialUser, impersonatedCompany, children, setActiveView }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
    
    const [rawUsers, setRawUsers] = useState<User[]>([]);
    const [rawCompanies, setRawCompanies] = useState<Company[]>([]);
    const [rawClients, setRawClients] = useState<Client[]>([]);
    const [rawPartners, setRawPartners] = useState<Partner[]>([]);
    const [rawProjects, setRawProjects] = useState<Project[]>([]);
    const [rawSaaSProducts, setRawSaaSProducts] = useState<SaaSProduct[]>([]);
    const [rawLeads, setRawLeads] = useState<Lead[]>([]);
    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
    
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
        try {
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
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    }, []);

    useEffect(() => {
        if (currentUser) load();
    }, [currentUser, load]);

    const activeCompanyId = impersonatedCompany?.id || currentUser?.companyId;
    const activeCompanyName = impersonatedCompany?.name || rawCompanies.find(c => c.id === currentUser?.companyId)?.name || 'Nexus Manager';

    const clients = useMemo(() => rawClients.filter(c => c.companyId === activeCompanyId), [rawClients, activeCompanyId]);
    const partners = useMemo(() => rawPartners.filter(p => p.companyId === activeCompanyId), [rawPartners, activeCompanyId]);
    const projects = useMemo(() => rawProjects.filter(p => p.companyId === activeCompanyId), [rawProjects, activeCompanyId]);
    const saasProducts = useMemo(() => rawSaaSProducts.filter(s => s.companyId === activeCompanyId), [rawSaaSProducts, activeCompanyId]);
    const users = useMemo(() => rawUsers.filter(u => u.companyId === activeCompanyId), [rawUsers, activeCompanyId]);
    const leads = useMemo(() => rawLeads.filter(l => l.companyId === activeCompanyId), [rawLeads, activeCompanyId]);
    const transactions = useMemo(() => rawTransactions.filter(t => t.companyId === activeCompanyId), [rawTransactions, activeCompanyId]);
    const companies = rawCompanies;

    const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const addClient = async (client: Omit<Client, 'id' | 'companyId'>) => {
        const newItem = { ...client, id: generateId('cli'), companyId: activeCompanyId };
        await api.saveItem('clients', newItem);
        setRawClients(prev => [...prev, newItem as Client]);
        closeModal();
    };

    const updateClient = async (client: Client) => {
        await api.updateItem('clients', client);
        setRawClients(prev => prev.map(c => c.id === client.id ? client : c));
        closeModal();
    };

    const deleteClient = async (id: string) => {
        await api.deleteItem('clients', id);
        setRawClients(prev => prev.filter(c => c.id !== id));
    };

    const addPartner = async (partner: Omit<Partner, 'id' | 'isAvailable' | 'companyId'>) => {
        const newItem = { ...partner, id: generateId('par'), companyId: activeCompanyId, isAvailable: true };
        await api.saveItem('partners', newItem);
        setRawPartners(prev => [...prev, newItem as Partner]);
        closeModal();
    };

    const updatePartner = async (partner: Partner) => {
        await api.updateItem('partners', partner);
        setRawPartners(prev => prev.map(p => p.id === partner.id ? partner : p));
        closeModal();
    };

    const deletePartner = async (id: string) => {
        await api.deleteItem('partners', id);
        setRawPartners(prev => prev.filter(p => p.id !== id));
    };

    const addProject = async (project: any) => {
        const payments: Payment[] = [];
        const installments = parseInt(project.installments || '1');
        const installmentValue = (project.value - (project.downPayment || 0)) / installments;
        
        const firstDate = project.firstPaymentDate ? new Date(project.firstPaymentDate) : new Date();
        
        for (let i = 0; i < installments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            payments.push({
                id: generateId('pay'),
                amount: installmentValue,
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'Pendente'
            });
        }

        if (project.downPayment > 0) {
            payments.unshift({
                id: generateId('pay'),
                amount: project.downPayment,
                dueDate: new Date().toISOString().split('T')[0],
                status: 'Pago',
                paidDate: new Date().toISOString()
            });
        }

        const newItem = { 
            ...project, 
            id: generateId('prj'), 
            companyId: activeCompanyId, 
            status: 'Pendente', 
            progress: 0, 
            payments, 
            activities: [] 
        };
        await api.saveItem('projects', newItem);
        setRawProjects(prev => [...prev, newItem as Project]);
        closeModal();
    };

    const updateProject = async (project: Project) => {
        await api.updateItem('projects', project);
        setRawProjects(prev => prev.map(p => p.id === project.id ? project : p));
        closeModal();
    };

    const deleteProject = async (id: string) => {
        await api.deleteItem('projects', id);
        setRawProjects(prev => prev.filter(p => p.id !== id));
    };

    const addSaaSProduct = async (product: any) => {
        const newItem = { ...product, id: generateId('saas'), companyId: activeCompanyId };
        await api.saveItem('saasProducts', newItem);
        setRawSaaSProducts(prev => [...prev, newItem as SaaSProduct]);
        closeModal();
    };

    const updateSaaSProduct = async (product: SaaSProduct) => {
        await api.updateItem('saasProducts', product);
        setRawSaaSProducts(prev => prev.map(s => s.id === product.id ? product : s));
        closeModal();
    };

    const deleteSaaSProduct = async (id: string) => {
        await api.deleteItem('saasProducts', id);
        setRawSaaSProducts(prev => prev.filter(s => s.id !== id));
    };

    const addUser = async (user: any) => {
        const newItem = { ...user, id: generateId('usr') };
        await api.saveItem('users', newItem);
        setRawUsers(prev => [...prev, newItem as User]);
        closeModal();
    };

    const updateUser = async (user: User) => {
        await api.updateItem('users', user);
        setRawUsers(prev => prev.map(u => u.id === user.id ? user : u));
        if (currentUser?.id === user.id) setCurrentUser(user);
        closeModal();
    };

    const deleteUser = async (id: string) => {
        await api.deleteItem('users', id);
        setRawUsers(prev => prev.filter(u => u.id !== id));
    };

    const addLead = async (lead: any) => {
        const newItem = { ...lead, id: generateId('lead'), companyId: activeCompanyId, createdAt: new Date().toISOString(), messages: lead.messages || [] };
        await api.saveItem('leads', newItem);
        setRawLeads(prev => [...prev, newItem as Lead]);
        closeModal();
    };

    const updateLead = async (lead: Lead) => {
        await api.updateItem('leads', lead);
        setRawLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
        closeModal();
    };

    const deleteLead = async (id: string) => {
        await api.deleteItem('leads', id);
        setRawLeads(prev => prev.filter(l => l.id !== id));
    };

    const addTransaction = async (transaction: any) => {
        const newItem = { ...transaction, id: generateId('tra'), companyId: activeCompanyId };
        await api.saveItem('transactions', newItem);
        setRawTransactions(prev => [...prev, newItem as Transaction]);
        closeModal();
    };

    const updateTransaction = async (transaction: Transaction) => {
        await api.updateItem('transactions', transaction);
        setRawTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
        closeModal();
    };

    const deleteTransaction = async (id: string) => {
        await api.deleteItem('transactions', id);
        setRawTransactions(prev => prev.filter(t => t.id !== id));
    };

    const addCompany = async (data: any) => {
        const result = await api.register(data.adminUser, data.name);
        if (result && result.user) {
            await load();
            closeModal();
        }
    };

    const updateCompany = async (company: Company) => {
        await api.updateItem('companies', company);
        setRawCompanies(prev => prev.map(c => c.id === company.id ? company : c));
        closeModal();
    };

    const updatePaymentStatus = async (projectId: string, paymentId: string, status: TransactionStatus) => {
        const project = rawProjects.find(p => p.id === projectId);
        if (project) {
            const updatedPayments = project.payments.map(p => 
                p.id === paymentId ? { ...p, status, paidDate: status === 'Pago' ? new Date().toISOString() : undefined } : p
            );
            await updateProject({ ...project, payments: updatedPayments });
        }
    };

    const checkPlanLimits = (feature: string) => {
        const myComp = rawCompanies.find(c => c.id === currentUser?.companyId);
        if (!myComp) return true;
        const plan = PLANS.find(p => p.name === (myComp.plan || 'Starter'));
        if (!plan) return true;

        switch(feature) {
            case 'users': return users.length < plan.limits.users;
            case 'leads': return leads.length < plan.limits.leads;
            case 'leadGen': return plan.limits.hasLeadGen;
            default: return true;
        }
    };

    const value: DataContextType = {
        currentUser,
        activeCompanyName,
        activeCompanyId,
        clients,
        partners,
        projects,
        saasProducts,
        users,
        companies,
        leads,
        transactions,
        addClient, updateClient, deleteClient,
        addPartner, updatePartner, deletePartner,
        addProject, updateProject, deleteProject,
        addSaaSProduct, updateSaaSProduct, deleteSaaSProduct,
        addCompany, updateCompany,
        addUser, updateUser, deleteUser,
        addLead, updateLead, deleteLead,
        addTransaction, updateTransaction, deleteTransaction,
        updatePaymentStatus,
        paySubscription: async () => {}, 
        recordSubscriptionPayment: async () => {},
        openModal,
        closeModal,
        setActiveView,
        checkPlanLimits
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle} maxWidth={modalMaxWidth}>
                {modalContent}
            </Modal>
        </DataContext.Provider>
    );
};
