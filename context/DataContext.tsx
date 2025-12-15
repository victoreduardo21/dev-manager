
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Modal from '../components/Modal';
import type { Client, Partner, Project, SaaSProduct, User, Company, Payment, DataContextType, View, SubscriptionPayment, Lead, ChatMessage, WhatsAppConfig } from '../types';
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

const RestrictedFeatureModal: React.FC<{ 
    featureName: string; 
    currentPlan: string;
    requiredPlan: string;
    message: string;
    onUpgrade: () => void;
}> = ({ featureName, currentPlan, requiredPlan, message, onUpgrade }) => (
    <div className="text-center p-6">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <LockClosedIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Recurso Bloqueado</h3>
        <p className="text-text-secondary mb-4">
            A funcionalidade <span className="font-bold text-primary">{featureName}</span> não está disponível no seu plano atual ({currentPlan}).
        </p>
        <p className="text-sm text-text-secondary mb-6 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md text-yellow-600">
            {message}
        </p>
        <button 
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold animate-pulse"
        >
            <RocketLaunchIcon className="w-5 h-5" />
            Fazer Upgrade para {requiredPlan}
        </button>
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
    const [saasProducts, setSaaSProducts] = useState<SaaSProduct[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    
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
        const loadData = async () => {
            try {
                const db = await api.fetchData();
                if (db) {
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
                }
            } catch (error) {
                console.error("Failed to initialize data context:", error);
            }
        };
        loadData();

        const storedConfig = localStorage.getItem('nexus_whatsapp_config');
        if (storedConfig) {
            setWhatsappConfigState(JSON.parse(storedConfig));
        }
    }, [currentUser]);

    const setWhatsappConfig = (config: WhatsAppConfig) => {
        setWhatsappConfigState(config);
        localStorage.setItem('nexus_whatsapp_config', JSON.stringify(config));
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMaxWidth, setModalMaxWidth] = useState('max-w-md');

    const openModal = (title: string, content: React.ReactNode, maxWidth: string = 'max-w-md') => {
        setModalTitle(title);
        setModalContent(content);
        setModalMaxWidth(maxWidth);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
        setModalTitle('');
        setModalMaxWidth('max-w-md');
    };
    
    const activeCompanyId = impersonatedCompany?.id || currentUser?.companyId;

    const activeCompanyName = useMemo(() => {
        const found = companies.find(c => c.id === activeCompanyId);
        if (found) return found.name;
        return activeCompanyId && activeCompanyId.trim() !== '' ? activeCompanyId : 'Empresa';
    }, [companies, activeCompanyId]);

    const filterByCompany = <T extends { companyId: string }>(data: T[]): T[] => {
        if (!currentUser) return [];
        if (currentUser.role === 'SuperAdmin' && !impersonatedCompany) {
             if (data.length > 0 && 'role' in data[0] && 'email' in data[0]) {
                 return (data as unknown as User[]).filter(item => item.companyId === currentUser.companyId) as unknown as T[];
             }
             return data;
        }
        return data.filter(item => item.companyId === activeCompanyId);
    };

    const filteredClients = useMemo(() => filterByCompany(clients), [clients, currentUser, impersonatedCompany]);
    const filteredPartners = useMemo(() => filterByCompany(partners), [partners, currentUser, impersonatedCompany]);
    const filteredProjects = useMemo(() => filterByCompany(projects), [projects, currentUser, impersonatedCompany]);
    const filteredSaaSProducts = useMemo(() => filterByCompany(saasProducts), [saasProducts, currentUser, impersonatedCompany]);
    const filteredUsers = useMemo(() => filterByCompany(users), [users, currentUser, impersonatedCompany]);
    const filteredLeads = useMemo(() => filterByCompany(leads), [leads, currentUser, impersonatedCompany]);

    // --- Plan Restriction Logic ---
    const checkPlanLimits = (feature: 'projects' | 'users' | 'whatsapp' | 'leadGen' | 'leads'): boolean => {
        if (currentUser?.role === 'SuperAdmin' && !impersonatedCompany) return true; // SuperAdmin has no limits

        const myCompany = companies.find(c => c.id === activeCompanyId);
        // Default to PRO if undefined, or handle 'Gratuito' if we implement it. Assuming PRO is base paid.
        const plan = myCompany?.plan || 'PRO'; 

        let allowed = true;
        let requiredPlan = '';
        let message = '';
        let featureTitle = '';

        if (feature === 'projects') {
            // PRO: Unlimited Projects
            // VIP: Unlimited Projects
            // Gratuito (if exists): Limit 5
            featureTitle = 'Criar Novo Projeto';
            if (plan === 'Gratuito' && filteredProjects.length >= 5) {
                allowed = false;
                requiredPlan = 'PRO';
                message = 'A versão gratuita permite gerenciar no máximo 5 projetos. Faça upgrade para o plano PRO.';
            }
        } 
        else if (feature === 'users') {
            featureTitle = 'Adicionar Usuário';
            if (plan === 'Gratuito' && filteredUsers.length >= 1) {
                allowed = false;
                requiredPlan = 'PRO';
                message = 'A versão gratuita é individual. Migre para o plano PRO para adicionar até 3 membros.';
            }
            else if (plan === 'PRO' && filteredUsers.length >= 3) {
                // PRO: Até 3 Usuários
                allowed = false;
                requiredPlan = 'VIP';
                message = 'O plano PRO permite até 3 usuários. Para equipes maiores e usuários ilimitados, escolha o plano VIP.';
            }
        }
        else if (feature === 'whatsapp') {
            featureTitle = 'Automação WhatsApp';
            if (plan !== 'VIP') {
                // Exclusive to VIP
                allowed = false;
                requiredPlan = 'VIP';
                message = 'A automação de WhatsApp e API é um recurso exclusivo do plano VIP.';
            }
        }
        else if (feature === 'leadGen') {
            featureTitle = 'Captação de Leads IA';
            if (plan !== 'VIP') {
                // Exclusive to VIP
                allowed = false;
                requiredPlan = 'VIP';
                message = 'A ferramenta de Inteligência Artificial para captação de leads está disponível apenas no plano VIP.';
            }
        }
        else if (feature === 'leads') {
             // PRO has unlimited leads, so usually no block unless Free plan
             featureTitle = 'Adicionar Lead';
             if (plan === 'Gratuito' && filteredLeads.length >= 50) {
                 allowed = false;
                 requiredPlan = 'PRO';
                 message = 'Limite de 50 leads no plano gratuito. Faça upgrade para o PRO para ter CRM ilimitado.';
             }
        }

        if (!allowed) {
            openModal(
                '', 
                <RestrictedFeatureModal 
                    featureName={featureTitle}
                    currentPlan={plan}
                    requiredPlan={requiredPlan}
                    message={message}
                    onUpgrade={() => {
                        closeModal();
                        setActiveView('Assinatura');
                    }}
                />
            );
            return false;
        }

        return true;
    };

    
    // Função aprimorada para gerar cronograma de pagamentos
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

    const addProject = async (data: Omit<Project, 'id' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>) => {
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

    const addUser = async (data: Omit<User, 'id'>) => {
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

    // --- Update Handlers ---
    const updateGeneric = async (collection: string, item: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        await api.updateItem(collection as any, item);
        setter(prev => prev.map(i => i.id === item.id ? item : i));
    };

    const updateClient = (item: Client) => updateGeneric('clients', item, setClients).then(closeModal);
    const updatePartner = (item: Partner) => updateGeneric('partners', item, setPartners).then(closeModal);
    const updateProject = (item: Project) => updateGeneric('projects', item, setProjects).then(closeModal);
    const updateSaaSProduct = (item: SaaSProduct) => updateGeneric('saasProducts', item, setSaaSProducts).then(closeModal);
    const updateCompany = (item: Company) => updateGeneric('companies', item, setCompanies).then(closeModal);
    const updateUser = (item: User) => updateGeneric('users', item, setUsers).then(() => {
        if (currentUser && currentUser.id === item.id) {
            setCurrentUser(item);
            localStorage.setItem('nexus_current_user', JSON.stringify(item));
        }
        closeModal();
    });
    const updateLead = (item: Lead) => updateGeneric('leads', item, setLeads);

    // --- Delete Handlers ---
    const deleteGeneric = async (collection: string, id: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        try {
            await api.deleteItem(collection, id);
            setter(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error(`Error deleting item from ${collection}:`, error);
            alert("Não foi possível excluir o item. Verifique se o backend suporta esta operação.");
        }
    };

    const deleteClient = (id: string) => deleteGeneric('clients', id, setClients);
    const deletePartner = (id: string) => deleteGeneric('partners', id, setPartners);
    const deleteProject = (id: string) => deleteGeneric('projects', id, setProjects);
    const deleteSaaSProduct = (id: string) => deleteGeneric('saasProducts', id, setSaaSProducts);
    const deleteUser = (id: string) => deleteGeneric('users', id, setUsers);
    const deleteLead = (id: string) => deleteGeneric('leads', id, setLeads);

    const updatePaymentStatus = async (projectId: string, paymentId: string, newStatus: 'Pago' | 'Pendente' | 'Atrasado') => {
        const found = projects.find(p => p.id === projectId);
        
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
            
            await api.updateItem('projects', updatedProject);
            setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
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
        activeCompanyId,
        clients: filteredClients, partners: filteredPartners, projects: filteredProjects, saasProducts: filteredSaaSProducts, users: filteredUsers, companies: companies, leads: filteredLeads,
        addClient, addPartner, addProject, addSaaSProduct, addCompany, addUser, addLead,
        updateClient, updatePartner, updateProject, updateSaaSProduct, updateCompany, updateUser, updateLead,
        deleteClient, deletePartner, deleteProject, deleteSaaSProduct, deleteUser, deleteLead,
        updatePaymentStatus,
        paySubscription,
        recordSubscriptionPayment,
        openModal,
        setActiveView,
        whatsappConfig,
        setWhatsappConfig,
        sendWhatsAppMessage,
        checkPlanLimits
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle} maxWidth={modalMaxWidth}>
                {modalContent}
            </Modal>
        </DataContext.Provider>
    )
}
