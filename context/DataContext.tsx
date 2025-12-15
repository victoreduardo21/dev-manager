
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import type { Client, Partner, Project, SaaSProduct, User, Company, Payment, DataContextType, View, SubscriptionPayment, Lead, ChatMessage, WhatsAppConfig, Transaction } from '../types';
import { api } from '../services/api';
import { RocketLaunchIcon, LockClosedIcon } from '../components/Icons';

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
            <p><strong className="text-text-secondary">Senha:</strong> <span className="font-mono bg-black/30 px-2 py-1 rounded">{user.password}</span></p>
        </div>
        <p className="text-xs text-text-secondary">Eles devem alterar a senha no primeiro login.</p>
    </div>
);

export const DataProvider: React.FC<DataProviderProps> = ({ currentUser: initialUser, impersonatedCompany, children, setActiveView }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(initialUser);

    // Inicialização segura com arrays vazios
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [saasProducts, setSaaSProducts] = useState<SaaSProduct[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    // Config do WhatsApp
    const [whatsappConfig, setWhatsappConfigState] = useState<WhatsAppConfig>({
        apiUrl: '',
        apiToken: '',
        instanceName: '',
        isConnected: false
    });

    useEffect(() => {
        if (initialUser) setCurrentUser(initialUser);
    }, [initialUser]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                // api.fetchData agora trata erros internamente e retorna objeto vazio se falhar
                const db = await api.fetchData();
                
                if (isMounted && db) {
                    setUsers(db.users || []);
                    setCompanies(db.companies || []);
                    setClients(db.clients || []);
                    setPartners(db.partners || []);
                    
                    const mappedProjects = (db.projects || []).map((p: any) => ({
                        ...p,
                        category: p.category || 'Sistema'
                    }));

                    const mappedSites = (db.sites || []).map((s: any) => ({
                        ...s,
                        category: 'Site'
                    }));

                    setProjects([...mappedProjects, ...mappedSites]);
                    setSaaSProducts(db.saasProducts || []);
                    setLeads(db.leads || []);
                    setTransactions(db.transactions || []);
                }
            } catch (error) {
                console.error("Erro fatal no DataContext (Ignorado para manter UI viva):", error);
            }
        };
        
        if (currentUser) {
            loadData();
        }

        const storedConfig = localStorage.getItem('nexus_whatsapp_config');
        if (storedConfig) {
            setWhatsappConfigState(JSON.parse(storedConfig));
        }

        return () => { isMounted = false; };
    }, [currentUser]); 

    const setWhatsappConfig = useCallback((config: WhatsAppConfig) => {
        setWhatsappConfigState(config);
        localStorage.setItem('nexus_whatsapp_config', JSON.stringify(config));
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMaxWidth, setModalMaxWidth] = useState('max-w-md');

    const openModal = useCallback((title: string, content: React.ReactNode, maxWidth: string = 'max-w-md') => {
        setModalTitle(title);
        setModalContent(content);
        setModalMaxWidth(maxWidth);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setModalContent(null);
        setModalTitle('');
        setModalMaxWidth('max-w-md');
    }, []);
    
    const activeCompanyId = impersonatedCompany?.id || currentUser?.companyId;

    const activeCompanyName = useMemo(() => {
        const found = companies.find(c => c.id === activeCompanyId);
        if (found) return found.name;
        return activeCompanyId && activeCompanyId.trim() !== '' ? activeCompanyId : 'Empresa';
    }, [companies, activeCompanyId]);

    const filterByCompany = useCallback(<T extends { companyId: string }>(data: T[]): T[] => {
        if (!data || !Array.isArray(data)) return [];
        if (!currentUser) return [];
        if (currentUser.role === 'SuperAdmin' && !impersonatedCompany) {
             if (data.length > 0 && 'role' in data[0] && 'email' in data[0]) {
                 return (data as unknown as User[]).filter(item => item.companyId === currentUser.companyId) as unknown as T[];
             }
             return data;
        }
        return data.filter(item => item.companyId === activeCompanyId);
    }, [currentUser, impersonatedCompany, activeCompanyId]);

    const filteredClients = useMemo(() => filterByCompany(clients), [clients, filterByCompany]);
    const filteredPartners = useMemo(() => filterByCompany(partners), [partners, filterByCompany]);
    const filteredProjects = useMemo(() => filterByCompany(projects), [projects, filterByCompany]);
    const filteredSaaSProducts = useMemo(() => filterByCompany(saasProducts), [saasProducts, filterByCompany]);
    const filteredUsers = useMemo(() => filterByCompany(users), [users, filterByCompany]);
    const filteredLeads = useMemo(() => filterByCompany(leads), [leads, filterByCompany]);
    const filteredTransactions = useMemo(() => filterByCompany(transactions), [transactions, filterByCompany]);

    const checkPlanLimits = useCallback((feature: 'projects' | 'users' | 'whatsapp' | 'leadGen' | 'leads'): boolean => {
        return true; 
    }, []);

    
    const generatePaymentSchedule = (totalValue: number, downPayment: number, installments: number, startDate: string, firstPaymentDate?: string): Payment[] => {
        const payments: Payment[] = [];
        const remainingValue = totalValue - downPayment;

        if (downPayment > 0) {
            payments.push({
                id: `pay_entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                amount: downPayment,
                dueDate: startDate, 
                status: 'Pendente' 
            });
        }

        if (installments > 0 && remainingValue > 0) {
            const installmentAmount = remainingValue / installments;
            let baseDate: Date;
            if (firstPaymentDate) {
                baseDate = new Date(firstPaymentDate + 'T12:00:00'); 
            } else {
                baseDate = new Date(startDate + 'T12:00:00');
                baseDate.setMonth(baseDate.getMonth() + 1);
            }
            
            for (let i = 0; i < installments; i++) {
                const dueDate = new Date(baseDate);
                dueDate.setMonth(baseDate.getMonth() + i);
                
                payments.push({
                    id: `pay_inst_${Date.now()}_${i + 1}_${Math.random().toString(36).substr(2, 5)}`,
                    amount: parseFloat(installmentAmount.toFixed(2)),
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: 'Pendente'
                });
            }
        }
        
        return payments;
    };

    const addCompany = useCallback(async (data: Omit<Company, 'id' | 'subscriptionDueDate' | 'paymentHistory'> & { adminUser: { name: string; email: string; phone: string } }) => {
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
    }, [openModal]);

    const addProject = useCallback(async (data: Omit<Project, 'id' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const payments = generatePaymentSchedule(data.value, data.downPayment || 0, data.installments, data.startDate, data.firstPaymentDate);

        const newItem: Project = { 
            ...data, 
            id: `proj${Date.now()}`,
            companyId: activeCompanyId,
            status: 'Pendente',
            progress: 0, 
            activities: [],
            payments: payments
        };
        await api.saveItem('projects', newItem);
        setProjects(prev => [...prev, newItem]);
        closeModal();
    }, [activeCompanyId, closeModal]);

    const addClient = useCallback(async (data: Omit<Client, 'id' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `cli${Date.now()}`, companyId: activeCompanyId };
        await api.saveItem('clients', newItem);
        setClients(prev => [...prev, newItem]);
        closeModal();
    }, [activeCompanyId, closeModal]);

    const addPartner = useCallback(async (data: Omit<Partner, 'id' | 'isAvailable' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `par${Date.now()}`, companyId: activeCompanyId, isAvailable: true };
        await api.saveItem('partners', newItem);
        setPartners(prev => [...prev, newItem]);
        closeModal();
    }, [activeCompanyId, closeModal]);

    const addSaaSProduct = useCallback(async (data: Omit<SaaSProduct, 'id' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const newItem = { ...data, id: `saas${Date.now()}`, companyId: activeCompanyId };
        await api.saveItem('saasProducts', newItem);
        setSaaSProducts(prev => [...prev, newItem]);
        closeModal();
    }, [activeCompanyId, closeModal]);

    const addUser = useCallback(async (data: Omit<User, 'id'>) => {
        const targetCompanyId = data.companyId || activeCompanyId;
        if (!targetCompanyId) return;
        const finalPassword = data.password || Math.random().toString(36).slice(-8);

        const newItem: User = { 
            ...data, 
            id: `user${Date.now()}`, 
            companyId: targetCompanyId, 
            role: data.role || 'User',
            password: finalPassword 
        };
        
        await api.saveItem('users', newItem);
        setUsers(prev => [...prev, newItem]);
        openModal('Usuário Criado', <PasswordDisplay user={newItem} />);
    }, [activeCompanyId, openModal]);

    const addLead = useCallback(async (data: Omit<Lead, 'id' | 'companyId' | 'createdAt' | 'messages'> & { messages?: ChatMessage[] }) => {
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
    }, [activeCompanyId, closeModal]);

    const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'companyId'>) => {
        if (!activeCompanyId) return;
        const newItem: Transaction = {
            ...data,
            id: `trans${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            companyId: activeCompanyId
        };
        await api.saveItem('transactions', newItem);
        setTransactions(prev => [...prev, newItem]);
        closeModal();
    }, [activeCompanyId, closeModal]);

    const updateGeneric = async (collection: string, item: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        await api.updateItem(collection as any, item);
        setter(prev => prev.map(i => i.id === item.id ? item : i));
    };

    const updateClient = useCallback((item: Client) => updateGeneric('clients', item, setClients).then(closeModal), [closeModal]);
    const updatePartner = useCallback((item: Partner) => updateGeneric('partners', item, setPartners).then(closeModal), [closeModal]);
    const updateProject = useCallback((item: Project) => updateGeneric('projects', item, setProjects).then(closeModal), [closeModal]);
    const updateSaaSProduct = useCallback((item: SaaSProduct) => updateGeneric('saasProducts', item, setSaaSProducts).then(closeModal), [closeModal]);
    const updateCompany = useCallback((item: Company) => updateGeneric('companies', item, setCompanies).then(closeModal), [closeModal]);
    const updateUser = useCallback((item: User) => updateGeneric('users', item, setUsers).then(() => {
        if (currentUser && currentUser.id === item.id) {
            setCurrentUser(item);
            localStorage.setItem('nexus_current_user', JSON.stringify(item));
        }
        closeModal();
    }), [currentUser, closeModal]);
    const updateLead = useCallback((item: Lead) => updateGeneric('leads', item, setLeads), []);
    const updateTransaction = useCallback((item: Transaction) => updateGeneric('transactions', item, setTransactions).then(closeModal), [closeModal]);

    const deleteGeneric = async (collection: string, id: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        try {
            await api.deleteItem(collection, id);
            setter(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error(`Error deleting item from ${collection}:`, error);
            alert("Não foi possível excluir o item. Verifique se o backend suporta esta operação.");
        }
    };

    const deleteClient = useCallback((id: string) => deleteGeneric('clients', id, setClients), []);
    const deletePartner = useCallback((id: string) => deleteGeneric('partners', id, setPartners), []);
    const deleteProject = useCallback((id: string) => deleteGeneric('projects', id, setProjects), []);
    const deleteSaaSProduct = useCallback((id: string) => deleteGeneric('saasProducts', id, setSaaSProducts), []);
    const deleteUser = useCallback((id: string) => deleteGeneric('users', id, setUsers), []);
    const deleteLead = useCallback((id: string) => deleteGeneric('leads', id, setLeads), []);
    const deleteTransaction = useCallback((id: string) => deleteGeneric('transactions', id, setTransactions), []);

    const updatePaymentStatus = useCallback(async (projectId: string, paymentId: string, newStatus: 'Pago' | 'Pendente' | 'Atrasado') => {
        setProjects(prevProjects => {
             const found = prevProjects.find(p => p.id === projectId);
             if (found) {
                const updatedProject = {
                    ...found,
                    payments: found.payments.map(pm => {
                        if (pm.id === paymentId) {
                            return {
                                ...pm,
                                status: newStatus,
                                paidDate: newStatus === 'Pago' ? new Date().toISOString() : undefined
                            };
                        }
                        return pm;
                    })
                };
                api.updateItem('projects', updatedProject).catch(console.error);
                return prevProjects.map(p => p.id === projectId ? updatedProject : p);
             }
             return prevProjects;
        });
    }, []);

    const recordSubscriptionPayment = useCallback(async (companyId: string) => {}, []);
    const paySubscription = useCallback(async (companyId: string, cardDetails?: { last4: string; expiry: string; }) => {}, []);

    const sendWhatsAppMessage = useCallback(async (phone: string, message: string): Promise<boolean> => {
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
    }, [whatsappConfig]);

    const value: DataContextType = useMemo(() => ({
        currentUser,
        activeCompanyName,
        activeCompanyId,
        clients: filteredClients, partners: filteredPartners, projects: filteredProjects, saasProducts: filteredSaaSProducts, users: filteredUsers, companies: companies, leads: filteredLeads, transactions: filteredTransactions,
        addClient, addPartner, addProject, addSaaSProduct, addCompany, addUser, addLead, addTransaction,
        updateClient, updatePartner, updateProject, updateSaaSProduct, updateCompany, updateUser, updateLead, updateTransaction,
        deleteClient, deletePartner, deleteProject, deleteSaaSProduct, deleteUser, deleteLead, deleteTransaction,
        updatePaymentStatus,
        paySubscription,
        recordSubscriptionPayment,
        openModal,
        closeModal,
        setActiveView,
        whatsappConfig,
        setWhatsappConfig,
        sendWhatsAppMessage,
        checkPlanLimits
    }), [
        currentUser, activeCompanyName, activeCompanyId, filteredClients, filteredPartners, filteredProjects, filteredSaaSProducts, filteredUsers, companies, filteredLeads, filteredTransactions,
        addClient, addPartner, addProject, addSaaSProduct, addCompany, addUser, addLead, addTransaction,
        updateClient, updatePartner, updateProject, updateSaaSProduct, updateCompany, updateUser, updateLead, updateTransaction,
        deleteClient, deletePartner, deleteProject, deleteSaaSProduct, deleteUser, deleteLead, deleteTransaction,
        updatePaymentStatus, paySubscription, recordSubscriptionPayment, openModal, closeModal, setActiveView, whatsappConfig, setWhatsappConfig, sendWhatsAppMessage, checkPlanLimits
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle} maxWidth={modalMaxWidth}>
                {modalContent}
            </Modal>
        </DataContext.Provider>
    )
}
