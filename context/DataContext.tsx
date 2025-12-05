
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Modal from '../components/Modal';
import type { Client, Partner, Project, Site, SaaSProduct, User, Company, Payment, DataContextType, View, SubscriptionPayment, Lead, ChatMessage, WhatsAppConfig } from '../types';
import { api } from '../services/api';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

interface DataProviderProps {
    children: React.ReactNode;
    currentUser: User | null;
    impersonatedCompany: Company | null;
    setActiveView: (view: View) => void;
}

const PasswordDisplay: React.FC<{ user: User }> = ({ user }) => (
    <div className="text-center">
        <p className="text-text-primary mb-2">O administrador da empresa foi criado.</p>
        <p className="text-text-secondary text-sm">Por favor, compartilhe estas credenciais com eles:</p>
        <div className="bg-background/50 border border-white/20 rounded-md p-4 my-4 text-left">
            <p><strong className="text-text-secondary">Email:</strong> {user.email}</p>
            <p><strong className="text-text-secondary">Senha Temporária:</strong> <span className="font-mono bg-black/30 px-2 py-1 rounded">{user.password}</span></p>
        </div>
        <p className="text-xs text-text-secondary">Eles devem alterar a senha no primeiro login.</p>
    </div>
);

export const DataProvider: React.FC<DataProviderProps> = ({ currentUser: initialUser, impersonatedCompany, children, setActiveView }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(initialUser);

    // Estado local para UI, mas inicializado via API
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [saasProducts, setSaaSProducts] = useState<SaaSProduct[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    
    // WhatsApp Configuration State
    const [whatsappConfig, setWhatsappConfigState] = useState<WhatsAppConfig>({
        apiUrl: '',
        apiToken: '',
        instanceName: '',
        isConnected: false
    });

    // Update internal currentUser when prop changes or on init
    useEffect(() => {
        if (initialUser) setCurrentUser(initialUser);
    }, [initialUser]);

    // Carregar Dados do Backend Local ao iniciar
    useEffect(() => {
        const loadData = async () => {
            try {
                const db = await api.fetchData();
                if (db) {
                    setUsers(db.users || []);
                    setCompanies(db.companies || []);
                    setClients(db.clients || []);
                    setPartners(db.partners || []);
                    setProjects(db.projects || []);
                    setSites(db.sites || []);
                    setSaaSProducts(db.saasProducts || []);
                    setLeads(db.leads || []);
                }
            } catch (error) {
                console.error("Failed to initialize data context:", error);
                // Non-blocking error, user might be offline or backend down
            }
        };
        loadData();

        const storedConfig = localStorage.getItem('nexus_whatsapp_config');
        if (storedConfig) {
            setWhatsappConfigState(JSON.parse(storedConfig));
        }
    }, [currentUser]); // Recarrega se usuário mudar (login/logout)

    const setWhatsappConfig = (config: WhatsAppConfig) => {
        setWhatsappConfigState(config);
        localStorage.setItem('nexus_whatsapp_config', JSON.stringify(config));
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    const openModal = (title: string, content: React.ReactNode) => {
        setModalTitle(title);
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
        setModalTitle('');
    };
    
    const activeCompanyId = impersonatedCompany?.id || currentUser?.companyId;

    const activeCompanyName = useMemo(() => {
        return companies.find(c => c.id === activeCompanyId)?.name || 'Empresa';
    }, [companies, activeCompanyId]);

    const filterByCompany = <T extends { companyId: string }>(data: T[]): T[] => {
        if (!currentUser) return [];
        // SuperAdmin vê tudo
        if (currentUser.role === 'SuperAdmin' && !impersonatedCompany) {
             if (data.length > 0 && 'role' in data[0] && 'email' in data[0]) {
                 return (data as unknown as User[]).filter(item => item.companyId === currentUser.companyId) as unknown as T[];
             }
             return data;
        }
        // Usuários normais veem apenas dados da sua empresa
        return data.filter(item => item.companyId === activeCompanyId);
    };

    const filteredClients = useMemo(() => filterByCompany(clients), [clients, currentUser, impersonatedCompany]);
    const filteredPartners = useMemo(() => filterByCompany(partners), [partners, currentUser, impersonatedCompany]);
    const filteredProjects = useMemo(() => filterByCompany(projects), [projects, currentUser, impersonatedCompany]);
    const filteredSites = useMemo(() => filterByCompany(sites), [sites, currentUser, impersonatedCompany]);
    const filteredSaaSProducts = useMemo(() => filterByCompany(saasProducts), [saasProducts, currentUser, impersonatedCompany]);
    const filteredUsers = useMemo(() => filterByCompany(users), [users, currentUser, impersonatedCompany]);
    const filteredLeads = useMemo(() => filterByCompany(leads), [leads, currentUser, impersonatedCompany]);
    
    const generatePayments = (totalValue: number, installments: number, startDate: string): Payment[] => {
        if (installments <= 0) return [];
        const installmentAmount = totalValue / installments;
        const start = new Date(startDate);
        return Array.from({ length: installments }, (_, i) => {
            const dueDate = new Date(start);
            dueDate.setMonth(start.getMonth() + i + 1);
            return {
                id: `payment_${Date.now()}_${i + 1}`,
                amount: parseFloat(installmentAmount.toFixed(2)),
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'Pendente'
            };
        });
    };

    // --- Create Handlers (Agora Persistentes) ---

    const addCompany = async (data: Omit<Company, 'id' | 'subscriptionDueDate' | 'paymentHistory'> & { adminUser: { name: string; email: string; phone: string } }) => {
        const newCompanyId = `comp-${Date.now()}`;
        const nextDueDate = new Date();
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        const newCompany: Company = {
            id: newCompanyId,
            name: data.name,
            cnpj_cpf: data.cnpj_cpf,
            subscriptionValue: data.subscriptionValue,
            currency: data.currency,
            subscriptionStatus: data.subscriptionStatus,
            contactName: data.adminUser.name,
            contactEmail: data.adminUser.email,
            contactPhone: data.adminUser.phone,
            subscriptionDueDate: nextDueDate.toISOString().split('T')[0],
            paymentHistory: [],
        };

        const tempPassword = Math.random().toString(36).slice(-8);
        const newUser: User = {
            id: `user-${Date.now()}`,
            companyId: newCompanyId,
            name: data.adminUser.name,
            email: data.adminUser.email,
            password: tempPassword,
            role: 'Admin',
        };

        await api.saveItem('companies', newCompany);
        await api.saveItem('users', newUser);
        
        setCompanies(prev => [...prev, newCompany]);
        setUsers(prev => [...prev, newUser]);
        openModal('Empresa Criada com Sucesso!', <PasswordDisplay user={newUser} />);
    };

    const addProject = async (data: Omit<Project, 'id' | 'type' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const remainingValue = data.value - data.downPayment;
        const newItem: Project = { 
            ...data, 
            id: `proj${Date.now()}`,
            companyId: activeCompanyId,
            type: 'Project',
            status: 'Pendente',
            progress: 0, 
            activities: [],
            payments: generatePayments(remainingValue, data.installments, data.startDate)
        };
        await api.saveItem('projects', newItem);
        setProjects(prev => [...prev, newItem]);
        closeModal();
    };

    const addSite = async (data: Omit<Site, 'id' | 'type' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const remainingValue = data.value - data.downPayment;
        const newItem: Site = { 
            ...data, 
            id: `site${Date.now()}`,
            companyId: activeCompanyId,
            type: 'Site',
            status: 'Pendente',
            progress: 0,
            activities: [],
            payments: generatePayments(remainingValue, data.installments, data.startDate)
        };
        await api.saveItem('sites', newItem);
        setSites(prev => [...prev, newItem]);
        closeModal();
    };
    
    const addClient = async (data: Omit<Client, 'id' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `cli${Date.now()}`, companyId: activeCompanyId };
        await api.saveItem('clients', newItem);
        setClients(prev => [...prev, newItem]);
        closeModal();
    };

    const addPartner = async (data: Omit<Partner, 'id' | 'isAvailable' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `par${Date.now()}`, companyId: activeCompanyId, isAvailable: true };
        await api.saveItem('partners', newItem);
        setPartners(prev => [...prev, newItem]);
        closeModal();
    };

    const addSaaSProduct = async (data: Omit<SaaSProduct, 'id' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `saas${Date.now()}`, companyId: activeCompanyId };
        await api.saveItem('saasProducts', newItem);
        setSaaSProducts(prev => [...prev, newItem]);
        closeModal();
    };

    const addUser = async (data: Omit<User, 'id' | 'companyId' | 'password'>) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `user${Date.now()}`, companyId: activeCompanyId, role: data.role || 'User'};
        await api.saveItem('users', newItem);
        setUsers(prev => [...prev, newItem]);
        closeModal();
    };

    const addLead = async (data: Omit<Lead, 'id' | 'companyId' | 'createdAt' | 'messages'> & { messages?: ChatMessage[] }) => {
        if (!activeCompanyId) return;
        const newItem: Lead = { 
            ...data, 
            id: `lead${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
            companyId: activeCompanyId, 
            createdAt: new Date().toISOString(),
            messages: data.messages || []
        };
        await api.saveItem('leads', newItem);
        setLeads(prev => [...prev, newItem]);
        closeModal();
    };

    // --- Update Handlers (Persistentes) ---
    // Helper para atualizar estado local e DB
    const updateGeneric = async (collection: string, item: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        await api.updateItem(collection as any, item);
        setter(prev => prev.map(i => i.id === item.id ? item : i));
    };

    const updateClient = (item: Client) => updateGeneric('clients', item, setClients).then(closeModal);
    const updatePartner = (item: Partner) => updateGeneric('partners', item, setPartners).then(closeModal);
    const updateProject = (item: Project) => updateGeneric('projects', item, setProjects).then(closeModal);
    const updateSite = (item: Site) => updateGeneric('sites', item, setSites).then(closeModal);
    const updateSaaSProduct = (item: SaaSProduct) => updateGeneric('saasProducts', item, setSaaSProducts).then(closeModal);
    const updateCompany = (item: Company) => updateGeneric('companies', item, setCompanies).then(closeModal);
    const updateUser = (item: User) => updateGeneric('users', item, setUsers).then(() => {
        // Special case: if we updated the current user, update session state
        if (currentUser && currentUser.id === item.id) {
            setCurrentUser(item);
            localStorage.setItem('nexus_current_user', JSON.stringify(item));
        }
        closeModal();
    });
    const updateLead = (item: Lead) => updateGeneric('leads', item, setLeads); // Lead não fecha modal auto

    const updatePaymentStatus = async (projectId: string, paymentId: string, newStatus: 'Pago' | 'Pendente' | 'Atrasado') => {
        // Encontrar e atualizar o projeto correto (seja em projects ou sites)
        let found: Project | Site | undefined = projects.find(p => p.id === projectId);
        let collection = 'projects';
        
        if (!found) {
            found = sites.find(s => s.id === projectId);
            collection = 'sites';
        }

        if (found) {
            const updatedProject = {
                ...found,
                payments: found.payments.map(pm => pm.id === paymentId ? { ...pm, status: newStatus } : pm)
            };
            
            await api.updateItem(collection as any, updatedProject);
            
            if (collection === 'projects') {
                setProjects(prev => prev.map(p => p.id === projectId ? updatedProject as Project : p));
            } else {
                setSites(prev => prev.map(s => s.id === projectId ? updatedProject as unknown as Site : s));
            }
        }
    };

    const recordSubscriptionPayment = async (companyId: string) => {
        const company = companies.find(c => c.id === companyId);
        if (company) {
            const newDueDate = new Date(company.subscriptionDueDate);
            newDueDate.setMonth(newDueDate.getMonth() + 1);
            
            const newPayment: SubscriptionPayment = {
                id: `subpay-admin-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: company.subscriptionValue,
            };

            const updatedCompany = {
                ...company,
                subscriptionStatus: 'Ativa' as any,
                subscriptionDueDate: newDueDate.toISOString().split('T')[0],
                paymentHistory: [newPayment, ...company.paymentHistory],
            };
            
            await api.updateItem('companies', updatedCompany);
            setCompanies(prev => prev.map(c => c.id === companyId ? updatedCompany : c));
            openModal('Pagamento Registrado!', <p className="text-center text-text-primary">A assinatura do cliente foi renovada com sucesso.</p>);
        }
    };

    const paySubscription = async (companyId: string, cardDetails?: { last4: string; expiry: string; }) => {
        const company = companies.find(c => c.id === companyId);
        if (company) {
            const baseDate = new Date(company.subscriptionDueDate) > new Date() ? new Date(company.subscriptionDueDate) : new Date();
            baseDate.setMonth(baseDate.getMonth() + 1);
            
            const newPayment: SubscriptionPayment = {
                id: `subpay-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: company.subscriptionValue,
            };

            const updatedCompany: Company = {
                ...company,
                subscriptionStatus: 'Ativa',
                subscriptionDueDate: baseDate.toISOString().split('T')[0],
                paymentHistory: [newPayment, ...company.paymentHistory],
            };

            if (cardDetails) {
                updatedCompany.savedCard = cardDetails;
            }

            await api.updateItem('companies', updatedCompany);
            setCompanies(prev => prev.map(c => c.id === companyId ? updatedCompany : c));
            closeModal();
        }
    };

    const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
        if (!whatsappConfig.isConnected || !whatsappConfig.apiUrl) {
            console.log("Simulating send to", phone, ":", message);
            return new Promise(r => setTimeout(() => r(true), 500));
        }

        try {
            let cleanPhone = phone.replace(/[^0-9+]/g, '');
            let finalPhone = cleanPhone.replace('+', ''); 
            
            if (!phone.includes('+') && finalPhone.length <= 11) {
                finalPhone = `55${finalPhone}`;
            }
            
            const payload = { number: finalPhone, text: message, message: message };

            const response = await fetch(`${whatsappConfig.apiUrl}/message/sendText/${whatsappConfig.instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': whatsappConfig.apiToken,
                    'Authorization': `Bearer ${whatsappConfig.apiToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API Request Failed');
            return true;
        } catch (error) {
            console.error("Failed to send WhatsApp via API", error);
            return false;
        }
    };

    const value: DataContextType = {
        currentUser,
        activeCompanyName,
        clients: filteredClients, partners: filteredPartners, projects: filteredProjects, sites: filteredSites, saasProducts: filteredSaaSProducts, users: filteredUsers, companies: companies, leads: filteredLeads,
        addClient, addPartner, addProject, addSite, addSaaSProduct, addCompany, addUser, addLead,
        updateClient, updatePartner, updateProject, updateSite, updateSaaSProduct, updateCompany, updateUser, updateLead,
        updatePaymentStatus,
        paySubscription,
        recordSubscriptionPayment,
        openModal,
        setActiveView,
        whatsappConfig,
        setWhatsappConfig,
        sendWhatsAppMessage
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
                {modalContent}
            </Modal>
        </DataContext.Provider>
    )
}
